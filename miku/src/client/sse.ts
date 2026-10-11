export interface SseMessage {
  event: string
  data: string
}

/**
 * Reads a `text/event-stream` response body and yields decoded frames.
 *
 * `EventSource` cannot issue a POST and cannot send an auth header, which is
 * exactly what a chat endpoint needs, so the parsing is done by hand against
 * `fetch` + a stream reader instead.
 */
export async function* parseSse(
  body: ReadableStream<Uint8Array>,
  signal?: AbortSignal
): AsyncGenerator<SseMessage> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      if (signal?.aborted) break
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      let index: number
      while ((index = buffer.search(/\r?\n\r?\n/)) !== -1) {
        const raw = buffer.slice(0, index)
        buffer = buffer.slice(index).replace(/^(\r?\n){2}/, "")
        const parsed = parseFrame(raw)
        if (parsed) yield parsed
      }
    }
    const tail = parseFrame(buffer)
    if (tail) yield tail
  } finally {
    reader.releaseLock?.()
    // Cancel so the socket is released promptly when the consumer stops early.
    await reader.cancel().catch(() => {})
  }
}

function parseFrame(raw: string): SseMessage | null {
  if (!raw.trim()) return null
  let event = "message"
  const data: string[] = []
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith("event:")) event = line.slice(6).trim()
    else if (line.startsWith("data:")) data.push(line.slice(5).replace(/^ /, ""))
  }
  if (data.length === 0) return null
  return { event, data: data.join("\n") }
}

/** Stable per-browser id used for rate limiting and audit rows. */
export function getSessionId(): string {
  if (typeof window === "undefined") return "server"
  const key = "miku.session"
  try {
    const existing = window.localStorage.getItem(key)
    if (existing) return existing
    const fresh = `s_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
    window.localStorage.setItem(key, fresh)
    return fresh
  } catch {
    // Private browsing or blocked storage: fall back to a per-tab id.
    return `t_${Math.random().toString(36).slice(2, 12)}`
  }
}

export function currentPathname(): string {
  if (typeof window === "undefined") return ""
  return window.location.pathname
}