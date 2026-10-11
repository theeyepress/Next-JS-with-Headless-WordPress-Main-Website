/**
 * Turns a fetched HTML page into clean, heading-annotated plain text.
 *
 * Deliberately regex-based rather than DOM-based: MIKU must install into any
 * React or Next.js app without pulling a parser into the host's dependency
 * tree. Next.js and every mainstream framework render real semantic HTML
 * (`<main>`, `<article>`, `<h1>`–`<h3>`), so the cheap approach holds up.
 */

export interface ExtractedPage {
  title: string
  text: string
  /** Headings in document order, used to keep a chunk inside one section. */
  headings: { level: number; text: string }[]
  description?: string
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  rsquo: "’",
  lsquo: "‘",
  ldquo: "“",
  rdquo: "”",
  middot: "·",
  eacute: "é",
  egrave: "è",
  uuml: "ü",
  ouml: "ö",
  auml: "ä",
  szlig: "ß",
}

export function decodeEntities(input: string): string {
  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (match, entity: string) => {
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      const code = Number.parseInt(entity.slice(2), 16)
      return Number.isFinite(code) ? String.fromCodePoint(code) : match
    }
    if (entity.startsWith("#")) {
      const code = Number.parseInt(entity.slice(1), 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : match
    }
    return ENTITIES[entity.toLowerCase()] ?? match
  })
}

/** Extracts <main>/<article> content, falling back to <body> then the raw string. */
function extractMainRegion(html: string): string {
  const patterns = [
    /<main\b[^>]*>([\s\S]*?)<\/main>/i,
    /<article\b[^>]*>([\s\S]*?)<\/article>/i,
    /<div\b[^>]*role=["']main["'][^>]*>([\s\S]*?)<\/div>/i,
    /<body\b[^>]*>([\s\S]*?)<\/body>/i,
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m && m[1] && stripTags(m[1]).trim().length > 200) return m[1]
  }
  return html
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim()
}

function extractMeta(html: string, name: string): string | undefined {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const patterns = [
    new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${escaped}["']`, "i"),
    new RegExp(`<meta[^>]+property=["']og:${escaped}["'][^>]+content=["']([^"']*)["']`, "i"),
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m?.[1]) return decodeEntities(m[1].trim())
  }
  return undefined
}

function extractTitle(html: string): string {
  const og = extractMeta(html, "title")
  if (og) return og
  const m = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)
  if (m?.[1]) {
    const t = stripTags(m[1])
    // Suffixes like "Page — Site Name" carry no retrieval value.
    return t.split(/\s+[|·–—]\s+/)[0]?.trim() || t
  }
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)
  return h1?.[1] ? stripTags(h1[1]) : "Untitled"
}

/** Removes the chrome that would otherwise pollute the index. */
function stripChrome(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|template|svg|canvas|iframe|form|button)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<(nav|header|footer|aside)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<input\b[^>]*>/gi, " ")
    .replace(/<select\b[^>]*>[\s\S]*?<\/select>/gi, " ")
}

/**
 * Converts block-level markup to line breaks and headings to Markdown, then
 * flattens what is left. Order matters: headings must survive before tags go.
 */
function htmlToMarkdown(html: string): string {
  let out = html

  for (let level = 1; level <= 6; level++) {
    const hashes = "#".repeat(level)
    out = out.replace(
      new RegExp(`<h${level}\\b[^>]*>([\\s\\S]*?)</h${level}>`, "gi"),
      (_m, inner: string) => `\n\n${hashes} ${stripTags(inner)}\n\n`
    )
  }

  out = out
    .replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_m, inner: string) => `\n- ${stripTags(inner)}`)
    .replace(/<(p|div|section|tr|blockquote|ul|ol|dl|dd|dt|figure|figcaption)\b[^>]*>/gi, "\n\n")
    .replace(/<\/(p|div|section|tr|blockquote|ul|ol|dl|dd|dt|figure|figcaption)>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<(th|td)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _t: string, inner: string) => ` | ${stripTags(inner)}`)

  out = decodeEntities(out.replace(/<[^>]+>/g, " "))

  return out
    .replace(/[ \t ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim()
}

export function extractPage(html: string): ExtractedPage {
  const title = extractTitle(html)
  const main = stripChrome(extractMainRegion(html))
  const text = htmlToMarkdown(main)

  const headings: { level: number; text: string }[] = []
  for (const line of text.split("\n")) {
    const m = line.match(/^(#{1,6})\s+(.*)$/)
    if (m?.[2]) headings.push({ level: m[1].length, text: m[2].trim() })
  }

  return {
    title,
    text,
    headings,
    description: extractMeta(html, "description"),
  }
}