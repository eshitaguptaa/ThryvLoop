/**
 * @typedef {{
 *   userId: string,
 *   label: string,
 *   email?: string | null,
 *   imageUrl?: string | null,
 *   roleLabel?: string,
 *   clerkRole?: string | null,
 * }} OrgMemberOption
 */

function formatMemberRole(clerkRole) {
  if (clerkRole === 'org:admin') return 'Workspace admin';
  return 'Team member';
}

export const ORG_TASK_COLUMNS = [
  { key: 'todo', label: 'To do' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'done', label: 'Done' },
];

export const PRIORITY_STYLES = {
  high: 'bg-red-50 text-red-700 border-red-200',
  medium: 'bg-amber-50 text-amber-800 border-amber-200',
  low: 'bg-slate-100 text-slate-600 border-slate-200',
};

/**
 * @param {import('@clerk/backend').OrganizationMembership[]} memberships
 * @returns {OrgMemberOption[]}
 */
export function mapOrgMembersForTasks(memberships) {
  return memberships
    .map((m) => {
      const userId =
        m.publicUserData?.userId
        || m.publicUserData?.user_id
        || null;
      if (!userId) return null;
      const first = m.publicUserData?.firstName || '';
      const last = m.publicUserData?.lastName || '';
      const name = `${first} ${last}`.trim();
      const email =
        m.publicUserData?.identifier
        || m.publicUserData?.emailAddress
        || null;
      return {
        userId,
        label: name || email || userId,
        email,
        imageUrl: m.publicUserData?.imageUrl ?? null,
        roleLabel: formatMemberRole(m.role),
        clerkRole: m.role || 'org:member',
      };
    })
    .filter(Boolean);
}

export function memberLabel(members, userId) {
  const found = members.find((m) => m.userId === userId);
  return found?.label || found?.email || userId?.slice(0, 12) || 'Unknown';
}

function startOfLocalDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * @param {Array<Record<string, unknown>>} tasks
 * @param {OrgMemberOption[]} members
 * @param {string | null} viewerUserId
 * @param {boolean} isAdmin
 * @param {{ rangeDays?: number }} [options]
 */
export function computeOrgTaskAnalytics(tasks, members, viewerUserId, isAdmin, options = {}) {
  const rangeDays = Math.min(Math.max(Number(options.rangeDays) || 7, 1), 90);
  const now = new Date();
  const rows = tasks || [];

  const baseRows = isAdmin ? rows : rows.filter((t) => t.assignee_user_id === viewerUserId);

  const lastDayExclusive = startOfLocalDay(now);
  lastDayExclusive.setDate(lastDayExclusive.getDate() + 1);

  const firstDay = startOfLocalDay(now);
  firstDay.setDate(firstDay.getDate() - (rangeDays - 1));

  /** Task relevant to this period: created or completed within the window. */
  const touchesPeriod = (t, start, endExcl) => {
    const created = new Date(t.created_at);
    if (created >= start && created < endExcl) return true;
    if (t.completed_at) {
      const co = new Date(t.completed_at);
      if (co >= start && co < endExcl) return true;
    }
    return false;
  };

  const scope = baseRows.filter((t) => touchesPeriod(t, firstDay, lastDayExclusive));

  const prevPeriodEnd = new Date(firstDay);
  const prevPeriodStart = new Date(firstDay);
  prevPeriodStart.setDate(prevPeriodStart.getDate() - rangeDays);

  const prevScope = baseRows.filter((t) => touchesPeriod(t, prevPeriodStart, prevPeriodEnd));

  const statsFor = (list) => {
    const total = list.length;
    const done = list.filter((t) => t.column_key === 'done').length;
    const inProgress = list.filter((t) => t.column_key === 'in_progress').length;
    const todo = list.filter((t) => t.column_key === 'todo').length;
    const overdue = list.filter((t) => {
      if (!t.due_date || t.column_key === 'done') return false;
      return new Date(t.due_date) < now;
    }).length;
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, inProgress, todo, overdue, completionRate };
  };

  const summary = statsFor(scope);
  const prevSummary = statsFor(prevScope);

  const pctDelta = (curr, prev) => {
    if (prev === 0 && curr === 0) return null;
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  const trends = {
    assigned: pctDelta(summary.total, prevSummary.total),
    completed: pctDelta(summary.done, prevSummary.done),
    inProgress: pctDelta(summary.inProgress, prevSummary.inProgress),
    overdue: pctDelta(summary.overdue, prevSummary.overdue),
  };

  /** Completions per calendar day in the visible window (any task, not only cohort). */
  const last7 = [];
  for (let i = 0; i < rangeDays; i += 1) {
    const d = new Date(firstDay);
    d.setDate(d.getDate() + i);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const day =
      rangeDays <= 7
        ? d.toLocaleDateString('en-US', { weekday: 'short' })
        : d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
    const completed = baseRows.filter((t) => {
      if (!t.completed_at) return false;
      const c = new Date(t.completed_at);
      return c >= d && c < next;
    }).length;
    last7.push({ day, completed });
  }

  const statusBreakdown = [
    { status: 'To do', count: scope.filter((t) => t.column_key === 'todo').length },
    { status: 'In progress', count: scope.filter((t) => t.column_key === 'in_progress').length },
    { status: 'Done', count: scope.filter((t) => t.column_key === 'done').length },
  ];

  const byMember = isAdmin
    ? members
        .map((m) => {
          const list = scope.filter((t) => t.assignee_user_id === m.userId);
          const s = statsFor(list);
          return {
            userId: m.userId,
            label: m.label,
            imageUrl: m.imageUrl ?? null,
            roleLabel: m.roleLabel ?? 'Team member',
            ...s,
          };
        })
        .filter((row) => row.total > 0)
        .sort((a, b) => b.done - a.done || b.completionRate - a.completionRate)
    : [];

  const priorityBreakdown = ['high', 'medium', 'low'].map((p) => ({
    priority: p,
    count: scope.filter((t) => t.priority === p && t.column_key !== 'done').length,
  }));

  return {
    summary,
    byMember,
    last7,
    trends,
    priorityBreakdown,
    statusBreakdown,
    rangeDays,
    compareLabel: rangeDays === 7 ? 'last week' : 'prior period',
  };
}
