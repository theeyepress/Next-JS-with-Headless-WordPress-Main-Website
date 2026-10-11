import type { ResolvedMikuConfig } from "../config/types"
import { streamWithFallback, type LlmMessage } from "../llm"
import { retrieve } from "../knowledge/retrieve"
import { createStore, Dialect, type KnowledgeStore } from "../knowledge/store"
import type { Citation, MikuTool, MikuUser, ToolCall, ToolContext, ToolResult } from "../types"
import { createActionTools, createKnowledgeTools } from "../tools/builtin"
import { runTool, ToolRegistry } from "../tools/registry"
import { buildSystemPrompt, buildUserContext, fallbackAnswer } from "./prompt"

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export interface AgentRequest {
  config: ResolvedMikuConfig
  question: string
  history: ChatMessage[]
  sessionId: string
  pathname?: string
  user?: MikuUser | null
  signal?: AbortSignal
  store?: KnowledgeStore
}

export interface PendingAction {
  id: string
  name: string
  args: Record<string, unknown>
  label: string
}

export type AgentEvent =
  | { type: "meta"; provider: string | null; grounded: boolean; sources: number; tools: string[] }
  | { type: "delta"; text: string }
  | { type: "tool"; id: string; name: string; kind: string }
  | { type: "tool_result"; id: string; name: string; ok: boolean; summary: string }
  | { type: "citations"; sources: Citation[] }
  | { type: "confirm"; action: PendingAction }
  | { type: "navigate"; path: string }
  | { type: "pending"; reason: string }
  | { type: "done"; finishReason?: string; tokens?: { input?: number; output?: number } }
  | { type: "error"; message: string }

export interface AgentResult {
  /** True when the model had something real to ground its answer in. */
  grounded: boolean
  provider: string | null
  citations: Citation[]
  pendingAction?: PendingAction
  answer: string
  toolCalls: { name: string; ok: boolean }[]
}

let actionSeq = 0

/** Builds the registry for a request. Host tools override built-ins by name. */
export function buildRegistry(
  config: ResolvedMikuConfig,
  store: KnowledgeStore
): ToolRegistry {
  const registry = new ToolRegistry(config)
  const resolver = () => store
  if (!config.disableBuiltInTools) {
    registry.registerAll(createKnowledgeTools(config, resolver))
    registry.registerAll(createActionTools(config))
  }
  registry.registerAll(config.tools ?? [])
  return registry
}

/**
 * One question, end to end.
 *
 * The loop is: ground → ask the model → run whatever tools it asked for → feed
 * the observations back → repeat until it answers. Two invariants hold
 * throughout: a tool that changes state never runs without the visitor's
 * explicit confirmation, and the model never sees a tool it is not allowed to
 * use.
 */
