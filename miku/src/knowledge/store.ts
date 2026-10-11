import type { MikuDatabase, ResolvedMikuConfig } from "../config/types"
import { cosineSimilarity, decodeVector, hash, type ChunkRecord, type KnowledgeStats } from "./chunker"

export interface KeywordHit {
  id: string
  score: number
}

export interface KnowledgeStore {
  ensureSchema(): Promise<void>
  upsertDocument(input: {
    url: string
    title: string
    description?: string | null
    text: string
    contentHash: string
    section: string
    chunks: Omit<ChunkRecord, "id" | "embedding" | "documentId">[]
    embedding?: ((texts: string[]) => Promise<number[][]>) | null
    /** Re-index even when the content hash is unchanged (model/dimension change). */
    force?: boolean
  }): Promise<{ chunks: number; skipped: boolean }>
  deleteDocumentsNotIn(urls: string[]): Promise<number>
  getChunksByIds(ids: string[]): Promise<ChunkRecord[]>
  keywordSearch(query: string, limit: number): Promise<KeywordHit[]>
  /** Embeddings plus metadata for in-process cosine scoring. */
  loadVectors(): Promise<{ id: string; embedding: number[]; row: ChunkRecord }[]>
  countChunks(): Promise<number>
  stats(): Promise<KnowledgeStats>
  clear(): Promise<void>
  close(): void
}

/**
 * One store per database — not one per request.
 *
 * The runtime resolves the host config on every request (deliberately: a host
 * can swap credentials per visitor), and `createStore` used to follow suit. But
 * the schema gate and the 60-second vector cache both live on the store
 * instance, so both were thrown away the moment the request ended. Every
 * message therefore re-ran the DDL and re-read the entire vector table — on a
 * remote database that is seconds to tens of seconds per reply with nothing to
 * show for it, and it is why chat looked like it was hanging.
 *
 * Keyed on `db` rather than on the config because `db` is `z.any()` in the
 * schema, so it is the one field that survives `resolveConfig` by reference.
 * A host on a different database still gets its own store.
 */
const sqlStores = new WeakMap<object, SqlStore>()

export function createStore(config: ResolvedMikuConfig): KnowledgeStore {
  if (!config.db) return new MemoryStore(config)
  const store = sqlStores.get(config.db)
  if (store) return store.refresh(config)
  const fresh = new SqlStore(config)
  sqlStores.set(config.db, fresh)
  return fresh
}

