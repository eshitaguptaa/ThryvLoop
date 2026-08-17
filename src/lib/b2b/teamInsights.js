/**
 * Team Insights — composite score, velocity, and ranked leaderboard.
 * Pure transforms; safe for SSR and API routes.
 */

import { resolveStreakRank } from '../analysis/buildPersonalAnalysisReportPayload.js';
import { addDaysToDateKey, localDateKey } from '../dateRanges.js';
import { sessionCreditedSeconds } from '../productivityIntegrity.js';

const ALLOWED_RANGE_DAYS = new Set([7, 14, 30]);

/**
 * @param {unknown} value
 * @returns {7 | 14 | 30}
 */
export function normalizeTeamInsightsRangeDays(value) {
  const n = Number(value);
  if (ALLOWED_RANGE_DAYS.has(n)) return /** @type {7 | 14 | 30} */ (n);
  return 7;
}

function startOfLocalDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * Due dates are often YYYY-MM-DD; compare as local calendar days.
 * @param {unknown} dueDate
 * @param {Date} now
 */
export function isOverdueDueDate(dueDate, now = new Date()) {
  if (!dueDate) return false;
  const raw = String(dueDate);
  const day = raw.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return day < localDateKey(now);
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed < now;
}

function isFocusSessionRow(session) {
  const phase = session?.phase;
  return phase == null || phase === '' || phase === 'session';
}

/**
 * Active focus seconds for a session chunk (Soft Focus = active duration).
 * @param {Record<string, unknown>} session
 */
export function focusSessionActiveSeconds(session) {
  if (!isFocusSessionRow(session)) return 0;
  return sessionCreditedSeconds(session);
}

/**
 * Composite Team Score (0–100) for a period.
 * Ship 40 + completion rate 25 + focus 35 (focus scaled by rangeDays).
 *
 * @param {{
 *   done?: number,
 *   completionRate?: number,
 *   focusMinutes?: number,
 *   rangeDays?: number,
 * }} input
 */
export function computeMemberTeamScore(input = {}) {
  const done = Math.max(0, Number(input.done) || 0);
  const completionRate = Math.min(100, Math.max(0, Number(input.completionRate) || 0));
  const focusMinutes = Math.max(0, Number(input.focusMinutes) || 0);
  const rangeDays = Math.min(Math.max(Number(input.rangeDays) || 7, 1), 90);

  const ship = Math.min(40, done * 8);
  const rate = Math.min(25, Math.round(completionRate * 0.25));
  const focusScale = 12 * (rangeDays / 7);
  const focus = Math.min(35, Math.round(focusMinutes / Math.max(focusScale, 0.001)));

  const score = Math.min(100, Math.max(0, Math.round(ship + rate + focus)));
  return {
    score,
    shipPoints: Math.round(ship),
    ratePoints: rate,
    focusPoints: focus,
  };
}

/**
 * Focus minutes in [start, endExclusive) from session rows.
 * @param {Array<Record<string, unknown>>} sessions
 * @param {Date} start
 * @param {Date} endExclusive
 */
export function sumFocusMinutesInRange(sessions, start, endExclusive) {
  let seconds = 0;
  for (const s of sessions || []) {
    if (!s?.completed_at) continue;
    const completed = new Date(/** @type {string} */ (s.completed_at));
    if (Number.isNaN(completed.getTime())) continue;
    if (completed < start || completed >= endExclusive) continue;
    seconds += focusSessionActiveSeconds(s);
  }
  return Math.round(seconds / 60);
}

/**
 * Consecutive local days with focus > 0 (today optional if empty).
 * @param {Array<Record<string, unknown>>} sessions
 * @param {Date} [now]
 */
