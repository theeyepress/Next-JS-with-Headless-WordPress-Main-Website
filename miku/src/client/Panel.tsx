"use client"

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react"
import { Message } from "./Message"
import { AlertIcon, CloseIcon, MikuMark, ResetIcon, SendIcon } from "./icons"
import type { MikuMessage, MikuPendingAction, MikuWidgetProps } from "./types"
import type { UseMikuResult } from "./useMiku"

export interface PanelProps extends MikuWidgetProps {
  chat: UseMikuResult
  assistantName: string
  onClose: () => void
}

/** Human-readable explanation of what the visitor is about to approve. */
function describeAction(action: MikuPendingAction): string {
  const args = action.args ?? {}
  switch (action.name) {
    case "book_a_call":
      return "You'll get a link to pick a time that suits you."
    case "offer_human_handoff":
      return "A member of the team will pick this up from where we left off."
    case "navigate_to":
      return `You'll be taken to the ${String(args.page ?? "requested")} page.`
    case "capture_lead":
      return [
        args.name ? `Name: ${args.name}` : null,
        args.email ? `Email: ${args.email}` : null,
        args.phone ? `Phone: ${args.phone}` : null,
        args.interest ? `Interested in: ${args.interest}` : null,
      ]
        .filter(Boolean)
        .join("\n")
    default:
      return "Please check the details below before continuing."
  }
}

