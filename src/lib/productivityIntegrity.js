/**
 * Productivity integrity — outcomes first; timer time is a claim that must be verified.
 *
 * Credited focus requires a pinned personal task and attentive time.
 * Uncredited timer time is tracked for habits but does not inflate delivery scores.
 */

/** Idle (no pointer/keyboard on this tab) before “Still focusing?” toast + stop crediting active seconds. */
export const FOCUS_IDLE_MS = 10 * 60 * 1000;

/** Tab hidden this long → same as idle for productivity (timer keeps running). */
export const FOCUS_HIDDEN_UNATTENTIVE_MS = 45 * 1000;

/** Re-nudge still-focusing toast+cling while unattentive. */
export const FOCUS_STILL_REPROMPT_MS = 2 * 60 * 1000;

/** Minimum active seconds in a chunk to mark is_credited. */
export const MIN_CREDITED_CHUNK_SECONDS = 45;

/** Soft daily cap on credited focus (seconds) for score / "verified focus" displays. */
export const DAILY_CREDITED_FOCUS_CAP_SECONDS = 6 * 60 * 60;

/** Soft daily cap on any focus claims (verified + unverified) in score formulas. */
export const DAILY_CLAIMED_FOCUS_CAP_SECONDS = 10 * 60 * 60;

export const FOCUS_PINNED_TASK_STORAGE_KEY = 'focus-current-task-id';

/**
 * @param {Record<string, unknown>} session
 * @returns {number}
 */
export function sessionDurationSeconds(session) {
  return Math.max(0, Math.floor(Number(session?.duration_seconds) || 0));
}

/**
 * Attentive seconds for a logged chunk.
 * @param {Record<string, unknown>} session
 */
export function sessionActiveSeconds(session) {
  const duration = sessionDurationSeconds(session);
  if (session?.active_seconds == null || session.active_seconds === '') {
    return duration;
  }
  return Math.min(duration, Math.max(0, Math.floor(Number(session.active_seconds) || 0)));
}

/**
 * Seconds that count as verified productive focus.
 * @param {Record<string, unknown>} session
 */
export function sessionCreditedSeconds(session) {
  // Soft Focus session: Active duration is productivity (no separate credit gate).
  return sessionActiveSeconds(session);
}

/**
 * Build insert payload fields for a focus session chunk.
 * @param {{
 *   durationSeconds: number,
 *   taskId?: string | null,
 *   activeSeconds?: number | null,
 *   flags?: Record<string, unknown>,
 * }} opts
 */
export function buildFocusSessionIntegrityFields({
  durationSeconds,
  taskId = null,
  activeSeconds = null,
  flags = {},
}) {
  const duration = Math.max(0, Math.floor(durationSeconds || 0));
  const active =
    activeSeconds == null
      ? duration
      : Math.min(duration, Math.max(0, Math.floor(activeSeconds)));
  const task = taskId ? String(taskId) : null;
  const integrityFlags = { ...(flags || {}) };
  if (!task) integrityFlags.no_task = true;

  const isCredited = Boolean(task) && active >= MIN_CREDITED_CHUNK_SECONDS;

  return {
    task_id: task,
    active_seconds: active,
    is_credited: isCredited,
    integrity_flags: integrityFlags,
  };
}

/**
 * Aggregate focus sessions into claimed vs credited minutes (with soft daily caps).
 * @param {Array<Record<string, unknown>>} sessions
 * @param {{ todayStr?: string, weekStartStr?: string }} bounds
 */
export function aggregateFocusIntegrity(sessions, bounds = {}) {
  const list = Array.isArray(sessions) ? sessions : [];
  const todayStr =
    bounds.todayStr || new Date().toISOString().slice(0, 10);
  const weekStartStr = bounds.weekStartStr || todayStr;

  let claimedToday = 0;
  let creditedToday = 0;
  let claimedWeek = 0;
  let creditedWeek = 0;
  let verifiedChunks = 0;
  let unverifiedChunks = 0;

  for (const s of list) {
    if (!s?.completed_at) continue;
    const day = String(s.completed_at).slice(0, 10);
    const duration = sessionDurationSeconds(s);
    const credited = sessionCreditedSeconds(s);
    if (credited > 0) verifiedChunks += 1;
    else if (duration > 0) unverifiedChunks += 1;

    if (day === todayStr) {
      claimedToday += duration;
      creditedToday += credited;
    }
    if (day >= weekStartStr) {
      claimedWeek += duration;
      creditedWeek += credited;
    }
  }

  const claimedTodayCapped = Math.min(claimedToday, DAILY_CLAIMED_FOCUS_CAP_SECONDS);
  const creditedTodayCapped = Math.min(creditedToday, DAILY_CREDITED_FOCUS_CAP_SECONDS);

  return {
    claimedSecondsToday: claimedToday,
    creditedSecondsToday: creditedToday,
    claimedSecondsWeek: claimedWeek,
    creditedSecondsWeek: creditedWeek,
    claimedMinutesToday: Math.round(claimedTodayCapped / 60),
    creditedMinutesToday: Math.round(creditedTodayCapped / 60),
    claimedMinutesWeek: Math.round(claimedWeek / 60),
    creditedMinutesWeek: Math.round(creditedWeek / 60),
    uncreditedMinutesToday: Math.max(
      0,
      Math.round((claimedTodayCapped - creditedTodayCapped) / 60)
    ),
    verifiedChunks,
    unverifiedChunks,
  };
}