/** DDL for MIKU's own tables. MIKU never touches the host's schema. */
const MYSQL_DDL: string[] = [
  `CREATE TABLE IF NOT EXISTS miku_documents (
     id VARCHAR(191) NOT NULL,
     url VARCHAR(768) NOT NULL,
     url_hash CHAR(40) NOT NULL,
     title VARCHAR(512) NOT NULL,
     description TEXT NULL,
     text LONGTEXT NOT NULL,
     content_hash VARCHAR(64) NOT NULL,
     section VARCHAR(128) NOT NULL DEFAULT '',
     updated_at DATETIME(3) NOT NULL,
     PRIMARY KEY (id),
     UNIQUE KEY uniq_miku_documents_url_hash (url_hash),
     KEY idx_miku_documents_hash (content_hash)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS miku_chunks (
     id VARCHAR(191) NOT NULL,
     document_id VARCHAR(191) NOT NULL,
     url VARCHAR(768) NOT NULL,
     title VARCHAR(512) NOT NULL,
     section VARCHAR(128) NOT NULL DEFAULT '',
     heading_path VARCHAR(512) NOT NULL DEFAULT '',
     ordinal INT NOT NULL DEFAULT 0,
     text MEDIUMTEXT NOT NULL,
     content_hash VARCHAR(64) NOT NULL,
     embedding LONGTEXT NULL,
     updated_at DATETIME(3) NOT NULL,
     PRIMARY KEY (id),
     KEY idx_miku_chunks_document (document_id),
     KEY idx_miku_chunks_hash (content_hash)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS miku_actions (
     id VARCHAR(191) NOT NULL,
     session_id VARCHAR(191) NOT NULL,
     tool VARCHAR(128) NOT NULL,
     args TEXT NOT NULL,
     ok TINYINT(1) NOT NULL DEFAULT 0,
     created_at DATETIME(3) NOT NULL,
     PRIMARY KEY (id),
     KEY idx_miku_actions_session (session_id),
     KEY idx_miku_actions_created (created_at)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS miku_feedback (
     id VARCHAR(191) NOT NULL,
     message_id VARCHAR(191) NULL,
     question TEXT NOT NULL,
     answer TEXT NULL,
     rating TINYINT NULL,
     session_id VARCHAR(191) NOT NULL,
     provider VARCHAR(32) NULL,
     created_at DATETIME(3) NOT NULL,
     PRIMARY KEY (id),
     KEY idx_miku_feedback_session (session_id),
     KEY idx_miku_feedback_created (created_at)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // InnoDB FULLTEXT. Duplicate-key-name (1061) means an earlier run already made it.
  `CREATE FULLTEXT INDEX ft_miku_chunks_text ON miku_chunks (text, title, heading_path)`,
]

const POSTGRES_DDL: string[] = [
  `CREATE TABLE IF NOT EXISTS miku_documents (
     id TEXT PRIMARY KEY,
     url TEXT NOT NULL,
     url_hash TEXT NOT NULL UNIQUE,
     title TEXT NOT NULL,
     description TEXT,
     text TEXT NOT NULL,
     content_hash TEXT NOT NULL,
     section TEXT NOT NULL DEFAULT '',
     updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS miku_chunks (
     id TEXT PRIMARY KEY,
     document_id TEXT NOT NULL,
     url TEXT NOT NULL,
     title TEXT NOT NULL,
     section TEXT NOT NULL DEFAULT '',
     heading_path TEXT NOT NULL DEFAULT '',
     ordinal INTEGER NOT NULL DEFAULT 0,
     text TEXT NOT NULL,
     content_hash TEXT NOT NULL,
     embedding TEXT,
     updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS miku_actions (
     id TEXT PRIMARY KEY,
     session_id TEXT NOT NULL,
     tool TEXT NOT NULL,
     args TEXT NOT NULL,
     ok BOOLEAN NOT NULL DEFAULT false,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS miku_feedback (
     id TEXT PRIMARY KEY,
     message_id TEXT,
     question TEXT NOT NULL,
     answer TEXT,
     rating SMALLINT,
     session_id TEXT NOT NULL,
     provider TEXT,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS idx_miku_chunks_document ON miku_chunks (document_id)`,
]

/** `?` for MySQL, `$n` for Postgres. Keeps every query dialect-correct. */
export class Dialect {
  constructor(readonly name: "mysql" | "postgres" | "sqlite") {}
  placeholders(sql: string): string {
    if (this.name !== "postgres") return sql
    let i = 0
    return sql.replace(/\?/g, () => `$${++i}`)
  }
  ddl(): string[] {
    if (this.name === "postgres") return POSTGRES_DDL
    return MYSQL_DDL
  }
  now(): string {
    return this.name === "postgres" ? "CURRENT_TIMESTAMP" : "UTC_TIMESTAMP(3)"
  }
  /** Cosine in SQL is not portable; the vector leg always runs in JS. */
  supportsFullText(): boolean {
    return this.name === "mysql" || this.name === "postgres"
  }
}

export class SqlStore implements KnowledgeStore {
  private db: MikuDatabase
  private dialect: Dialect
  private schemaReady: Promise<void> | null = null
  private vectorCache: { at: number; rows: Awaited<ReturnType<SqlStore["readVectors"]>> } | null = null
  private vectorLoad: Promise<Awaited<ReturnType<SqlStore["readVectors"]>>> | null = null

  constructor(private config: ResolvedMikuConfig) {
    const db = config.db as MikuDatabase
    this.db = db
    this.dialect = new Dialect(db.dialect ?? "mysql")
  }

  /**
   * Re-points a reused store at the current request's config.
   *
   * `db` cannot change — it is the identity the store is cached under — so only
   * the resolved settings need refreshing when a host mutates its config
   * between requests (which `resolveConfig` explicitly supports).
   */
  refresh(config: ResolvedMikuConfig): this {
    this.config = config
    return this
  }

  private async run<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    const out = await this.db.query(this.dialect.placeholders(sql), params)
    return (out ?? []) as T[]
  }

  private async write(sql: string, params: unknown[] = []): Promise<void> {
    const exec = this.db.execute ?? this.db.query
    await exec(this.dialect.placeholders(sql), params)
  }

  ensureSchema(): Promise<void> {
    if (!this.schemaReady) {
      this.schemaReady = (async () => {
        for (const statement of this.dialect.ddl()) {
          try {
            await this.write(statement)
          } catch (err) {
            const code = (err as { code?: string }).code
            // 1061 = index already exists, 42710 = pg duplicate object.
            if (code === "1061" || code === "42710") continue
            if (/already exists|duplicate key name/i.test(String((err as Error)?.message))) continue
            throw err
          }
        }
      })()
    }
    return this.schemaReady
  }

  async upsertDocument(input: {
    url: string
    title: string
    description?: string | null
    text: string
    contentHash: string
    section: string
    chunks: Omit<ChunkRecord, "id" | "embedding" | "documentId">[]
    embedding?: ((texts: string[]) => Promise<number[][]>) | null
    force?: boolean
  }): Promise<{ chunks: number; skipped: boolean }> {
    await this.ensureSchema()

    const urlHash = hash(input.url)
    const docId = `doc_${urlHash}`

    if (!input.force) {
      const existing = await this.run<{ content_hash: string }>(
        "SELECT content_hash FROM miku_documents WHERE url_hash = ?",
        [urlHash]
      )
      if (existing[0]?.content_hash === input.contentHash) {
        return { chunks: 0, skipped: true }
      }
    }

    const now = this.dialect.now()
    // Upsert differs enough between engines that explicit branches are clearer
    // than a clever one-liner.
    if (this.dialect.name === "postgres") {
      await this.write(
        `INSERT INTO miku_documents (id, url, url_hash, title, description, text, content_hash, section, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ${now})
         ON CONFLICT (url_hash) DO UPDATE SET
           title = EXCLUDED.title, description = EXCLUDED.description, text = EXCLUDED.text,
           content_hash = EXCLUDED.content_hash, section = EXCLUDED.section, updated_at = EXCLUDED.updated_at`,
        [
          docId,
          input.url,
          urlHash,
          input.title.slice(0, 512),
          input.description ?? null,
          input.text,
          input.contentHash,
          input.section,
        ]
      )
    } else {
      await this.write("DELETE FROM miku_documents WHERE url_hash = ?", [urlHash])
      await this.write(
        `INSERT INTO miku_documents (id, url, url_hash, title, description, text, content_hash, section, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ${now})`,
        [
          docId,
          input.url,
          urlHash,
          input.title.slice(0, 512),
          input.description ?? null,
          input.text,
          input.contentHash,
          input.section,
        ]
      )
    }

    await this.write("DELETE FROM miku_chunks WHERE document_id = ?", [docId])

    if (input.chunks.length === 0) return { chunks: 0, skipped: false }

    let embeddings: number[][] | null = null
    if (input.embedding && this.config.retrieval.useVectors) {
      try {
        embeddings = await input.embedding(input.chunks.map((c) => c.text))
      } catch (err) {
        console.warn("[miku] embedding failed for", input.url, (err as Error).message)
      }
    }

    for (let i = 0; i < input.chunks.length; i++) {
      const chunk = input.chunks[i]
      if (!chunk) continue
      const vec = embeddings?.[i]
      await this.write(
        `INSERT INTO miku_chunks (id, document_id, url, title, section, heading_path, ordinal, text, content_hash, embedding, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${now})`,
        [
          `chk_${hash(`${urlHash}:${chunk.ordinal}:${chunk.contentHash}`)}`,
          docId,
          chunk.url,
          chunk.title.slice(0, 512),
          chunk.section,
          chunk.headingPath.slice(0, 512),
          chunk.ordinal,
          chunk.text,
          chunk.contentHash,
          vec ? JSON.stringify(vec) : null,
        ]
      )
    }
    this.vectorCache = null
    return { chunks: input.chunks.length, skipped: false }
  }

  async deleteDocumentsNotIn(urls: string[]): Promise<number> {
    await this.ensureSchema()
    const rows = await this.run<{ url_hash: string }>("SELECT url_hash FROM miku_documents")
    const keep = new Set(urls.map((u) => hash(u)))
    const stale = rows.map((r) => r.url_hash).filter((h) => !keep.has(h))
    for (const h of stale) {
      await this.write("DELETE FROM miku_chunks WHERE document_id = ?", [`doc_${h}`])
      await this.write("DELETE FROM miku_documents WHERE url_hash = ?", [h])
    }
    if (stale.length > 0) this.vectorCache = null
    return stale.length
  }

  async getChunksByIds(ids: string[]): Promise<ChunkRecord[]> {
    if (ids.length === 0) return []
    await this.ensureSchema()
    const placeholders = ids.map(() => "?").join(",")
    const rows = await this.run<Record<string, unknown>>(
      `SELECT id, document_id, url, title, section, heading_path, ordinal, text, content_hash, embedding
       FROM miku_chunks WHERE id IN (${placeholders})`,
      ids
    )
    return rows.map(rowToChunk)
  }

  async keywordSearch(query: string, limit: number): Promise<KeywordHit[]> {
    await this.ensureSchema()
    const cleaned = query.replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim()
    if (cleaned.length < 2) return []

    if (this.dialect.supportsFullText()) {
      try {
        const rows =
          this.dialect.name === "postgres"
            ? await this.run<{ id: string; score: number }>(
                `SELECT id, ts_rank(to_tsvector('english', text), plainto_tsquery('english', ?)) AS score
                 FROM miku_chunks
                 WHERE to_tsvector('english', text) @@ plainto_tsquery('english', ?)
                 ORDER BY score DESC LIMIT ${limit}`,
                [cleaned, cleaned]
              )
            : await this.run<{ id: string; score: number }>(
                `SELECT id,
                  MATCH(text, title, heading_path) AGAINST (? IN NATURAL LANGUAGE MODE) AS score
                 FROM miku_chunks
                 WHERE MATCH(text, title, heading_path) AGAINST (? IN NATURAL LANGUAGE MODE)
                 ORDER BY score DESC LIMIT ${limit}`,
                [cleaned, cleaned]
              )
        if (rows.length > 0) return rows.map((r) => ({ id: r.id, score: Number(r.score) }))
      } catch (err) {
        console.warn("[miku] full-text search failed, using LIKE fallback", (err as Error).message)
      }
    }

    // LIKE fallback also covers tokens InnoDB's full-text index cannot store
    // (innodb_ft_min_token_size defaults to 3, so "AI" and "WP" are invisible).
    const tokens = cleaned.split(" ").filter(Boolean)
    const terms = tokens
      .filter((t) => t.length >= 2)
      .sort((a, b) => b.length - a.length)
      .slice(0, 6)
    if (terms.length === 0) return []

    const where = terms.map(() => "(title LIKE ? OR heading_path LIKE ? OR text LIKE ?)").join(" OR ")
    const params: unknown[] = []
    for (const t of terms) params.push(`%${t}%`, `%${t}%`, `%${t}%`)

    const rows = await this.run<{ id: string; hits: number }>(
      `SELECT id, (${terms.map(() => "(title LIKE ? OR heading_path LIKE ? OR text LIKE ?)").join(" + ")}) AS hits
       FROM miku_chunks WHERE ${where} LIMIT ${limit}`,
      [...params, ...params]
    )
    return rows.map((r) => ({ id: r.id, score: Number(r.hits) || 1 }))
  }

  private async readVectors(): Promise<{ id: string; embedding: number[]; row: ChunkRecord }[]> {
    const rows = await this.run<Record<string, unknown>>(
      "SELECT id, document_id, url, title, section, heading_path, ordinal, text, content_hash, embedding FROM miku_chunks WHERE embedding IS NOT NULL"
    )
    const out: { id: string; embedding: number[]; row: ChunkRecord }[] = []
    for (const row of rows) {
      const embedding = decodeVector(row.embedding)
      if (!embedding) continue
      out.push({ id: String(row.id), embedding, row: rowToChunk(row) })
    }
    return out
  }

  async loadVectors(): Promise<{ id: string; embedding: number[]; row: ChunkRecord }[]> {
    const now = Date.now()
    // 60s cache: keeps repeat questions cheap without ever serving a stale index.
    if (this.vectorCache && now - this.vectorCache.at < 60_000) return this.vectorCache.rows

    // One scan at a time. Concurrent requests arriving on a cold cache would
    // otherwise each start their own full table read and exhaust the pool —
    // which surfaces as "too many connections" on a small remote database.
    if (!this.vectorLoad) {
      this.vectorLoad = this.readVectors()
        .then((rows) => {
          this.vectorCache = { at: Date.now(), rows }
          return rows
        })
        .finally(() => {
          this.vectorLoad = null
        })
    }
    return this.vectorLoad
  }

  async countChunks(): Promise<number> {
    await this.ensureSchema()
    const rows = await this.run<{ n: number | string }>("SELECT COUNT(*) AS n FROM miku_chunks")
    return Number(rows[0]?.n ?? 0)
  }

  async stats(): Promise<KnowledgeStats> {
    await this.ensureSchema()
    const docs = await this.run<{ n: number | string }>("SELECT COUNT(*) AS n FROM miku_documents")
    const chunks = await this.run<{ n: number | string }>("SELECT COUNT(*) AS n FROM miku_chunks")
    const last = await this.run<{ updated_at: string }>(
      "SELECT MAX(updated_at) AS updated_at FROM miku_documents"
    )
    const urls = await this.run<{ url: string; title: string; n: number | string }>(
      "SELECT url, title, COUNT(*) AS n FROM miku_chunks GROUP BY url, title ORDER BY url"
    )
    return {
      documents: Number(docs[0]?.n ?? 0),
      chunks: Number(chunks[0]?.n ?? 0),
      lastIngestedAt: last[0]?.updated_at ? String(last[0].updated_at) : null,
      urls: urls.map((u) => ({ url: u.url, title: u.title, chunks: Number(u.n) })),
    }
  }

  async clear(): Promise<void> {
    await this.ensureSchema()
    for (const t of ["miku_chunks", "miku_documents", "miku_actions", "miku_feedback"]) {
      await this.write(`DELETE FROM ${t}`)
    }
    this.vectorCache = null
  }

  close(): void {
    this.vectorCache = null
  }
}

function rowToChunk(row: Record<string, unknown>): ChunkRecord {
  return {
    id: String(row.id),
    documentId: String(row.document_id),
    url: String(row.url),
    title: String(row.title),
    section: String(row.section ?? ""),
    headingPath: String(row.heading_path ?? ""),
    ordinal: Number(row.ordinal ?? 0),
    text: String(row.text ?? ""),
    contentHash: String(row.content_hash ?? ""),
    embedding: decodeVector(row.embedding),
  }
}

/**
 * Zero-infrastructure store. Used in development, in tests, and whenever a host
 * has not wired a database. Retrieval quality is lower because there are no
 * embeddings, but nothing is lost structurally.
 */
export class MemoryStore implements KnowledgeStore {
  private docs = new Map<string, { url: string; title: string; contentHash: string; updatedAt: string }>()
  private chunks = new Map<string, ChunkRecord>()
  private vectors = new Map<string, number[]>()

  constructor(private config: ResolvedMikuConfig) {}

  async ensureSchema(): Promise<void> {}

  async upsertDocument(input: {
    url: string
    title: string
    contentHash: string
    section: string
    chunks: Omit<ChunkRecord, "id" | "embedding" | "documentId">[]
    embedding?: ((texts: string[]) => Promise<number[][]>) | null
    force?: boolean
  }): Promise<{ chunks: number; skipped: boolean }> {
    const docId = `doc_${hash(input.url)}`
    if (!input.force && this.docs.get(docId)?.contentHash === input.contentHash) {
      return { chunks: 0, skipped: true }
    }
    this.removeByDoc(docId)
    this.docs.set(docId, {
      url: input.url,
      title: input.title,
      contentHash: input.contentHash,
      updatedAt: new Date().toISOString(),
    })

    let embeddings: number[][] | null = null
    if (input.embedding && this.config.retrieval.useVectors) {
      try {
        embeddings = await input.embedding(input.chunks.map((c) => c.text))
      } catch {
        embeddings = null
      }
    }
    input.chunks.forEach((c, i) => {
      const id = `chk_${hash(`${docId}:${c.ordinal}:${c.contentHash}`)}`
      this.chunks.set(id, { ...c, id, documentId: docId, embedding: embeddings?.[i] ?? null })
      const vec = embeddings?.[i]
      if (vec) this.vectors.set(id, vec)
    })
    return { chunks: input.chunks.length, skipped: false }
  }

  private removeByDoc(docId: string): void {
    for (const [id, c] of this.chunks) {
      if (c.documentId !== docId) continue
      this.chunks.delete(id)
      this.vectors.delete(id)
    }
  }

  async deleteDocumentsNotIn(urls: string[]): Promise<number> {
    const keep = new Set(urls.map((u) => hash(u)))
    let removed = 0
    for (const [docId] of this.docs) {
      if (keep.has(docId.replace("doc_", ""))) continue
      this.removeByDoc(docId)
      this.docs.delete(docId)
      removed++
    }
    return removed
  }

  async getChunksByIds(ids: string[]): Promise<ChunkRecord[]> {
    const out: ChunkRecord[] = []
    for (const id of ids) {
      const chunk = this.chunks.get(id)
      if (chunk) out.push(chunk)
    }
    return out
  }

  async keywordSearch(query: string, limit: number): Promise<KeywordHit[]> {
    const tokens = query
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((t) => t.length >= 2)
    if (tokens.length === 0) return []
    const hits: KeywordHit[] = []
    for (const [id, chunk] of this.chunks) {
      const haystack = `${chunk.title} ${chunk.headingPath} ${chunk.text}`.toLowerCase()
      let score = 0
      for (const t of tokens) {
        const count = haystack.split(t).length - 1
        if (count > 0) score += 1 + Math.log(count)
      }
      if (score > 0) hits.push({ id, score })
    }
    return hits.sort((a, b) => b.score - a.score).slice(0, limit)
  }

  async loadVectors(): Promise<{ id: string; embedding: number[]; row: ChunkRecord }[]> {
    const out: { id: string; embedding: number[]; row: ChunkRecord }[] = []
    for (const [id, embedding] of this.vectors) {
      const row = this.chunks.get(id)
      if (row) out.push({ id, embedding, row })
    }
    return out
  }

  async countChunks(): Promise<number> {
    return this.chunks.size
  }

  async stats(): Promise<KnowledgeStats> {
    let lastIngestedAt: string | null = null
    for (const d of this.docs.values()) {
      if (!lastIngestedAt || d.updatedAt > lastIngestedAt) lastIngestedAt = d.updatedAt
    }
    const byUrl = new Map<string, number>()
    for (const c of this.chunks.values()) byUrl.set(c.url, (byUrl.get(c.url) ?? 0) + 1)
    return {
      documents: this.docs.size,
      chunks: this.chunks.size,
      lastIngestedAt,
      urls: [...byUrl.entries()].map(([url, n]) => ({
        url,
        title: this.docs.get(`doc_${hash(url)}`)?.title ?? url,
        chunks: n,
      })),
    }
  }

  async clear(): Promise<void> {
    this.docs.clear()
    this.chunks.clear()
    this.vectors.clear()
  }

  close(): void {}
}

export { cosineSimilarity }