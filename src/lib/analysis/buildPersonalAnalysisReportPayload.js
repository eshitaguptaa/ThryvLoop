/**
 * Builds the same report payload used by Analytics → Download report.
 * Pure data transforms — works on server and client.
 *
 * Measurement = Active Focus time (duration_seconds). Session *counts* are
 * ignored: the logger checkpoints every ~10s, so chunk counts are noise.
 */
import { localDateKey } from '../dateRanges.js';

const TREND_DAYS = 14;
/** Rolling windows — same as Home (last 7 vs prior 7 of a 14-day span). */
const WEEK_DAYS = 7;
/**
 * Merge consecutive 10s flush rows into one stretch.
 * Idle auto-away is 10 minutes, so a 3-minute gap is still one sitting
 * (covers background timer throttle without joining separate sessions).
 */
const BLOCK_GAP_MS = 3 * 60 * 1000;
const MIN_STRETCH_SECONDS = 60;
const DAY_LABELS_MON = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Consecutive-day ranks — used by Analytics streak card. */
export const STREAK_RANKS = [
  { min: 0, title: 'Unlit', next: 1 },
  { min: 1, title: 'Spark', next: 3 },
  { min: 3, title: 'Ember', next: 7 },
  { min: 7, title: 'Week flame', next: 14 },
  { min: 14, title: 'On fire', next: 21 },
  { min: 21, title: 'Deep burn', next: 30 },
  { min: 30, title: 'Inferno', next: 50 },
  { min: 50, title: 'Legend', next: 100 },
  { min: 100, title: 'Mythic', next: null },
];

/**
 * @param {number} streak
 * @returns {{ title: string, min: number, next: number | null, remaining: number, progress: number }}
 */
export function resolveStreakRank(streak) {
  const n = Math.max(0, Math.floor(Number(streak) || 0));
  let rank = STREAK_RANKS[0];
  for (const row of STREAK_RANKS) {
    if (n >= row.min) rank = row;
  }
  const remaining = rank.next == null ? 0 : Math.max(0, rank.next - n);
  const span = rank.next == null ? 1 : rank.next - rank.min;
  const into = n - rank.min;
  const progress = rank.next == null ? 100 : Math.min(100, Math.round((into / Math.max(1, span)) * 100));
  return { title: rank.title, min: rank.min, next: rank.next, remaining, progress };
}

/**
 * @param {number} minutes
 * @returns {{ hours: number, minutes: number, label: string }}
 */
export function formatFocusMinutes(minutes) {
  const m = Math.max(0, Math.round(Number(minutes) || 0));
  if (m < 60) return { hours: 0, minutes: m, label: `${m}m` };
  const hours = Math.floor(m / 60);
  const rem = m % 60;
  return {
    hours,
    minutes: rem,
    label: rem ? `${hours}h ${rem}m` : `${hours}h`,
  };
}

/**
 * @param {number} current
 * @param {number} previous
 * @returns {number | null}
 */
export function percentChange(current, previous) {
  const cur = Math.max(0, Number(current) || 0);
  const prev = Math.max(0, Number(previous) || 0);
  if (prev <= 0 && cur <= 0) return null;
  if (prev <= 0) return null;
  return Math.round(((cur - prev) / prev) * 100);
}

function isFocusPhase(session) {
  const phase = session?.phase;
  return !phase || phase === 'session';
}

function sessionStartMs(session) {
  if (session?.started_at) {
    const t = new Date(session.started_at).getTime();
    if (Number.isFinite(t)) return t;
  }
  const completed = new Date(session?.completed_at || 0).getTime();
  const durationMs = Math.max(0, Number(session?.duration_seconds) || 0) * 1000;
  return Number.isFinite(completed) ? completed - durationMs : 0;
}

function sessionEndMs(session) {
  const completed = new Date(session?.completed_at || 0).getTime();
  return Number.isFinite(completed) ? completed : sessionStartMs(session);
}

function addDays(date, n) {
  const x = new Date(date);
  x.setDate(x.getDate() + n);
  return x;
}

/**
 * Split a focus span across local weekday × hour buckets.
 * 10s flush chunks usually sit in one hour; longer / live spans can cross.
 * @param {number[][]} matrix
 * @param {number} startMs
 * @param {number} seconds
 */
