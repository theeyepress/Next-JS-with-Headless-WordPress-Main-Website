// src/miku.config.ts
import { defineMiku } from "@wpcodingpress/miku/config"
import { Pool } from "pg"

// Lazy pool — server-side-এ প্রথম ব্যবহারে তৈরি হবে, build-এর সময় না।
let pool: Pool | null = null

function getPool(): Pool {
  if (pool) return pool
  const connectionString = process.env.MIKU_DB_URL
  if (!connectionString) {
    throw new Error("MIKU persistence: MIKU_DB_URL is not set")
  }
  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }, // Neon requires TLS
    max: 4,
  })
  return pool
}

export default defineMiku({
  brand: {
    name: "The EyePress",
    assistantName: "MIKU",
    tagline: "বাংলা ও English — আপনার প্রশ্নের উত্তর",
    accent: "#1e3a8a",
    accentAlt: "#2563eb",
  },

  site: {
    baseUrl: "https://www.theeyepress.com",
    exclude: [
      "/api/**",
      "/admin/**",
      "/login",
      "/register",
      "/logout",
      "/profile/**",
      "/search",
      "/404/**",
      "/_next/**",
    ],
    maxPages: 400,
  },

  persona: {
    extraInstructions: [
      "The EyePress is an independent digital news platform (Bengali /bn and English /en).",
      "Always answer in the visitor's language — Bengali প্রশ্ন পেলে বাংলায় উত্তর দাও।",
      "Be factual and polite; cite the source page when answering.",
    ],
    suggestions: [
      "সাম্প্রতিক গুরুত্বপূর্ণ খবর কী?",
      "আমাদের সম্পর্কে বলুন",
      "কীভাবে সাবস্ক্রাইব করবো?",
      "How can I contact The EyePress?",
    ],
  },

  db: {
    dialect: "postgres",
    query: async (sql, params) => {
      const res = await getPool().query(sql, (params ?? []) as unknown[])
      return res.rows as unknown[]
    },
    execute: async (sql, params) => {
      const res = await getPool().query(sql, (params ?? []) as unknown[])
      return res.rows as unknown
    },
  },
})