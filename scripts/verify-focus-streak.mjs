/**
 * Daily +1 streak celebration helpers.
 * Run: node scripts/verify-focus-streak.mjs
 */
import assert from 'assert';
import {
  buildMonthCalendar,
  buildStreakCelebrationView,
  buildWeekStrip,
  computeLockedFocusStreak,
  fallbackSecondsByDay,
  secondsByDayFromSessions,
  shouldCelebrateFocusStreak,
  streakCelebrateCopy,
  streakRankGuide,
  streakRankPillStyle,
  streakRankTheme,
  sundayIndexFromDateKey,
} from '../src/lib/focusStreak.js';

function eq(actual, expected, label) {
  assert.strictEqual(actual, expected, label);
}

function deepEq(actual, expected, label) {
  assert.deepStrictEqual(actual, expected, label);
}

// --- when to show ---
eq(
  shouldCelebrateFocusStreak({
    source: 'user',
    totalsReady: true,
    todayLoggedSeconds: 0,
    celebratedDateKey: null,
    todayKey: '2026-08-16',
  }),
  true,
  'first focus of a new day'
);
eq(
  shouldCelebrateFocusStreak({
    source: 'user',
    totalsReady: true,
    todayLoggedSeconds: 0,
    celebratedDateKey: '2026-08-15',
    todayKey: '2026-08-16',
  }),
  true,
  'yesterday’s celebrate key does not block today'
);
eq(
  shouldCelebrateFocusStreak({
    source: 'user',
    totalsReady: true,
    todayLoggedSeconds: 12,
    celebratedDateKey: null,
    todayKey: '2026-08-16',
  }),
  false,
  'already focused today'
);
eq(
  shouldCelebrateFocusStreak({
    source: 'user',
    totalsReady: true,
    todayLoggedSeconds: 0,
    celebratedDateKey: '2026-08-16',
    todayKey: '2026-08-16',
  }),
  false,
  'already celebrated today'
);
eq(
  shouldCelebrateFocusStreak({
    source: 'system_resume',
    totalsReady: true,
    todayLoggedSeconds: 0,
    celebratedDateKey: null,
    todayKey: '2026-08-16',
  }),
  false,
  'idle resume is not a new start'
);
eq(
  shouldCelebrateFocusStreak({
    source: 'user',
    totalsReady: false,
    todayLoggedSeconds: 0,
    celebratedDateKey: null,
    todayKey: '2026-08-16',
  }),
  false,
  'wait until today totals are known'
);
eq(
  shouldCelebrateFocusStreak({
    source: 'user',
    totalsReady: true,
    todayLoggedSeconds: 0,
    celebratedDateKey: null,
    todayKey: '',
  }),
  false,
  'missing today key'
);

// --- locked streak count ---
eq(computeLockedFocusStreak({}, '2026-08-16'), 1, 'first day ever → 1');
eq(
  computeLockedFocusStreak({ '2026-08-15': 40 }, '2026-08-16'),
  2,
  'yesterday focused → 2'
);
eq(
  computeLockedFocusStreak(
    { '2026-08-13': 10, '2026-08-14': 10, '2026-08-15': 10 },
    '2026-08-16'
  ),
  4,
  'three prior days + today'
);
eq(
  computeLockedFocusStreak({ '2026-08-14': 10, '2026-08-15': 0 }, '2026-08-16'),
  1,
  'gap yesterday resets to 1'
);
eq(
  computeLockedFocusStreak({ '2026-08-16': 99, '2026-08-15': 10 }, '2026-08-16'),
  2,
  'existing today seconds do not double-count'
);

// --- sessions → day map (local date of completed_at) ---
const mapped = secondsByDayFromSessions([
  { completed_at: '2026-08-16T04:30:00.000Z', duration_seconds: 20 },
  { completed_at: '2026-08-16T05:00:00.000Z', duration_seconds: 15 },
  { completed_at: '2026-08-15T12:00:00.000Z', duration_seconds: 0 },
  { duration_seconds: 40 },
]);
assert.ok(Object.keys(mapped).length >= 1, 'maps at least one day');
assert.ok(
  Object.values(mapped).some((n) => n === 35),
  'sums chunks on the same completed day'
);

deepEq(
  fallbackSecondsByDay({ todayKey: '2026-08-16', yesterdaySeconds: 0 }),
  {},
  'no yesterday fallback'
);
deepEq(
  fallbackSecondsByDay({ todayKey: '2026-08-16', yesterdaySeconds: 80 }),
  { '2026-08-15': 80 },
  'yesterday fallback key'
);