function addSpanToHeatmap(matrix, startMs, seconds) {
  addSpanToHourBuckets(matrix, startMs, seconds, null);
}

/**
 * @param {number[][] | number[]} buckets  weekday×hour matrix or a single 24-hour row
 * @param {number} startMs
 * @param {number} seconds
 * @param {string | null} onlyDateKey  if set, only credit slices on that local date
 */
function addSpanToHourBuckets(buckets, startMs, seconds, onlyDateKey) {
  let remaining = Math.max(0, Math.floor(Number(seconds) || 0));
  let t = Number(startMs);
  if (!Number.isFinite(t) || remaining <= 0) return;
  const isMatrix = Array.isArray(buckets?.[0]);
  let guard = 0;
  while (remaining > 0 && guard < 48) {
    guard += 1;
    const d = new Date(t);
    if (!Number.isFinite(d.getTime())) return;
    const next = new Date(d);
    next.setMinutes(0, 0, 0);
    next.setHours(d.getHours() + 1);
    const sliceMs = next.getTime() - t;
    let sliceSec = Math.floor(sliceMs / 1000);
    if (sliceSec <= 0) sliceSec = remaining;
    sliceSec = Math.min(remaining, sliceSec);
    const onDate = !onlyDateKey || localDateKey(d) === onlyDateKey;
    if (onDate) {
      const hour = d.getHours();
      if (isMatrix) {
        const dayIndex = (d.getDay() + 6) % 7;
        if (buckets[dayIndex] && buckets[dayIndex][hour] != null) {
          buckets[dayIndex][hour] += sliceSec;
        }
      } else if (buckets[hour] != null) {
        buckets[hour] += sliceSec;
      }
    }
    remaining -= sliceSec;
    t = next.getTime();
  }
}

function dateKeyOffset(fromKey, days) {
  const d = new Date(`${fromKey}T12:00:00`);
  d.setDate(d.getDate() + days);
  return localDateKey(d);
}

/**
 * Collapse flush-sized rows into real focus stretches.
 * @param {Array<Record<string, unknown>>} sessions
 * @returns {Array<{ startMs: number, endMs: number, seconds: number, date: string }>}
 */
export function mergeFocusBlocks(sessions) {
  const rows = (Array.isArray(sessions) ? sessions : [])
    .filter((s) => isFocusPhase(s) && s.completed_at)
    .map((s) => ({
      startMs: sessionStartMs(s),
      endMs: sessionEndMs(s),
      seconds: Math.max(0, Number(s.duration_seconds) || 0),
    }))
    .filter((s) => s.seconds > 0 && Number.isFinite(s.startMs))
    .sort((a, b) => a.startMs - b.startMs);

  /** @type {Array<{ startMs: number, endMs: number, seconds: number, date: string }>} */
  const blocks = [];
  for (const row of rows) {
    const prev = blocks[blocks.length - 1];
    if (prev && row.startMs - prev.endMs <= BLOCK_GAP_MS) {
      prev.endMs = Math.max(prev.endMs, row.endMs);
      prev.seconds += row.seconds;
    } else {
      blocks.push({
        startMs: row.startMs,
        endMs: row.endMs,
        seconds: row.seconds,
        date: localDateKey(new Date(row.startMs)),
      });
    }
  }
  return blocks;
}

/**
 * @param {{
 *   userName?: string,
 *   tasks?: Array<Record<string, unknown>>,
 *   focusSessions?: Array<Record<string, unknown>>,
 *   liveTodayFocusSeconds?: number | null,
 *   liveUnloggedFocusSeconds?: number | null,
 * }} input
 */
