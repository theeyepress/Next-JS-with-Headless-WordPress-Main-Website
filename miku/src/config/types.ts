import type { MikuTool } from "../types"

/** Provider identifiers MIKU knows how to talk to. */
export type MikuProviderId = "gemini" | "groq"

export interface MikuBrandConfig {
  /** The business name. Used everywhere MIKU names the company. */
  name: string
  /** The assistant's own name. Defaults to "MIKU". */
  assistantName?: string
  /** One line describing the assistant, shown under its name in the header. */
  tagline?: string
  /** Absolute URL or a path under /public. */
  logoUrl?: string
  /** Accent colour used for the orb, glow and send button. */
  accent?: string
  /** Secondary gradient stop. */
  accentAlt?: string
  /** Hex or rgb() string for the assistant bubble background. */
  bubbleTint?: string
}

export interface MikuSiteConfig {
  /** Absolute origin, no trailing slash. Ingestion and citations are built on it. */
  baseUrl: string
  /** Extra sitemaps when the site has no /sitemap.xml. */
  sitemaps?: string[]
  /**
   * Path globs to index. Only these are crawled, so a host never accidentally
   * indexes a thank-you page. Defaults to ["/**"].
   */
  include?: string[]
  /** Path globs to skip. Applied after `include`. */
  exclude?: string[]
  /** Hard ceiling on pages per ingest run. Defaults to 400. */
  maxPages?: number
  /** Concurrent page fetches. Defaults to 4. */
  concurrency?: number
  /** Per-request timeout in ms. Defaults to 15000. */
  timeoutMs?: number
  /** Read and honour robots.txt Disallow rules. Defaults to true. */
  respectRobots?: boolean
  /** Extra origins allowed in addition to baseUrl (e.g. a docs subdomain). */
  additionalOrigins?: string[]
}

export interface MikuLlmConfig {
  /** Failover order. Defaults to ["gemini", "groq"]. */
  order?: MikuProviderId[]
  /** Overrides the chat model for every provider. */
  model?: string
  /** Chat model overrides, keyed by provider. */
  models?: Partial<Record<MikuProviderId, string>>
  /** Embedding model. Defaults to gemini-embedding-001 — never text-embedding-004, which the API now rejects with 404. */
  embeddingModel?: string
  /** 0..2. Defaults to 0.3 — assistants should be consistent, not creative. */
  temperature?: number
  /** Defaults to 2000. */
  maxOutputTokens?: number
  /** Turns of history sent to the model. Defaults to 8. */
  historyTurns?: number
  /** Hard cap on tool-call rounds per question. Defaults to 4. */
  maxToolRounds?: number
}

export interface MikuRetrievalConfig {
  /** Target chunk size in characters. Defaults to 1000. */
  chunkSize?: number
  /** Overlap between chunks. Defaults to 150. */
  chunkOverlap?: number
  /** Chunks handed to the model. Defaults to 6. */
  topK?: number
  /**
   * Minimum fused score for an answer to be considered grounded. Below this the
   * model is told it has no relevant information instead of being allowed to
   * guess. Defaults to 0.18.
   */
  minScore?: number
  /** Embedding width. 256 keeps MySQL rows small and is plenty for site copy. */
  embeddingDimensions?: number
  /** Set false for a pure keyword index — no embeddings, no embedding calls. */
  useVectors?: boolean
  /** Candidate depth for each leg before reciprocal-rank fusion. Defaults to 20. */
  candidateDepth?: number
  /** Reciprocal-rank-fusion damping constant. Defaults to 60. */
  rrfK?: number
}

export interface MikuPersonaConfig {
  /** Replaces MIKU's built-in system prompt wholesale. */
  systemPrompt?: string
  /** Appended to the built-in prompt — the usual way to add house style. */
  extraInstructions?: string[]
  /** Bullet list of things MIKU will do, used to answer "what can you do?". */
  canDo?: string[]
  /** Bullet list of hard boundaries. Also shown to the model. */
  cannotDo?: string[]
  /** Suggested first questions in the empty state. */
  suggestions?: string[]
}

export interface MikuActionsConfig {
  /** Turn on lead capture. Creates a lead only after the visitor confirms. */
  leadCapture?: boolean
  /** Label on the confirm button, e.g. "Send my details". */
  leadConsentLabel?: string
  /** Where `book_demo` sends the visitor. */
  bookingUrl?: string
  /** Where `handoff_to_human` sends the visitor. */
  handoffUrl?: string
  /** WhatsApp deep link for handoff. */
  handoffWhatsApp?: string
  /** Email shown in the handoff message. */
  handoffEmail?: string
}