export function computeFocusStreakDays(sessions, now = new Date()) {
  /** @type {Record<string, number>} */
  const allDaySeconds = {};
  for (const s of sessions || []) {
    if (!s?.completed_at) continue;
    const secs = focusSessionActiveSeconds(s);
    if (secs <= 0) continue;
    const key = localDateKey(new Date(/** @type {string} */ (s.completed_at)));
    allDaySeconds[key] = (allDaySeconds[key] || 0) + secs;
  }

  const todayStr = localDateKey(now);
  const todayLocked = (allDaySeconds[todayStr] || 0) > 0;
  let streak = 0;
  const streakStart = todayLocked ? 0 : 1;
  for (let i = streakStart; i < 120; i += 1) {
    const ds = addDaysToDateKey(todayStr, -i);
    if ((allDaySeconds[ds] || 0) > 0) streak += 1;
    else break;
  }
  return streak;
}

/**
 * Tasks created or completed within [start, endExclusive).
 * @param {Record<string, unknown>} t
 * @param {Date} start
 * @param {Date} endExclusive
 */
function touchesPeriod(t, start, endExclusive) {
  if (t?.created_at) {
    const created = new Date(/** @type {string} */ (t.created_at));
    if (!Number.isNaN(created.getTime()) && created >= start && created < endExclusive) return true;
  }
  if (t?.completed_at) {
    const co = new Date(/** @type {string} */ (t.completed_at));
    if (!Number.isNaN(co.getTime()) && co >= start && co < endExclusive) return true;
  }
  return false;
}

function inTimeRange(iso, start, endExclusive) {
  if (!iso) return false;
  const c = new Date(/** @type {string} */ (iso));
  if (Number.isNaN(c.getTime())) return false;
  return c >= start && c < endExclusive;
}

/**
 * Completions with completed_at within window.
 * @param {Array<Record<string, unknown>>} tasks
 * @param {Date} start
 * @param {Date} endExclusive
 * @param {string | null} [assigneeUserId]
 */
export function countCompletionsInRange(tasks, start, endExclusive, assigneeUserId = null) {
  return (tasks || []).filter((t) => {
    if (assigneeUserId && t.assignee_user_id !== assigneeUserId) return false;
    return inTimeRange(t.completed_at, start, endExclusive);
  }).length;
}

/**
 * @param {Array<{ userId: string, score: number, done: number, focusMinutes: number }>} rows
 */
function assignRanks(rows) {
  const sorted = [...rows].sort(
    (a, b) => b.score - a.score || b.done - a.done || b.focusMinutes - a.focusMinutes
  );
  /** @type {Map<string, number>} */
  const rankByUser = new Map();
  sorted.forEach((row, i) => {
    rankByUser.set(row.userId, i + 1);
  });
  return rankByUser;
}

/**
 * @param {Array<Record<string, unknown>>} tasks
 * @param {string} userId
 * @param {Date} firstDay
 * @param {Date} lastDayExclusive
 * @param {Date} now
 */
function memberPeriodMetrics(tasks, userId, firstDay, lastDayExclusive, now) {
  const periodTasks = (tasks || []).filter(
    (t) => t.assignee_user_id === userId && touchesPeriod(t, firstDay, lastDayExclusive)
  );
  const shipped = countCompletionsInRange(tasks, firstDay, lastDayExclusive, userId);
  const openAssigned = (tasks || []).filter(
    (t) => t.assignee_user_id === userId && t.column_key !== 'done'
  );
  const inProgress = openAssigned.filter((t) => t.column_key === 'in_progress').length;
  const todo = openAssigned.filter((t) => t.column_key === 'todo').length;
  const overdue = openAssigned.filter((t) => isOverdueDueDate(t.due_date, now)).length;
  const total = periodTasks.length;
  const assigned = openAssigned.length;
  const completionRate = total > 0 ? Math.round((shipped / total) * 100) : shipped > 0 ? 100 : 0;
  return {
    total,
    assigned,
    done: shipped,
    shipped,
    inProgress,
    todo,
    overdue,
    completionRate,
  };
}

/**
 * Daily Active Focus minutes across the insights window.
 * @param {Array<Record<string, unknown>>} sessions
 * @param {Date} firstDay
 * @param {number} rangeDays
 */
