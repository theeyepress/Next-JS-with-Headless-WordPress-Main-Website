import type { ResolvedMikuConfig } from "../config/types"
import { getEmbedder } from "../llm"
import { cosineSimilarity } from "./chunker"
import { extractPage } from "./extractor"
import { sanitiseCrawledText } from "./chunker"
import { createStore, type KnowledgeStore } from "./store"
import type { Citation, RetrievedChunk } from "../types"

export interface RetrieveOptions {
  topK?: number
  /** Restrict to URLs under this prefix, used by `read_page`. */
  urlPrefix?: string
  /** Skip the minimum-score gate. Used by the knowledge tools, not the agent. */
  ignoreMinScore?: boolean
}

export interface RetrieveResult {
  chunks: RetrievedChunk[]
  citations: Citation[]
  /** Highest fused score, 0..1. The agent gates on this. */
  topScore: number
  /** True when a semantic leg actually ran (vs keyword-only). */
  semantic: boolean
}

/**
 * How long a reply may wait on the vector index before answering keyword-only.
 *
 * This is a deadline, not a cancellation. The store shares one load between
 * every in-flight request, so aborting a single caller must not abort the load
 * that warms the cache — the slow read keeps going and the next message gets
 * the semantic leg back. What we refuse to do is hold an answer hostage to a
 * table scan on a remote database.
 */
const VECTOR_LOAD_DEADLINE_MS = 4_000

/**
 * Resolves `promise`, or `null` if it has not settled within `ms`.
 *
 * Both handlers are attached unconditionally: once the deadline has fired the
 * underlying load may still reject, and an unhandled rejection would take the
 * host process down over an answer we no longer care about.
 */
function giveUp<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise<T | null>((resolve, reject) => {
    let settled = false
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      resolve(null)
    }, ms)
    promise.then(
      (value) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        resolve(value)
      },
      (err) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        reject(err)
      }
    )
  })
}

/**
 * Reciprocal-rank fusion of two retrieval legs.
 *
 * Keyword search is excellent at "visa onboarding" but blind to "how do I get
 * started"; vectors are the reverse. Fusing ranks rather than raw scores avoids
 * having to normalise two incomparable scales.
 */
function fuse(
  keyword: { id: string; score: number }[],
  vector: { id: string; score: number }[],
  rrfK: number
): Map<string, number> {
  const fused = new Map<string, number>()
  const add = (list: { id: string }[], weight: number) => {
    list.forEach((item, index) => {
      const key = item.id
      fused.set(key, (fused.get(key) ?? 0) + weight * (1 / (rrfK + index + 1)))
    })
  }
  add(keyword, 1)
  add(vector, 1)
  return fused
}

export async function retrieve(
  config: ResolvedMikuConfig,
  query: string,
  options: RetrieveOptions = {},
  store: KnowledgeStore = createStore(config)
): Promise<RetrieveResult> {
  const topK = options.topK ?? config.retrieval.topK
  const depth = config.retrieval.candidateDepth
  const cleaned = query.trim()
  if (cleaned.length === 0) {
    return { chunks: [], citations: [], topScore: 0, semantic: false }
  }

  const keyword = await store.keywordSearch(cleaned, depth)

  let vector: { id: string; score: number }[] = []
  const embedder = getEmbedder(config)
  let semantic = false

  if (embedder?.embed) {
    try {
      const [queryVec] = await embedder.embed([cleaned], config.retrieval.embeddingDimensions)
      if (queryVec && queryVec.length > 0) {
        const rows = await giveUp(store.loadVectors(), VECTOR_LOAD_DEADLINE_MS)
        if (rows === null) {
          console.warn(
            `[miku] vector leg skipped: index load exceeded ${VECTOR_LOAD_DEADLINE_MS}ms, answering keyword-only`
          )
        } else if (rows.length > 0) {
          semantic = true
          vector = rows
            .map((r) => ({ id: r.id, score: cosineSimilarity(queryVec, r.embedding) }))
            // Negatives only ever rank noise; the keyword leg covers exact matches.
            .filter((r) => r.score > 0.15)
            .sort((a, b) => b.score - a.score)
            .slice(0, depth)
        }
      }
    } catch (err) {
      console.warn("[miku] vector leg unavailable:", (err as Error).message)
    }
  }

  const fused = fuse(keyword, vector, config.retrieval.rrfK)
  if (fused.size === 0) {
    return { chunks: [], citations: [], topScore: 0, semantic }
  }

  const ranked = [...fused.entries()].sort((a, b) => b[1] - a[1]).slice(0, topK)
  const rows = await store.getChunksByIds(ranked.map(([id]) => id))

  const byId = new Map(rows.map((r) => [r.id, r]))
  const max = ranked[0]?.[1] ?? 1

  const chunks: RetrievedChunk[] = ranked
    .map(([id, score]) => {
      const row = byId.get(id)
      if (!row) return null
      if (options.urlPrefix && !row.url.startsWith(options.urlPrefix)) return null
      return {
        id: row.id,
        documentId: row.documentId,
        title: row.title,
        url: row.url,
        text: row.text,
        // Normalised so minScore means the same thing regardless of index size.
        score: max > 0 ? score / max : 0,
      } satisfies RetrievedChunk
    })
    .filter((c): c is RetrievedChunk => c !== null)

  if (!options.ignoreMinScore && chunks.length > 0) {
    const best = chunks[0]?.score ?? 0
    if (best < config.retrieval.minScore) {
      return { chunks: [], citations: [], topScore: best, semantic }
    }
  }

  const citations = dedupeCitations(chunks)
  return { chunks, citations, topScore: chunks[0]?.score ?? 0, semantic }
}

function dedupeCitations(chunks: RetrievedChunk[]): Citation[] {
  const seen = new Set<string>()
  const out: Citation[] = []
  for (const c of chunks) {
    if (seen.has(c.url)) continue
    seen.add(c.url)
    out.push({ title: c.title, url: c.url, snippet: c.text.slice(0, 220).trim() })
    if (out.length >= 5) break
  }
  return out
}

/** Renders retrieved chunks into the data block handed to the model. */
export function formatContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return ""
  const parts = chunks.map((c, i) => {
    const heading = c.text.startsWith("#") ? "" : ""
    return [
      `[SOURCE ${i + 1}] ${c.title}`,
      `URL: ${c.url}`,
      heading,
      c.text,
    ]
      .filter(Boolean)
      .join("\n")
  })
  return parts.join("\n\n---\n\n")
}

/** Builds the embedder closure the store uses, or null when vectors are off. */
export function makeEmbedder(config: ResolvedMikuConfig) {
  const embedder = getEmbedder(config)
  if (!embedder?.embed) return null
  const dims = config.retrieval.embeddingDimensions
  return (texts: string[]) => embedder.embed!(texts, dims)
}

export { extractPage, sanitiseCrawledText }