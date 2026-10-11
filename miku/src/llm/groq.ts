import type { ResolvedMikuConfig } from "../config/types"
import type { ToolCall } from "../types"
import {
  frameData,
  ProviderError,
  safeJsonParse,
  sseFrames,
  type LlmChunk,
  type LlmMessage,
  type LlmProvider,
  type LlmStreamOptions,
} from "./types"

const BASE = "https://api.groq.com/openai/v1/chat/completions"

interface GroqToolCallDelta {
  index: number
  id?: string
  function?: { name?: string; arguments?: string }
}

interface GroqChunk {
  choices?: {
    delta?: {
      content?: string | null
      tool_calls?: GroqToolCallDelta[]
    }
    finish_reason?: string | null
  }[]
  usage?: { prompt_tokens?: number; completion_tokens?: number }
  error?: { message?: string }
}

function apiKey(): string | undefined {
  return process.env.GROQ_API_KEY
}

export function getGroqModel(config?: ResolvedMikuConfig): string {
  if (config?.llm.model) return config.llm.model
  if (config?.llm.models.groq) return config.llm.models.groq
  return process.env.GROQ_MODEL || "llama-3.3-70b-versatile"
}

export function isGroqConfigured(): boolean {
  return Boolean(apiKey())
}

type GroqMessage =
  | { role: "system" | "user" | "assistant"; content: string }
  | {
      role: "assistant"
      content: string | null
      tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[]
    }
  | { role: "tool"; tool_call_id: string; name: string; content: string }

function toGroqMessages(system: string, messages: LlmMessage[]): GroqMessage[] {
  const out: GroqMessage[] = [{ role: "system", content: system }]
  for (const m of messages) {
    if (m.role === "user") {
      out.push({ role: "user", content: m.content || " " })
      continue
    }
    if (m.toolCalls?.length) {
      out.push({
        role: "assistant",
        content: m.content || null,
        tool_calls: m.toolCalls.map((c) => ({
          id: c.id,
          type: "function" as const,
          function: { name: c.name, arguments: JSON.stringify(c.args) },
        })),
      })
      for (const r of m.toolResults ?? []) {
        const id = m.toolCalls.find((c) => c.name === r.name)?.id
        if (!id) continue
        out.push({ role: "tool", tool_call_id: id, name: r.name, content: r.observation })
      }
      continue
    }
    if (m.content) out.push({ role: "assistant", content: m.content })
  }
  return out
}

export async function* streamGroq(
  config: ResolvedMikuConfig,
  opts: LlmStreamOptions
): AsyncGenerator<LlmChunk> {
  const key = apiKey()
  if (!key) {
    yield { type: "error", message: "Groq is not configured (GROQ_API_KEY missing)" }
    return
  }

  const body: Record<string, unknown> = {
    model: getGroqModel(config),
    messages: toGroqMessages(opts.system, opts.messages),
    stream: true,
    temperature: config.llm.temperature,
    max_tokens: config.llm.maxOutputTokens,
  }
  if (opts.tools?.length) {
    body.tools = opts.tools.map((t) => ({
      type: "function",
      function: { name: t.name, description: t.description, parameters: t.parameters },
    }))
    body.tool_choice = "auto"
  }

  let res: Response
  try {
    res = await fetch(BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
      signal: opts.signal,
    })
  } catch (err) {
    yield {
      type: "error",
      message: err instanceof Error ? err.message : "Groq request failed",
      retryable: true,
    }
    return
  }

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "")
    throw new ProviderError(
      `Groq ${res.status}: ${text.slice(0, 300)}`,
      res.status === 429 || res.status >= 500
    )
  }

  // Groq streams tool-call arguments as string fragments keyed by index, so we
  // accumulate them and only emit a call once the JSON parses.
  const pending = new Map<number, { id: string; name: string; args: string }>()
  const usage: { in?: number; out?: number } = {}
  let finishReason: string | undefined
  let callSeq = 0

  for await (const frame of sseFrames(res.body, opts.signal)) {
    const payload = frameData(frame)
    if (payload === null) continue
    if (payload === "[DONE]") break

    const parsed = safeJsonParse<GroqChunk | null>(payload, null)
    if (!parsed) continue
    if (parsed.error) {
      yield { type: "error", message: parsed.error.message || "Groq error" }
      continue
    }
    if (parsed.usage) {
      usage.in = parsed.usage.prompt_tokens ?? usage.in
      usage.out = parsed.usage.completion_tokens ?? usage.out
    }

    const choice = parsed.choices?.[0]
    if (!choice) continue
    if (choice.finish_reason) finishReason = choice.finish_reason

    const text = choice.delta?.content
    if (text) yield { type: "text", text }

    for (const tc of choice.delta?.tool_calls ?? []) {
      const slot = pending.get(tc.index) ?? { id: "", name: "", args: "" }
      if (tc.id) slot.id = tc.id
      if (tc.function?.name) slot.name += tc.function.name
      if (tc.function?.arguments) slot.args += tc.function.arguments
      pending.set(tc.index, slot)
    }
  }

  for (const slot of pending.values()) {
    if (!slot.name) continue
    const call: ToolCall = {
      id: slot.id || `groq-${Date.now().toString(36)}-${callSeq++}`,
      name: slot.name,
      args: safeJsonParse<Record<string, unknown>>(slot.args || "{}", {}),
    }
    yield { type: "tool_call", toolCall: call }
  }

  yield {
    type: "done",
    finishReason,
    inputTokens: usage.in,
    outputTokens: usage.out,
  }
}

export function createGroqProvider(config: ResolvedMikuConfig): LlmProvider {
  return {
    id: "groq",
    isConfigured: isGroqConfigured,
    streamChat: (opts) => streamGroq(config, opts),
    // Groq has no embedding endpoint; retrieval falls back to keyword-only.
  }
}