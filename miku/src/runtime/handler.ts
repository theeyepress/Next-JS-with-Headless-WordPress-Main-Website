import { resolveConfig, type MikuConfig, type ResolvedMikuConfig } from "../config"
import { streamWithFallback } from "../llm"
import { createStore, type KnowledgeStore } from "../knowledge/store"
import type { MikuUser } from "../types"
import {
  buildRegistry,
  executeConfirmedAction,
  runAgent,
  type AgentRequest,
  type ChatMessage,
  type PendingAction,
} from "./agent"
import { checkRateLimit } from "./rateLimit"
import { buildSystemPrompt } from "./prompt"

/** Wire format for the streaming endpoint. One JSON object per `data:` line. */
export interface MikuStreamEvent {
  type: string
  [key: string]: unknown
}

export interface MikuChatBody {
  message?: string
  history?: ChatMessage[]
  sessionId?: string
  pathname?: string
  /** Present when the visitor is confirming or declining a pending action. */
  confirmedAction?: PendingAction & { approved: boolean }
}

export interface HandleChatOptions {
  config: MikuConfig | ResolvedMikuConfig
  body: MikuChatBody
  /** Best-effort visitor identity. Never trust an id sent by the client. */
  resolveUser?: () => Promise<MikuUser | null>
  /** For rate limiting. Pass the real IP when you have it. */
  clientKey?: string
  signal?: AbortSignal
}

function isResolved(c: MikuConfig | ResolvedMikuConfig): c is ResolvedMikuConfig {
  return typeof (c as ResolvedMikuConfig).llm === "object" && "historyTurns" in (c as ResolvedMikuConfig).llm
}

const MAX_HISTORY_MESSAGES = 40
const MAX_HISTORY_CHARS = 2000

/**
 * Bounds the conversation the client sends back.
 *
 * The count alone is not a limit worth much: 40 messages of unbounded length is
 * still an arbitrarily large bill. Each message is truncated, so one visitor
 * cannot turn a single request into a hundred-thousand-token prompt. Truncation
 * keeps the start of the message, which is where the question is.
 */
function clampHistory(history: unknown): ChatMessage[] {
  if (!Array.isArray(history)) return []
  return history
    .slice(-MAX_HISTORY_MESSAGES)
    .filter(
      (m): m is ChatMessage =>
        !!m && typeof m === "object" && (m as ChatMessage).role !== undefined
    )
    .map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: typeof m.content === "string" ? m.content.slice(0, MAX_HISTORY_CHARS) : "",
    }))
}

const encoder = new TextEncoder()

function frame(event: MikuStreamEvent): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
}

interface Base {
  config: ResolvedMikuConfig
  history: ChatMessage[]
  sessionId: string
  pathname?: string
  user: MikuUser | null
  signal?: AbortSignal
  store: KnowledgeStore
}

/**
 * The streaming request handler.
 *
 * Framework-agnostic on purpose: a Next.js route handler, an Express handler or
 * a Vite middleware can all call it, because a package that only works behind
 * one framework is not actually installable.
 */
