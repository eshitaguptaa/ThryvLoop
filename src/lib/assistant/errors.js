import { GeminiRateLimitError } from '@/lib/assistant/geminiRateLimit';

/**
 * User-friendly message for Gemini API failures.
 * @param {unknown} err
 */
export function formatGeminiError(err) {
  if (err instanceof GeminiRateLimitError) {
    return {
      message: err.message,
      status: 429,
      retryAfterSec: err.retryAfterSec,
      limit: err.limit,
    };
  }

  const raw = err instanceof Error ? err.message : String(err);

  if (raw.includes('429') || raw.includes('quota') || raw.includes('Quota exceeded')) {
    const retryMatch = raw.match(/retry in (\d+)/i);
    const retrySec = retryMatch ? Math.ceil(Number(retryMatch[1])) : null;
    let msg =
      'AI limit reached. Upgrade to Pro for higher limits, or wait a minute and try again.';
    if (retrySec) msg += ` Suggested retry in ~${retrySec}s.`;
    if (raw.includes('limit: 0')) {
      msg =
        'AI is temporarily unavailable on the free tier. Upgrade to Pro, or try again later.';
    }
    return { message: msg, status: 429 };
  }

  if (raw.includes('API key not valid') || raw.includes('API_KEY_INVALID')) {
    return { message: 'Invalid GEMINI_API_KEY. Check your key in .env.local.', status: 503 };
  }

  if (raw.includes('GEMINI_API_KEY')) {
    return { message: raw, status: 503 };
  }

  if (raw.includes('404') && raw.includes('model')) {
    return {
      message: `Gemini model not found. Set GEMINI_MODEL in .env.local (current: ${process.env.GEMINI_MODEL || 'gemini-2.5-flash'}).`,
      status: 503,
    };
  }

  return { message: raw || 'Chat failed', status: 500 };
}
