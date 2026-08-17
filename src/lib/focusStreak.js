import { addDaysToDateKey, localDateKey } from './dateRanges.js';
import { resolveStreakRank, STREAK_RANKS } from './analysis/buildPersonalAnalysisReportPayload.js';

/** localStorage suffix — last YYYY-MM-DD the daily +1 modal was shown. */
export const FOCUS_STREAK_CELEBRATED_KEY = 'focus-streak-celebrated-day';

export const FOCUS_STREAK_LOOKBACK_DAYS = 120;

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAY_SUN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_SUN_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/**
 * First Focusing start of a local day — not login, not idle resume.
 * @param {{
 *   source?: string,
 *   totalsReady?: boolean,
 *   todayLoggedSeconds?: number,
 *   celebratedDateKey?: string | null,
 *   todayKey?: string,
 * }} args
 */
export function shouldCelebrateFocusStreak({
  source = 'user',
  totalsReady = false,
  todayLoggedSeconds = 0,
  celebratedDateKey = null,
  todayKey = '',
} = {}) {
  if (source !== 'user') return false;
  if (!totalsReady) return false;
  if (!todayKey) return false;
  if (celebratedDateKey === todayKey) return false;
  if (Math.max(0, Number(todayLoggedSeconds) || 0) > 0) return false;
  return true;
}

/**
 * @param {string} dateKey YYYY-MM-DD
 * @returns {number} 0 = Sunday … 6 = Saturday (UTC calendar, timezone-safe)
 */
