"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import type { MikuCitation, MikuMessage } from "./types"
import { LinkIcon } from "./icons"

/**
 * A citation URL turned into a short, human label ("/products/visaflow-pro" →
 * "VisaFlow Pro"). Page <title>s are near-identical across this site — many pages
 * share one SEO title — so the URL is the only reliable way to tell two sources
 * apart. Pure display: it never changes where the link points.
 */
const PAGE_LABELS: Record<string, string> = {
  "/": "Home",
  "/about": "About",
  "/services": "Services",
  "/products": "Products",
  "/pricing": "Pricing",
  "/portfolio": "Portfolio",
  "/blog": "Blog",
  "/contact": "Contact",
  "/documentation": "Documentation",
  "/setup-guide": "Setup guide",
  "/license": "License",
  "/web-dev-plans": "Web dev plans",
  "/terms": "Terms",
  "/privacy-policy": "Privacy policy",
  "/refund-policy": "Refund policy",
  "/cookie-policy": "Cookie policy",
  "/support-policy": "Support policy",
  "/update-policy": "Update policy",
  "/white-label-policy": "White-label policy",
}

/** Words that look wrong in Title Case. */
const WORD_CASE: Record<string, string> = {
  ai: "AI",
  api: "API",
  seo: "SEO",
  ui: "UI",
  ux: "UX",
  wp: "WP",
  saas: "SaaS",
  cms: "CMS",
  crm: "CRM",
  erp: "ERP",
  nextjs: "Next.js",
  wordpress: "WordPress",
  woocommerce: "WooCommerce",
  visaflow: "VisaFlow",
}

function titleCaseSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => WORD_CASE[word.toLowerCase()] ?? word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

/** Short, unique label for a citation, derived from its URL when possible. */
export function friendlyLabel(url: string, fallback: string): string {
  let pathname = url
  try {
    pathname = new URL(url).pathname
  } catch {
    // Not an absolute URL — treat the value as a path already.
  }
  const clean = pathname.replace(/\/+$/, "") || "/"
  const known = PAGE_LABELS[clean]
  if (known) return known
  const last = clean.split("/").filter(Boolean).pop()
  return last ? titleCaseSlug(last) : fallback
}

/**
 * Renders MIKU's answer.
 *
 * External links are forced to `target="_blank" rel="noopener noreferrer"` — the
 * panel would otherwise navigate the visitor's whole site away from the page
 * they were reading, and `noopener` keeps the opened page from reaching back
 * through `window.opener`.
 */
function Markdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer nofollow">
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

/**
 * Rewrites the `[SOURCE n]` markers the model emits into ordinary Markdown
 * links pointing at the real page.
 *
 * Doing this as a text transform rather than as a custom React renderer is
 * deliberate: the answer is Markdown, and injecting JSX into the middle of it
 * would break the surrounding formatting. As links, the markers survive
 * rendering, stay clickable, and cost nothing.
 */
export function applyCitationLinks(content: string, citations: MikuCitation[]): string {
  if (citations.length === 0) return content.replace(/\[SOURCE\s+\d+\]\s*/gi, "")
  return content.replace(/\[SOURCE\s+(\d+)\]/gi, (marker, index: string) => {
    const source = citations[Number(index) - 1]
    if (!source) return ""
    return `[${Number(index)}](${source.url} "${friendlyLabel(source.url, source.title).replace(/"/g, "")}")`
  })
}

function Citations({ sources }: { sources: MikuCitation[] }) {
  if (sources.length === 0) return null

  // Two different pages can render the same <title>; label by URL so each chip
  // is distinct and meaningful, then drop any that collapse to the same label.
  const seen = new Set<string>()
  const items = sources
    .map((source) => ({ source, label: friendlyLabel(source.url, source.title) }))
    .filter(({ label }) => {
      if (seen.has(label)) return false
      seen.add(label)
      return true
    })

  if (items.length === 0) return null

  return (
    <div className="miku-citations">
      {items.map(({ source, label }) => (
        <a
          key={source.url}
          className="miku-citation"
          href={source.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          title={source.snippet ? `${source.title}\n\n${source.snippet}` : source.title}
        >
          <LinkIcon />
          <span>{label}</span>
        </a>
      ))}
    </div>
  )
}

export function Message({ message }: { message: MikuMessage }) {
  const citations: MikuCitation[] = message.citations ?? []
  const isAssistant = message.role === "assistant"
  const content = isAssistant ? applyCitationLinks(message.content, citations) : message.content

  return (
    <>
      {isAssistant && (message.tools?.length ?? 0) > 0 && (
        <div className="miku-tools">
          {message.tools?.map((tool) => (
            <div key={tool.id} className="miku-tool" data-status={tool.status}>
              {tool.status === "running" ? (
                <span className="miku-tool-spinner" aria-hidden />
              ) : (
                <span className="miku-tool-mark" data-failed={tool.status === "error"} aria-hidden />
              )}
              <span>
                {tool.status === "running"
                  ? `${humanise(tool.name)}…`
                  : tool.status === "error"
                    ? `${humanise(tool.name)} failed`
                    : humanise(tool.name)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className={`miku-msg miku-msg-${message.role}${message.error ? " miku-msg-error" : ""}`}>
        <div className="miku-bubble">
          {content.length > 0 ? (
            <Markdown content={content} />
          ) : message.streaming ? (
            <TypingIndicator />
          ) : null}
          {message.streaming && content.length > 0 && <span className="miku-caret" aria-hidden />}
        </div>

        {isAssistant && citations.length > 0 && message.content.length > 0 && (
          <Citations sources={citations} />
        )}
      </div>
    </>
  )
}

function TypingIndicator() {
  return (
    <div className="miku-typing" role="status" aria-label="MIKU is typing">
      <span />
      <span />
      <span />
    </div>
  )
}

/** `search_site` → "Searching the site". Reads better than a raw tool name. */
function humanise(toolName: string): string {
  const map: Record<string, string> = {
    search_site: "Searching the site",
    read_site_page: "Reading a page",
    offer_human_handoff: "Connecting you with the team",
    book_a_call: "Preparing the booking link",
    navigate_to: "Finding the right page",
    capture_lead: "Saving your details",
  }
  if (map[toolName]) return map[toolName]
  const spaced = toolName.replace(/_/g, " ")
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}