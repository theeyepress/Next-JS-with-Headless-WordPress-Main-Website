# MIKU

A self-hosted AI assistant that actually knows your website.

Drop it into any Next.js or React site. MIKU crawls your pages, reads your
live database, and answers visitors' questions with citations — grounded in
your content, not in guesses.

It runs on your server, with your API keys, against your database. No
third-party service, no per-message fee, no vendor lock-in.

---

## What makes it different

Most chat widgets are a language model with a marketing blurb glued to the
front. MIKU has three layers that make answers trustworthy:

**1. Grounding.** Your site's pages are crawled, split into heading-bounded
chunks, and embedded. Answers are assembled from retrieved passages, and each
one carries a citation the visitor can click.

**2. Live data.** Prices, order status, licences, tickets — these are answered
by *tools* that query your database at the moment the question is asked. Nothing
live is ever baked into the index, so a price change takes effect immediately
rather than at the next crawl.

**3. Refusal.** When MIKU has nothing grounded to say, it says so. It will not
invent a price, a feature, or a policy. This is the most important property
here: an assistant that confidently makes up your pricing is worse than no
assistant at all.

---

## Install

```bash
npm install @wpcodingpress/miku
```

Then add to `next.config.ts`:

```ts
transpilePackages: ["@wpcodingpress/miku"],
```

And import the stylesheet in your root layout:

```ts
import "@wpcodingpress/miku/styles.css"
```

### 1. Configure

Create `miku.config.ts` in your project root:

```ts
import { defineMiku } from "@wpcodingpress/miku/config"

export default defineMiku({
  brand: {
    name: "Acme Studio",
    tagline: "Websites that convert",
  },
  site: {
    baseUrl: "https://acme.com",
    exclude: ["/admin/**", "/dashboard/**", "/api/**", "/checkout"],
  },
})
```

### 2. Add the route

`app/api/miku/chat/route.ts`:

```ts
import { createMikuRoute } from "@wpcodingpress/miku/next"
import config from "../../miku.config"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export const POST = createMikuRoute({ config })
```

That is the whole backend. It streams server-sent events, runs the tool loop,
handles consent, and rate-limits.

### 3. Mount the widget

In any layout:

```tsx
"use client"
import { MikuWidget } from "@wpcodingpress/miku/client"

export function Assistant() {
  return <MikuWidget />
}
```

### 4. Add your keys

```bash
GEMINI_API_KEY=your_key    # chat + embeddings (required)
GROQ_API_KEY=your_key      # optional failover provider
```

### 5. Build the knowledge index

```bash
npx miku ingest
```

MIKU reads `miku.config.ts` — the same file your app uses — so there is no
second configuration to keep in sync.

> **Changing `llm.embeddingModel` means re-running ingest.** Embeddings from
> one model are not comparable with another's, so a swapped model against an
> existing index silently retrieves the wrong passages — or none. The default is
> `gemini-embedding-001`; do not switch to a model without
> `outputDimensionality` support without also changing `embeddingDimensions`.
> `npm run miku:embed` confirms your key can reach the model you configured.

You now have a working assistant.

---

## Live data with tools

Static content belongs in the knowledge index. Anything that changes belongs in
a tool, because a tool reads the truth at answer time.

```ts
import { readTool, obj, str } from "@wpcodingpress/miku/tools"

export default defineMiku({
  // ...
  tools: [
    readTool({
      name: "list_products",
      description:
        "List the products on sale with their live prices. Use for " +
        "'what do you sell' or any pricing question.",
      parameters: obj({ category: str("Optional category filter") }, []),
      execute: async (args) => {
        const products = await db.product.findMany({
          where: { isActive: true },
          select: { name: true, price: true },
        })
        return { items: products }
      },
    }),
  ],
})
```

That is the whole pattern. MIKU handles the schema, the tool loop, the
streaming, and deciding when to call it.

### Tool kinds

| Helper | Use for | Shown to model when unavailable |
|---|---|---|
| `readTool` | Public info, catalogs, site search | Always |
| `accountTool` | The signed-in user's own records | Only when signed in |
| `actionTool` | Anything that changes state | Always, but requires a click |

`accountTool` is scoped for you: it will not appear in the tool list for
anonymous visitors, and each handler should still include the user id in its
query. Ownership belongs *in* the `where` clause, not in a check that runs
before it.

### Actions require consent

`actionTool` calls do not execute. MIKU emits a confirmation card, the visitor
sees exactly what is about to happen, and only their click runs the code. A
model that decides to act on its own cannot actually do anything.

This is enforced server-side at execution time, not just in the UI — the tool's
availability is re-checked after the visitor clicks.

---

## Configuration

Everything has a sensible default. You rarely need more than `brand`, `site`,
and a `tools` array.