export function sundayIndexFromDateKey(dateKey) {
  const [y, m, d] = String(dateKey)
    .split('-')
    .map((part) => Number(part));
  if (!y || !m || !d) return 0;
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/**
 * Consecutive days after locking today (the +1 the modal celebrates).
 * @param {Record<string, number>} secondsByDay
 * @param {string} todayKey
 */
export function computeLockedFocusStreak(secondsByDay, todayKey) {
  const map = secondsByDay || {};
  let streak = 1;
  for (let i = 1; i < FOCUS_STREAK_LOOKBACK_DAYS; i += 1) {
    const key = addDaysToDateKey(todayKey, -i);
    if ((map[key] || 0) > 0) streak += 1;
    else break;
  }
  return streak;
}

/**
 * @param {Array<{ completed_at?: string, duration_seconds?: number }>} sessions
 * @returns {Record<string, number>}
 */
export function secondsByDayFromSessions(sessions) {
  /** @type {Record<string, number>} */
  const map = {};
  for (const row of sessions || []) {
    if (!row?.completed_at) continue;
    const secs = Math.max(0, Number(row.duration_seconds) || 0);
    if (secs <= 0) continue;
    const key = localDateKey(new Date(/** @type {string} */ (row.completed_at)));
    map[key] = (map[key] || 0) + secs;
  }
  return map;
}

/**
 * @param {{ todayKey: string, yesterdaySeconds?: number }} args
 * @returns {Record<string, number>}
 */
export function fallbackSecondsByDay({ todayKey, yesterdaySeconds = 0 }) {
  /** @type {Record<string, number>} */
  const map = {};
  if ((Number(yesterdaySeconds) || 0) > 0) {
    map[addDaysToDateKey(todayKey, -1)] = Math.max(0, Number(yesterdaySeconds) || 0);
  }
  return map;
}

/**
 * @param {string} todayKey
 * @param {Record<string, number>} secondsByDay today already treated as lit
 */
export function buildMonthCalendar(todayKey, secondsByDay = {}) {
  const [y, m] = String(todayKey)
    .split('-')
    .map((part) => Number(part));
  const year = y || 1970;
  const month = m || 1;
  const firstKey = `${year}-${String(month).padStart(2, '0')}-01`;
  const lead = sundayIndexFromDateKey(firstKey);
  const dim = new Date(Date.UTC(year, month, 0)).getUTCDate();
  /** @type {Array<{ key: string, day: number | null, inMonth: boolean, isToday: boolean, lit: boolean, isFuture: boolean }>} */
  const cells = [];

  for (let i = 0; i < lead; i += 1) {
    cells.push({
      key: `lead-${i}`,
      day: null,
      inMonth: false,
      isToday: false,
      lit: false,
      isFuture: false,
    });
  }

  for (let day = 1; day <= dim; day += 1) {
    const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday = key === todayKey;
    const isFuture = key > todayKey;
    const lit = !isFuture && (isToday || (secondsByDay[key] || 0) > 0);
    cells.push({ key, day, inMonth: true, isToday, lit, isFuture });
  }

  while (cells.length % 7 !== 0) {
    cells.push({
      key: `trail-${cells.length}`,
      day: null,
      inMonth: false,
      isToday: false,
      lit: false,
      isFuture: false,
    });
  }

  return {
    year,
    month,
    label: `${MONTH_NAMES[month - 1] || ''} ${year}`.trim(),
    weekdayLabels: WEEKDAY_SUN_SHORT,
    cells,
  };
}

/**
 * Last 7 local days ending today.
 * @param {string} todayKey
 * @param {Record<string, number>} secondsByDay
 */
export function buildWeekStrip(todayKey, secondsByDay = {}) {
  return Array.from({ length: 7 }, (_, i) => {
    const key = addDaysToDateKey(todayKey, i - 6);
    const isToday = key === todayKey;
    const weekday = WEEKDAY_SUN[sundayIndexFromDateKey(key)] || '';
    return {
      key,
      label: weekday.slice(0, 2),
      weekday,
      isToday,
      lit: isToday || (secondsByDay[key] || 0) > 0,
    };
  });
}

/**
 * @param {number} streak
 * @param {{ title?: string, min?: number, next?: number | null, remaining?: number }} rank
 */
export function streakCelebrateCopy(streak, rank = {}) {
  const n = Math.max(1, Math.floor(Number(streak) || 1));
  const title = rank.title && rank.title !== 'Unlit' ? rank.title : null;
  const rankedUp = Boolean(title && rank.min === n && n > 1);

  if (n === 1) {
    return {
      eyebrow: 'Daily streak',
      headline: 'Spark lit',
      sub: 'You showed up. Tomorrow is what makes it a streak.',
      cta: 'Keep focusing',
    };
  }
  if (rankedUp) {
    return {
      eyebrow: 'Rank up',
      headline: `${title}`,
      sub: `${title} hits different when you earned it today.`,
      cta: 'Keep focusing',
    };
  }
  if (n === 2) {
    return {
      eyebrow: 'Daily streak',
      headline: 'days in a row',
      sub: 'Day two is the real start. Most people never get here.',
      cta: 'Keep focusing',
    };
  }
  if (n < 7) {
    return {
      eyebrow: 'Daily streak',
      headline: 'days in a row',
      sub: "This isn't luck anymore. It's a rhythm.",
      cta: 'Keep focusing',
    };
  }
  return {
    eyebrow: 'Daily streak',
    headline: 'days in a row',
    sub: "Don't break what you've already proven.",
    cta: 'Keep focusing',
  };
}

/**
 * @param {number | null | undefined} min
 */
export function streakRankTitleAt(min) {
  const n = Number(min);
  if (!Number.isFinite(n)) return null;
  const row = STREAK_RANKS.find((r) => r.min === n);
  return row && row.title !== 'Unlit' ? row.title : null;
}

/** Visual identity for each earned rank (skips Unlit). */
export const STREAK_RANK_PRESENTATION = {
  Spark: {
    blurb: 'A first flicker. Fragile — and real.',
    hex: '#f5c542',
    from: '#fde68a',
    to: '#d97706',
    motion: 'twinkle',
  },
  Ember: {
    blurb: 'Heat that holds through the night.',
    hex: '#fb923c',
    from: '#fdba74',
    to: '#c2410c',
    motion: 'glow',
  },
  'Week flame': {
    blurb: 'Seven days. The fire has a name now.',
    hex: '#f97316',
    from: '#fb923c',
    to: '#9a3412',
    motion: 'flicker',
  },
  'On fire': {
    blurb: 'Two weeks of showing up. Unignorable.',
    hex: '#ef4444',
    from: '#fb7185',
    to: '#b91c1c',
    motion: 'pulse',
  },
  'Deep burn': {
    blurb: 'Three weeks in. The heat lives in the bone.',
    hex: '#e11d48',
    from: '#fb7185',
    to: '#7f1d1d',
    motion: 'shimmer',
  },
  Inferno: {
    blurb: 'A month of fire. Everything around it warms.',
    hex: '#f43f5e',
    from: '#fb7185',
    to: '#9f1239',
    motion: 'roar',
  },
  Legend: {
    blurb: 'Fifty days. People start telling the story.',
    hex: '#eab308',
    from: '#fde047',
    to: '#a16207',
    motion: 'shine',
  },
  Mythic: {
    blurb: 'A hundred days. The flame outlives the calendar.',
    hex: '#a78bfa',
    from: '#ddd6fe',
    to: '#6d28d9',
    motion: 'orbit',
  },
};

/**
 * Inline styles for a rank name pill. Unlit / unknown → null (use a muted default).
 * @param {string | null | undefined} title
 * @param {{ onDark?: boolean }} [opts]
 */
export function streakRankPillStyle(title, opts = {}) {
  const look = title && title !== 'Unlit' ? STREAK_RANK_PRESENTATION[title] : null;
  if (!look) return null;
  if (opts.onDark) {
    return {
      backgroundColor: `${look.hex}28`,
      color: look.from,
      borderColor: `${look.hex}70`,
    };
  }
  return {
    backgroundColor: `${look.hex}24`,
    color: look.to,
    borderColor: `${look.hex}66`,
  };
}

/**
 * @param {string} hex
 * @param {number} alpha
 */
export function hexToRgba(hex, alpha) {
  const raw = String(hex || '').replace('#', '');
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
  const n = Number.parseInt(full, 16);
  if (!Number.isFinite(n)) return `rgba(245,158,11,${alpha})`;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Accent tokens for the celebration modal and Analytics streak card.
 * Chrome stays “streak”; flame / glow / progress pick up the rank.
 * @param {string | null | undefined} title
 * @param {{ rankedUp?: boolean }} [opts]
 */
export function streakRankTheme(title, opts = {}) {
  const key = title && STREAK_RANK_PRESENTATION[title] ? title : null;
  const look = key ? STREAK_RANK_PRESENTATION[key] : STREAK_RANK_PRESENTATION.Spark;
  const lit = Boolean(key);
  const quiet = !key || key === 'Spark';
  const rich = key === 'Legend' || key === 'Mythic';
  const rankedUp = Boolean(opts.rankedUp);
  const glowA = rankedUp ? 0.46 : !lit ? 0.1 : quiet ? 0.2 : rich ? 0.38 : 0.26;
  const lightCta = key === 'On fire' || key === 'Deep burn' || key === 'Inferno' || key === 'Mythic';
  return {
    title: key,
    hex: look.hex,
    from: look.from,
    to: look.to,
    motion: look.motion,
    lit,
    quiet,
    rich,
    well: `linear-gradient(160deg, ${look.from}, ${look.to})`,
    progress: `linear-gradient(90deg, ${look.from}, ${look.hex} 55%, ${look.to})`,
    cta: `linear-gradient(180deg, ${look.from} 0%, ${look.to} 100%)`,
    ctaH: `linear-gradient(90deg, ${look.from}, ${look.to})`,
    ctaInk: lightCta ? '#fff6ea' : '#2a1408',
    glow: hexToRgba(look.hex, glowA),
    glowSoft: hexToRgba(look.hex, lit ? 0.18 : 0.08),
    particles: [look.from, look.hex, look.to, '#fff7ed', look.from],
    halo: `radial-gradient(circle, ${hexToRgba(look.hex, 0.55)} 0%, ${hexToRgba(look.to, 0.14)} 42%, transparent 70%)`,
    wash: `radial-gradient(ellipse 80% 90% at 50% 0%, ${hexToRgba(look.hex, glowA)}, transparent 70%)`,
    shadow: `0 0 28px ${hexToRgba(look.hex, 0.5)}`,
    tileShadow: `0 6px 14px ${hexToRgba(look.to, 0.35)}`,
    todayRing: `0 0 0 2px ${hexToRgba(look.from, 0.55)}, 0 8px 18px ${hexToRgba(look.to, 0.45)}`,
    numberGlow: `0 0 28px ${hexToRgba(look.hex, 0.32)}`,
    plusShadow: `0 4px 12px ${hexToRgba(look.to, 0.45)}`,
    ctaShadow: `0 10px 24px ${hexToRgba(look.to, 0.35)}`,
    border: hexToRgba(look.hex, rich ? 0.28 : 0.12),
  };
}

/**
 * Earned ranks for the Analytics guide (skips Unlit).
 * @returns {Array<{ title: string, min: number, days: string, blurb: string, hex: string, from: string, to: string, motion: string }>}
 */
export function streakRankGuide() {
  const rows = STREAK_RANKS.filter((row) => row.min >= 1);
  return rows.map((row, i) => {
    const nextMin = rows[i + 1]?.min;
    const until = nextMin == null ? null : nextMin - 1;
    let days = `${row.min}+ days`;
    if (until != null && until === row.min) days = `${row.min} day`;
    else if (until != null) days = `${row.min}–${until} days`;
    const look = STREAK_RANK_PRESENTATION[row.title] || STREAK_RANK_PRESENTATION.Spark;
    return { title: row.title, min: row.min, days, ...look };
  });
}

/**
 * View-model for the +1 modal. Treats today as locked even before the first flush.
 * @param {Record<string, number>} secondsByDay
 * @param {string} todayKey
 */
export function buildStreakCelebrationView(secondsByDay, todayKey) {
  const map = secondsByDay || {};
  const locked = { ...map, [todayKey]: Math.max(map[todayKey] || 0, 1) };
  const streak = computeLockedFocusStreak(map, todayKey);
  const rank = resolveStreakRank(streak);
  const prior = resolveStreakRank(Math.max(0, streak - 1));
  const rankedUp = Boolean(rank.min === streak && streak > 1);
  return {
    todayKey,
    days: streak,
    previousDays: Math.max(0, streak - 1),
    rankTitle: rank.title,
    nextTarget: rank.next,
    nextRankTitle: streakRankTitleAt(rank.next),
    remaining: rank.remaining,
    progress: rank.progress,
    previousProgress: rankedUp ? 0 : prior.progress,
    rankedUp,
    copy: streakCelebrateCopy(streak, rank),
    calendar: buildMonthCalendar(todayKey, locked),
    week: buildWeekStrip(todayKey, locked),
  };
}

/**
 * Fake payload so the modal can be previewed without a new-day focus start.
 * @param {number} [days]
 * @param {Date} [now]
 */
export function previewStreakCelebrationPayload(days = 2, now = new Date()) {
  const n = Math.max(1, Math.floor(Number(days) || 2));
  const todayKey = localDateKey(now);
  /** @type {Record<string, number>} */
  const secondsByDay = {};
  for (let i = 1; i < n; i += 1) {
    secondsByDay[addDaysToDateKey(todayKey, -i)] = 60;
  }
  return { type: 'streak', ...buildStreakCelebrationView(secondsByDay, todayKey) };
}

/**
 * Inclusive lookback window for streak + month calendar.
 * @param {Date} [now]
 */
export function getFocusStreakLookbackRange(now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (FOCUS_STREAK_LOOKBACK_DAYS - 1));
  const end = new Date(now);
  end.setHours(0, 0, 0, 0);
  end.setDate(end.getDate() + 1);
  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    todayKey: localDateKey(now),
  };
}
