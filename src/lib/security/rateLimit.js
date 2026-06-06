/** @type {Map<string, { count: number, resetAt: number }>} */
const buckets = new Map();

/**
 * Simple in-memory per-key rate limiter for API routes.
 * @param {string} key
 * @param {{ limit?: number, windowMs?: number }} [options]
 */
export function checkRateLimit(key, { limit = 10, windowMs = 60_000 } = {}) {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;

  if (bucket.count > limit) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  return { allowed: true, retryAfterSec: 0 };
}

/**
 * @param {string} userId
 * @param {string} action
 * @param {{ limit?: number, windowMs?: number }} [options]
 */
export function checkUserRateLimit(userId, action, options) {
  return checkRateLimit(`${action}:${userId}`, options);
}

/**
 * @param {string} userId
 * @param {string} action
 * @param {{ limit?: number, windowMs?: number }} [options]
 * @returns {Response | null}
 */
export function rateLimitResponse(userId, action, options) {
  const result = checkUserRateLimit(userId, action, options);
  if (result.allowed) return null;

  return Response.json(
    { error: 'Too many requests. Please wait and try again.' },
    {
      status: 429,
      headers: { 'Retry-After': String(result.retryAfterSec) },
    }
  );
}