export async function handleMikuChat(
  opts: HandleChatOptions
): Promise<{ status: number; headers: Headers; body: ReadableStream<Uint8Array> }> {
  const config = isResolved(opts.config) ? opts.config : resolveConfig(opts.config)
  const body = opts.body ?? {}
  const sessionId = (body.sessionId || "anon").slice(0, 180)

  if (
    !config.rateLimit &&
    !checkRateLimit(
      `${sessionId}:${opts.clientKey ?? "local"}`,
      config.security.rateLimitPerMinute,
      60_000
    )
  ) {
    return stream([
      { type: "rate_limited", message: "You're sending messages a little too quickly. Give it a moment." },
    ])
  }

  let user: MikuUser | null = null
  try {
    user = (await (opts.resolveUser ?? config.auth?.resolveUser)?.()) ?? null
  } catch (err) {
    console.warn("[miku] resolveUser failed:", (err as Error).message)
  }

  const store = createStore(config)
  const registry = buildRegistry(config, store)

  const base: Base = {
    config,
    history: clampHistory(body.history),
    sessionId,
    pathname: typeof body.pathname === "string" ? body.pathname.slice(0, 300) : undefined,
    user,
    signal: opts.signal,
    store,
  }

  // ---- Confirm / decline path ------------------------------------------------
  if (body.confirmedAction) {
    const action = body.confirmedAction
    const out = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          const lastQuestion = [...base.history].reverse().find((m) => m.role === "user")?.content ?? ""
          const result = await executeConfirmedAction(
            { ...base, question: lastQuestion, action },
            registry
          )

          if (action.name === "navigate_to" && result.ok) {
            const path = (result.data as { path?: string } | undefined)?.path
            if (path) controller.enqueue(frame({ type: "navigate", path }))
          }

          await streamFollowUp(controller, base, action, result.observation, result.ok)
        } catch (err) {
          controller.enqueue(frame({ type: "error", message: (err as Error).message }))
          controller.enqueue(frame({ type: "done" }))
        } finally {
          controller.close()
        }
      },
    })
    return sse(out)
  }

  const question = typeof body.message === "string" ? body.message.trim() : ""
  if (question.length === 0) return stream([{ type: "error", message: "message is required" }], 400)
  if (question.length > 4000) return stream([{ type: "error", message: "message is too long" }], 400)

  const req: AgentRequest = { ...base, question }

  const out = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of runAgent(req, registry)) {
          controller.enqueue(frame(event as unknown as MikuStreamEvent))
        }
      } catch (err) {
        controller.enqueue(frame({ type: "error", message: (err as Error).message }))
        controller.enqueue(frame({ type: "done" }))
      } finally {
        controller.close()
      }
    },
  })

  return sse(out)
}

/**
 * After a visitor confirms an action the model needs one short closing message.
 *
 * This is a separate, tool-free turn on purpose: the question has already been
 * answered, so re-running retrieval and re-offering tools would only risk the
 * model wandering off. It gets the action's outcome and nothing else.
 */
async function streamFollowUp(
  controller: ReadableStreamDefaultController<Uint8Array>,
  base: Base,
  action: PendingAction & { approved: boolean },
  observation: string,
  ok: boolean
): Promise<void> {
  const question = [...base.history].reverse().find((m) => m.role === "user")?.content ?? ""

  const system = buildSystemPrompt(base.config, {
    question,
    retrieved: [],
    citations: [],
    // The action outcome is itself real context, so this turn is grounded even
    // though no pages were retrieved.
    ungrounded: false,
    pathname: base.pathname,
    userName: base.user?.name ?? base.user?.email ?? null,
    observations: [{ name: action.name, ok, text: observation }],
    availableTools: [],
  })

  const instruction = ok
    ? [
        `The visitor just confirmed the action "${action.name}" and it succeeded. Its result:`,
        observation,
        "",
        "Write one or two short sentences telling the visitor what happens next from here.",
        "Do not restate their earlier answer, do not re-list what the action did, and do not ask them to confirm again.",
      ].join("\n")
    : [
        `The visitor declined the action "${action.name}".`,
        "",
        "Acknowledge that in one short, easy-going sentence and offer a different way forward.",
        "Do not pressure them, do not apologise repeatedly, and do not repeat your earlier answer.",
      ].join("\n")

  const llm = streamWithFallback(base.config, {
    system,
    messages: [{ role: "user", content: instruction }],
    signal: base.signal,
  })

  for await (const chunk of llm.chunks) {
    if (chunk.type === "text") controller.enqueue(frame({ type: "delta", text: chunk.text }))
    else if (chunk.type === "error") {
      controller.enqueue(frame({ type: "error", message: chunk.message }))
      break
    } else if (chunk.type === "done") {
      controller.enqueue(frame({ type: "done", finishReason: chunk.finishReason }))
    }
  }
}

function sse(body: ReadableStream<Uint8Array>) {
  return {
    status: 200,
    headers: new Headers({
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Tells nginx not to buffer, which would defeat streaming entirely.
      "X-Accel-Buffering": "no",
    }),
    body,
  }
}

function stream(events: MikuStreamEvent[], status = 200) {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const e of events) controller.enqueue(frame(e))
      controller.enqueue(frame({ type: "done" }))
      controller.close()
    },
  })
  return {
    status,
    headers: new Headers({ "Content-Type": "text/event-stream; charset=utf-8" }),
    body,
  }
}

export { runAgent, executeConfirmedAction, buildRegistry } from "./agent"
export { checkRateLimit } from "./rateLimit"
export { buildSystemPrompt, fallbackAnswer } from "./prompt"