/**
 * Inline icons.
 *
 * Hand-drawn rather than pulled from an icon package: MIKU should not add a
 * dependency to the host's tree for the sake of five glyphs, and inline SVG
 * inherits `currentColor` cleanly in both themes.
 */
import type { SVGProps } from "react"

type IconProps = SVGProps<SVGSVGElement>

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
}

export function ChatIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.9 8.9 0 0 1-3.8-.8L3 21l1.9-5.1A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z" />
    </svg>
  )
}

/** The default MIKU mark: a chat bubble with a spark, so it reads as an assistant. */
export function MikuMark(props: IconProps) {
  return (
    <svg {...base} strokeWidth={1.9} {...props}>
      <path d="M20.5 11.6a7.9 7.9 0 0 1-8.4 7.9 8.4 8.4 0 0 1-3.5-.7L4 20.4l1.8-4.6a7.9 7.9 0 0 1-.9-3.7 7.9 7.9 0 0 1 8-7.9 7.9 7.9 0 0 1 7.6 7.4Z" />
      <path d="M12 8.4l1.1 2.3 2.4 1.1-2.4 1.1L12 15.2l-1.1-2.3L8.5 11.8l2.4-1.1L12 8.4Z" />
    </svg>
  )
}

export function SendIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m4.3 11.3 15.2-6.4-6.4 15.2-2.1-6.7-6.7-2.1Z" />
    </svg>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

export function ResetIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 12a9 9 0 1 0 2.6-6.4" />
      <path d="M3 4v5h5" />
    </svg>
  )
}

export function SpinnerIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m20 6.5-11 11-5-5" />
    </svg>
  )
}

export function AlertIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5M12 16.2v.1" />
    </svg>
  )
}

export function LinkIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth={2} {...props}>
      <path d="M10.6 13.4a4.5 4.5 0 0 0 6.4 0l2.4-2.4a4.5 4.5 0 1 0-6.4-6.4L11.7 5.9" />
      <path d="M13.4 10.6a4.5 4.5 0 0 0-6.4 0l-2.4 2.4a4.5 4.5 0 1 0 6.4 6.4l1.3-1.3" />
    </svg>
  )
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21s7-3.2 7-9V5.8L12 3 5 5.8V12c0 5.8 7 9 7 9Z" />
      <path d="m9.4 12 1.8 1.8 3.6-3.6" />
    </svg>
  )
}