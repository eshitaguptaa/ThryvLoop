/**
 * Team Insights metric consistency checks.
 * Run: node scripts/verify-team-insights.mjs
 */
import assert from 'assert';
import {
  computeMemberTeamScore,
  computeTeamInsights,
  countCompletionsInRange,
  isOverdueDueDate,
} from '../src/lib/b2b/teamInsights.js';

const now = new Date('2026-08-15T12:00:00');

eq(isOverdueDueDate('2026-08-14', now), true, 'past due date overdue');
eq(isOverdueDueDate('2026-08-15', now), false, 'today not overdue');
eq(isOverdueDueDate('2026-08-16', now), false, 'future not overdue');

const score = computeMemberTeamScore({
  done: 5,
  completionRate: 100,
  focusMinutes: 84,
  rangeDays: 7,
});
assert.ok(score.score >= 40 && score.score <= 100, 'score in range');
assert.equal(score.shipPoints, 40, 'ship capped at 40');

const members = [
  { userId: 'u1', label: 'Eshita', roleLabel: 'Team member', clerkRole: 'org:member' },
  { userId: 'u2', label: 'Arjun', roleLabel: 'Workspace admin', clerkRole: 'org:admin' },
];

const tasks = [
  {
    assignee_user_id: 'u1',
    column_key: 'done',
    created_at: '2026-08-10T10:00:00.000Z',
    completed_at: '2026-08-14T10:00:00.000Z',
    due_date: null,
  },
  {
    assignee_user_id: 'u1',
    column_key: 'done',
    created_at: '2026-08-11T10:00:00.000Z',
    completed_at: '2026-08-13T10:00:00.000Z',
    due_date: null,
  },
  {
    assignee_user_id: 'u2',
    column_key: 'in_progress',
    created_at: '2026-08-01T10:00:00.000Z',
    completed_at: null,
    due_date: '2026-08-10',
  },
  {
    assignee_user_id: 'u2',
    column_key: 'todo',
    created_at: '2026-08-12T10:00:00.000Z',
    completed_at: null,
    due_date: null,
  },
];

const focusSessionsByUser = {
  u1: [
    { completed_at: '2026-08-14T11:00:00.000Z', duration_seconds: 3600, phase: 'session' },
    { completed_at: '2026-08-13T11:00:00.000Z', duration_seconds: 1800, phase: 'session' },
  ],
  u2: [{ completed_at: '2026-08-12T11:00:00.000Z', duration_seconds: 600, phase: 'session' }],
};

const out = computeTeamInsights({
  tasks,
  focusSessionsByUser,
  members,
  rangeDays: 7,
  now,
});

eq(out.summary.velocity, 2, 'team velocity = completions in range');
eq(out.summary.done, out.summary.velocity, 'summary.done mirrors velocity');
eq(
  out.statusBreakdown.find((s) => s.status === 'Done')?.count,
  out.summary.velocity,
  'pipeline Done = velocity'
);
eq(out.statusBreakdown.find((s) => s.status === 'In progress')?.count, 1, 'live in progress');
eq(out.statusBreakdown.find((s) => s.status === 'To do')?.count, 1, 'live todo');
eq(out.summary.overdue, 1, 'overdue open task');

const eshita = out.leaderboard.find((r) => r.userId === 'u1');
const arjun = out.leaderboard.find((r) => r.userId === 'u2');
assert.ok(eshita, 'eshita on board');
assert.ok(arjun, 'arjun on board');
eq(eshita.done, 2, 'eshita shipped = completions');
eq(eshita.assigned, 0, 'eshita has no open assigned');
eq(arjun.assigned, 2, 'arjun open assigned = todo + in progress');
eq(arjun.todo, 1, 'arjun todo');
eq(arjun.inProgress, 1, 'arjun in progress');
eq(arjun.overdue, 1, 'arjun overdue');
eq(eshita.rank, 1, 'eshita ranks first with more ship+focus');
eq(out.leaderboard[0].userId, 'u1', 'leaderboard order matches rank 1');
eq(out.leaderboard[0].rank, 1, 'first row is rank 1');

const memberSum = out.leaderboard.reduce((s, r) => s + r.done, 0);
assert.ok(memberSum <= out.summary.velocity, 'member shipped sum ≤ team velocity');

const firstDay = new Date(now);
firstDay.setHours(0, 0, 0, 0);
firstDay.setDate(firstDay.getDate() - 6);
const end = new Date(now);
end.setHours(0, 0, 0, 0);
end.setDate(end.getDate() + 1);
eq(
  countCompletionsInRange(tasks, firstDay, end),
  out.summary.velocity,
  'countCompletionsInRange matches summary'
);

assert.ok(out.summary.focusMinutes > 0, 'team focus minutes > 0');
assert.equal(out.velocitySeries.length, 7, '7-day series');
eq(out.todayKey, '2026-08-15', 'todayKey is local date');
eq(eshita.focusDays?.length, 7, 'member daily focus series');
const eshitaAug14 = eshita.focusDays.find((d) => d.key === '2026-08-14');
eq(eshitaAug14?.minutes, 60, 'eshita 60m on Aug 14');
eq(arjun.focusDays.find((d) => d.key === '2026-08-12')?.minutes, 10, 'arjun 10m on Aug 12');
assert.ok(
  out.velocitySeries.every((d) => typeof d.focusMinutes === 'number' && typeof d.completed === 'number'),
  'series points complete'
);

console.log('verify-team-insights: all checks passed');

function eq(actual, expected, label) {
  assert.strictEqual(actual, expected, `${label}: got ${actual}, expected ${expected}`);
}