export function memberFocusDaySeries(sessions, firstDay, rangeDays) {
  const days = Math.min(Math.max(Number(rangeDays) || 7, 1), 90);
  /** @type {Array<{ key: string, label: string, minutes: number }>} */
  const out = [];
  for (let i = 0; i < days; i += 1) {
    const d = new Date(firstDay);
    d.setDate(d.getDate() + i);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const key = localDateKey(d);
    const label =
      days <= 7
        ? d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2)
        : `${d.getMonth() + 1}/${d.getDate()}`;
    out.push({
      key,
      label,
      minutes: sumFocusMinutesInRange(sessions, d, next),
    });
  }
  return out;
}

/**
 * Build team velocity + gamified leaderboard payload.
 *
 * @param {{
 *   tasks?: Array<Record<string, unknown>>,
 *   focusSessionsByUser?: Record<string, Array<Record<string, unknown>>>,
 *   members?: Array<{
 *     userId: string,
 *     label: string,
 *     email?: string | null,
 *     imageUrl?: string | null,
 *     roleLabel?: string,
 *     clerkRole?: string | null,
 *   }>,
 *   rangeDays?: number,
 *   now?: Date,
 * }} input
 */
export function computeTeamInsights(input = {}) {
  const rangeDays = normalizeTeamInsightsRangeDays(input.rangeDays);
  const now = input.now instanceof Date ? input.now : new Date();
  const tasks = input.tasks || [];
  const members = input.members || [];
  const focusSessionsByUser = input.focusSessionsByUser || {};

  const lastDayExclusive = startOfLocalDay(now);
  lastDayExclusive.setDate(lastDayExclusive.getDate() + 1);

  const firstDay = startOfLocalDay(now);
  firstDay.setDate(firstDay.getDate() - (rangeDays - 1));

  const prevPeriodEnd = new Date(firstDay);
  const prevPeriodStart = new Date(firstDay);
  prevPeriodStart.setDate(prevPeriodStart.getDate() - rangeDays);

  const openTasks = tasks.filter((t) => t.column_key !== 'done');
  const velocity = countCompletionsInRange(tasks, firstDay, lastDayExclusive);
  const prevVelocity = countCompletionsInRange(tasks, prevPeriodStart, prevPeriodEnd);

  const todoCount = openTasks.filter((t) => t.column_key === 'todo').length;
  const inProgressCount = openTasks.filter((t) => t.column_key === 'in_progress').length;
  const overdueCount = openTasks.filter((t) => isOverdueDueDate(t.due_date, now)).length;
  const prevOpen = tasks.filter((t) => {
    // Prior overdue approximation: open now that were overdue relative to prev period end
    if (t.column_key === 'done') return false;
    return isOverdueDueDate(t.due_date, prevPeriodEnd);
  }).length;

  const pipelineDenom = openTasks.length + velocity;
  const completionRate =
    pipelineDenom > 0 ? Math.round((velocity / pipelineDenom) * 100) : 0;

  const pctDelta = (curr, prev) => {
    if (prev === 0 && curr === 0) return null;
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  /** @type {Array<{ day: string, completed: number, focusMinutes: number }>} */
  const velocitySeries = [];
  let teamFocusMinutes = 0;
  let prevTeamFocusMinutes = 0;

  const allUserIds = members.map((m) => m.userId);
  for (const userId of allUserIds) {
    const sessions = focusSessionsByUser[userId] || [];
    teamFocusMinutes += sumFocusMinutesInRange(sessions, firstDay, lastDayExclusive);
    prevTeamFocusMinutes += sumFocusMinutesInRange(sessions, prevPeriodStart, prevPeriodEnd);
  }

  for (let i = 0; i < rangeDays; i += 1) {
    const d = new Date(firstDay);
    d.setDate(d.getDate() + i);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const day =
      rangeDays <= 7
        ? d.toLocaleDateString('en-US', { weekday: 'short' })
        : d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
    const completed = countCompletionsInRange(tasks, d, next);
    let dayFocus = 0;
    for (const userId of allUserIds) {
      dayFocus += sumFocusMinutesInRange(focusSessionsByUser[userId] || [], d, next);
    }
    velocitySeries.push({ day, completed, focusMinutes: dayFocus });
  }

  // Done pillar = shipped in range (aligned with velocity); open pillars = live board
  const statusBreakdown = [
    { status: 'To do', count: todoCount },
    { status: 'In progress', count: inProgressCount },
    { status: 'Done', count: velocity },
  ];

  /** @type {Array<Record<string, unknown>>} */
  const currentMemberRows = members.map((m) => {
    const s = memberPeriodMetrics(tasks, m.userId, firstDay, lastDayExclusive, now);
    const sessions = focusSessionsByUser[m.userId] || [];
    const focusMinutes = sumFocusMinutesInRange(sessions, firstDay, lastDayExclusive);
    const points = computeMemberTeamScore({
      done: s.shipped,
      completionRate: s.completionRate,
      focusMinutes,
      rangeDays,
    });
    const streak = computeFocusStreakDays(sessions, now);
    const streakRank = resolveStreakRank(streak);
    const focusDays = memberFocusDaySeries(sessions, firstDay, rangeDays);
    const todayKey = localDateKey(now);
    const focusMinutesToday = focusDays.find((d) => d.key === todayKey)?.minutes || 0;
    return {
      userId: m.userId,
      label: m.label,
      imageUrl: m.imageUrl ?? null,
      roleLabel: m.roleLabel ?? 'Team member',
      clerkRole:
        m.clerkRole
        ?? (m.roleLabel === 'Workspace admin' || m.roleLabel === 'Admin' ? 'org:admin' : 'org:member'),
      total: s.total,
      assigned: s.assigned,
      done: s.shipped,
      shipped: s.shipped,
      inProgress: s.inProgress,
      todo: s.todo,
      overdue: s.overdue,
      completionRate: s.completionRate,
      focusMinutes,
      focusMinutesToday,
      focusDays,
      streak,
      streakTitle: streakRank.title,
      ...points,
    };
  });

  const prevMemberRows = members.map((m) => {
    const s = memberPeriodMetrics(tasks, m.userId, prevPeriodStart, prevPeriodEnd, now);
    const sessions = focusSessionsByUser[m.userId] || [];
    const focusMinutes = sumFocusMinutesInRange(sessions, prevPeriodStart, prevPeriodEnd);
    const points = computeMemberTeamScore({
      done: s.shipped,
      completionRate: s.completionRate,
      focusMinutes,
      rangeDays,
    });
    return {
      userId: m.userId,
      score: points.score,
      done: s.shipped,
      focusMinutes,
    };
  });

  const currentRanks = assignRanks(
    currentMemberRows.map((r) => ({
      userId: /** @type {string} */ (r.userId),
      score: /** @type {number} */ (r.score),
      done: /** @type {number} */ (r.done),
      focusMinutes: /** @type {number} */ (r.focusMinutes),
    }))
  );
  const prevRanks = assignRanks(prevMemberRows);

  const leaderboard = currentMemberRows
    .map((row) => {
      const rank = currentRanks.get(/** @type {string} */ (row.userId)) || currentMemberRows.length;
      const prevRank = prevRanks.get(/** @type {string} */ (row.userId));
      const rankDelta = prevRank != null ? prevRank - rank : null;
      return { ...row, rank, prevRank: prevRank ?? null, rankDelta };
    })
    .sort((a, b) => a.rank - b.rank);

  // Sanity: sum of member shipped ≤ team velocity (unassigned completions allowed)
  const memberShippedSum = leaderboard.reduce((sum, r) => sum + (Number(r.done) || 0), 0);

  return {
    rangeDays,
    todayKey: localDateKey(now),
    compareLabel: rangeDays === 7 ? 'last week' : 'prior period',
    summary: {
      total: openTasks.length,
      done: velocity,
      inProgress: inProgressCount,
      todo: todoCount,
      overdue: overdueCount,
      completionRate,
      velocity,
      focusMinutes: teamFocusMinutes,
      memberShippedSum,
    },
    trends: {
      velocity: pctDelta(velocity, prevVelocity),
      assigned: null,
      completed: pctDelta(velocity, prevVelocity),
      inProgress: null,
      overdue: pctDelta(overdueCount, prevOpen),
      focusMinutes: pctDelta(teamFocusMinutes, prevTeamFocusMinutes),
    },
    velocitySeries,
    statusBreakdown,
    leaderboard,
  };
}