export function buildPersonalAnalysisReportPayload(input = {}) {
  const tasks = Array.isArray(input.tasks) ? input.tasks : [];
  const focusSessions = (Array.isArray(input.focusSessions) ? input.focusSessions : []).filter(
    isFocusPhase
  );
  const liveTodaySeconds =
    input.liveTodayFocusSeconds == null
      ? null
      : Math.max(0, Math.floor(Number(input.liveTodayFocusSeconds) || 0));

  const now = new Date();
  const todayStr = localDateKey(now);
  const dateString = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const daysElapsedThisWeek = WEEK_DAYS;

  const inProgressCount = tasks.filter((t) => t.column_key === 'inProgress').length;
  const backlogCount = tasks.filter((t) => t.column_key === 'backlog').length;
  const doneCount = tasks.filter((t) => t.column_key === 'done').length;
  const todaysFocusCount = tasks.filter((t) => t.column_key === 'todaysFocus').length;
  const totalTasks = tasks.length;
  const highPriorityCount = tasks.filter((t) => t.priority?.level === 'High Priority').length;
  const nowMs = Date.now();
  const overdueCount = tasks.filter(
    (t) => t.column_key !== 'done' && t.due_date && new Date(/** @type {string} */ (t.due_date)).getTime() < nowMs
  ).length;

  const categoryCounts = tasks.reduce((acc, t) => {
    const cat = /** @type {string} */ (t.category || 'Other');
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, /** @type {Record<string, number>} */ ({}));

  const completedTasks = tasks.filter((t) => t.completed_at);
  const taskCompletedDate = (t) => localDateKey(new Date(/** @type {string} */ (t.completed_at)));

  /** @type {Record<string, number>} seconds */
  const secondsByDay = {};
  const trendDays = Array.from({ length: TREND_DAYS }, (_, i) => {
    const d = addDays(now, -(TREND_DAYS - 1 - i));
    const key = localDateKey(d);
    secondsByDay[key] = 0;
    return key;
  });
  const last7Days = trendDays.slice(-WEEK_DAYS);
  const prior7Days = trendDays.slice(0, WEEK_DAYS);

  focusSessions.forEach((s) => {
    if (!s.completed_at) return;
    const d = localDateKey(new Date(/** @type {string} */ (s.completed_at)));
    if (d in secondsByDay) {
      secondsByDay[d] += Math.max(0, Number(s.duration_seconds) || 0);
    }
  });

  // Live today includes unlogged seconds. Never let an unhydrated 0 wipe DB totals.
  if (liveTodaySeconds != null) {
    secondsByDay[todayStr] = Math.max(secondsByDay[todayStr] ?? 0, liveTodaySeconds);
  }

  const minutesFromSeconds = (sec) => Math.round((Number(sec) || 0) / 60);
  const focusMinutesToday = minutesFromSeconds(secondsByDay[todayStr] ?? 0);
  const focusMinutesThisWeek = minutesFromSeconds(
    last7Days.reduce((sum, d) => sum + (secondsByDay[d] || 0), 0)
  );
  const focusMinutesLastWeek = minutesFromSeconds(
    prior7Days.reduce((sum, d) => sum + (secondsByDay[d] || 0), 0)
  );

  const yesterdayStr = dateKeyOffset(todayStr, -1);
  const focusMinutesYesterday = minutesFromSeconds(secondsByDay[yesterdayStr] ?? 0);
  const priorSixKeys = trendDays.filter((d) => d < todayStr).slice(-6);
  const recentAvgMinutes =
    priorSixKeys.length > 0
      ? minutesFromSeconds(
          priorSixKeys.reduce((sum, d) => sum + (secondsByDay[d] || 0), 0) / priorSixKeys.length
        )
      : 0;
  const todayVsYesterdayPct = percentChange(focusMinutesToday, focusMinutesYesterday);
  const todayVsAvgPct = percentChange(focusMinutesToday, recentAvgMinutes);
  const todayVsAvgMinutes = focusMinutesToday - recentAvgMinutes;
  const todayVsYesterdayMinutes = focusMinutesToday - focusMinutesYesterday;

  const tasksByDay = {};
  trendDays.forEach((d) => {
    tasksByDay[d] = 0;
  });
  completedTasks.forEach((t) => {
    const d = taskCompletedDate(t);
    if (d in tasksByDay) tasksByDay[d] += 1;
  });

  const tasksCompletedThisWeek = last7Days.reduce((sum, d) => sum + (tasksByDay[d] || 0), 0);
  const tasksCompletedLastWeek = prior7Days.reduce((sum, d) => sum + (tasksByDay[d] || 0), 0);
  const tasksCompletedToday = tasksByDay[todayStr] ?? 0;
  const tasksCompletedYesterday = tasksByDay[yesterdayStr] ?? 0;

  const shipTodayLocked = tasksCompletedToday > 0;
  let shipStreak = 0;
  const shipStart = shipTodayLocked ? 0 : 1;
  for (let i = shipStart; i < TREND_DAYS; i += 1) {
    const ds = dateKeyOffset(todayStr, -i);
    if ((tasksByDay[ds] || 0) > 0) shipStreak += 1;
    else break;
  }
  const shipAtRisk = !shipTodayLocked && shipStreak > 0;
  let longestShipStreak = shipStreak;
  let shipRun = 0;
  trendDays.forEach((d) => {
    if ((tasksByDay[d] || 0) > 0) shipRun += 1;
    else shipRun = 0;
    if (shipRun > longestShipStreak) longestShipStreak = shipRun;
  });
  const priorBestShipped = Math.max(
    0,
    ...trendDays.filter((d) => d !== todayStr).map((d) => tasksByDay[d] || 0)
  );
  const priorBestKey = [...trendDays]
    .reverse()
    .find((d) => d !== todayStr && (tasksByDay[d] || 0) === priorBestShipped && priorBestShipped > 0);
  const shipBestDay = Math.max(priorBestShipped, tasksCompletedToday);
  const shipBestDayLabel = priorBestKey
    ? new Date(`${priorBestKey}T12:00:00`).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : null;
  const shipToBeatBest =
    priorBestShipped <= 0 ? 1 : Math.max(0, priorBestShipped + 1 - tasksCompletedToday);

  const chartData = trendDays.map((d) => ({
    date: d,
    label: new Date(`${d}T12:00:00`).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    weekday: new Date(`${d}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' }),
    focusMinutes: minutesFromSeconds(secondsByDay[d] ?? 0),
    tasksCompleted: tasksByDay[d] ?? 0,
  }));

  const focusedDaysThisWeek = last7Days.filter((d) => (secondsByDay[d] || 0) > 0).length;
  const consistencyPercent = Math.round((focusedDaysThisWeek / Math.max(1, daysElapsedThisWeek)) * 100);

  /** Focused calendar days in the loaded window (for streak, not just the 14-day chart). */
  const allDaySeconds = {};
  focusSessions.forEach((s) => {
    if (!s.completed_at) return;
    const d = localDateKey(new Date(/** @type {string} */ (s.completed_at)));
    allDaySeconds[d] = (allDaySeconds[d] || 0) + Math.max(0, Number(s.duration_seconds) || 0);
  });
  if (liveTodaySeconds != null) {
    allDaySeconds[todayStr] = Math.max(allDaySeconds[todayStr] ?? 0, liveTodaySeconds);
  } else if ((secondsByDay[todayStr] || 0) > 0) {
    allDaySeconds[todayStr] = Math.max(allDaySeconds[todayStr] ?? 0, secondsByDay[todayStr]);
  }

  const todayLocked = (allDaySeconds[todayStr] || 0) > 0;
  let streak = 0;
  const streakStart = todayLocked ? 0 : 1;
  for (let i = streakStart; i < 120; i += 1) {
    const ds = dateKeyOffset(todayStr, -i);
    if ((allDaySeconds[ds] || 0) > 0) streak += 1;
    else break;
  }
  const streakAtRisk = !todayLocked && streak > 0;

  const focusedKeys = Object.keys(allDaySeconds)
    .filter((d) => (allDaySeconds[d] || 0) > 0)
    .sort();
  let longestStreak = streak;
  let run = 0;
  let prev = null;
  focusedKeys.forEach((key) => {
    if (prev && dateKeyOffset(prev, 1) === key) run += 1;
    else run = 1;
    if (run > longestStreak) longestStreak = run;
    prev = key;
  });

  const streakRank = resolveStreakRank(streak);

  const dayLabels = DAY_LABELS_MON;
  /** @type {number[][]} seconds per weekday/hour (Mon–Sun × 0–23 local) */
  const peakByDayHour = dayLabels.map(() => Array.from({ length: 24 }, () => 0));
  /** @type {number[]} seconds per hour for today only */
  const todayHourSecs = Array.from({ length: 24 }, () => 0);
  let loggedTodaySeconds = 0;
  focusSessions.forEach((s) => {
    if (!s.completed_at) return;
    const secs = Math.max(0, Number(s.duration_seconds) || 0);
    if (secs <= 0) return;
    const startMs = sessionStartMs(s);
    addSpanToHeatmap(peakByDayHour, startMs, secs);
    if (localDateKey(new Date(/** @type {string} */ (s.completed_at))) === todayStr) {
      loggedTodaySeconds += secs;
      addSpanToHourBuckets(todayHourSecs, startMs, secs, todayStr);
    }
  });
  if (liveTodaySeconds != null) {
    const extraLive = Math.max(0, liveTodaySeconds - loggedTodaySeconds);
    if (extraLive > 0) {
      const liveStart = now.getTime() - extraLive * 1000;
      addSpanToHeatmap(peakByDayHour, liveStart, extraLive);
      addSpanToHourBuckets(todayHourSecs, liveStart, extraLive, todayStr);
    }
  }
  const peakMatrix = peakByDayHour.map((row) => row.map((secs) => secs / 60));
  const todayByHour = todayHourSecs.map((secs) => secs / 60);
  const maxPeakCell = Math.max(0, ...peakMatrix.flat());

  let peakDayIndex = 0;
  let peakHour = 0;
  let peakSeconds = 0;
  peakByDayHour.forEach((row, dayIndex) => {
    row.forEach((secs, hour) => {
      if (secs > peakSeconds) {
        peakSeconds = secs;
        peakDayIndex = dayIndex;
        peakHour = hour;
      }
    });
  });

  const peakMinutes = Math.round(peakSeconds / 60);
  const hourLabel = `${peakHour % 12 || 12}${peakHour >= 12 ? 'pm' : 'am'}`;
  const peakFocusWindow = peakSeconds > 0 ? `${dayLabels[peakDayIndex]} ${hourLabel}` : null;

  const weekFocusDeltaPct = percentChange(focusMinutesThisWeek, focusMinutesLastWeek);
  const tasksWeekDeltaPct = percentChange(tasksCompletedThisWeek, tasksCompletedLastWeek);

  const metrics = {
    date: todayStr,
    focusMinutesToday,
    focusMinutesYesterday,
    focusMinutesThisWeek,
    focusMinutesLastWeek,
    weekFocusDeltaPct,
    todayVsYesterdayPct,
    todayVsYesterdayMinutes,
    recentAvgMinutes,
    todayVsAvgPct,
    todayVsAvgMinutes,
    tasksCompletedToday,
    tasksCompletedYesterday,
    tasksCompletedThisWeek,
    tasksCompletedLastWeek,
    tasksWeekDeltaPct,
    shipStreak,
    shipAtRisk,
    shipTodayLocked,
    longestShipStreak,
    shipBestDay,
    shipBestDayLabel,
    priorBestShipped,
    shipToBeatBest,
    streak,
    streakAtRisk,
    todayLocked,
    longestStreak,
    streakTitle: streakRank.title,
    nextStreakTarget: streakRank.next,
    nextStreakRemaining: streakRank.remaining,
    streakRankProgress: streakRank.progress,
    focusedDaysThisWeek,
    daysElapsedThisWeek,
    consistencyPercent,
    totalTasks,
    doneCount,
    highPriorityCount,
    overdueCount,
    todaysFocusCount,
    inProgressCount,
    backlogCount,
    categoryCounts,
    peakFocusWindow,
    peakFocusMinutes: peakMinutes,
  };

  const taskDistribution = [
    { name: "Today's focus", value: todaysFocusCount, color: '#818cf8' },
    { name: 'In progress', value: inProgressCount, color: '#38bdf8' },
    { name: 'Backlog', value: backlogCount, color: '#94a3b8' },
    { name: 'Done', value: doneCount, color: '#34d399' },
  ].filter((d) => d.value > 0);

  const charts = buildReportChartImages({ chartData, taskDistribution });

  return {
    userName: input.userName || 'User',
    dateString,
    metrics,
    chartData,
    taskDistribution,
    peakByDayHour: peakMatrix,
    todayByHour,
    dayLabels,
    maxPeakCell,
    categoryCounts,
    charts,
  };
}

/**
 * Lightweight SVG chart PNGs-as-data-URL so PDF charts aren't blank without DOM capture.
 * @param {{ chartData: Array, taskDistribution: Array }} data
 */
export function buildReportChartImages({ chartData, taskDistribution }) {
  return {
    focusTrend: dualTrendSvgDataUrl(chartData),
    workPipeline: distributionSvgDataUrl(taskDistribution),
  };
}

function svgDataUrl(svg) {
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

function dualTrendSvgDataUrl(chartData) {
  const W = 720;
  const H = 220;
  const pad = { t: 24, r: 28, b: 36, l: 40 };
  const rows = Array.isArray(chartData) ? chartData : [];
  const focusVals = rows.map((r) => Number(r.focusMinutes) || 0);
  const taskVals = rows.map((r) => Number(r.tasksCompleted) || 0);
  const maxF = Math.max(1, ...focusVals);
  const maxT = Math.max(1, ...taskVals);
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;
  const n = Math.max(rows.length, 1);

  const xAt = (i) => pad.l + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const yF = (v) => pad.t + plotH - (v / maxF) * plotH;
  const yT = (v) => pad.t + plotH - (v / maxT) * plotH;

  let area = '';
  let focusLine = '';
  let taskLine = '';
  rows.forEach((row, i) => {
    const x = xAt(i);
    const yf = yF(Number(row.focusMinutes) || 0);
    const yt = yT(Number(row.tasksCompleted) || 0);
    focusLine += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${yf.toFixed(1)} `;
    taskLine += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${yt.toFixed(1)} `;
    if (i === 0) area = `M${x.toFixed(1)},${(pad.t + plotH).toFixed(1)} L${x.toFixed(1)},${yf.toFixed(1)} `;
    else area += `L${x.toFixed(1)},${yf.toFixed(1)} `;
    if (i === rows.length - 1) {
      area += `L${x.toFixed(1)},${(pad.t + plotH).toFixed(1)} Z`;
    }
  });

  const labels = rows
    .map((row, i) => {
      if (i % Math.ceil(n / 6) !== 0 && i !== n - 1) return '';
      return `<text x="${xAt(i).toFixed(1)}" y="${H - 10}" text-anchor="middle" font-size="10" fill="#64748b">${escapeXml(String(row.label || ''))}</text>`;
    })
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="100%" height="100%" fill="#ffffff"/>
    <path d="${area}" fill="rgba(80,67,243,0.12)"/>
    <path d="${focusLine.trim()}" fill="none" stroke="#5043F3" stroke-width="2.5"/>
    <path d="${taskLine.trim()}" fill="none" stroke="#10b981" stroke-width="2.5"/>
    ${labels}
  </svg>`;
  return svgDataUrl(svg);
}

function distributionSvgDataUrl(taskDistribution) {
  const W = 720;
  const H = 180;
  const pad = { t: 16, r: 16, b: 40, l: 16 };
  const rows = Array.isArray(taskDistribution) ? taskDistribution : [];
  if (!rows.length) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <rect width="100%" height="100%" fill="#ffffff"/>
      <text x="50%" y="50%" text-anchor="middle" fill="#94a3b8" font-size="14">No task movement yet</text>
    </svg>`;
    return svgDataUrl(svg);
  }
  const vals = rows.map((r) => Number(r.value) || 0);
  const maxV = Math.max(1, ...vals);
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;
  const gap = 16;
  const barW = (plotW - gap * (rows.length - 1)) / rows.length;

  const bars = rows
    .map((row, i) => {
      const v = Number(row.value) || 0;
      const h = (v / maxV) * plotH;
      const x = pad.l + i * (barW + gap);
      const y = pad.t + plotH - h;
      const color = row.color || '#5043F3';
      return `
        <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(0, h).toFixed(1)}" rx="6" fill="${escapeXml(color)}"/>
        <text x="${(x + barW / 2).toFixed(1)}" y="${H - 18}" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">${escapeXml(String(row.name || ''))}</text>
        <text x="${(x + barW / 2).toFixed(1)}" y="${Math.max(pad.t + 14, y - 6).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="700" fill="#0f172a">${v}</text>
      `;
    })
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="100%" height="100%" fill="#ffffff"/>
    ${bars}
  </svg>`;
  return svgDataUrl(svg);
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
