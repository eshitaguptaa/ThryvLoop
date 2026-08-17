/** Local calendar date key YYYY-MM-DD (matches user-visible "today"). */
export function localDateKey(d = new Date()) {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** YYYY-MM-DD in an IANA timezone (e.g. Asia/Kolkata). */
export function dateKeyInTimeZone(d = new Date(), timeZone = 'UTC') {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  } catch {
    return localDateKey(d);
  }
}

/** Shift a YYYY-MM-DD key by whole days (timezone-safe). */
export function addDaysToDateKey(dateKey, delta) {
  const [y, m, day] = String(dateKey)
    .split('-')
    .map((part) => Number(part));
  if (!y || !m || !day) return dateKey;
  const utc = new Date(Date.UTC(y, m - 1, day + Number(delta)));
  return utc.toISOString().slice(0, 10);
}

/** Local calendar day bounds (for matching user-visible "today"). */
export function localStartOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

export function localEndOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x.toISOString();
}
