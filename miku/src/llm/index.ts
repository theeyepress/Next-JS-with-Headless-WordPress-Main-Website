import type { MikuProviderId, ResolvedMikuConfig } from "../config/types"
import { createGeminiProvider } from "./gemini"
import { createGroqProvider } from "./groq"
import { ProviderError, type LlmChunk, type LlmProvider, type LlmStreamOptions } from "./types"

export * from "./types"
export {
  createGeminiProvider,
  embedWithGemini,
  getGeminiModel,
  isGeminiConfigured,
} from "./gemini"
export { createGroqProvider, getGroqModel, isGroqConfigured } from "./groq"

export function createProvider(
  id: MikuProviderId,
  config: ResolvedMikuConfig
): LlmProvider {
  return id === "gemini" ? createGeminiProvider(config) : createGroqProvider(config)
}

/** Any provider that can embed text, for the vector leg of hybrid retrieval. */
export function getEmbedder(config: ResolvedMikuConfig): LlmProvider | null {
  if (!config.retrieval.useVectors) return null
  for (const id of config.llm.order) {
    const provider = createProvider(id, config)
    if (provider.isConfigured() && provider.embed) return provider
  }
  return null
}

export interface StreamWithFallbackResult {
  chunks: AsyncGenerator<LlmChunk>
  /** Resolves to the provider that actually served the request. */
  providerUsed: Promise<MikuProviderId | null>
  /** Last error seen, for logging when every provider fails. */
  lastError: () => Error | null
}

/**
 * Retry budget for a provider that has produced nothing yet.
 *
 * Free-tier Gemini sits at 503 for seconds at a time and connections do get
 * dropped, so one failure is not evidence the provider is down. With a single
 * provider configured — the common case — no retry at all meant the visitor
 * simply got nothing. Three attempts with widening gaps, then fail over for
 * real: a visitor waiting on a chat bubble is not a batch job.
 */
const MAX_ATTEMPTS = 3
const RETRY_BACKOFF_MS = [700, 2000]

/**
 * Longest one attempt may go without delivering a chunk.
 *
 * Measured against MIKU's real payload (~5k tokens plus 14 tool declarations)
 * rather than a toy prompt: first byte landed anywhere from 11s to 17.6s under
 * load, so a tighter ceiling cut healthy requests. Google will also accept a
 * `streamGenerateContent` and then never answer at all, which without a
 * ceiling reads as the reply hanging forever — the same failure the vector leg
 * had. Reset by every chunk, so a long answer that keeps arriving is never cut.
 */
const PROVIDER_IDLE_MS = 30_000

/**
 * Total time one question may spend on providers across every retry.
 *
 * The stall ceiling alone still allowed three consecutive stalls to stack into
 * a minute and a half. Bounding the whole attempt loop keeps the worst case
 * honest while leaving fast failures (a 503 answers in ~2s) all three tries.
 */
const PROVIDER_BUDGET_MS = 60_000

interface AttemptGuard {
  /** Substitute for `opts.signal` — aborts on idle or when the caller aborts. */
  signal: AbortSignal
  /** Call on every received chunk to reset the idle clock. */
  touch(): void
  /** Drops the timer and listener. Always call from `finally`. */
  done(): void
}

function guardAttempt(external: AbortSignal | undefined, idleMs: number): AttemptGuard {
  const ctrl = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined
  const arm = () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => ctrl.abort(), idleMs)
  }
  const relay = () => ctrl.abort()
  arm()
  external?.addEventListener("abort", relay, { once: true })
  return {
    signal: ctrl.signal,
    touch: arm,
    done() {
      if (timer) clearTimeout(timer)
      external?.removeEventListener("abort", relay)
    },
  }
}

/** Sleeps, returning early if the request is aborted. */
function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve()
      return
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort)
      resolve()
    }, ms)
    // Hoisted, so the timeout above can name it before this point is reached.
    function onAbort() {
      clearTimeout(timer)
      resolve()
    }
    signal?.addEventListener("abort", onAbort, { once: true })
  })
}

/**
 * Runs the request against each configured provider in order, moving to the next
 * one only when the current provider cannot start (network error, non-2xx,
 * missing key). Once a provider has emitted text we stay on it — switching
 * mid-answer would duplicate content.
 */
export function streamWithFallback(
  config: ResolvedMikuConfig,
  opts: LlmStreamOptions
): StreamWithFallbackResult {
  let errorRef: Error | null = null
  let providerUsedResolve: (id: MikuProviderId) => void = () => {}
  const providerUsed = new Promise<MikuProviderId | null>((resolve) => {
    providerUsedResolve = resolve
  })

  const chunks = (async function* (): AsyncGenerator<LlmChunk> {
    const candidates = config.llm.order.filter((id) => createProvider(id, config).isConfigured())
    if (candidates.length === 0) {
      yield {
        type: "error",
        message:
          "No AI provider is configured. Set GEMINI_API_KEY (or GROQ_API_KEY) in your environment.",
      }
      return
    }

    const startedAt = Date.now()

    for (const id of candidates) {
      const provider = createProvider(id, config)

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        // Cap each attempt by whatever budget is left, so stacked stalls stop
        // at PROVIDER_BUDGET_MS rather than MAX_ATTEMPTS * PROVIDER_IDLE_MS.
        const remaining = PROVIDER_BUDGET_MS - (Date.now() - startedAt)
        if (remaining <= 0) break
        let emitted = false
        const guard = guardAttempt(opts.signal, Math.min(PROVIDER_IDLE_MS, remaining))
        try {
          for await (const chunk of provider.streamChat({ ...opts, signal: guard.signal })) {
            guard.touch()
            if (chunk.type === "error") {
              errorRef = new ProviderError(chunk.message, chunk.retryable ?? false)
              // An error before any content means this provider is unusable.
              if (!emitted) throw errorRef
              yield chunk
              continue
            }
            if (chunk.type === "text" && chunk.text) emitted = true
            if (chunk.type === "tool_call") emitted = true
            providerUsedResolve(id)
            yield chunk
          }
          return
        } catch (err) {
          errorRef = err instanceof Error ? err : new Error(String(err))
          if (emitted) {
            yield { type: "error", message: errorRef.message }
            return
          }

          // Nothing was sent, so the turn can be retried or the next provider
          // tried from scratch — but only for a failure that could clear up.
          const retryable = !(errorRef instanceof ProviderError) || errorRef.retryable
          const backoff = RETRY_BACKOFF_MS[attempt]
          if (!retryable || backoff === undefined || opts.signal?.aborted) break
          await wait(backoff, opts.signal)
        } finally {
          // Releasing this matters on success too: a live timer would abort the
          // signal the caller may still be holding.
          guard.done()
        }
      }
    }

    yield {
      type: "error",
      message: errorRef?.message ?? "All AI providers failed to respond.",
    }
  })()

  return { chunks, providerUsed, lastError: () => errorRef }
}