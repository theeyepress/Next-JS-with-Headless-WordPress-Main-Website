import type { ResolvedMikuConfig } from "../config/types"
import { retrieve } from "../knowledge/retrieve"
import { createStore, type KnowledgeStore } from "../knowledge/store"
import type { MikuTool, ToolContext } from "../types"
import { actionTool, enumOf, obj, readTool, str } from "./helpers"

/** Per-request store, so the request path builds the index handle only once. */
export type StoreResolver = (ctx: ToolContext) => KnowledgeStore

function defaultResolver(config: ResolvedMikuConfig): StoreResolver {
  let store: KnowledgeStore | null = null
  return () => {
    if (!store) store = createStore(config)
    return store
  }
}

/**
 * The knowledge tools. These are what let MIKU answer "what are your refund
 * terms" or "which service handles X" without the host writing a single tool.
 */
export function createKnowledgeTools(
  config: ResolvedMikuConfig,
  getStore: StoreResolver = defaultResolver(config)
): MikuTool[] {
  const search = readTool({
    name: "search_site",
    kind: "knowledge",
    description:
      "Search this website's own pages for information about the business — services, policies, pricing pages, docs, company details, anything published on the site. Use this for any question about what the company offers or how it works. Returns matching passages with their source URLs.",
    parameters: obj(
      {
        query: str(
          "What to look for, in the visitor's own words. For example: 'refund policy', 'do you offer monthly billing', 'what is included in the Pro plan'."
        ),
      },
      ["query"]
    ),
    execute: async (args: { query: string }, ctx: ToolContext) => {
      const result = await retrieve(
        ctx.config,
        args.query,
        { topK: Math.min(8, ctx.config.retrieval.topK + 2), ignoreMinScore: true },
        getStore(ctx)
      )
      if (result.chunks.length === 0) {
        return {
          found: false,
          message:
            "Nothing on this website matches that. Answer honestly that the information is not published here, and offer to pass the question to the team.",
        }
      }
      return {
        found: true,
        topScore: Number(result.topScore.toFixed(3)),
        passages: result.chunks.map((c, i) => ({
          source: i + 1,
          page: c.title,
          url: c.url,
          excerpt: c.text.slice(0, 900),
        })),
      }
    },
  })

  const readPage = readTool({
    name: "read_site_page",
    kind: "knowledge",
    description:
      "Read a specific page of this website in full when you already know which page the answer lives on — for example a specific policy, product or pricing page. Do not use this to explore; use search_site for that.",
    parameters: obj(
      {
        url: str("Full URL on this website, exactly as it appears in a search_site result."),
      },
      ["url"]
    ),
    execute: async (args: { url: string }, ctx: ToolContext) => {
      let parsed: URL
      try {
        parsed = new URL(args.url, ctx.config.site.baseUrl)
      } catch {
        throw new Error("That is not a valid URL.")
      }
      if (parsed.origin !== ctx.config.site.baseUrl) {
        throw new Error(
          "Only pages on this website can be read. Use search_site instead for a general question."
        )
      }

      const result = await retrieve(
        ctx.config,
        args.url.replace(/\/$/, ""),
        { topK: 8, urlPrefix: parsed.pathname.replace(/\/$/, ""), ignoreMinScore: true },
        getStore(ctx)
      )
      if (result.chunks.length === 0) {
        return {
          found: false,
          message: "That page is not in the index. It may have moved, or it may not be public.",
        }
      }
      return {
        found: true,
        page: result.chunks[0]?.title ?? parsed.pathname,
        url: args.url,
        content: result.chunks.map((c) => c.text).join("\n\n").slice(0, 6000),
      }
    },
  })

  return [search, readPage]
}

/**
 * Action tools: the ones that do something rather than answer something. Every
 * one of these is opt-in by config and requires an explicit click in the UI.
 */
export function createActionTools(config: ResolvedMikuConfig): MikuTool[] {
  const tools: MikuTool[] = []

  if (config.actions.handoffUrl || config.actions.handoffWhatsApp || config.actions.handoffEmail) {
    tools.push(
      actionTool({
        name: "offer_human_handoff",
        description:
          "Hand the conversation to a real person. Use this when the visitor asks for a human, when they are upset, or when you genuinely cannot answer and a person is the right next step. Do not use it for questions you can answer yourself.",
        parameters: obj({
          reason: str("A short internal note on why the handoff is happening. The visitor does not see this."),
        }),
        execute: async (args: { reason?: string }) => {
          const contact = {
            bookingUrl: config.actions.bookingUrl,
            handoffUrl: config.actions.handoffUrl,
            handoffWhatsApp: config.actions.handoffWhatsApp,
            handoffEmail: config.actions.handoffEmail,
          }
          return {
            handedOff: true,
            reason: args.reason ?? "Visitor asked for a human",
            contact,
            instruction:
              "Confirm to the visitor that a person will take over, then give them the contact option. Do not promise a response time you cannot guarantee.",
          }
        },
      })
    )
  }

  if (config.actions.bookingUrl) {
    tools.push(
      actionTool({
        name: "book_a_call",
        description:
          "Offer to book a call or demo with the team. Use when the visitor wants to talk to someone, or after they have shown buying intent.",
        parameters: obj({
          purpose: str(
            "Short internal summary of what the call would cover, taken from the conversation."
          ),
        }),
        execute: async (args: { purpose?: string }) => ({
          bookingUrl: config.actions.bookingUrl,
          purpose: args.purpose ?? "",
          instruction:
            "Give the visitor the booking link and suggest they pick a slot. Do not pick a time on their behalf.",
        }),
      })
    )
  }

  tools.push(
    actionTool({
      name: "navigate_to",
      description:
        "Move the visitor to a page on this website — for example to a pricing page, a product page, the contact page, or their dashboard. Use when the answer is really 'this is where that lives'.",
      parameters: obj({
        page: enumOf("Which page to open.", [
          "home",
          "pricing",
          "contact",
          "services",
          "products",
          "blog",
          "docs",
          "about",
          "login",
          "dashboard",
          "account",
        ]),
      }),
      execute: async (args: { page: string }) => {
        const map: Record<string, string> = {
          home: "/",
          pricing: "/pricing",
          contact: "/contact",
          services: "/services",
          products: "/products",
          blog: "/blog",
          docs: "/docs",
          about: "/about",
          login: "/login",
          dashboard: "/dashboard",
          account: "/dashboard",
        }
        const path = map[args.page] ?? "/"
        return {
          path,
          instruction: `Tell the visitor you are taking them to ${args.page}. The interface will navigate for you.`,
        }
      },
    })
  )

  return tools
}