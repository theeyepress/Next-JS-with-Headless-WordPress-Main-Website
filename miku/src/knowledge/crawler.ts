import type { ResolvedMikuConfig } from "../config/types"

export interface CrawlPage {
  url: string
  pathname: string
  html: string
  status: number
}

export interface CrawlResult {
  pages: CrawlPage[]
  discovered: string[]
  failures: { url: string; error: string }[]
}

/** Minimal glob matcher for the `/**`, `/admin/**` style patterns MIKU uses. */
export function matchesGlob(pathname: string, pattern: string): boolean {
  const p = pathname.replace(/\/+$/, "") || "/"
  const glob = pattern.replace(/\/+$/, "") || "/"
  if (glob === "/**") return true
  if (glob === p) return true
  if (glob.endsWith("/**")) {
    const prefix = glob.slice(0, -3) || "/"
    return p === prefix || p.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`)
  }
  if (glob.endsWith("/*")) {
    const prefix = glob.slice(0, -2)
    return p.startsWith(`${prefix}/`) && !p.slice(prefix.length + 1).includes("/")
  }
  return false
}

export function isPathIncluded(pathname: string, config: ResolvedMikuConfig): boolean {
  const included = config.site.include.some((g) => matchesGlob(pathname, g))
  if (!included) return false
  return !config.site.exclude.some((g) => matchesGlob(pathname, g))
}

function toAbs(base: string, href: string): string | null {
  try {
    const u = new URL(href, base)
    u.hash = ""
    return u.toString()
  } catch {
    return null
  }
}

function isAllowedOrigin(url: string, config: ResolvedMikuConfig): boolean {
  try {
    const origin = new URL(url).origin
    return origin === config.site.baseUrl || config.site.additionalOrigins.includes(origin)
  } catch {
    return false
  }
}

function isIndexable(url: string, config: ResolvedMikuConfig): boolean {
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return false
  }
  if (!/^https?:$/.test(u.protocol)) return false
  if (!isAllowedOrigin(url, config)) return false
  // Never index anything that would need auth or carries a session id.
  if (/[?&](token|key|session|auth|code|signature)=/i.test(u.search)) return false
  if (hasBinaryExtension(u.pathname)) return false
  return isPathIncluded(u.pathname, config)
}

/**
 * True when the URL points at a file rather than a page.
 *
 * Extensionless paths are the norm on a modern framework (`/about`,
 * `/blog/my-post`), so a missing extension means "page". Only a real extension
 * counts — and only the ones that are not worth indexing.
 */
function hasBinaryExtension(pathname: string): boolean {
  const lastSegment = pathname.split("/").filter(Boolean).at(-1)
  if (!lastSegment) return false
  const match = lastSegment.match(/\.([a-z0-9]{1,8})$/i)
  if (!match) return false
  return !/^(html?|php|aspx?|jsp|md|mdx|txt)$/i.test(match[1] as string)
}

/** Reads robots.txt once and returns a matcher for Disallow rules. */
export async function loadRobots(baseUrl: string): Promise<(pathname: string) => boolean> {
  try {
    const res = await fetch(`${baseUrl}/robots.txt`, {
      headers: { "User-Agent": "MikuBot" },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return () => false
    const text = await res.text()
    const disallowed: string[] = []
    let applies = false
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.split("#")[0]?.trim() ?? ""
      if (!line) continue
      const [rawKey, ...rest] = line.split(":")
      const key = (rawKey ?? "").trim().toLowerCase()
      const value = rest.join(":").trim()
      if (key === "user-agent") applies = value === "*" || /miku|bot/i.test(value)
      else if (applies && key === "disallow" && value) disallowed.push(value)
    }
    if (disallowed.length === 0) return () => false
    return (pathname) => disallowed.some((rule) => matchesGlob(pathname, rule))
  } catch {
    return () => false
  }
}

/** Pulls every <loc> out of a sitemap or sitemap index, following children. */
async function collectSitemapUrls(
  url: string,
  seen: Set<string>,
  depth = 0
): Promise<string[]> {
  if (seen.has(url) || depth > 3) return []
  seen.add(url)
  let xml: string
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "MikuBot" },
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) return []
    xml = await res.text()
  } catch {
    return []
  }

  const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)]
    .map((m) => (m[1] ?? "").replace(/&amp;/g, "&"))
    .filter(Boolean)

  // A sitemap index has no <urlset> and points at further sitemaps.
  const looksLikeIndex = /<sitemapindex/i.test(xml)
  if (!looksLikeIndex) return locs

  const nested = await Promise.all(
    locs.map((child) => collectSitemapUrls(child, seen, depth + 1))
  )
  return nested.flat()
}

/** Discovers URLs to crawl: configured sitemaps, /sitemap.xml, then homepage links. */
export async function discoverUrls(
  config: ResolvedMikuConfig
): Promise<{ urls: string[]; robots: (pathname: string) => boolean }> {
  const robots = config.site.respectRobots
    ? await loadRobots(config.site.baseUrl)
    : () => false

  const seeds = [
    ...config.site.sitemaps,
    ...(config.site.sitemaps.length === 0 ? [`${config.site.baseUrl}/sitemap.xml`] : []),
  ]

  const found: string[] = []
  const seen = new Set<string>()
  for (const seed of seeds) {
    for (const url of await collectSitemapUrls(seed, seen)) {
      if (isIndexable(url, config)) found.push(url)
    }
  }

  // No sitemap (or none indexable): follow homepage links so a fresh install
  // still gets a usable index instead of nothing.
  if (found.length === 0) {
    try {
      const res = await fetch(config.site.baseUrl, {
        headers: { "User-Agent": "MikuBot" },
        signal: AbortSignal.timeout(config.site.timeoutMs),
      })
      const html = await res.text()
      for (const m of html.matchAll(/href=["']([^"'#]+)["']/gi)) {
        const abs = toAbs(config.site.baseUrl, m[1] ?? "")
        if (abs && isIndexable(abs, config)) found.push(abs)
      }
    } catch {
      // A site with no reachable sitemap and no reachable homepage has nothing
      // to index; the caller reports zero pages.
    }
  }

  const unique = [...new Set(found)]
    .filter((url) => {
      try {
        return !robots(new URL(url).pathname)
      } catch {
        return true
      }
    })
    .sort()
    .slice(0, config.site.maxPages)

  return { urls: unique, robots }
}

/** Crawls the given URLs with bounded concurrency and per-page resilience. */
export async function crawl(config: ResolvedMikuConfig, urls: string[]): Promise<CrawlResult> {
  const pages: CrawlPage[] = []
  const failures: { url: string; error: string }[] = []
  const queue = [...urls]
  let cursor = 0

  async function worker(): Promise<void> {
    while (cursor < queue.length) {
      const url = queue[cursor++]
      if (!url) return
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), config.site.timeoutMs)
      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent": "MikuBot (+self-hosted site assistant)",
            Accept: "text/html,application/xhtml+xml",
          },
          signal: controller.signal,
        })
        if (!res.ok) {
          failures.push({ url, error: `HTTP ${res.status}` })
          continue
        }
        const type = res.headers.get("content-type") ?? ""
        if (!type.includes("text/html")) continue
        const html = await res.text()
        pages.push({ url, pathname: new URL(url).pathname, html, status: res.status })
      } catch (err) {
        failures.push({ url, error: (err as Error).message })
      } finally {
        clearTimeout(timer)
      }
    }
  }

  const workers = Array.from({ length: Math.min(config.site.concurrency, queue.length) }, worker)
  await Promise.all(workers)

  return { pages, discovered: urls, failures }
}