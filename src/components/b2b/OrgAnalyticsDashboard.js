'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  CalendarDays,
  ChartLine,
  CheckCircle2,
  ChevronDown,
  Clock,
  ListTodo,
  Loader2,
} from 'lucide-react';
import {
  workspaceCardClass,
  workspacePageTitleClass,
} from '@/components/b2b/workspaceShellClasses';
import { computeOrgTaskAnalytics } from '@/lib/orgTasks';
import { getSupabaseClient, setSupabaseAuthToken } from '@/utils/userStorage';

const STATUS_COLORS = {
  'To Do': '#e2e8f0',
  Doing: '#ea580c',
  Review: '#7dd3fc',
  Done: '#22c55e',
};

const CHART_TOOLTIP = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.08)',
};

const TICK_FILL = '#64748b';
const GRID_STROKE = '#e5e7eb';

const RANGE_OPTIONS = [
  { value: 7, label: 'Last 7 days' },
  { value: 14, label: 'Last 14 days' },
  { value: 30, label: 'Last 30 days' },
];

function TrendText({ delta, compareLabel, variant = 'default' }) {
  if (delta === null || delta === undefined) {
    return (
      <span className="text-xs font-semibold text-gray-400">No prior data vs {compareLabel}</span>
    );
  }
  if (delta === 0) {
    return <span className="text-xs font-semibold text-gray-500">Flat vs {compareLabel}</span>;
  }
  const up = delta > 0;
  let colorClass = 'text-emerald-600';
  if (variant === 'warning') {
    colorClass = 'text-orange-600';
  } else if (variant === 'inverse') {
    colorClass = up ? 'text-rose-600' : 'text-emerald-600';
  } else {
    colorClass = up ? 'text-emerald-600' : 'text-rose-600';
  }
  return (
    <span className={`text-xs font-semibold ${colorClass}`}>
      {up ? '↑' : '↓'} {up ? '+' : ''}
      {delta}% vs {compareLabel}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, trend, trendVariant, highlight, compareLabel }) {
  return (
    <div
      className={`${workspaceCardClass} p-4 sm:p-5 relative overflow-hidden ${highlight ? 'ring-1 ring-[#5D3FD3]/25 border-[#5D3FD3]/20' : ''}`}
    >
      {highlight ? (
        <div className="absolute left-0 right-0 top-0 h-1 bg-[#5D3FD3]" aria-hidden />
      ) : null}
      <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold mb-2">
        <Icon className="w-3.5 h-3.5 text-[#5D3FD3]" strokeWidth={2} />
        {label}
      </div>
      <div className="flex flex-wrap items-baseline gap-2">
        <p className="text-2xl sm:text-[1.75rem] font-bold tracking-tight text-gray-900 tabular-nums">
          {value}
        </p>
        {sub ? (
          <span className="rounded-full bg-slate-100 text-slate-600 text-[11px] sm:text-xs font-semibold px-2 py-0.5 border border-slate-200/80">
            {sub}
          </span>
        ) : null}
      </div>
      {trend !== undefined ? (
        <p className="mt-2">
          <TrendText delta={trend} compareLabel={compareLabel} variant={trendVariant} />
        </p>
      ) : null}
    </div>
  );
}

function MemberAvatar({ label, imageUrl }) {
  const initials = (label || '?').slice(0, 2).toUpperCase();
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        className="h-10 w-10 shrink-0 rounded-full object-cover border border-slate-200/90"
      />
    );
  }
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#5D3FD3]/12 text-xs font-bold text-[#5D3FD3] border border-[#5D3FD3]/15">
      {initials}
    </div>
  );
}

