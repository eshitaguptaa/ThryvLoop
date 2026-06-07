/**
 * User-friendly message for Gemini API failures.
 * @param {unknown} err
 */
export function formatGeminiError(err) {
  const raw = err instanceof Error ? err.message : String(err);

  if (raw.includes('429') || raw.includes('quota') || raw.includes('Quota exceeded')) {
    const retryMatch = raw.match(/retry in (\d+)/i);
    const retrySec = retryMatch ? Math.ceil(Number(retryMatch[1])) : null;
    const modelHint = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    let msg =
      'ThryvBot hit the Gemini API rate limit. Wait a minute and try again, or set GEMINI_MODEL in .env.local to another model (e.g. gemini-2.5-flash, gemini-1.5-flash).';
    if (retrySec) msg += ` Suggested retry in ~${retrySec}s.`;
    if (raw.includes('limit: 0')) {
      msg =
        `The model "${modelHint}" has no free-tier quota on this API key. Add GEMINI_MODEL=gemini-2.5-flash or gemini-1.5-flash to .env.local, enable billing in Google AI Studio, or create a new API key.`;
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
