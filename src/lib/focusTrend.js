import { addDaysToDateKey, dateKeyInTimeZone, localDateKey } from '@/lib/dateRanges';

export const FOCUS_TREND_DAYS = 14;
export const FOCUS_TREND_WEEK_DAYS = 7;
export const WEEKDAY_LABELS_MON = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const IANA_TZ_RE = /^[A-Za-z0-9_+\-/]{1,64}$/;

export function sanitizeTimeZone(timeZone) {
  const raw = typeof timeZone === 'string' ? timeZone.trim() : '';
  if (raw && IANA_TZ_RE.test(raw)) return raw;
  return 'UTC';
}

/** Weekday label for a YYYY-MM-DD calendar date (independent of clock timezone). */
export function weekdayLabelFromKey(dateKey) {
  const [y, m, day] = String(dateKey)
    .split('-')
    .map((part) => Number(part));
  if (!y || !m || !day) return '';
  const utcDay = new Date(Date.UTC(y, m - 1, day)).getUTCDay();
  return WEEKDAY_LABELS_MON[utcDay === 0 ? 6 : utcDay - 1];
}

/**
 * Inclusive local-day window: last 14 days ending today, plus exclusive end bound.
 * Call from the browser so midnight matches the user's calendar.
 */
export function getFocusTrendRange(now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (FOCUS_TREND_DAYS - 1));
  const end = new Date(now);
  end.setHours(0, 0, 0, 0);
  end.setDate(end.getDate() + 1);
  const todayKey = localDateKey(now);
  const keys = Array.from({ length: FOCUS_TREND_DAYS }, (_, i) =>
    addDaysToDateKey(todayKey, i - (FOCUS_TREND_DAYS - 1))
  );
  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    todayKey,
    keys,
  };
}

/**
 * @param {string[]} keys
 * @param {Record<string, number>} secondsByDay
 */
export function buildFocusTrendDays(keys, secondsByDay = {}) {
  return keys.map((key) => {
    const seconds = Math.max(0, Math.floor(Number(secondsByDay[key]) || 0));
    return {
      key,
      label: weekdayLabelFromKey(key),
      seconds,
      minutes: Math.round(seconds / 60),
    };
  });
}

/**
 * Overlay live Active seconds onto today's bucket without double-counting
 * already-flushed rows (use max of DB vs live timer).
 * @param {Array<{ key: string, seconds: number, minutes?: number, label: string }>} days
 * @param {string} todayKey
 * @param {number} liveTodaySeconds
 */
export function overlayLiveTodaySeconds(days, todayKey, liveTodaySeconds) {
  const live = Math.max(0, Math.floor(Number(liveTodaySeconds) || 0));
  return (days || []).map((day) => {
    const logged = Math.max(0, Number(day.seconds) || 0);
    const seconds = day.key === todayKey ? Math.max(logged, live) : logged;
    return {
      ...day,
      seconds,
      minutes: Math.round(seconds / 60),
    };
  });
}

export function sumDaySeconds(days) {
  return (days || []).reduce((sum, day) => sum + (Math.max(0, Number(day.seconds) || 0)), 0);
}

export function splitFocusTrendWeeks(days) {
  const prior = days.slice(0, FOCUS_TREND_WEEK_DAYS);
  const current = days.slice(FOCUS_TREND_WEEK_DAYS);
  return { prior, current };
}

export function todayKeyInTimeZone(timeZone, now = new Date()) {
  return dateKeyInTimeZone(now, sanitizeTimeZone(timeZone));
}
