import { z } from "zod"
import type { MikuConfig, ResolvedMikuConfig } from "./types"

export * from "./types"

const hex = z.string().regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "must be a hex colour")

const brandSchema = z.object({
  name: z.string().min(1, "brand.name is required"),
  assistantName: z.string().min(1).optional(),
  tagline: z.string().optional(),
  logoUrl: z.string().optional(),
  accent: hex.optional(),
  accentAlt: hex.optional(),
  bubbleTint: z.string().optional(),
})

const siteSchema = z.object({
  baseUrl: z
    .string()
    .url("site.baseUrl must be an absolute URL, e.g. https://example.com")
    .transform((v) => v.replace(/\/+$/, "")),
  sitemaps: z.array(z.string()).optional(),
  include: z.array(z.string()).optional(),
  exclude: z.array(z.string()).optional(),
  maxPages: z.number().int().positive().optional(),
  concurrency: z.number().int().positive().max(12).optional(),
  timeoutMs: z.number().int().positive().optional(),
  respectRobots: z.boolean().optional(),
  additionalOrigins: z.array(z.string()).optional(),
})

const llmSchema = z.object({
  order: z.array(z.enum(["gemini", "groq"])).optional(),
  model: z.string().optional(),
  models: z
    .object({ gemini: z.string().optional(), groq: z.string().optional() })
    .optional(),
  embeddingModel: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxOutputTokens: z.number().int().positive().optional(),
  historyTurns: z.number().int().positive().max(40).optional(),
  maxToolRounds: z.number().int().positive().max(10).optional(),
})

const retrievalSchema = z.object({
  chunkSize: z.number().int().min(200).max(4000).optional(),
  chunkOverlap: z.number().int().min(0).max(2000).optional(),
  topK: z.number().int().positive().max(20).optional(),
  minScore: z.number().min(0).max(1).optional(),
  embeddingDimensions: z.number().int().min(64).max(3072).optional(),
  useVectors: z.boolean().optional(),
  candidateDepth: z.number().int().positive().max(100).optional(),
  rrfK: z.number().positive().optional(),
})

const personaSchema = z.object({
  systemPrompt: z.string().optional(),
  extraInstructions: z.array(z.string()).optional(),
  canDo: z.array(z.string()).optional(),
  cannotDo: z.array(z.string()).optional(),
  suggestions: z.array(z.string()).optional(),
})

const actionsSchema = z.object({
  leadCapture: z.boolean().optional(),
  leadConsentLabel: z.string().optional(),
  bookingUrl: z.string().optional(),
  handoffUrl: z.string().optional(),
  handoffWhatsApp: z.string().optional(),
  handoffEmail: z.string().optional(),
})

const widgetSchema = z.object({
  position: z.enum(["bottom-right", "bottom-left"]).optional(),
  greeting: z.string().optional(),
  launcherIcon: z.string().optional(),
  idleAttentionAfterMs: z.number().int().min(1000).optional(),
  attentionPulse: z.boolean().optional(),
  poweredByLabel: z.string().optional(),
})

const securitySchema = z.object({
  sanitiseCrawledText: z.boolean().optional(),
  requireUserForTools: z.boolean().optional(),
  rateLimitPerMinute: z.number().int().positive().optional(),
  maxToolCallsPerQuestion: z.number().int().positive().optional(),
})

export const mikuConfigSchema = z.object({
  brand: brandSchema,
  site: siteSchema,
  llm: llmSchema.optional(),
  retrieval: retrievalSchema.optional(),
  persona: personaSchema.optional(),
  actions: actionsSchema.optional(),
  widget: widgetSchema.optional(),
  security: securitySchema.optional(),
  auth: z
    .object({ resolveUser: z.function().optional() })
    .optional(),
  tools: z.array(z.any()).optional(),
  disableBuiltInTools: z.boolean().optional(),
  db: z.any().optional(),
  store: z.any().optional(),
  rateLimit: z.any().optional(),
})

export type MikuConfigInput = z.input<typeof mikuConfigSchema>

export type MikuDefine = (config: MikuConfig) => MikuConfig

/**
 * Identity helper for `miku.config.ts`. Exists purely for editor autocomplete and
 * type-checking; it returns the config unchanged.
 */
export const defineMiku: MikuDefine = (config) => config

/**
 * Applies every default. Called once per request by the runtime, so a host can
 * mutate its config at runtime (for example a multi-tenant lookup) without
 * worrying about partially-populated objects reaching the rest of MIKU.
 */
