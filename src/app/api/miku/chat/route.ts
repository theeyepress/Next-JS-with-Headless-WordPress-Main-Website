// src/app/api/miku/chat/route.ts
import { createMikuRoute } from "@wpcodingpress/miku/next"
import config from "@/miku.config"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export const POST = createMikuRoute({ config })