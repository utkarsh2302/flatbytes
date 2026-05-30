// In-memory sliding window rate limiter, per-IP.
// Works on a single Vercel instance. For multi-instance, swap to Upstash Redis.

import { type NextRequest } from 'next/server'

interface Window {
  count: number
  resetAt: number
}

const store = new Map<string, Window>()

let lastCleanup = Date.now()
function maybeCleanup() {
  if (Date.now() - lastCleanup < 5 * 60_000) return
  lastCleanup = Date.now()
  store.forEach((win, key) => {
    if (Date.now() > win.resetAt) store.delete(key)
  })
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
  resetAt: number
}

export function rateLimit(
  req: NextRequest,
  opts: { max: number; windowMs: number; keyFn?: (r: NextRequest) => string }
): RateLimitResult {
  maybeCleanup()
  const key = opts.keyFn
    ? opts.keyFn(req)
    : (req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown')

  const now = Date.now()
  let win = store.get(key)
  if (!win || now > win.resetAt) {
    win = { count: 0, resetAt: now + opts.windowMs }
    store.set(key, win)
  }
  win.count++
  return {
    ok: win.count <= opts.max,
    remaining: Math.max(0, opts.max - win.count),
    resetAt: win.resetAt,
  }
}

export const limits = {
  /** 60 req/min per IP — general public API */
  public: (req: NextRequest) => rateLimit(req, { max: 60, windowMs: 60_000 }),
  /** 10 req/min per IP — auth/login */
  auth: (req: NextRequest) => rateLimit(req, { max: 10, windowMs: 60_000 }),
  /** 120 req/min per IP — admin */
  admin: (req: NextRequest) => rateLimit(req, { max: 120, windowMs: 60_000 }),
  /** 20 req/min per IP — heavy ops (AI, face check) */
  heavy: (req: NextRequest) => rateLimit(req, { max: 20, windowMs: 60_000 }),
}
