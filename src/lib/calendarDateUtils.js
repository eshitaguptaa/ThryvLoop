/**
 * Parse an instant from ISO strings (API, Supabase, toISOString).
 * @param {unknown} value
 */
export function parseInstant(value) {
  if (value instanceof Date) return new Date(value.getTime());
  if (typeof value !== 'string' || !value.trim()) return new Date(NaN);
  return new Date(value.trim());
}

/**
 * Parse calendar datetimes in the user's local timezone.
 * Only bare datetime-local values (YYYY-MM-DDTHH:mm) use local parsing.
 * ISO strings with seconds or timezone (Z / +00:00) must stay as instants.
 * @param {unknown} value
 */
export function parseCalendarDateTime(value) {
  if (value instanceof Date) return new Date(value.getTime());
  if (typeof value !== 'string' || !value.trim()) return new Date(NaN);

  const trimmed = value.trim();

  // Exactly what <input type="datetime-local" /> produces — no seconds, no TZ
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
    const [datePart, timePart] = trimmed.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    return new Date(year, month - 1, day, hour, minute, 0, 0);
  }

  return parseInstant(trimmed);
}

/** Normalize DB/API timestamps to ISO UTC for the client. @param {unknown} value */
export function toIsoUtcString(value) {
  const d = parseInstant(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toISOString();
}

/** @param {Date | string | number} date */
export function toDatetimeLocalValue(date) {
  const d = parseInstant(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** @param {Date} d */
export function startOfLocalDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** @param {Date | string} a @param {Date | string} b */
export function isSameLocalDay(a, b) {
  const da = startOfLocalDay(parseInstant(a));
  const db = startOfLocalDay(parseInstant(b));
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

/** @param {Date | string} iso */
export function localDayKey(iso) {
  return startOfLocalDay(parseInstant(iso)).toDateString();
}

/** @param {Date | string} iso */
export function localMinutesFromMidnight(iso) {
  const d = parseInstant(iso);
  return d.getHours() * 60 + d.getMinutes();
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** @param {{ startsAt: string, endsAt: string }} ev @param {Date} day local calendar day */
export function eventOverlapsLocalDay(ev, day) {
  const dayStart = startOfLocalDay(day).getTime();
  const dayEnd = dayStart + MS_PER_DAY;
  const start = parseInstant(ev.startsAt).getTime();
  const end = parseInstant(ev.endsAt).getTime();
  return end > dayStart && start < dayEnd;
}

/**
 * Visible portion of an event on a calendar day, in minutes from local midnight.
 * @param {{ startsAt: string, endsAt: string }} ev
 * @param {Date} day
 * @param {{ hourStart?: number, hourCount?: number }} [grid]
 * @returns {{ clampStart: number, clampEnd: number } | null}
 */
export function getEventDaySegmentMinutes(ev, day, grid = {}) {
  const hourStart = grid.hourStart ?? 0;
  const hourCount = grid.hourCount ?? 24;
  const dayStart = startOfLocalDay(day).getTime();
  const dayEnd = dayStart + MS_PER_DAY;
  const eventStart = parseInstant(ev.startsAt).getTime();
  const eventEnd = parseInstant(ev.endsAt).getTime();
  const segStart = Math.max(eventStart, dayStart);
  const segEnd = Math.min(eventEnd, dayEnd);
  if (segEnd <= segStart) return null;

  const startMin = (segStart - dayStart) / 60_000;
  const endMin = (segEnd - dayStart) / 60_000;
  const clampStart = Math.max(startMin, hourStart * 60);
  const clampEnd = Math.min(endMin, hourCount * 60);
  if (clampEnd <= clampStart) return null;
  return { clampStart, clampEnd };
}