export async function* runAgent(
  req: AgentRequest,
  registry?: ToolRegistry
): AsyncGenerator<AgentEvent, AgentResult> {
  const { config, question } = req
  const store = req.store ?? createStore(config)
  const tools = registry ?? buildRegistry(config, store)

  const ctx: ToolContext = {
    user: req.user ?? null,
    sessionId: req.sessionId,
    pathname: req.pathname,
    config,
    query: question,
  }

  const available = await tools.available(ctx)
  const toolCalls: { name: string; ok: boolean }[] = []

  // ---- Ground the question before the model sees anything. -----------------
  let retrieved: Awaited<ReturnType<typeof retrieve>>["chunks"] = []
  let citations: Citation[] = []
  let retrievalOk = true
  try {
    const result = await retrieve(config, question, { topK: config.retrieval.topK }, store)
    retrieved = result.chunks
    citations = result.citations
  } catch (err) {
    retrievalOk = false
    console.warn("[miku] retrieval failed:", (err as Error).message)
  }
  const ungrounded = retrieved.length === 0

  const history = trimHistory(req.history, config.llm.historyTurns)
  const messages: LlmMessage[] = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: buildUserContextBlock(ctx, question, retrieved, ungrounded, retrievalOk, available) },
  ]

  let provider: string | null = null
  let answer = ""
  let finishReason: string | undefined
  const observations: { name: string; ok: boolean; text: string }[] = []
  let inputTokens = 0
  let outputTokens = 0

  for (let round = 0; round <= config.llm.maxToolRounds; round++) {
    const stream = streamWithFallback(config, {
      system: buildSystemPrompt(config, {
        question,
        retrieved,
        citations,
        ungrounded,
        pathname: req.pathname,
        userName: req.user?.name ?? req.user?.email ?? null,
        observations,
        availableTools: available.map((t) => ({ name: t.name, description: t.description })),
      }),
      messages,
      tools: tools.toProviderSchema(available),
      signal: req.signal,
    })

    const pendingCalls: ToolCall[] = []
    let roundText = ""

    for await (const chunk of stream.chunks) {
      if (chunk.type === "text") {
        roundText += chunk.text
        answer += chunk.text
        yield { type: "delta", text: chunk.text }
      } else if (chunk.type === "tool_call") {
        pendingCalls.push(chunk.toolCall)
      } else if (chunk.type === "done") {
        finishReason = chunk.finishReason
        inputTokens += chunk.inputTokens ?? 0
        outputTokens += chunk.outputTokens ?? 0
      } else if (chunk.type === "error") {
        yield { type: "error", message: chunk.message }
        if (answer.length === 0 && observations.length === 0 && round === 0) {
          yield { type: "done" }
          return {
            grounded: false,
            provider: null,
            citations: [],
            answer: fallbackAnswer(config, chunk.message),
            toolCalls,
          }
        }
      }
    }
    provider = await Promise.race([stream.providerUsed, Promise.resolve(null)])

    if (pendingCalls.length === 0) {
      // Turn is finished — but only if the model actually said something.
      if (answer.trim().length === 0) {
        answer = fallbackAnswer(config, "the model returned an empty answer")
      }
      break
    }

    // A consent-gated tool ends the turn. The visitor has to click first.
    const consentCall = pendingCalls.find((c) => tools.get(c.name)?.requiresConsent)
    if (consentCall) {
      const action: PendingAction = {
        id: `act_${Date.now().toString(36)}_${actionSeq++}`,
        name: consentCall.name,
        args: consentCall.args,
        label: consentLabel(config, consentCall.name),
      }
      yield { type: "confirm", action }
      return {
        grounded: !ungrounded || observations.length > 0,
        provider,
        citations,
        pendingAction: action,
        answer,
        toolCalls,
      }
    }

    if (toolCalls.length >= config.security.maxToolCallsPerQuestion) {
      yield {
        type: "tool_result",
        id: "",
        name: "limit",
        ok: false,
        summary: "Tool call limit reached for this question.",
      }
      break
    }

    const roundResults: { name: string; ok: boolean; text: string }[] = []
    for (const call of pendingCalls) {
      const tool = tools.get(call.name)
      if (!tool) {
        // Every call must get a response, or the replay is rejected outright:
        // Gemini 400s on a functionCall with nothing answering it. A model that
        // invents a tool name should be told so, not quietly ignored.
        roundResults.push({
          name: call.name,
          ok: false,
          text: `There is no tool called "${call.name}". Do not call it again.`,
        })
        toolCalls.push({ name: call.name, ok: false })
        continue
      }
      yield { type: "tool", id: call.id, name: call.name, kind: tool.kind }

      const result: ToolResult = await runTool(tools, call.name, call.args, ctx)
      const text = result.observation
      roundResults.push({ name: call.name, ok: result.ok, text })
      toolCalls.push({ name: call.name, ok: result.ok })

      yield {
        type: "tool_result",
        id: call.id,
        name: call.name,
        ok: result.ok,
        summary: summarise(result),
      }

      // `navigate_to` is an action the UI applies directly; there is nothing
      // useful to tell the model about it.
      if (call.name === "navigate_to" && result.ok) {
        const path = (result.data as { path?: string } | undefined)?.path
        if (path) yield { type: "navigate", path }
      }
    }

    observations.push(...roundResults)

    // One assistant turn carrying both the calls and their results.
    //
    // These used to be two messages — one with the calls, then a blank one
    // holding only the results — and both providers dropped the second: Gemini
    // bails out of a message with no text and no calls, so the replay ended on
    // a model turn ("Requests ending with a model turn are not supported"), and
    // Groq never saw the tool_call_id its `role: "tool"` messages need. Paired
    // on one turn, both mappers do the obvious thing.
    messages.push({
      role: "assistant",
      content: roundText,
      toolCalls: pendingCalls.map((c) => ({
        id: c.id,
        name: c.name,
        args: c.args,
        // Gemini 3.x 400s on a replayed functionCall that has lost this.
        ...(c.thoughtSignature ? { thoughtSignature: c.thoughtSignature } : {}),
      })),
      toolResults: roundResults.map((r) => ({ name: r.name, ok: r.ok, observation: r.text })),
    })
  }

  // Citations ride along once the answer is complete.
  if (citations.length > 0) yield { type: "citations", sources: citations }
  yield { type: "done", finishReason, tokens: { input: inputTokens, output: outputTokens } }

  return {
    // Honesty about grounding, not optimism: text length is not evidence.
    // Either the retrieval found something or a tool returned real data.
    grounded: !ungrounded || observations.length > 0,
    provider,
    citations,
    answer,
    toolCalls,
  }
}

