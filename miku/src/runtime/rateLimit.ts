const store = new Map<string, { count: number; resetAt: number }>()

const CLEANUP_INTERVAL = 60_000
let lastCleanup = Date.now()

function cleanup(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}

/**
 * Fixed-window limiter, kept in process memory.
 *
 * Adequate for a single instance, which is what self-hosting usually means. A
 * host running more than one instance should pass `rateLimit.allow` in
 * miku.config.ts and back it with Redis or their database — the default is a
 * convenience, not a distributed guarantee.
 */
export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  cleanup(now)
  const existing = store.get(key)
  if (!existing || now > existing.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (existing.count >= maxRequests) return false
  existing.count++
  return true
}

export function resetRateLimit(): void {
  store.clear()
}