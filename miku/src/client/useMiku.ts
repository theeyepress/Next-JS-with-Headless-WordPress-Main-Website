"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { MikuMessage, MikuPendingAction, MikuToolActivity } from "./types"
import { getSessionId, parseSse } from "./sse"

let seq = 0
const nextId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${seq++}`

export interface UseMikuOptions {
  endpoint: string
  pathname: string
  onComplete?: (message: MikuMessage) => void
  onNavigate?: (path: string) => void
}

export interface UseMikuResult {
  messages: MikuMessage[]
  busy: boolean
  send: (text: string) => void
  confirmAction: (action: MikuPendingAction, approved: boolean) => void
  reset: () => void
  hasMessages: boolean
  error: string | null
}

/**
 * Owns the conversation and the network conversation with the endpoint.
 *
 * Deliberately has no persistence: MIKU keeps no cross-session memory, so a
 * reload starts clean. History is still carried in memory for the current
 * session, which is what lets MIKU resolve "what about the premium one?".
 */
export function useMiku(options: UseMikuOptions): UseMikuResult {
  const { endpoint, pathname } = options

  const [messages, setMessages] = useState<MikuMessage[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sessionId = useRef<string>(getSessionId())
  const abortRef = useRef<AbortController | null>(null)
  // A ref rather than state: the stream must always see the conversation as it
  // is right now, never a stale render's copy.
  const historyRef = useRef<{ role: "user" | "assistant"; content: string }[]>([])
  const pathnameRef = useRef(pathname)
  const completeRef = useRef(options.onComplete)
  const navigateRef = useRef(options.onNavigate)

  useEffect(() => {
    completeRef.current = options.onComplete
    navigateRef.current = options.onNavigate
  }, [options.onComplete, options.onNavigate])

  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const patchLast = useCallback((fn: (m: MikuMessage) => MikuMessage) => {
    setMessages((prev) => {
      if (prev.length === 0) return prev
      const next = [...prev]
      const index = next.length - 1
      const current = next[index]
      if (!current) return prev
      next[index] = fn(current)
      return next
    })
  }, [])

  const run = useCallback(
    async (payload: Record<string, unknown>) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setBusy(true)
      setError(null)

      const assistantId = nextId("a")
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", streaming: true, tools: [] },
      ])

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
          body: JSON.stringify({
            sessionId: sessionId.current,
            pathname: pathnameRef.current,
            history: historyRef.current,
            ...payload,
          }),
          signal: controller.signal,
        })

        if (!res.ok && !res.body) {
          throw new Error(`The assistant is unavailable (HTTP ${res.status}).`)
        }
        if (!res.body) throw new Error("The assistant returned an empty response.")

        for await (const frame of parseSse(res.body, controller.signal)) {
          let event: Record<string, unknown>
          try {
            event = JSON.parse(frame.data) as Record<string, unknown>
          } catch {
            continue
          }

          switch (event.type) {
            case "delta": {
              const text = String(event.text ?? "")
              if (text) patchLast((m) => ({ ...m, content: m.content + text }))
              break
            }
            case "tool": {
              const activity: MikuToolActivity = {
                id: String(event.id ?? event.name ?? nextId("t")),
                name: String(event.name ?? ""),
                status: "running",
              }
              patchLast((m) => ({
                ...m,
                tools: [...(m.tools ?? []).filter((t) => t.name !== activity.name), activity],
              }))
              break
            }
            case "tool_result": {
              const name = String(event.name ?? "")
              patchLast((m) => ({
                ...m,
                tools: (m.tools ?? []).map((t) =>
                  t.name === name
                    ? { ...t, status: event.ok ? "done" : "error", summary: String(event.summary ?? "") }
                    : t
                ),
              }))
              break
            }
            case "citations": {
              const sources = (event.sources as MikuMessage["citations"]) ?? []
              patchLast((m) => ({ ...m, citations: sources }))
              break
            }
            case "confirm": {
              patchLast((m) => ({
                ...m,
                streaming: false,
                pending: event.action as MikuPendingAction,
              }))
              break
            }
            case "navigate": {
              navigateRef.current?.(String(event.path ?? "/"))
              break
            }
            case "rate_limited": {
              setError(String(event.message ?? "Slow down a moment."))
              break
            }
            case "error": {
              const message = String(event.message ?? "Something went wrong.")
              // An error before any token means the whole turn failed.
              let hadContent = false
              patchLast((m) => {
                hadContent = m.content.length > 0
                return { ...m, error: true }
              })
              if (!hadContent) {
                setMessages((prev) => prev.filter((m) => m.id !== assistantId))
                setError(message)
              }
              break
            }
            case "done": {
              break
            }
            default:
              break
          }
        }

        // Commit the finished turn to history so the next question has context.
        setMessages((prev) => {
          const last = prev[prev.length - 1]
          if (!last || last.id !== assistantId) return prev
          const finished: MikuMessage = { ...last, streaming: false }
          if (finished.content.trim().length > 0) {
            historyRef.current = [
              ...historyRef.current,
              { role: "assistant", content: finished.content },
            ]
          }
          completeRef.current?.(finished)
          const index = prev.length - 1
          const next = [...prev]
          next[index] = finished
          return next
        })
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          setMessages((prev) => prev.filter((m) => m.id !== assistantId))
        } else {
          setMessages((prev) => prev.filter((m) => m.id !== assistantId))
          setError((err as Error).message || "Could not reach the assistant.")
        }
      } finally {
        if (abortRef.current === controller) abortRef.current = null
        setBusy(false)
      }
    },
    [endpoint, patchLast]
  )

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (trimmed.length === 0 || busy) return
      const userMessage: MikuMessage = { id: nextId("u"), role: "user", content: trimmed }
      setMessages((prev) => [...prev, userMessage])
      historyRef.current = [...historyRef.current, { role: "user", content: trimmed }]
      void run({ message: trimmed })
    },
    [busy, run]
  )

  const confirmAction = useCallback(
    (action: MikuPendingAction, approved: boolean) => {
      if (busy) return
      patchLast((m) => ({ ...m, pending: undefined, resolved: true }))
      void run({ confirmedAction: { ...action, approved } })
    },
    [busy, patchLast, run]
  )

  const reset = useCallback(() => {
    abortRef.current?.abort()
    historyRef.current = []
    sessionId.current = getSessionId()
    setMessages([])
    setError(null)
    setBusy(false)
  }, [])

  return useMemo(
    () => ({ messages, busy, send, confirmAction, reset, hasMessages: messages.length > 0, error }),
    [messages, busy, send, confirmAction, reset, error]
  )
}

export { currentPathname, getSessionId } from "./sse"