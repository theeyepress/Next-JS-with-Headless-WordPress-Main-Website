export interface MikuCitation {
  title: string
  url: string
  snippet?: string
}

export interface MikuToolActivity {
  id: string
  name: string
  status: "running" | "done" | "error"
  summary?: string
}

export interface MikuPendingAction {
  id: string
  name: string
  args: Record<string, unknown>
  label: string
}

export interface MikuMessage {
  id: string
  role: "user" | "assistant"
  content: string
  /** True while tokens are still arriving for this message. */
  streaming?: boolean
  error?: boolean
  citations?: MikuCitation[]
  tools?: MikuToolActivity[]
  pending?: MikuPendingAction
  /** Set once the visitor has answered a pending action. */
  resolved?: boolean
}

export interface MikuWidgetProps {
  /** Route that serves MIKU's SSE stream. */
  endpoint?: string
  /** Current pathname, so MIKU knows where the visitor is. */
  pathname?: string
  /** Shown on the launcher tooltip. */
  launcherTip?: string
  /** "light" | "dark" | "auto". Auto follows the OS setting. */
  theme?: "light" | "dark" | "auto"
  position?: "bottom-right" | "bottom-left"
  /** First questions offered in the empty state. */
  suggestions?: string[]
  greeting?: string
  /** One-line welcome shown under the greeting before the first message. */
  introText?: string
  /** Assistant display name in the header. */
  assistantName?: string
  tagline?: string
  /** Brand gradient. Also drives the launcher glow. */
  accent?: string
  accentAlt?: string
  /** Logo or icon URL for the header avatar. */
  logoUrl?: string
  /** Opens the panel on mount. */
  defaultOpen?: boolean
  /** Fired when an answer has finished streaming. */
  onComplete?: (message: MikuMessage) => void
  /** Fired when the visitor navigates via the navigate_to tool. */
  onNavigate?: (path: string) => void
  /** Small text under the composer. Pass an empty string to hide it. */
  poweredByLabel?: string
  className?: string
}

export type { MikuProviderId } from "../config/types"