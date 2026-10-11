/**
 * Next.js App Router glue.
 *
 * MIKU's runtime is framework-agnostic, so the only thing a Next.js site needs
 * is a thin route handler that forwards the request. Keeping it here means the
 * route file in a host project is four lines rather than forty.
 */

import type { NextRequest } from "next/server"
import { resolveConfig, type MikuConfig } from "./config"
import { handleMikuChat, type MikuChatBody } from "./runtime/handler"
import type { MikuUser } from "./types"

export interface CreateMikuRouteOptions {
  config: MikuConfig
  /** Defaults to `config.auth.resolveUser`. */
  resolveUser?: () => Promise<MikuUser | null> | MikuUser | null
  /** Identify the caller for rate limiting. Defaults to the forwarded IP. */
  clientKey?: (req: NextRequest) => string
  /** Cap on the request body size in bytes. Defaults to 256 KB. */
  maxBodyBytes?: number
}

/**
 * Builds a POST handler that streams MIKU's answers as server-sent events.
 *
 *   // app/api/miku/chat/route.ts
 *   import { createMikuRoute } from "@wpcodingpress/miku/next"
 *   import miku from "../../miku.config"
 *   export const POST = createMikuRoute({ config: miku })
 */
export function createMikuRoute(options: CreateMikuRouteOptions) {
  const maxBytes = options.maxBodyBytes ?? 256 * 1024

  return async function handler(req: NextRequest): Promise<Response> {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 })
    }

    const declared = Number(req.headers.get("content-length") ?? "0")
    if (declared > maxBytes) {
      return new Response("Payload too large", { status: 413 })
    }

    let body: MikuChatBody
    try {
      const raw = await req.text()
      if (raw.length > maxBytes) {
        return new Response("Payload too large", { status: 413 })
      }
      body = raw ? (JSON.parse(raw) as MikuChatBody) : {}
    } catch {
      return new Response("Invalid JSON body", { status: 400 })
    }

    // Resolve per request rather than once at module load: a host may build its
    // config dynamically, and a cached resolve would pin stale credentials.
    const config = resolveConfig(options.config)

    const { status, headers, body: stream } = await handleMikuChat({
      config,
      body,
      signal: req.signal,
      clientKey: options.clientKey
        ? options.clientKey(req)
        : req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          req.headers.get("x-real-ip") ??
          undefined,
      resolveUser: options.resolveUser
        ? async () => (await options.resolveUser?.()) ?? null
        : undefined,
    })

    return new Response(stream, { status, headers })
  }
}

/**
 * Re-exported so a host can build an ingest route in one line, which is how a
 * deploy webhook refreshes MIKU's knowledge index.
 */
export { ingest, createStore } from "./knowledge"
export type { MikuConfig } from "./config"