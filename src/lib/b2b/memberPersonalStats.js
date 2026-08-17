function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function sessionDurationSeconds(session) {
  return Math.max(0, Math.floor(Number(session?.duration_seconds) || 0));
}

/**
 * Snapshot stats for a member — Active Focus session minutes (duration_seconds).
 * @param {{ tasks?: Array, focusSessions?: Array, orgTasks?: Array }} input
 */
export function computeMemberPersonalStats({
  tasks = [],
  focusSessions = [],
  orgTasks = [],
}) {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const weekStart = startOfDay(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStartStr = weekStart.toISOString().slice(0, 10);

  let focusSecondsToday = 0;
  let focusSecondsWeek = 0;
  const sessionsToday = focusSessions.filter((s) => {
    if (!s?.completed_at) return false;
    const day = String(s.completed_at).slice(0, 10);
    const dur = sessionDurationSeconds(s);
    if (day === todayStr) focusSecondsToday += dur;
    if (day >= weekStartStr) focusSecondsWeek += dur;
    return day === todayStr;
  }).length;

  const personalOpen = tasks.filter(
    (t) => !t.completed_at && t.column !== 'done' && t.status !== 'done'
  );
  const personalDone = tasks.filter(
    (t) => t.completed_at || t.column === 'done' || t.status === 'done'
  );

  const orgOpen = orgTasks.filter((t) => t.column_key !== 'done');
  const orgDone = orgTasks.filter((t) => t.column_key === 'done');
  const orgOverdue = orgOpen.filter((t) => t.due_date && new Date(t.due_date) < now);

  const byDay = {};
  focusSessions.forEach((s) => {
    if (!s.completed_at) return;
    const d = String(s.completed_at).slice(0, 10);
    byDay[d] = (byDay[d] || 0) + 1;
  });
  let streak = 0;
  for (let i = 0; i < 60; i += 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if ((byDay[key] || 0) > 0) streak += 1;
    else if (i > 0) break;
  }

  const focusMinutesToday = Math.round(focusSecondsToday / 60);
  const focusMinutesWeek = Math.round(focusSecondsWeek / 60);

  return {
    sessionsToday,
    focusMinutesWeek,
    creditedFocusMinutesWeek: focusMinutesWeek,
    claimedFocusMinutesToday: focusMinutesToday,
    creditedFocusMinutesToday: focusMinutesToday,
    uncreditedFocusMinutesToday: 0,
    sessionCount30: focusSessions.length,
    personalOpen: personalOpen.length,
    personalDone: personalDone.length,
    orgOpen: orgOpen.length,
    orgDone: orgDone.length,
    orgOverdue: orgOverdue.length,
    streak,
    integrityFlags: [],
  };
}

export const MEMBER_REPORT_METRIC_LABELS = [
  { key: 'orgDone', label: 'Org work done' },
  { key: 'orgOpen', label: 'Org work open' },
  { key: 'orgOverdue', label: 'Org work overdue' },
  { key: 'personalDone', label: 'Personal tasks done' },
  { key: 'personalOpen', label: 'Personal tasks open' },
  { key: 'focusMinutesWeek', label: 'Focus minutes (week)' },
  { key: 'claimedFocusMinutesToday', label: 'Focus minutes (today)' },
  { key: 'sessionsToday', label: 'Focus chunks today' },
  { key: 'streak', label: 'Focus streak (days)' },
];

/**
 * Server-side payload for a member personal report PDF.
 */
export function buildMemberReportPayload(input) {
  const stats = computeMemberPersonalStats(input);
  const metrics = MEMBER_REPORT_METRIC_LABELS.map((m) => ({
    label: m.label,
    value: stats[m.key] ?? 0,
  }));

  const sessions = [...(input.focusSessions || [])]
    .filter((s) => s.completed_at)
    .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
    .slice(0, 15)
    .map((s) => ({
      when: new Date(s.completed_at).toLocaleString(),
      minutes: Math.round((Number(s.duration_seconds) || 0) / 60),
      credited: true,
    }));

  return {
    subjectLabel: input.subjectLabel || 'Member',
    orgName: input.orgName || 'Workspace',
    roleLabel: input.roleLabel || '',
    generatedAt: new Date().toLocaleString(),
    metrics,
    sessions,
    integrityFlags: [],
  };
}
