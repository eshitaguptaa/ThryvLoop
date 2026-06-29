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

/**
 * Browser IANA timezone (e.g. America/Chicago). Safe on server — returns UTC.
 */
export function resolveLocalTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Format an instant as wall-clock time in an IANA zone for Google Calendar API.
 * Google expects dateTime without offset when timeZone is set.
 * @param {Date} date
 * @param {string} timeZone
 */
export function formatGoogleCalendarDateTime(date, timeZone) {
  const d = date instanceof Date ? date : parseInstant(date);
  if (Number.isNaN(d.getTime())) {
    throw new Error('Invalid date');
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(d);

  const pick = (type) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${pick('year')}-${pick('month')}-${pick('day')}T${pick('hour')}:${pick('minute')}:${pick('second')}`;
}

const DATETIME_LOCAL_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const DATETIME_LOCAL_SECONDS_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;

/**
 * Convert a datetime-local value (YYYY-MM-DDTHH:mm) to Google Calendar dateTime (with seconds).
 * @param {unknown} value
 */
export function toGoogleCalendarLocalDateTime(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (DATETIME_LOCAL_RE.test(trimmed)) return `${trimmed}:00`;
  if (DATETIME_LOCAL_SECONDS_RE.test(trimmed)) return trimmed;
  return null;
}

/**
 * RFC3339 offset for an instant in an IANA zone (e.g. +05:30).
 * @param {Date} instant
 * @param {string} timeZone
 */
export function formatTimezoneOffset(instant, timeZone) {
  const d = instant instanceof Date ? instant : parseInstant(instant);
  if (Number.isNaN(d.getTime())) return 'Z';

  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'longOffset',
    }).formatToParts(d);
    const raw = parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
    const match = raw.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/i);
    if (!match) return 'Z';
    const sign = match[1];
    const hours = match[2].padStart(2, '0');
    const mins = (match[3] ?? '00').padStart(2, '0');
    return `${sign}${hours}:${mins}`;
  } catch {
    return 'Z';
  }
}

/**
 * Google Calendar dateTime with embedded offset — unambiguous absolute instant.
 * @param {Date} instant
 * @param {string} timeZone
 * @param {unknown} [localValue]
 */
export function toGoogleCalendarEventDateTime(instant, timeZone, localValue) {
  const d = instant instanceof Date ? instant : parseInstant(instant);
  if (Number.isNaN(d.getTime())) {
    throw new Error('Invalid date');
  }

  const tz = timeZone?.trim() || 'UTC';
  const local =
    toGoogleCalendarLocalDateTime(localValue) ?? formatGoogleCalendarDateTime(d, tz);
  const offset = formatTimezoneOffset(d, tz);
  return { dateTime: `${local}${offset}` };
}

/** @param {Date | string | number} date */
export function toDatetimeLocalValue(date) {
  const d = parseInstant(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** @param {unknown} value */
export function toDateInputValue(value) {
  const d = parseCalendarDateTime(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Merge a date input value (YYYY-MM-DD) with hour/minute from an existing datetime-local.
 * @param {string} dateValue
 * @param {unknown} existing
 */
export function mergeDateIntoDatetimeLocal(dateValue, existing) {
  const base = parseCalendarDateTime(existing);
  const [year, month, day] = dateValue.split('-').map(Number);
  if (!year || !month || !day) return toDatetimeLocalValue(base);
  const next = new Date(base);
  next.setFullYear(year, month - 1, day);
  return toDatetimeLocalValue(next);
}

/**
 * Merge hour/minute into an existing datetime-local value.
 * @param {unknown} existing
 * @param {number} hour 0–23
 * @param {number} minute 0–59
 */
export function mergeTimeIntoDatetimeLocal(existing, hour, minute) {
  const base = parseCalendarDateTime(existing);
  const next = new Date(base);
  next.setHours(hour, minute, 0, 0);
  return toDatetimeLocalValue(next);
}

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/** Calendar cells for a month view. @param {number} year @param {number} month 0–11 */
export function getCalendarMonthCells(year, month) {
  const first = new Date(year, month, 1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  for (let i = 0; i < startOffset; i += 1) {
    cells.push({ type: 'padding', key: `pad-start-${i}` });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ type: 'day', key: `${year}-${month}-${day}`, year, month, day });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ type: 'padding', key: `pad-end-${cells.length}` });
  }

  return { weekdayLabels: WEEKDAY_LABELS, cells };
}

/** @param {Date} d */
export function startOfLocalDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Round up to the next wall-clock interval. @param {Date} date @param {number} intervalMinutes */
export function roundUpToInterval(date, intervalMinutes = 30) {
  const d = date instanceof Date ? new Date(date.getTime()) : parseInstant(date);
  const ms = intervalMinutes * 60 * 1000;
  return new Date(Math.ceil(d.getTime() / ms) * ms);
}

/**
 * Default create-event slot for a calendar day: uses that day's date with the current
 * clock time (rounded up to 30 min). When the day is today, uses the present time.
 * @param {Date} day local calendar day
 * @param {number} [durationMinutes]
 */
export function defaultRangeForCalendarDay(day, durationMinutes = 60) {
  const base = startOfLocalDay(day);
  const now = new Date();
  let start;

  if (isSameLocalDay(day, now)) {
    start = roundUpToInterval(now, 30);
    if (!isSameLocalDay(start, day)) {
      start = new Date(base);
      start.setHours(23, 0, 0, 0);
    }
  } else {
    const rounded = roundUpToInterval(now, 30);
    start = new Date(base);
    start.setHours(rounded.getHours(), rounded.getMinutes(), 0, 0);
  }

  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  return { start, end };
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
