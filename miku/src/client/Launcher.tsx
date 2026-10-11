"use client"

import { useEffect, useRef, useState } from "react"
import { MikuMark } from "./icons"

export interface LauncherProps {
  open: boolean
  onToggle: () => void
  /** Idle milliseconds before the attention ring starts. */
  attentionAfterMs: number
  attentionEnabled: boolean
  tip: string
  label: string
  logoUrl?: string
}

/**
 * The floating launcher.
 *
 * Three separate pieces of motion, each doing one job:
 *  - a permanent slow bob, so it reads as alive rather than as chrome;
 *  - a breathing halo, so it is visible against a busy page;
 *  - a one-off attention ring after a period of inactivity.
 *
 * The attention ring deliberately stops after a few cycles. A badge that pulses
 * forever trains people to ignore it, which defeats the purpose of having one.
 */
export function Launcher({
  open,
  onToggle,
  attentionAfterMs,
  attentionEnabled,
  tip,
  label,
  logoUrl,
}: LauncherProps) {
  const [attention, setAttention] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Arm the nudge only while the panel is closed and nudging is wanted. The
  // state update sits inside the timeout callback rather than the effect body,
  // so opening MIKU never triggers a synchronous render cascade.
  useEffect(() => {
    if (open || !attentionEnabled) return
    timerRef.current = setTimeout(() => setAttention(true), attentionAfterMs)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [open, attentionEnabled, attentionAfterMs])

  // The nudge fades on its own so it cannot sit and pulse forever.
  useEffect(() => {
    if (!attention) return
    const stop = setTimeout(() => setAttention(false), 6_500)
    return () => clearTimeout(stop)
  }, [attention])

  // Derived rather than cleared from an effect: a nudge is only ever visible
  // while the panel is closed and the host still allows it.
  const showAttention = attention && !open && attentionEnabled

  // Tapping the launcher is an interaction, so the nudge is spent either way.
  const handleToggle = () => {
    setAttention(false)
    onToggle()
  }

  return (
    <button
      type="button"
      className="miku-launcher"
      onClick={handleToggle}
      data-open={open}
      data-attention={showAttention}
      aria-expanded={open}
      aria-label={open ? `Close ${label}` : `Open ${label} chat`}
      aria-haspopup="dialog"
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" width={26} height={26} style={{ objectFit: "contain" }} />
      ) : (
        <MikuMark />
      )}

      <span className="miku-launcher-tip" aria-hidden>
        {tip}
      </span>
    </button>
  )
}