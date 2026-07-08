/**
 * In-memory fixed-window rate limiter.
 *
 * Suitable for the current single-instance deployment (Linode + PM2 with one
 * process). If the app is ever scaled to multiple instances, replace this
 * with a shared store (e.g. Upstash Redis) behind the same interface.
 */

interface WindowEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, WindowEntry>();

/** Prevent unbounded memory growth by pruning expired windows periodically */
const MAX_STORE_SIZE = 10_000;

function prune(now: number) {
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the current window resets (for Retry-After) */
  retryAfterSeconds: number;
}

/**
 * Record a hit for `key` and report whether it is within `limit` requests
 * per `windowMs` window.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  if (store.size > MAX_STORE_SIZE) {
    prune(now);
  }

  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  entry.count += 1;

  if (entry.count > limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}
