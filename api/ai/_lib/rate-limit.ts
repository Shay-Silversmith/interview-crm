// ---------------------------------------------------------------------------
// InterviewFlow — api/ai/_lib/rate-limit.ts
// Simple in-memory sliding-window rate limiter.
// Scope: per-IP, 10 requests / 60 seconds.
// Good enough for personal use; replace with Upstash Redis before friend beta.
// Note: resets on cold-start — acceptable for Vercel serverless.
// ---------------------------------------------------------------------------

const WINDOW_MS  = 60_000   // 1 minute
const MAX_PER_IP = 10

/** Map from IP → array of request timestamps within the current window */
const buckets = new Map<string, number[]>()

/** Prune expired timestamps every minute to prevent unbounded memory growth */
setInterval(() => {
  const now = Date.now()
  for (const [ip, stamps] of buckets) {
    const fresh = stamps.filter(t => now - t < WINDOW_MS)
    if (fresh.length === 0) buckets.delete(ip)
    else buckets.set(ip, fresh)
  }
}, WINDOW_MS)

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface RateLimitResult {
  allowed:   boolean
  remaining: number
  resetInMs: number
}

export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now()
  const stamps = (buckets.get(ip) ?? []).filter(t => now - t < WINDOW_MS)

  if (stamps.length >= MAX_PER_IP) {
    const oldest   = Math.min(...stamps)
    const resetInMs = WINDOW_MS - (now - oldest)
    return { allowed: false, remaining: 0, resetInMs }
  }

  stamps.push(now)
  buckets.set(ip, stamps)
  return { allowed: true, remaining: MAX_PER_IP - stamps.length, resetInMs: 0 }
}

/** Extract the best IP from Vercel's request headers */
export function getIP(headers: Record<string, string | string[] | undefined>): string {
  const fwd = headers['x-forwarded-for']
  if (typeof fwd === 'string') return fwd.split(',')[0].trim()
  if (Array.isArray(fwd))     return fwd[0].trim()
  return '127.0.0.1'
}