export default function OrgAnalyticsDashboard({
  organizationId,
  isAdmin,
  members,
  currentUserId,
}) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const chartFillId = `orgCompletionFill-${useId().replace(/:/g, '')}`;
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rangeDays, setRangeDays] = useState(7);

  const loadTasks = useCallback(async () => {
    if (!organizationId) {
      setError(
        'Workspace could not be linked to Supabase. Run both migrations in supabase/migrations, then refresh.'
      );
      setLoading(false);
      return;
    }
    const token = await getToken({ template: 'supabase' });
    if (!token) {
      setError('Unable to authenticate.');
      setLoading(false);
      return;
    }
    setSupabaseAuthToken(token);
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError('Supabase not configured.');
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error: qErr } = await supabase
      .from('organization_tasks')
      .select('*')
      .eq('organization_id', organizationId);
    if (qErr) setError(qErr.message);
    else setTasks(data || []);
    setLoading(false);
  }, [organizationId, getToken]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    queueMicrotask(() => {
      void loadTasks();
    });
  }, [isLoaded, isSignedIn, loadTasks]);

  const analytics = useMemo(
    () =>
      computeOrgTaskAnalytics(tasks, members, currentUserId, isAdmin, { rangeDays }),
    [tasks, members, currentUserId, isAdmin, rangeDays]
  );

  const { summary, byMember, last7, trends, statusBreakdown, compareLabel } = analytics;

  const completionBadge =
    summary.total > 0 ? `${summary.completionRate}% completion rate` : '0% completion rate';

  const rangeLabel = RANGE_OPTIONS.find((o) => o.value === rangeDays)?.label ?? 'Last 7 days';

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[#5D3FD3] text-xs font-semibold uppercase tracking-widest mb-2">
            Insights
          </p>
          <h1 className={workspacePageTitleClass}>Analytics</h1>
          <p className="text-gray-500 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
            {isAdmin
              ? 'Team-wide metrics and per-member performance for assigned work.'
              : 'Your personal stats for tasks assigned to you in this workspace.'}
          </p>
        </div>
        <div className="relative w-full sm:w-auto sm:min-w-[200px]">
          <CalendarDays
            className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#5D3FD3]"
            aria-hidden
          />
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
          <select
            id="analytics-range"
            value={rangeDays}
            onChange={(e) => setRangeDays(Number(e.target.value))}
            aria-label="Analytics date range"
            className="w-full appearance-none rounded-xl border border-slate-200/90 bg-white pl-10 pr-10 py-2.5 text-sm font-semibold text-gray-800 shadow-[0_1px_3px_-1px_rgba(15,23,42,0.08)] outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-[#5D3FD3]/35"
          >
            {RANGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <p className="mt-6 text-sm text-red-700 border border-red-200 bg-red-50 px-4 py-3 rounded-xl">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-20 text-gray-400 items-center gap-2 mt-8">
          <Loader2 className="w-6 h-6 animate-spin" />
          Loading analytics…
        </div>
      ) : (
        <>
          <section className="mt-8 sm:mt-10">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={ListTodo}
                label={isAdmin ? 'Total assigned (team)' : 'Assigned to you'}
                value={summary.total}
                trend={trends.assigned}
                compareLabel={compareLabel}
              />
              <StatCard
                icon={CheckCircle2}
                label="Completed"
                value={summary.done}
                sub={completionBadge}
                trend={trends.completed}
                compareLabel={compareLabel}
                highlight
              />
              <StatCard
                icon={Clock}
                label="In progress"
                value={summary.inProgress}
                trend={trends.inProgress}
                trendVariant="warning"
                compareLabel={compareLabel}
              />
              <StatCard
                icon={AlertTriangle}
                label="Overdue"
                value={summary.overdue}
                trend={trends.overdue}
                trendVariant="inverse"
                compareLabel={compareLabel}
              />
            </div>
          </section>

          <section className="mt-8 sm:mt-10">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className={`${workspaceCardClass} p-5 sm:p-6`}>
                <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
                  <ChartLine className="h-4 w-4 text-[#5D3FD3] shrink-0" aria-hidden />
                  Completions over Time
                </h3>
                <p className="text-xs text-gray-500 mb-4">{rangeLabel}</p>
                <div className="h-56 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={last7} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
                      <defs>
                        <linearGradient id={chartFillId} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#5D3FD3" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#5D3FD3" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                      <XAxis dataKey="day" tick={{ fill: TICK_FILL, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fill: TICK_FILL, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={CHART_TOOLTIP} />
                      <Area
                        type="monotone"
                        dataKey="completed"
                        stroke="#5D3FD3"
                        strokeWidth={3}
                        fill={`url(#${chartFillId})`}
                        dot={{ fill: '#5D3FD3', strokeWidth: 0, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className={`${workspaceCardClass} p-5 sm:p-6`}>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Tasks by Status</h3>
                <div className="h-56 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusBreakdown} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                      <XAxis dataKey="status" tick={{ fill: TICK_FILL, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fill: TICK_FILL, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={CHART_TOOLTIP} />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={48}>
                        {statusBreakdown.map((entry) => (
                          <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>

          {isAdmin ? (
            <section className="mt-8 sm:mt-10">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
                Top performers
              </h2>
              <div className={`${workspaceCardClass} overflow-hidden p-0`}>
                {byMember.length === 0 ? (
                  <p className="px-5 py-10 text-center text-sm text-gray-500">
                    No assigned tasks in this period. Create or assign tasks to see performance here.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[520px]">
                      <thead>
                        <tr className="text-left text-gray-500 border-b border-slate-100 bg-slate-50/80">
                          <th className="px-4 sm:px-5 py-3 font-semibold">Member</th>
                          <th className="px-4 sm:px-5 py-3 font-semibold text-center">Tasks Completed</th>
                          <th className="px-4 sm:px-5 py-3 font-semibold min-w-[180px]">Completion Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {byMember.map((row) => (
                          <tr
                            key={row.userId}
                            className="border-b border-slate-50 hover:bg-slate-50/90 text-gray-800 last:border-b-0"
                          >
                            <td className="px-4 sm:px-5 py-3">
                              <div className="flex items-center gap-3">
                                <MemberAvatar label={row.label} imageUrl={row.imageUrl} />
                                <div>
                                  <p className="font-semibold text-gray-900">{row.label}</p>
                                  <p className="text-xs text-gray-500">{row.roleLabel}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 sm:px-5 py-3 text-center font-semibold tabular-nums">
                              {row.done}
                            </td>
                            <td className="px-4 sm:px-5 py-3">
                              <div className="flex items-center gap-3">
                                <div className="h-2 flex-1 min-w-[80px] overflow-hidden rounded-full bg-gray-100">
                                  <div
                                    className="h-full rounded-full bg-[#5D3FD3]"
                                    style={{ width: `${row.completionRate}%` }}
                                  />
                                </div>
                                <span className="text-sm font-semibold text-gray-900 tabular-nums w-10 text-right">
                                  {row.completionRate}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
