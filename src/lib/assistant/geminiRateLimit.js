import { checkRateLimit } from '@/lib/security/rateLimit';

export class GeminiRateLimitError extends Error {
  /** @param {string} message */
  constructor(message, retryAfterSec = 60) {
    super(message);
    this.name = 'GeminiRateLimitError';
    this.status = 429;
    this.retryAfterSec = retryAfterSec;
  }
}

function parsePositiveInt(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getRequestsPerMinute() {
  return parsePositiveInt(process.env.GEMINI_REQUESTS_PER_MINUTE, 10);
}

function getRequestsPerDay() {
  return parsePositiveInt(process.env.GEMINI_REQUESTS_PER_DAY, 50);
}

function getApiCallsPerMinute() {
  return parsePositiveInt(process.env.GEMINI_API_CALLS_PER_MINUTE, 25);
}

/**
 * Per-user limits for each assistant HTTP request (chat, analytics insight).
 * @param {string} userId
 */
export function assertGeminiRequestAllowed(userId) {
  if (!userId) return;

  const perMinute = checkRateLimit(`gemini:req:minute:${userId}`, {
    limit: getRequestsPerMinute(),
    windowMs: 60_000,
  });

  if (!perMinute.allowed) {
    throw new GeminiRateLimitError(
      'Too many AI requests. Please wait a moment and try again.',
      perMinute.retryAfterSec
    );
  }

  const perDay = checkRateLimit(`gemini:req:day:${userId}`, {
    limit: getRequestsPerDay(),
    windowMs: 24 * 60 * 60 * 1000,
  });

  if (!perDay.allowed) {
    throw new GeminiRateLimitError(
      'Daily AI limit reached. Try again tomorrow.',
      perDay.retryAfterSec
    );
  }
}

/**
 * Burst limit for individual Gemini API calls (tool loops can issue several per request).
 * @param {string} userId
 */
export function assertGeminiApiAllowed(userId) {
  if (!userId) return;

  const perMinute = checkRateLimit(`gemini:api:minute:${userId}`, {
    limit: getApiCallsPerMinute(),
    windowMs: 60_000,
  });

  if (!perMinute.allowed) {
    throw new GeminiRateLimitError(
      'AI is busy right now. Please wait a moment and try again.',
      perMinute.retryAfterSec
    );
  }
}

/**
 * @param {string} userId
 * @returns {Response | null}
 */
export function geminiRateLimitResponse(userId) {
  try {
    assertGeminiRequestAllowed(userId);
    return null;
  } catch (err) {
    if (err instanceof GeminiRateLimitError) {
      return Response.json(
        { error: err.message },
        {
          status: 429,
          headers: { 'Retry-After': String(err.retryAfterSec) },
        }
      );
    }
    throw err;
  }
}