```ts
export default defineMiku({
  brand: {
    name: "Acme Studio",          // required
    assistantName: "MIKU",        // default "MIKU"
    tagline: "Ask me anything",   // header subtitle
    accent: "#4f46e5",            // orb + send button
    accentAlt: "#9333ea",         // gradient stop
  },

  site: {
    baseUrl: "https://acme.com",  // required
    sitemaps: [],                 // extra sitemaps if you have no /sitemap.xml
    include: ["/**"],             // what to index
    exclude: ["/admin/**"],       // defaults to a sensible private-path list
    maxPages: 400,
    concurrency: 5,
    respectRobots: true,
  },

  llm: {
    order: ["gemini", "groq"],    // failover order
    model: "gemini-3.5-flash-lite", // chat model (pinned, non-preview)
    embeddingModel: "gemini-embedding-001", // defines every vector in miku_chunks
    temperature: 0.3,             // low: assistants should be consistent
    maxOutputTokens: 2000,
    historyTurns: 8,              // in-conversation context depth
    maxToolRounds: 4,
  },

  retrieval: {
    topK: 6,                      // passages given to the model
    minScore: 0.18,               // below this, MIKU says it doesn't know
    embeddingDimensions: 256,
    useVectors: true,
  },

  persona: {
    canDo: ["..."],
    cannotDo: ["..."],
    extraInstructions: [
      "Founded in 2021, so five years of experience.",
      "Prices are always in USD.",
    ],
    suggestions: ["What do you sell?", "How do I get started?"],
  },

  actions: {
    handoffEmail: "hello@acme.com",
    handoffWhatsApp: "https://wa.me/...",
    bookingUrl: "https://cal.com/acme",
  },

  security: {
    rateLimitPerMinute: 12,
    sanitiseCrawledText: true,    // strip injection attempts from pages
    maxToolCallsPerQuestion: 8,
  },

  // MIKU's own tables. Omit to use in-memory storage (fine for development).
  db: {
    dialect: "mysql",             // "mysql" | "postgres"
    query: (sql, params) => db.$queryRawUnsafe(sql, ...params),
    execute: (sql, params) => db.$executeRawUnsafe(sql, ...params),
  },
})
```

---

## Storage

MIKU creates four tables of its own and never touches your schema:

| Table | Purpose |
|---|---|
| `miku_documents` | One row per crawled page, with a content hash |
| `miku_chunks` | The retrievable passages, plus embeddings |
| `miku_actions` | Audit log of every consented action |
| `miku_feedback` | Visitor feedback |

This is deliberate. Installing MIKU cannot disturb your data, and removing it
means dropping four tables you can name.

Set `db` in your config to persist. Without it, MIKU runs in memory — useful in
development, useless in production.

Re-ingesting is cheap: pages whose content hash is unchanged are skipped, so you
can run `miku ingest` on every deploy.

### Retrieval

Hybrid, fused with reciprocal-rank fusion:

- **Keyword** — MySQL `FULLTEXT` (Postgres uses `ts_rank`). Excellent at exact
  terms, blind to paraphrase.
- **Vector** — in-database embeddings, scored by cosine similarity in-process.
  Excellent at paraphrase, blind to exact terms.

Neither is good alone. Fusing their *ranks* rather than their scores avoids
having to normalise two incomparable scales.

One caveat worth knowing: MySQL's InnoDB full-text index ignores tokens shorter
than three characters, so a query for "AI" or "WP" will not match on the keyword
leg. The vector leg covers this, which is why `useVectors` defaults to on.

---

## Customising the look

MIKU ships its own stylesheet and does not read your Tailwind config. Re-theme
it with CSS variables:

```css
.miku-root {
  --miku-accent: #0ea5e9;
  --miku-accent-alt: #22d3ee;
  --miku-radius-lg: 12px;
  --miku-panel-width: 420px;
}
```

Or pass props:

```tsx
<MikuWidget
  accent="#0ea5e9"
  accentAlt="#22d3ee"
  theme="auto"
  position="bottom-left"
/>
```

`theme="auto"` follows the OS setting. All motion respects
`prefers-reduced-motion`.

---

## Auth-scoped answers

If your site has accounts, resolve the visitor server-side and hand MIKU the
user. Never accept an identity from the browser.

```ts
export const POST = createMikuRoute({
  config,
  async resolveUser() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return null
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
    }
  },
})
```

Tools created with `accountTool` then appear only for signed-in visitors, and
their handlers receive a guaranteed user.

---

## Deploying

MIKU needs a Node.js runtime (not Edge) and a persistent database.

**Vercel / Render / Railway / Fly.io**

```bash
npm run build && npm start
```

Run ingestion after each deploy:

```bash
curl -X POST https://your-site.com/api/miku/ingest \
  -H "x-miku-secret: $MIKU_INGEST_SECRET"
```

Or use the included route with your own auth. On a read-only filesystem or an
ephemeral disk, ingestion must run as a separate job — the store is external
precisely so this works.

---

## CLI

```
miku ingest [--force] [--no-prune] [--quiet]   rebuild the index
miku stats                                     what is indexed
miku search <query>                            test retrieval, see scores
miku clear --yes                               drop everything
```

`miku search` is the tool for tuning `retrieval.minScore`. Run a few real
questions, look at the scores, and set the threshold where it belongs.

---

## Security

- **Prompt injection.** Crawled pages are untrusted input. Instruction-shaped
  sentences are stripped at ingest, and retrieved content is wrapped in an
  explicit data boundary in the prompt. Content cannot grant itself authority.
- **Tool authorisation** is re-checked server-side at execution. The model is
  never trusted for ownership checks.
- **Consent** for state-changing actions is enforced in the handler, not only
  in the UI. A replayed request without a confirmed action cannot execute one.
- **Secrets** are never sent to the model and never appear in observations.
- **Rate limiting** defaults to per-session in-process. If you run multiple
  instances, supply `rateLimit.allow` backed by Redis.

---

## Requirements

- Node.js 22.6 or newer (the CLI runs MIKU's TypeScript source directly)
- React 18+ (Next.js 14+ recommended)
- One LLM provider key (Gemini recommended; Groq works as failover)
- A database for persistence (optional in development)

## Licence

Proprietary. All rights reserved. Installing MIKU in your own project grants you
the right to use it there; it does not grant you the right to redistribute,
resell or sublicense it.