export function Panel({
  chat,
  assistantName,
  onClose,
  suggestions = [],
  greeting,
  introText,
  tagline,
  logoUrl,
  poweredByLabel,
}: PanelProps) {
  const { messages, busy, send, confirmAction, reset, error } = chat
  const [draft, setDraft] = useState("")
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  const [closing, setClosing] = useState(false)

  // ── Auto-grow the composer, capped by CSS max-height ──────────────────────
  useLayoutEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`
  }, [draft])

  // ── Keep the newest message in view ──────────────────────────────────────
  useEffect(() => {
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, busy])

  // The list can also shrink without a new message — an on-screen keyboard
  // opens and lifts the panel, or the window is resized. `messages` does not
  // change in that case, so without this the newest reply sits below the fold
  // until the next send. Only follows the bottom if the reader was already
  // there: someone scrolling back through history keeps their place.
  useEffect(() => {
    const el = listRef.current
    if (!el || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(() => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight
      if (distance < 160) el.scrollTop = el.scrollHeight
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // ── Focus management and the Escape key ──────────────────────────────────
  useEffect(() => {
    restoreFocusRef.current = document.activeElement as HTMLElement | null
    inputRef.current?.focus()
    return () => restoreFocusRef.current?.focus?.()
  }, [])

  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation()
        onClose()
        return
      }
      // Trap Tab inside the dialog so keyboard users cannot wander to the page
      // behind an open panel.
      if (event.key !== "Tab" || !panelRef.current) return
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), textarea, a[href], [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("keydown", onKeyDown, true)
    return () => document.removeEventListener("keydown", onKeyDown, true)
  }, [onClose])

  const handleClose = useCallback(() => {
    setClosing(true)
    setTimeout(onClose, 180)
  }, [onClose])

  const submit = useCallback(() => {
    if (busy) return
    const text = draft.trim()
    if (text.length === 0) return
    send(text)
    setDraft("")
  }, [busy, draft, send, setDraft])

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault()
        submit()
      }
    },
    [submit]
  )

  const onFormSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault()
      submit()
    },
    [submit]
  )

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant")
  const pending = lastAssistant?.pending && !lastAssistant.resolved ? lastAssistant.pending : null
  const isEmpty = messages.length === 0

  return (
    <div
      ref={panelRef}
      className="miku-panel"
      data-closing={closing}
      role="dialog"
      aria-modal="false"
      aria-label={`${assistantName} chat`}
    >
      <header className="miku-header">
        <div className="miku-avatar" data-busy={busy}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" width={21} height={21} style={{ objectFit: "contain" }} />
          ) : (
            <MikuMark />
          )}
        </div>
        <div className="miku-header-text">
          <p className="miku-header-name">{assistantName}</p>
          {tagline && <p className="miku-header-tagline">{tagline}</p>}
        </div>
        <div className="miku-header-actions">
          <button
            type="button"
            className="miku-icon-button"
            onClick={reset}
            aria-label="Start a new conversation"
            title="New conversation"
          >
            <ResetIcon />
          </button>
          <button
            type="button"
            className="miku-icon-button"
            onClick={handleClose}
            aria-label={`Close ${assistantName} chat`}
          >
            <CloseIcon />
          </button>
        </div>
      </header>

      <div className="miku-body">
        <div
          ref={listRef}
          className="miku-messages"
          role="log"
          aria-live="polite"
          aria-relevant="additions text"
          aria-label="Conversation"
        >
          {isEmpty && (
            <div className="miku-empty">
              <div className="miku-empty-icon">
                <MikuMark />
              </div>
              <p className="miku-empty-title">{greeting ?? `Hi, I'm ${assistantName}`}</p>
              <p className="miku-empty-text">
                {introText ??
                  "Ask me anything about this site — services, pricing, policies or getting started."}
              </p>
            </div>
          )}

          {messages.map((message: MikuMessage) => (
            <Message key={message.id} message={message} />
          ))}

          {error && (
            <div className="miku-msg miku-msg-assistant miku-msg-error">
              <div className="miku-bubble">
                <AlertIcon style={{ width: 15, height: 15, verticalAlign: "-2px", marginRight: 6 }} />
                {error}
              </div>
              <button
                type="button"
                className="miku-retry"
                onClick={() => {
                  const lastUser = [...messages].reverse().find((m) => m.role === "user")
                  if (lastUser) {
                    // Re-ask rather than silently swallow the failure.
                    reset()
                    setTimeout(() => send(lastUser.content), 0)
                  }
                }}
              >
                Try again
              </button>
            </div>
          )}
        </div>

        {isEmpty && suggestions.length > 0 && (
          <div className="miku-suggestions">
            {suggestions.slice(0, 4).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="miku-suggestion"
                onClick={() => send(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {pending && (
          <div className="miku-confirm-wrap">
            <div className="miku-confirm">
              <p className="miku-confirm-title">
                <AlertIcon />
                {assistantName} wants to do this
              </p>
              <p className="miku-confirm-body">{describeAction(pending)}</p>
              {pending.name === "capture_lead" && (
                <pre className="miku-confirm-summary">
                  {describeAction(pending).split("\n").join("\n")}
                </pre>
              )}
              <div className="miku-confirm-actions">
                <button
                  type="button"
                  className="miku-btn miku-btn-ghost"
                  onClick={() => confirmAction(pending, false)}
                  disabled={busy}
                >
                  No thanks
                </button>
                <button
                  type="button"
                  className="miku-btn miku-btn-primary"
                  onClick={() => confirmAction(pending, true)}
                  disabled={busy}
                >
                  {pending.label}
                </button>
              </div>
            </div>
          </div>
        )}

        <form className="miku-composer" onSubmit={onFormSubmit}>
          <label className="miku-sr-only" htmlFor="miku-input">
            Message {assistantName}
          </label>
          <textarea
            id="miku-input"
            ref={inputRef}
            className="miku-input"
            value={draft}
            rows={1}
            placeholder={`Ask ${assistantName} anything…`}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={busy}
            maxLength={4000}
          />
          <button
            type="submit"
            className="miku-send"
            disabled={busy || draft.trim().length === 0}
            aria-label="Send message"
          >
            {busy ? (
              <span className="miku-tool-spinner miku-on-accent" aria-hidden />
            ) : (
              <SendIcon />
            )}
          </button>
        </form>

        {poweredByLabel && <p className="miku-footer">{poweredByLabel}</p>}
      </div>
    </div>
  )
}