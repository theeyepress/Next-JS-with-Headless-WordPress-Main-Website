import type { ResolvedMikuConfig } from "../config/types"
import { chunkPage, hash, sanitiseCrawledText } from "./chunker"
import { crawl, discoverUrls } from "./crawler"
import { extractPage } from "./extractor"
import { makeEmbedder } from "./retrieve"
import { createStore, type KnowledgeStore } from "./store"

export interface IngestReport {
  discovered: number
  indexed: number
  unchanged: number
  failed: number
  removed: number
  chunks: number
  durationMs: number
  errors: string[]
  urls: string[]
}

export interface IngestOptions {
  /**
   * Re-embed pages whose content hash is unchanged. Needed after switching
   * embedding model or dimension; otherwise unused.
   */
  force?: boolean
  /** Delete indexed pages that are no longer discovered. Defaults to true. */
  prune?: boolean
  /** Print progress to the console. */
  verbose?: boolean
  store?: KnowledgeStore
  onProgress?: (message: string) => void
}

/**
 * Full knowledge ingestion: discover → extract → sanitise → chunk → embed → store.
 *
 * Safe to run repeatedly. Pages whose content hash is unchanged are skipped, so
 * an incremental re-run costs almost nothing.
 */
export async function ingest(
  config: ResolvedMikuConfig,
  options: IngestOptions = {}
): Promise<IngestReport> {
  const started = Date.now()
  const store = options.store ?? createStore(config)
  const log = (message: string) => {
    options.onProgress?.(message)
    if (options.verbose) console.log(`[miku] ${message}`)
  }

  log("discovering URLs…")
  const { urls } = await discoverUrls(config)
  log(`discovered ${urls.length} indexable URLs`)

  if (urls.length === 0) {
    return {
      discovered: 0,
      indexed: 0,
      unchanged: 0,
      failed: 0,
      removed: 0,
      chunks: await store.countChunks(),
      durationMs: Date.now() - started,
      errors: [
        `No indexable URLs found under ${config.site.baseUrl}. Check site.sitemaps, site.include and site.exclude.`,
      ],
      urls: [],
    }
  }

  log(`crawling ${urls.length} pages…`)
  const { pages, failures } = await crawl(config, urls)

  await store.ensureSchema()
  const embedder = makeEmbedder(config)

  let indexed = 0
  let unchanged = 0
  let chunkTotal = 0
  let storeFailed = 0
  const errors: string[] = []
  const indexedUrls: string[] = []
  /**
   * URLs this run could not speak for, so pruning must leave their existing
   * index alone. Without this a single flaky fetch or a rate-limited embed
   * would delete a page that is still perfectly live — the failure would look
   * exactly like the page having been removed from the site.
   */
  const retainUrls = new Set<string>()

  for (const page of pages) {
    const extracted = extractPage(page.html)
    // A page with almost no text is either empty or client-rendered past
    // recognition; either way there is nothing worth indexing.
    if (extracted.text.length < 80) continue

    const text = sanitiseCrawledText(extracted.text, config.security.sanitiseCrawledText)
    const contentHash = hash(text)
    const section = sectionOf(page.pathname)

    const chunks = chunkPage(
      { ...extracted, text, url: page.url, contentHash, section },
      { chunkSize: config.retrieval.chunkSize, chunkOverlap: config.retrieval.chunkOverlap }
    )
    if (chunks.length === 0) continue

    try {
      const result = await store.upsertDocument({
        url: page.url,
        title: extracted.title,
        description: extracted.description,
        text,
        contentHash,
        section,
        chunks,
        embedding: embedder,
        force: options.force,
      })
      indexedUrls.push(page.url)
      if (result.skipped) unchanged++
      else {
        indexed++
        chunkTotal += result.chunks
      }
    } catch (err) {
      storeFailed++
      retainUrls.add(page.url)
      errors.push(`${page.url}: ${(err as Error).message}`)
    }
  }

  for (const f of failures) {
    errors.push(`${f.url}: ${f.error}`)
    // 404/410 is the server saying the page is gone — that is precisely what
    // pruning is for. Anything else (5xx, timeout, 429, network) only means we
    // could not read it this time, so its existing index survives.
    if (!/^HTTP (404|410)\b/.test(f.error)) retainUrls.add(f.url)
  }

  let removed = 0
  if (options.prune !== false) {
    removed = await store.deleteDocumentsNotIn([...indexedUrls, ...retainUrls])
    if (removed > 0) log(`pruned ${removed} stale documents`)
  }

  const report: IngestReport = {
    discovered: urls.length,
    indexed,
    unchanged,
    // Crawl failures and embed/store failures are both failures. Reporting only
    // the crawl half is how a run ends up claiming `failed 0` while pages were
    // in fact dropped.
    failed: failures.length + storeFailed,
    removed,
    chunks: chunkTotal,
    durationMs: Date.now() - started,
    errors: errors.slice(0, 25),
    urls: indexedUrls,
  }

  log(
    `done in ${report.durationMs}ms — ${indexed} indexed, ${unchanged} unchanged, ` +
      `${removed} pruned, ${chunkTotal} chunks written` +
      (report.failed > 0 ? `, ${report.failed} FAILED` : "")
  )
  if (report.failed > 0) {
    log(`${report.failed} page(s) were not indexed; re-run ingest to pick them up`)
  }
  return report
}

/** First meaningful path segment, used to group citations by site section. */
export function sectionOf(pathname: string): string {
  const segment = pathname.split("/").filter(Boolean)[0]
  return segment ? segment.replace(/\.(html?|php)$/i, "") : "home"
}