/**
 * Outcome-first productivity score 0–100.
 * Outcomes dominate; verified focus and meetings are secondary; raw timer gets almost no weight.
 *
 * @param {{
 *   tasksCompletedThisWeek?: number,
 *   overdueCount?: number,
 *   openTasks?: number,
 *   doneCount?: number,
 *   totalTasks?: number,
 *   creditedFocusMinutesToday?: number,
 *   uncreditedFocusMinutesToday?: number,
 *   meetingMinutesToday?: number,
 * }} m
 */
export function computeOutcomeProductivityScore(m = {}) {
  const tasksDone = Math.max(0, Number(m.tasksCompletedThisWeek) || 0);
  const overdue = Math.max(0, Number(m.overdueCount) || 0);
  const done = Math.max(0, Number(m.doneCount) || 0);
  const total = Math.max(0, Number(m.totalTasks) || 0);
  const credited = Math.max(0, Number(m.creditedFocusMinutesToday) || 0);
  const uncredited = Math.max(0, Number(m.uncreditedFocusMinutesToday) || 0);
  const meetings = Math.max(0, Number(m.meetingMinutesToday) || 0);

  // Outcomes ~55
  let score = Math.min(40, tasksDone * 8);
  const completionBoost =
    total > 0 ? Math.min(15, Math.round((done / total) * 15)) : 0;
  score += completionBoost;
  score -= Math.min(20, overdue * 5);

  // Verified focus ~25 (needs linked task)
  score += Math.min(25, Math.round(credited / 3));

  // Meetings ~15
  score += Math.min(15, Math.round(meetings / 10));

  // Unverified timer claim — almost none
  score += Math.min(3, Math.round(uncredited / 45));

  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Integrity flags for UI banners (home analytics / member / B2B).
 * @param {{
 *   claimedMinutes?: number,
 *   creditedMinutes?: number,
 *   tasksCompleted?: number,
 *   overdueCount?: number,
 * }} input
 * @returns {Array<{ type: string, severity: 'warn' | 'info', message: string }>}
 */
export function detectIntegrityFlags(input = {}) {
  const claimed = Math.max(0, Number(input.claimedMinutes) || 0);
  const credited = Math.max(0, Number(input.creditedMinutes) || 0);
  const tasksDone = Math.max(0, Number(input.tasksCompleted) || 0);
  const overdue = Math.max(0, Number(input.overdueCount) || 0);
  /** @type {Array<{ type: string, severity: 'warn' | 'info', message: string }>} */
  const flags = [];

  if (claimed >= 60 && credited < claimed * 0.35) {
    flags.push({
      type: 'unverified_focus',
      severity: 'warn',
      message:
        'Much of the timer time is unverified — pin a task in Focus so sessions count toward productivity.',
    });
  }
  if (claimed >= 90 && tasksDone === 0) {
    flags.push({
      type: 'no_outcomes',
      severity: 'warn',
      message:
        'High focus claims with no completed tasks. Outcomes (done work) drive the productivity score.',
    });
  }
  if (overdue >= 3 && claimed >= 45) {
    flags.push({
      type: 'overdue_with_claims',
      severity: 'info',
      message:
        'Focus sessions are running while multiple tasks are overdue — prioritize closing work.',
    });
  }
  return flags;
}

/**
 * Read pinned personal task id from local storage (client only).
 * @param {string | null | undefined} userId
 */
export function readPinnedFocusTaskId(userId) {
  if (typeof window === 'undefined' || !userId) return null;
  try {
    const raw = window.localStorage.getItem(`${userId}:${FOCUS_PINNED_TASK_STORAGE_KEY}`)
      || window.localStorage.getItem(FOCUS_PINNED_TASK_STORAGE_KEY);
    // Storage helpers may use different key formats — also try last known global
    if (raw) return raw;
  } catch {
    /* ignore */
  }
  return null;
}