export interface MikuWidgetConfig {
  /** Which corner the launcher sits in. Defaults to "bottom-right". */
  position?: "bottom-right" | "bottom-left"
  /** Greeting shown in the empty state. */
  greeting?: string
  /** Inline SVG data URI or URL for the launcher. Optional. */
  launcherIcon?: string
  /** Milliseconds of no interaction before the launcher pulses for attention. */
  idleAttentionAfterMs?: number
  /** Enable the launcher attention animation. Defaults to true. */
  attentionPulse?: boolean
  /** Extra small text under the header. */
  poweredByLabel?: string
}

export interface MikuSecurityConfig {
  /**
   * Strip instruction-shaped sentences out of crawled pages. Crawled content is
   * data, never instruction. Defaults to true.
   */
  sanitiseCrawledText?: boolean
  /** Never let a tool run for an anonymous visitor when true. Defaults to false. */
  requireUserForTools?: boolean
  /** Messages per minute per session. Defaults to 12. */
  rateLimitPerMinute?: number
  /** Tool calls allowed per question across all tools. Defaults to 8. */
  maxToolCallsPerQuestion?: number
}

export interface MikuRateLimitConfig {
  /** Returns true when the request may proceed. Defaults to allowing 12/min. */
  allow: (ctx: { key: string }) => boolean
}

export interface MikuAuthConfig {
  /**
   * Resolve the signed-in visitor. Return null for anonymous. Called once per
   * request on the server; never trust a client-sent identity.
   */
  resolveUser?: () => Promise<MikuUserLike | null>
}

export interface MikuUserLike {
  id: string
  email?: string | null
  name?: string | null
  role?: string | null
}

/** What a host writes in miku.config.ts. Everything is optional except brand + site. */
export interface MikuConfig {
  brand: MikuBrandConfig
  site: MikuSiteConfig
  llm?: MikuLlmConfig
  retrieval?: MikuRetrievalConfig
  persona?: MikuPersonaConfig
  actions?: MikuActionsConfig
  widget?: MikuWidgetConfig
  security?: MikuSecurityConfig
  auth?: MikuAuthConfig
  /** Extra tools. Built-ins are added automatically unless suppressed below. */
  tools?: MikuTool[]
  /** Skip the built-in catalog/knowledge tools. */
  disableBuiltInTools?: boolean
  /**
   * Supply the database handle for MIKU's own tables. MIKU never touches the
   * host's schema — it creates and owns its own four tables.
   */
  db?: MikuDatabase
  /** Provide a custom knowledge store instead of the built-in one. */
  store?: unknown
  /** Override the default per-session rate limiter. */
  rateLimit?: MikuRateLimitConfig
}

/** The minimal database surface MIKU needs. Any client with this shape works. */
export interface MikuDatabase {
  /** Runs raw SQL. */
  query: (sql: string, params?: unknown[]) => Promise<unknown[]>
  /** Runs raw SQL for writes. May share `query` on most clients. */
  execute?: (sql: string, params?: unknown[]) => Promise<unknown>
  /** Driver name, used to pick the right DDL dialect. Defaults to "mysql". */
  dialect?: "mysql" | "postgres" | "sqlite"
}

/** A config with every default applied. This is what the runtime sees. */
export interface ResolvedMikuConfig {
  brand: Required<Omit<MikuBrandConfig, "logoUrl" | "tagline">> & {
    tagline?: string
    logoUrl?: string
  }
  site: Required<
    Omit<MikuSiteConfig, "sitemaps" | "additionalOrigins">
  > & {
    sitemaps: string[]
    additionalOrigins: string[]
  }
  /** `model` stays optional because each provider has its own default. */
  llm: Required<Omit<MikuLlmConfig, "model">> & {
    model?: string
    models: Partial<Record<MikuProviderId, string>>
  }
  retrieval: Required<MikuRetrievalConfig>
  persona: Required<Omit<MikuPersonaConfig, "systemPrompt" | "extraInstructions">> & {
    systemPrompt?: string
    extraInstructions: string[]
  }
  /** Every field is optional; each one turns a specific action tool on. */
  actions: MikuActionsConfig
  widget: Required<Omit<MikuWidgetConfig, "launcherIcon" | "poweredByLabel">> & {
    launcherIcon?: string
    poweredByLabel?: string
  }
  security: Required<MikuSecurityConfig>
  tools: MikuTool[]
  disableBuiltInTools: boolean
  db?: MikuDatabase
  store?: unknown
  auth?: MikuAuthConfig
  rateLimit?: MikuRateLimitConfig
}