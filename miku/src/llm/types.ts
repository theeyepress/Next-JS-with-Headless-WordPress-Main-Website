import type { MikuProviderId } from "../config/types"
import type { ToolCall } from "../types"

export interface LlmMessage {
  role: "user" | "assistant"
  content: string
  /** Tool calls the assistant requested, replayed to providers that need them. */
  toolCalls?: ToolCall[]
  /**
   * Observations returned for those calls. Kept on the assistant turn because
   * both Gemini and Groq require a tool result to directly follow its call.
   */
  toolResults?: { name: string; ok: boolean; observation: string }[]
}

export type LlmChunk =
  | { type: "text"; text: string }
  | { type: "tool_call"; toolCall: ToolCall }
  | { type: "done"; finishReason?: string; inputTokens?: number; outputTokens?: number }
  | { type: "error"; message: string; retryable?: boolean }

export interface LlmStreamOptions {
  system: string
  messages: LlmMessage[]
  tools?: { name: string; description: string; parameters: unknown }[]
  signal?: AbortSignal
}

export interface LlmProvider {
  id: MikuProviderId
  /** False when the API key is missing — the cascade skips this provider. */
  isConfigured(): boolean
  streamChat(opts: LlmStreamOptions): AsyncGenerator<LlmChunk>
  /**
   * Embeds a batch of strings. Only Gemini implements this; when no provider can
   * embed, retrieval falls back to keyword-only.
   */
  embed?(texts: string[], dimensions: number): Promise<number[][]>
}

export class ProviderError extends Error {
  retryable: boolean
  constructor(message: string, retryable = false) {
    super(message)
    this.name = "ProviderError"
    this.retryable = retryable
  }
}

/** Splits an SSE byte stream into decoded text frames. */
export async function* sseFrames(
  body: ReadableStream<Uint8Array>,
  signal?: AbortSignal
): AsyncGenerator<string> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  try {
    while (true) {
      if (signal?.aborted) break
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      // Frames are separated by a blank line. Keep the tail for the next read.
      let sep: number
      while ((sep = indexOfFrameBoundary(buffer)) !== -1) {
        const raw = buffer.slice(0, sep)
        buffer = buffer.slice(sep).replace(/^(\r?\n){2}/, "")
        const frame = raw.trim()
        if (frame) yield frame
      }
    }
    const tail = buffer.trim()
    if (tail) yield tail
  } finally {
    reader.releaseLock?.()
  }
}

/** Returns the index of the blank-line frame boundary, or -1. */
function indexOfFrameBoundary(buffer: string): number {
  const lf = buffer.indexOf("\n\n")
  const crlf = buffer.indexOf("\r\n\r\n")
  if (lf === -1) return crlf
  if (crlf === -1) return lf
  return Math.min(lf, crlf)
}

/** Pulls the `data:` payload out of one raw SSE frame. */
export function frameData(frame: string): string | null {
  const lines = frame.split(/\r?\n/)
  const data: string[] = []
  for (const line of lines) {
    if (line.startsWith("data:")) data.push(line.slice(5).trimStart())
    else if (line.startsWith(":")) continue
  }
  if (data.length === 0) return null
  return data.join("\n")
}

export function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}