// --- calendar (Sunday-first, like LeetCode) ---
eq(sundayIndexFromDateKey('2026-08-16'), 0, '2026-08-16 is Sunday');
eq(sundayIndexFromDateKey('2026-08-01'), 6, '2026-08-01 is Saturday');

const cal = buildMonthCalendar('2026-08-16', {
  '2026-08-14': 10,
  '2026-08-15': 10,
  '2026-08-16': 1,
});
eq(cal.label, 'August 2026', 'month label');
eq(cal.weekdayLabels[0], 'S', 'Sunday-first header');
eq(cal.cells.length % 7, 0, 'complete weeks');
const first = cal.cells.find((c) => c.day === 1);
eq(first?.inMonth, true, 'day 1 in month');
eq(cal.cells.filter((c) => !c.inMonth && c.key.startsWith('lead-')).length, 6, 'Aug 2026 leads with 6 pads');
const todayCell = cal.cells.find((c) => c.isToday);
eq(todayCell?.day, 16, 'today is the 16th');
eq(todayCell?.lit, true, 'today is lit');
eq(cal.cells.find((c) => c.day === 14)?.lit, true, 'prior focused day lit');
eq(cal.cells.find((c) => c.day === 13)?.lit, false, 'unfocused past day unlit');
eq(cal.cells.find((c) => c.day === 17)?.isFuture, true, 'tomorrow is future');
eq(cal.cells.find((c) => c.day === 17)?.lit, false, 'future not lit');

const week = buildWeekStrip('2026-08-16', { '2026-08-15': 12, '2026-08-16': 1 });
eq(week.length, 7, 'seven-day strip');
eq(week[6].key, '2026-08-16', 'strip ends today');
eq(week[6].isToday, true, 'last cell is today');
eq(week[5].lit, true, 'yesterday lit');
eq(week[4].lit, false, 'two days ago unlit without data');
eq(week[6].label, 'Su', 'today Sunday uses two-letter label');
eq(week[5].label, 'Sa', 'Saturday is distinct from Sunday');

// --- view model ---
const view = buildStreakCelebrationView({ '2026-08-15': 30 }, '2026-08-16');
eq(view.days, 2, 'view streak is +1');
eq(view.previousDays, 1, 'count-up starts at prior streak');
eq(view.calendar.cells.find((c) => c.isToday)?.lit, true, 'view lights today');
eq(view.copy.cta, 'Keep focusing', 'cta');
eq(view.nextRankTitle, 'Ember', 'progress line names the next rank');
eq(
  view.copy.sub.includes('keep it alive'),
  false,
  'sub copy is not the dead tomorrow line'
);

const spark = buildStreakCelebrationView({}, '2026-08-16');
eq(spark.days, 1, 'spark day');
eq(spark.copy.headline, 'Spark lit', 'day-1 copy');
eq(spark.rankedUp, false, 'day 1 is not a rank-up');
eq(streakRankTheme('Spark').quiet, true, 'Spark theme is quiet');
eq(streakRankTheme('Mythic').rich, true, 'Mythic theme is rich');
eq(streakRankTheme('Mythic').hex, '#a78bfa', 'Mythic accent is violet');
eq(streakRankTheme('On fire').ctaInk, '#fff6ea', 'hot ranks use light CTA ink');
eq(streakCelebrateCopy(7, { title: 'Week flame', min: 7 }).headline, 'Week flame', 'rank-up copy');
eq(
  streakCelebrateCopy(2).sub.includes('Day two'),
  true,
  'day-2 copy is specific'
);

const guide = streakRankGuide();
eq(guide[0].title, 'Spark', 'guide starts at Spark');
eq(guide[1].title, 'Ember', 'Ember listed');
eq(guide[0].days, '1–2 days', 'Spark range');
eq(guide[guide.length - 1].title, 'Mythic', 'guide ends at Mythic');
eq(guide.some((row) => row.title === 'Unlit'), false, 'Unlit omitted');
eq(new Set(guide.map((row) => row.motion)).size, guide.length, 'each rank has unique motion');
eq(new Set(guide.map((row) => row.hex)).size, guide.length, 'each rank has unique color');
eq(streakRankPillStyle('Spark')?.color, '#d97706', 'Spark pill uses gold text');
eq(streakRankPillStyle('Mythic')?.color, '#6d28d9', 'Mythic pill uses violet text');
eq(streakRankPillStyle('Unlit'), null, 'Unlit has no rank color');

console.log('verify-focus-streak: all cases ok');