function buildUserContextBlock(
  ctx: ToolContext,
  question: string,
  retrieved: Parameters<typeof buildUserContext>[0]["retrieved"],
  ungrounded: boolean,
  retrievalOk: boolean,
  available: { name: string; description: string }[]
): string {
  const block = buildUserContext({
    question,
    retrieved,
    citations: [],
    ungrounded,
    pathname: ctx.pathname,
    userName: ctx.user?.name ?? ctx.user?.email ?? null,
    observations: [],
    availableTools: available,
  })

  const guard = ungrounded
    ? retrievalOk
      ? "\n\nIMPORTANT: Nothing on this website matches the visitor's question. Do not answer from general knowledge about the industry. Tell the visitor plainly that this information is not published here, and offer to pass them to the team."
      : "\n\nIMPORTANT: The knowledge search is temporarily unavailable. Tell the visitor you cannot verify this right now and offer to pass them to the team. Do not guess."
    : ""

  return `VISITOR QUESTION:\n${question}\n\n---\n${block}${guard}`
}

function trimHistory(history: ChatMessage[], maxTurns: number): ChatMessage[] {
  if (history.length <= maxTurns) return history
  return history.slice(history.length - maxTurns)
}

function consentLabel(config: ResolvedMikuConfig, toolName: string): string {
  if (toolName === "book_a_call") return "Show me the booking link"
  if (toolName === "offer_human_handoff") return "Connect me with the team"
  if (toolName === "navigate_to") return "Take me there"
  return config.actions.leadConsentLabel ?? "Yes, do it"
}

function summarise(result: ToolResult): string {
  if (!result.ok) return "Failed"
  const data = result.data as Record<string, unknown> | undefined
  if (data && typeof data === "object") {
    if (Array.isArray(data.items)) return `${data.items.length} result(s)`
    if (typeof data.total === "number") return `${data.total} result(s)`
  }
  return "Done"
}

/**
 * Runs one action the visitor has explicitly confirmed, audits it, and returns
 * the observation so the caller can continue the conversation.
 */
export async function executeConfirmedAction(
  req: AgentRequest & { action: PendingAction & { approved: boolean } },
  registry?: ToolRegistry
): Promise<{ ok: boolean; observation: string; data?: unknown }> {
  const { config } = req
  const store = req.store ?? createStore(config)
  const tools = registry ?? buildRegistry(config, store)

  if (!req.action.approved) {
    return { ok: false, observation: "The visitor declined this action. Do not retry it." }
  }

  const tool = tools.get(req.action.name)
  if (!tool) {
    return { ok: false, observation: `Unknown tool "${req.action.name}".` }
  }
  // Re-check availability at execution time, not only when the confirm card was
  // rendered. Between those two moments the visitor's session state can change.
  const ctx: ToolContext = {
    user: req.user ?? null,
    sessionId: req.sessionId,
    pathname: req.pathname,
    config,
    query: req.question,
  }
  const stillAvailable = (await tools.available(ctx)).some((t) => t.name === tool.name)
  if (!stillAvailable) {
    return { ok: false, observation: "That action is no longer available. Do not retry it." }
  }

  const result = await runTool(tools, req.action.name, req.action.args, ctx)
  await audit(config, req.sessionId, req.action.name, req.action.args, result.ok)
  return { ok: result.ok, observation: result.observation, data: result.data }
}

/**
 * Writes to miku_actions so a host can see what MIKU did on its users' behalf.
 *
 * The arguments are recorded, because "which tool ran" is not a useful audit
 * trail on its own — "who did it run as, and with what" is. Anything that looks
 * like a secret is replaced rather than stored: an audit log is the last place
 * that should hold a credential.
 */
async function audit(
  config: ResolvedMikuConfig,
  sessionId: string,
  tool: string,
  args: Record<string, unknown>,
  ok: boolean
): Promise<void> {
  const db = config.db
  if (!db) return
  const dialect = new Dialect(db.dialect ?? "mysql")
  const exec = db.execute ?? db.query
  const raw =
    `INSERT INTO miku_actions (id, session_id, tool, args, ok, created_at) ` +
    `VALUES (?, ?, ?, ?, ?, ${dialect.now()})`
  try {
    await exec(dialect.placeholders(raw), [
      `act_${Math.random().toString(36).slice(2, 10)}`,
      sessionId.slice(0, 180),
      tool.slice(0, 120),
      JSON.stringify(redactArgs(args)).slice(0, 4000),
      ok ? 1 : 0,
    ])
  } catch (err) {
    // Auditing must never break the visitor's request.
    console.warn("[miku] audit write failed:", (err as Error).message)
  }
}

const SECRET_ARG = /(pass|secret|token|api[-_]?key|auth|cookie|otp|pin|cvv|card)/i

/** Replaces secret-looking values in tool arguments before they are stored. */
function redactArgs(args: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(args ?? {})) {
    if (SECRET_ARG.test(key)) {
      out[key] = "[redacted]"
      continue
    }
    out[key] =
      typeof value === "string"
        ? value.slice(0, 500)
        : value && typeof value === "object"
          ? "[object]"
          : value
  }
  return out
}

export type { MikuTool }