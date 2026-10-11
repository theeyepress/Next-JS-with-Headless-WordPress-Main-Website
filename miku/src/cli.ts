#!/usr/bin/env node
/**
 * `miku` CLI — knowledge-base maintenance.
 *
 * Usage:
 *   miku ingest   [--force] [--no-prune] [--quiet]
 *   miku stats
 *   miku search <query>
 *   miku clear    [--yes]
 *
 * It loads the host's miku.config.ts, so whatever the site uses at runtime is
 * exactly what gets indexed. There is no separate ingest configuration to keep
 * in sync — that is the whole point.
 */

import { resolveConfig, type MikuConfig } from "./config"
import { createStore } from "./knowledge/store"
import { ingest } from "./knowledge/ingest"
import { retrieve } from "./knowledge/retrieve"
import { isGeminiConfigured, isGroqConfigured } from "./llm"

interface Loaded {
  config: ResolvedConfig
  path: string
}

type ResolvedConfig = ReturnType<typeof resolveConfig>

async function loadConfig(): Promise<Loaded> {
  const candidates = [
    process.env.MIKU_CONFIG,
    "miku.config.ts",
    "miku.config.mts",
    "miku.config.js",
    "miku.config.mjs",
    "src/miku.config.ts",
  ].filter(Boolean) as string[]

  for (const candidate of candidates) {
    try {
      const mod = (await import(new URL(candidate, `file://${process.cwd()}/`).href)) as {
        default?: MikuConfig
        miku?: MikuConfig
      }
      const raw = mod.default ?? mod.miku
      if (raw) return { config: resolveConfig(raw), path: candidate }
    } catch {
      // Try the next candidate.
    }
  }
  throw new Error(
    "Could not load miku.config.ts. Run this from your project root, or set MIKU_CONFIG to its path."
  )
}

function bar(value: number, width = 24): string {
  const filled = Math.round(value * width)
  return `${"█".repeat(Math.max(0, filled))}${"░".repeat(Math.max(0, width - filled))}`
}

async function main(): Promise<void> {
  const [command = "help", ...rest] = process.argv.slice(2)
  const flags = new Set(rest.filter((a) => a.startsWith("--")))
  const positional = rest.filter((a) => !a.startsWith("--"))

  if (command === "help" || command === "--help" || command === "-h") {
    process.stdout.write(HELP)
    return
  }

  const { config, path } = await loadConfig()

  switch (command) {
    case "ingest": {
      const quiet = flags.has("--quiet")
      if (!quiet) {
        process.stdout.write(`MIKU ingest — ${config.brand.name}\n`)
        process.stdout.write(`  config      ${path}\n`)
        process.stdout.write(`  site        ${config.site.baseUrl}\n`)
        process.stdout.write(
          `  providers   gemini:${isGeminiConfigured() ? "ready" : "no key"} groq:${
            isGroqConfigured() ? "ready" : "no key"
          } vectors:${config.retrieval.useVectors ? "on" : "off"}\n`
        )
        if (!config.db) {
          process.stdout.write(
            "  storage     in-memory (set config.db to persist the index)\n"
          )
        }
        process.stdout.write("\n")
      }

      const report = await ingest(config, {
        force: flags.has("--force"),
        prune: !flags.has("--no-prune"),
        verbose: !quiet,
        onProgress: quiet ? undefined : (m) => process.stdout.write(`  ${m}\n`),
      })

      process.stdout.write("\n")
      process.stdout.write(`  documents indexed    ${report.indexed}\n`)
      process.stdout.write(`  unchanged            ${report.unchanged}\n`)
      process.stdout.write(`  pruned               ${report.removed}\n`)
      process.stdout.write(`  chunks written       ${report.chunks}\n`)
      process.stdout.write(`  failed               ${report.failed}\n`)
      process.stdout.write(`  elapsed              ${(report.durationMs / 1000).toFixed(1)}s\n`)
      if (report.errors.length > 0) {
        process.stdout.write("\n  errors:\n")
        for (const e of report.errors) process.stdout.write(`    ${e}\n`)
      }
      if (report.discovered === 0) {
        process.stdout.write(
          "\n  No pages were indexed. Check that the site is reachable and that site.include/site.exclude allow the pages you expect.\n"
        )
        process.exitCode = 1
      } else if (report.failed > 0) {
        // A partial index is a wrong index: the retriever has no way to know a
        // page is missing. Fail loudly so a deploy hook does not treat it as
        // a completed ingest.
        process.stdout.write(
          `\n  ${report.failed} page(s) could not be indexed — run \`miku ingest\` again.\n`
        )
        process.exitCode = 1
      }
      break
    }

    case "stats": {
      const store = createStore(config)
      const stats = await store.stats()
      process.stdout.write(`MIKU knowledge base — ${config.brand.name}\n\n`)
      process.stdout.write(`  documents      ${stats.documents}\n`)
      process.stdout.write(`  chunks         ${stats.chunks}\n`)
      process.stdout.write(`  last ingested  ${stats.lastIngestedAt ?? "never"}\n`)
      process.stdout.write(`\n  indexed pages\n`)
      for (const u of stats.urls) {
        process.stdout.write(`    ${String(u.chunks).padStart(4)}  ${u.url}\n`)
      }
      break
    }

    case "search": {
      const query = positional.join(" ").trim()
      if (!query) {
        process.stderr.write("Usage: miku search <query>\n")
        process.exitCode = 1
        return
      }
      const store = createStore(config)
      const result = await retrieve(config, query, { topK: 8, ignoreMinScore: true }, store)
      process.stdout.write(`MIKU search — "${query}"\n\n`)
      if (result.chunks.length === 0) {
        process.stdout.write("  no matches\n")
        return
      }
      process.stdout.write(`  semantic leg: ${result.semantic ? "on" : "off"}\n\n`)
      for (const [i, chunk] of result.chunks.entries()) {
        process.stdout.write(`  ${i + 1}. ${bar(chunk.score)}  ${chunk.score.toFixed(3)}  ${chunk.url}\n`)
        const preview = chunk.text.replace(/\s+/g, " ").slice(0, 160)
        process.stdout.write(`     ${preview}…\n\n`)
      }
      break
    }

    case "clear": {
      if (!flags.has("--yes")) {
        process.stderr.write(
          "This deletes every indexed document. Re-run with --yes if that is what you want.\n"
        )
        process.exitCode = 1
        return
      }
      const store = createStore(config)
      await store.clear()
      process.stdout.write("MIKU knowledge base cleared.\n")
      break
    }

    default:
      process.stderr.write(`Unknown command "${command}".\n\n${HELP}`)
      process.exitCode = 1
  }
}

const HELP = `miku — maintain your AI assistant's knowledge base

  miku ingest [--force] [--no-prune] [--quiet]
      Crawl the site, extract and chunk every page, embed what changed, store it.
      Safe to run on every deploy: unchanged pages are skipped.

  miku stats
      Show what is currently indexed.

  miku search <query>
      Run a retrieval query and print the fused scores. Use this to tune
      retrieval.minScore and retrieval.topK.

  miku clear --yes
      Delete the whole index.

Environment:
  MIKU_CONFIG        Path to miku.config.ts (default: ./miku.config.ts)
  GEMINI_API_KEY     Chat + embeddings (primary provider)
  GROQ_API_KEY       Chat (failover provider)

`

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`)
  process.exit(1)
})