/**
 * Public type contract for MIKU.
 *
 * A host site describes itself once, in `miku.config.ts`, and everything else —
 * ingestion, retrieval, tools, persona, widget — is derived from that. Nothing
 * in here is Next.js specific, so the same config drives a Next.js App Router
 * site, a Vite React SPA, or anything else with a server runtime.
 */

import type { ResolvedMikuConfig } from "./config/types"

/** A tool the model may call. Everything that mutates state must be an action. */
export interface MikuTool<TArgs = unknown, TResult = unknown> {
  /** Unique, snake_case. Shown to the model verbatim, so keep it unambiguous. */
  name: string
  /** One line. The model reads this to decide whether to call the tool. */
  description: string
  /**
   * JSON Schema for the arguments. Gemini and Groq both accept this subset
   * (type/object/array/properties/required/enum/description).
   */
  parameters: JsonSchema
  /** Grouping used for authorisation checks and for how the UI presents the call. */
  kind?: "knowledge" | "catalog" | "account" | "action"
  /**
   * Actions change state. They are never executed without an explicit click in
   * the UI, they are opt-out per tool, and every invocation is audited.
   */
  requiresConsent?: boolean
  /** Returns false to hide the tool from the model entirely. Checked per request. */
  isAvailable?: (ctx: ToolContext) => boolean | Promise<boolean>
  /** Executes the tool. Throw to fail; the message is shown to the user. */
  execute: (args: TArgs, ctx: ToolContext) => Promise<TResult>
}

export interface ToolContext {
  /** Present when the visitor is signed in on the host site. */
  user?: MikuUser | null
  /** Stable id for this browser session, used for rate limiting and audit. */
  sessionId: string
  /** Page the visitor is currently on, so MIKU can say "this page". */
  pathname?: string
  /** Full config, so a tool can read brand/llm settings if it needs to. */
  config: ResolvedMikuConfig
  /** The question being answered, for tools that need intent beyond their args. */
  query: string
}

export interface MikuUser {
  id: string
  email?: string | null
  name?: string | null
  role?: string | null
}

export interface JsonSchema {
  type: "object" | "string" | "number" | "boolean" | "array"
  properties?: Record<string, JsonSchema>
  required?: string[]
  items?: JsonSchema
  enum?: string[]
  description?: string
  minimum?: number
  maximum?: number
  default?: unknown
}

/** Tool call as emitted by a provider, normalised across Gemini and Groq. */
export interface ToolCall {
  id: string
  name: string
  args: Record<string, unknown>
  /**
   * Gemini only: the opaque signature that must accompany a functionCall when
   * the turn is replayed to the model. Carried as an optional field so the
   * provider-neutral history can round-trip it; Groq ignores it.
   */
  thoughtSignature?: string
}

export interface ToolResult {
  id: string
  name: string
  ok: boolean
  /** Compact string handed back to the model as the tool's observation. */
  observation: string
  /** Structured result, used by the UI (for example a list of orders). */
  data?: unknown
  /** Short line shown in the UI while/after the call runs. */
  label?: string
}

export interface Citation {
  title: string
  url: string
  /** Optional excerpt shown in the citation popover. */
  snippet?: string
}

export interface RetrievedChunk {
  id: string
  documentId: string
  title: string
  url: string
  text: string
  /** 0..1 hybrid score after fusion. */
  score: number
}
