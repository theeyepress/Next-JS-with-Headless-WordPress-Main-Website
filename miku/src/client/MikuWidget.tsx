"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Launcher } from "./Launcher"
import { Panel } from "./Panel"
import { currentPathname } from "./sse"
import type { MikuWidgetProps } from "./types"
import { useMiku } from "./useMiku"

export const DEFAULT_ENDPOINT = "/api/miku/chat"

function useSystemTheme(): "light" | "dark" {
  const [theme, setTheme] = useState<"light" | "dark">("light")
  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)")
    const apply = () => setTheme(query.matches ? "dark" : "light")
    apply()
    query.addEventListener("change", apply)
    return () => query.removeEventListener("change", apply)
  }, [])
  return theme
}

/**
 * Publishes the on-screen keyboard's height as `--miku-keyboard-h` on the
 * widget root, so CSS can lift the panel clear of it.
 *
 * iOS and Android overlay the software keyboard instead of shrinking the
 * layout viewport, which means `100dvh`, `window.innerHeight` and every
 * bottom-anchored element keep reporting the pre-keyboard height. The keyboard
 * only ever shows up in `visualViewport`: the strip between it and the layout
 * viewport is exactly the keyboard. Publishes 0px when there is none, and does
 * nothing at all in browsers without the API — the panel then just stays where
 * it was.
 *
 * The 24px floor exists because Safari reports a few pixels of drift here while
 * the page scrolls; lifting the panel for that would make it jitter.
 */
function useKeyboardInset(rootRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return

    const apply = () => {
      const el = rootRef.current
      if (!el) return
      const hidden = window.innerHeight - viewport.height - viewport.offsetTop
      const pixels = hidden > 24 ? Math.round(hidden) : 0
      el.style.setProperty("--miku-keyboard-h", `${pixels}px`)
    }

    apply()
    viewport.addEventListener("resize", apply)
    viewport.addEventListener("scroll", apply)
    return () => {
      viewport.removeEventListener("resize", apply)
      viewport.removeEventListener("scroll", apply)
    }
  }, [rootRef])
}

/**
 * MIKU's entire client surface: one button and one panel.
 *
 * Everything about the assistant — what it knows, what it can do, what it looks
 * like — comes from the server config, so a host changes behaviour in
 * miku.config.ts and never touches this file.
 */
export function MikuWidget(props: MikuWidgetProps) {
  const {
    endpoint = DEFAULT_ENDPOINT,
    theme = "auto",
    position = "bottom-right",
    assistantName = "MIKU",
    accent,
    accentAlt,
    defaultOpen = false,
    className,
  } = props

  const systemTheme = useSystemTheme()
  const resolvedTheme = theme === "auto" ? systemTheme : theme

  const [open, setOpen] = useState(defaultOpen)
  const rootRef = useRef<HTMLDivElement | null>(null)
  useKeyboardInset(rootRef)
  // Snapshot of the route at mount. MIKU is told where the visitor is when they
  // open the panel, not tracked continuously — tracking would mean re-rendering
  // the widget on every navigation of the host's router.
  const [pathname, setPathname] = useState(() => currentPathname())

  // Captured on the click instead of in an effect: the visitor's route is read
  // at the moment they ask for the panel, batched with the open itself.
  const handleToggle = () => {
    const willOpen = !open
    if (willOpen) setPathname(currentPathname())
    setOpen(willOpen)
  }

  const chat = useMiku({
    endpoint,
    pathname,
    onComplete: props.onComplete,
    onNavigate: props.onNavigate,
  })

  const style = useMemo(() => {
    const vars: Record<string, string> = {}
    if (accent) vars["--miku-accent"] = accent
    if (accentAlt) vars["--miku-accent-alt"] = accentAlt
    return vars as React.CSSProperties
  }, [accent, accentAlt])

  const tips = useMemo(() => {
    if (props.launcherTip) return props.launcherTip
    return `Ask ${assistantName} anything`
  }, [props.launcherTip, assistantName])

  return (
    <div
      ref={rootRef}
      className={className ? `miku-root ${className}` : "miku-root"}
      data-theme={resolvedTheme}
      data-position={position}
      style={style}
    >
      <Launcher
        open={open}
        onToggle={handleToggle}
        attentionAfterMs={12_000}
        attentionEnabled={props.defaultOpen !== true && !chat.hasMessages}
        tip={tips}
        label={assistantName}
        logoUrl={props.logoUrl}
      />
      {open && (
        <Panel
          {...props}
          chat={chat}
          assistantName={assistantName}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}

export default MikuWidget