export function resolveConfig(input: MikuConfig): ResolvedMikuConfig {
  const parsed = mikuConfigSchema.parse(input)
  const cfg = parsed as MikuConfig

  return {
    brand: {
      name: cfg.brand.name,
      assistantName: cfg.brand.assistantName ?? "MIKU",
      accent: cfg.brand.accent ?? "#6366f1",
      accentAlt: cfg.brand.accentAlt ?? "#8b5cf6",
      bubbleTint: cfg.brand.bubbleTint ?? "#6366f1",
      tagline: cfg.brand.tagline,
      logoUrl: cfg.brand.logoUrl,
    },
    site: {
      baseUrl: cfg.site.baseUrl,
      sitemaps: cfg.site.sitemaps ?? [],
      include: cfg.site.include ?? ["/**"],
      exclude: cfg.site.exclude ?? DEFAULT_EXCLUDE,
      maxPages: cfg.site.maxPages ?? 400,
      concurrency: cfg.site.concurrency ?? 4,
      timeoutMs: cfg.site.timeoutMs ?? 15_000,
      respectRobots: cfg.site.respectRobots ?? true,
      additionalOrigins: cfg.site.additionalOrigins ?? [],
    },
    llm: {
      order: cfg.llm?.order ?? ["gemini", "groq"],
      model: cfg.llm?.model,
      models: cfg.llm?.models ?? {},
      embeddingModel: cfg.llm?.embeddingModel ?? "gemini-embedding-001",
      temperature: cfg.llm?.temperature ?? 0.3,
      maxOutputTokens: cfg.llm?.maxOutputTokens ?? 2000,
      historyTurns: cfg.llm?.historyTurns ?? 8,
      maxToolRounds: cfg.llm?.maxToolRounds ?? 4,
    },
    retrieval: {
      chunkSize: cfg.retrieval?.chunkSize ?? 1000,
      chunkOverlap: cfg.retrieval?.chunkOverlap ?? 150,
      topK: cfg.retrieval?.topK ?? 6,
      minScore: cfg.retrieval?.minScore ?? 0.18,
      embeddingDimensions: cfg.retrieval?.embeddingDimensions ?? 256,
      useVectors: cfg.retrieval?.useVectors ?? true,
      candidateDepth: cfg.retrieval?.candidateDepth ?? 20,
      rrfK: cfg.retrieval?.rrfK ?? 60,
    },
    persona: {
      canDo: cfg.persona?.canDo ?? [],
      cannotDo: cfg.persona?.cannotDo ?? [],
      suggestions: cfg.persona?.suggestions ?? [],
      systemPrompt: cfg.persona?.systemPrompt,
      extraInstructions: cfg.persona?.extraInstructions ?? [],
    },
    actions: {
      leadCapture: cfg.actions?.leadCapture ?? true,
      leadConsentLabel: cfg.actions?.leadConsentLabel ?? "Send my details",
      bookingUrl: cfg.actions?.bookingUrl,
      handoffUrl: cfg.actions?.handoffUrl,
      handoffWhatsApp: cfg.actions?.handoffWhatsApp,
      handoffEmail: cfg.actions?.handoffEmail,
    },
    widget: {
      position: cfg.widget?.position ?? "bottom-right",
      greeting:
        cfg.widget?.greeting ??
        `Hi! I'm ${cfg.brand.assistantName ?? "MIKU"}. Ask me anything about ${
          cfg.brand.name
        }.`,
      idleAttentionAfterMs: cfg.widget?.idleAttentionAfterMs ?? 12_000,
      attentionPulse: cfg.widget?.attentionPulse ?? true,
      launcherIcon: cfg.widget?.launcherIcon,
      poweredByLabel: cfg.widget?.poweredByLabel ?? `Powered by ${cfg.brand.assistantName ?? "MIKU"}`,
    },
    security: {
      sanitiseCrawledText: cfg.security?.sanitiseCrawledText ?? true,
      requireUserForTools: cfg.security?.requireUserForTools ?? false,
      rateLimitPerMinute: cfg.security?.rateLimitPerMinute ?? 12,
      maxToolCallsPerQuestion: cfg.security?.maxToolCallsPerQuestion ?? 8,
    },
    tools: cfg.tools ?? [],
    disableBuiltInTools: cfg.disableBuiltInTools ?? false,
    db: cfg.db,
    store: cfg.store,
    auth: cfg.auth,
    rateLimit: cfg.rateLimit,
  }
}

/**
 * Applied after `include`. These paths are either private (they would leak the
 * host's own data into an index) or useless to a visitor.
 */
export const DEFAULT_EXCLUDE = [
  "/admin/**",
  "/dashboard/**",
  "/api/**",
  "/login",
  "/register",
  "/logout",
  "/cart",
  "/checkout",
  "/my-account/**",
  "/_next/**",
  "/wp-admin/**",
  "/wp-login.php",
]