// src/app/api/miku/ingest/route.ts
import { NextRequest } from "next/server"
import { resolveConfig, ingest } from "@wpcodingpress/miku"
import config from "@/miku.config"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

/** Rebuilds MIKU's knowledge index. Protected by MIKU_INGEST_SECRET. */
export async function POST(req: NextRequest) {
  const secret = process.env.MIKU_INGEST_SECRET
  if (!secret) {
    return Response.json({ error: "MIKU_INGEST_SECRET not set" }, { status: 503 })
  }
  const provided =
    req.headers.get("x-miku-secret") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    new URL(req.url).searchParams.get("secret")

  if (!provided || !timingSafeEqual(provided, secret)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const force = new URL(req.url).searchParams.get("force") === "1"
  try {
    const report = await ingest(resolveConfig(config), { force })
    return Response.json({ ok: true, ...report })
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : "Ingestion failed" },
      { status: 500 }
    )
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}