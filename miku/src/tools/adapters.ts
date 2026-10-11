import type { MikuTool, ToolContext } from "../types"
import { readTool, str } from "./helpers"

/**
 * Generic HTTP-backed tool.
 *
 * The escape hatch that makes MIKU installable on a site whose data lives in
 * anything at all — a Rails app, a Supabase project, a Google Sheet, an internal
 * admin API. The host decides where the request goes and what comes back.
 */
export interface HttpToolOptions {
  name: string
  description: string
  /** Absolute URL, or a path resolved against the host site's baseUrl. */
  endpoint: string
  /** Query parameters the model is allowed to set. Anything else is dropped. */
  query?: Record<string, { description: string; type?: "string" | "number" | "boolean" }>
  /** Fixed parameters sent on every call. */
  params?: Record<string, unknown>
  method?: "GET" | "POST"
  /** Extra headers, e.g. an internal service token. */
  headers?: Record<string, string>
  /** Milliseconds before the call is abandoned. Defaults to 10000. */
  timeoutMs?: number
  /** Send the visitor's id to your API so it can scope the response itself. */
  forwardSession?: boolean
  /**
   * Mark as an action. Use this when the endpoint changes state — consent is
   * enforced by the interface, but the endpoint must also be idempotent or
   * protected, since a client can still replay a confirmed request.
   */
  action?: boolean
  /** Override the tool's availability at runtime. */
  isAvailable?: (ctx: ToolContext) => boolean | Promise<boolean>
  /** Reduce the response before it reaches the model. Defaults to identity. */
  transform?: (payload: unknown) => unknown
}

export function httpTool(options: HttpToolOptions): MikuTool {
  const query = options.query ?? {}
  const parameters = {
    type: "object" as const,
    properties: Object.fromEntries(
      Object.entries(query).map(([key, spec]) => [
        key,
        { type: spec.type ?? "string", description: spec.description },
      ])
    ),
    required: [] as string[],
  }

  const run = async (args: Record<string, unknown>, ctx: ToolContext): Promise<unknown> => {
    const url = new URL(
      options.endpoint.startsWith("http") ? options.endpoint : `${ctx.config.site.baseUrl}${options.endpoint}`
    )
    const method = options.method ?? "GET"

    if (method === "GET") {
      for (const key of Object.keys(query)) {
        const value = args[key]
        if (value === undefined || value === null || value === "") continue
        url.searchParams.set(key, String(value))
      }
    }
    for (const [key, value] of Object.entries(options.params ?? {})) {
      if (method === "GET") url.searchParams.set(key, String(value))
    }
    if (options.forwardSession && ctx.user) url.searchParams.set("session", ctx.sessionId)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 10_000)
    try {
      const init: RequestInit = {
        method,
        headers: {
          Accept: "application/json",
          ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
          ...options.headers,
        },
        signal: controller.signal,
      }
      if (method === "POST") {
        init.body = JSON.stringify({
          ...options.params,
          ...args,
          ...(options.forwardSession ? { sessionId: ctx.sessionId } : {}),
        })
      }

      const res = await fetch(url, init)
      const text = await res.text()
      if (!res.ok) {
        throw new Error(`${options.name} returned HTTP ${res.status}: ${text.slice(0, 200)}`)
      }
      let payload: unknown = text
      try {
        payload = JSON.parse(text)
      } catch {
        // A plain-text endpoint is fine; hand the text to the model as-is.
      }
      return options.transform ? options.transform(payload) : payload
    } finally {
      clearTimeout(timer)
    }
  }

  if (options.action) {
    return {
      name: options.name,
      description: options.description,
      parameters,
      kind: "action",
      requiresConsent: true,
      isAvailable: options.isAvailable,
      execute: run as MikuTool["execute"],
    }
  }

  return readTool({
    name: options.name,
    description: options.description,
    parameters,
    isAvailable: options.isAvailable,
    execute: run,
  })
}

/**
 * A tool backed by the host's own data client — Prisma, Drizzle, Mongoose,
 * anything with a query interface. MIKU never imports a database library itself;
 * the host hands over a function.
 */
export function queryTool<T>(spec: {
  name: string
  description: string
  parameters?: Parameters<typeof readTool>[0]["parameters"]
  /** Receives only the arguments the model supplied. Return any JSON-serialisable value. */
  run: (args: never, ctx: ToolContext) => Promise<T>
  kind?: "catalog" | "account"
  requiresConsent?: boolean
  isAvailable?: (ctx: ToolContext) => boolean | Promise<boolean>
}): MikuTool {
  return {
    name: spec.name,
    description: spec.description,
    parameters: spec.parameters ?? { type: "object", properties: {}, required: [] },
    kind: spec.kind ?? "catalog",
    requiresConsent: spec.requiresConsent ?? false,
    isAvailable: spec.isAvailable,
    execute: spec.run as MikuTool["execute"],
  }
}

export { str }