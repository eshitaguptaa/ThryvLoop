'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useAuth, useUser } from '@clerk/nextjs';
import {
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Bar,
} from 'recharts';
import {
  Download,
  Flame,
  CheckCircle2,
  ArrowUpRight,
  Focus,
  Clock,
  TrendingUp,
  ListTodo,
  Info,
} from 'lucide-react';
import { Outfit } from 'next/font/google';
import ThryvAIInsightCard from '@/components/analysis/ThryvAIInsightCard';
import StreakRanksModal from '@/components/analysis/StreakRanksModal';
import AppPageLoader from '@/components/ui/AppPageLoader';
import ThemeToolbarButton from '@/components/ThemeToolbarButton';
import { captureAnalyticsCharts } from '@/lib/analysis/captureChartImages';
import {
  buildPersonalAnalysisReportPayload,
  formatFocusMinutes,
} from '@/lib/analysis/buildPersonalAnalysisReportPayload';
import { buildPersonalAnalyticsFilename } from '@/lib/analysis/reportFilename';
import { localStartOfDay } from '@/lib/dateRanges';
import { streakRankPillStyle, streakRankTheme, hexToRgba } from '@/lib/focusStreak';
import { getClerkSupabaseToken } from '@/lib/clerkSupabaseToken';
import { getSupabaseClient, setSupabaseAuthToken } from '@/utils/userStorage';
import { workspaceApiFetch } from '@/lib/workspace/clientApi';
import { FocusSessionContext } from '@/contexts/FocusSessionContext';
import {
  appSurfaceClass,
  appSurfaceInsetClass,
  appContentClass,
  appPageTitleClass,
  appEyebrowClass,
  appMutedTextClass,
  dashboardHeroCardClass,
  dashboardPanelClass,
  dashboardWidePanelClass,
  dashboardOverlayGradientClass,
  dashboardBadgeClass,
} from '@/lib/appShellClasses';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-outfit',
});

const THRYV_PURPLE = '#5043F3';
const TASK_GREEN = '#10b981';

export default function AnalyticsDashboard() {
  const { user } = useUser();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const userId = user?.id || null;
  const focusSession = React.useContext(FocusSessionContext);
  const todayFocusSeconds = focusSession?.todayFocusSeconds ?? 0;
  const isFocusSessionActiveToday = Boolean(focusSession?.isFocusSessionActiveToday);
  const liveTodayBucketSec = Math.floor(todayFocusSeconds / 60) * 60;

  const [tasks, setTasks] = useState([]);
  const [focusSessions, setFocusSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState('');
  const [cachedInsight, setCachedInsight] = useState(null);

  const focusTrendChartRef = useRef(null);

  const loadData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError('');
    try {
      const since = new Date();
      since.setDate(since.getDate() - 29);
      const rangeEnd = new Date();
      rangeEnd.setHours(0, 0, 0, 0);
      rangeEnd.setDate(rangeEnd.getDate() + 1);
      const sessionParams = new URLSearchParams({
        start: localStartOfDay(since),
        end: rangeEnd.toISOString(),
      });

      const token = await getClerkSupabaseToken(getToken, isSignedIn);
      if (token) setSupabaseAuthToken(token);
      const supabase = token ? getSupabaseClient() : null;

      const [tasksRes, sessionsHttp] = await Promise.all([
        supabase
          ? supabase
              .from('tasks')
              .select('*')
              .eq('user_id', userId)
              .or(`column_key.neq.done,completed_at.gte.${since.toISOString()}`)
              .order('created_at', { ascending: true })
          : Promise.resolve({ data: [], error: token ? null : { message: 'Unable to authenticate.' } }),
        workspaceApiFetch(`/api/analytics/focus-sessions?${sessionParams}`, {}, getToken),
      ]);

      if (tasksRes.error) throw new Error(tasksRes.error.message || 'Failed to load tasks');
      setTasks(tasksRes.data || []);

      if (!sessionsHttp.ok) {
        const body = await sessionsHttp.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to load focus history');
      }
      const sessionsJson = await sessionsHttp.json();
      setFocusSessions(Array.isArray(sessionsJson.sessions) ? sessionsJson.sessions : []);
    } catch (e) {
      setError(e?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [getToken, isSignedIn, userId]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) {
      setLoading(false);
      return;
    }
    loadData();
  }, [isLoaded, isSignedIn, userId, loadData]);

  const report = useMemo(
    () =>
      buildPersonalAnalysisReportPayload({
        userName:
          [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
          user?.fullName ||
          user?.username ||
          user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ||
          'User',
        tasks,
        focusSessions,
        liveTodayFocusSeconds: focusSession?.hydrated ? liveTodayBucketSec : null,
      }),
    [user, tasks, focusSessions, liveTodayBucketSec, focusSession?.hydrated]
  );

  const { metrics, chartData, taskDistribution, peakByDayHour, todayByHour, dayLabels, maxPeakCell, dateString, categoryCounts } =
    report;
  const weekFmt = formatFocusMinutes(metrics.focusMinutesThisWeek);
  const todayFmt = formatFocusMinutes(metrics.focusMinutesToday);
  const yesterdayFmt = formatFocusMinutes(metrics.focusMinutesYesterday);
  const avgFmt = formatFocusMinutes(metrics.recentAvgMinutes);
  const todayPeak = todayPeakHour(todayByHour);
  const vsAvgMinutes = Math.round(Number(metrics.todayVsAvgMinutes) || 0);

  const aiMetrics = useMemo(
    () => ({
      date: metrics.date,
      focusMinutesToday: metrics.focusMinutesToday,
      focusMinutesYesterday: metrics.focusMinutesYesterday,
      focusMinutesThisWeek: metrics.focusMinutesThisWeek,
      focusMinutesLastWeek: metrics.focusMinutesLastWeek,
      weekFocusDeltaPct: metrics.weekFocusDeltaPct,
      todayVsYesterdayPct: metrics.todayVsYesterdayPct,
      todayVsYesterdayMinutes: metrics.todayVsYesterdayMinutes,
      recentAvgMinutes: metrics.recentAvgMinutes,
      todayVsAvgPct: metrics.todayVsAvgPct,
      todayVsAvgMinutes: metrics.todayVsAvgMinutes,
      tasksCompletedToday: metrics.tasksCompletedToday,
      tasksCompletedYesterday: metrics.tasksCompletedYesterday,
      tasksCompletedThisWeek: metrics.tasksCompletedThisWeek,
      tasksCompletedLastWeek: metrics.tasksCompletedLastWeek,
      tasksWeekDeltaPct: metrics.tasksWeekDeltaPct,
      shipStreak: metrics.shipStreak,
      shipAtRisk: metrics.shipAtRisk,
      shipBestDay: metrics.shipBestDay,
      shipToBeatBest: metrics.shipToBeatBest,
      streak: metrics.streak,
      streakAtRisk: metrics.streakAtRisk,
      todayLocked: metrics.todayLocked,
      longestStreak: metrics.longestStreak,
      streakTitle: metrics.streakTitle,
      nextStreakTarget: metrics.nextStreakTarget,
      nextStreakRemaining: metrics.nextStreakRemaining,
      overdueCount: metrics.overdueCount,
      todaysFocusCount: metrics.todaysFocusCount,
      inProgressCount: metrics.inProgressCount,
      backlogCount: metrics.backlogCount,
      doneCount: metrics.doneCount,
      highPriorityCount: metrics.highPriorityCount,
      peakFocusWindow: metrics.peakFocusWindow,
    }),
    [metrics]
  );

  const handleDownloadPdf = async () => {
    if (typeof window === 'undefined') return;
    setExportLoading(true);
    setExportError('');
    try {
      let insight = cachedInsight;
      if (!insight?.summary) {
        const insightRes = await fetch('/api/assistant/analytics-insight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ metrics: aiMetrics }),
        });
        const insightData = await insightRes.json().catch(() => ({}));
        if (insightRes.ok && insightData?.summary) {
          insight = insightData;
          setCachedInsight(insightData);
        }
      }

      const charts = await captureAnalyticsCharts({
        focusTrend: focusTrendChartRef.current,
      });

      const res = await fetch('/api/analytics/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: report.userName,
          dateString,
          metrics: {
            ...aiMetrics,
            todaysFocusCount: metrics.todaysFocusCount,
            backlogCount: metrics.backlogCount,
            doneCount: metrics.doneCount,
            streakRankProgress: metrics.streakRankProgress,
          },
          chartData,
          taskDistribution,
          peakByDayHour,
          todayByHour,
          dayLabels,
          maxPeakCell,
          categoryCounts,
          insight,
          charts: { ...report.charts, ...charts },
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to generate PDF');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = buildPersonalAnalyticsFilename(report.userName, metrics.date);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setExportError(e?.message || 'Could not generate PDF');
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return <AppPageLoader message="Loading analytics" />;
  }

  return (
    <div className={`${appSurfaceClass} ${appSurfaceInsetClass} ${outfit.className}`}>
      <main className={`${appContentClass} py-4 lg:py-6`}>
        {error ? (
          <div className="mb-6 py-3 px-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm font-medium">
            {error}
          </div>
        ) : null}
        {exportError ? (
          <div className="mb-6 py-3 px-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-sm font-medium">
            {exportError}
          </div>
        ) : null}

        <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
          <div>
            <p className={appEyebrowClass}>Insights</p>
            <h1 className={appPageTitleClass}>Analytics</h1>
            <p className={`mt-1 ${appMutedTextClass} font-medium`}>{dateString}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ThemeToolbarButton />
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={loading || !!error || exportLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#545BE8] to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-300/40 dark:shadow-indigo-900/40 cursor-pointer"
            >
              {exportLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {exportLoading ? 'Generating PDF…' : 'Download report'}
            </button>
          </div>
        </header>

        <div className={`${dashboardHeroCardClass} mb-6 md:mb-8 lg:!p-10 items-stretch min-h-0 lg:min-h-[440px]`}>
          <div className={`absolute inset-0 ${dashboardOverlayGradientClass} pointer-events-none`} />
          <div className="absolute -top-16 -right-10 w-72 h-72 bg-indigo-500/20 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-56 h-56 bg-violet-400/15 dark:bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 -left-8 w-40 h-40 bg-fuchsia-400/10 dark:bg-fuchsia-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex-1 min-w-0 flex flex-col">
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <div className={dashboardBadgeClass}>
                <div
                  className={`w-2 h-2 rounded-full ${isFocusSessionActiveToday ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-500'}`}
                />
                {isFocusSessionActiveToday ? 'FOCUSING NOW' : 'TODAY'}
              </div>
              {metrics.todayLocked ? (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-500/25">
                  Day locked
                </span>
              ) : null}
            </div>

            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300 uppercase tracking-[0.2em] mb-3">
              Time in focus
            </p>

            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="flex items-baseline gap-1.5">
                <span className="text-6xl sm:text-7xl md:text-8xl font-bold text-foreground tracking-tight leading-[0.9] tabular-nums">
                  {todayFmt.hours}
                </span>
                <span className="text-2xl sm:text-3xl text-indigo-500/80 dark:text-indigo-300/80 font-semibold pb-2">h</span>
                <span className="text-6xl sm:text-7xl md:text-8xl font-bold text-foreground tracking-tight leading-[0.9] tabular-nums ml-2">
                  {todayFmt.minutes}
                </span>
                <span className="text-2xl sm:text-3xl text-indigo-500/80 dark:text-indigo-300/80 font-semibold pb-2">m</span>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-2 shrink-0 pb-1">
                <DeltaPill pct={metrics.todayVsYesterdayPct} suffix="vs yesterday" />
                <Link
                  href="/focus"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#545BE8] to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-sm font-semibold shadow-lg shadow-indigo-500/30 transition-all"
                >
                  <Focus className="w-4 h-4" />
                  {isFocusSessionActiveToday ? 'Back to focus' : 'Start focusing'}
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-80" />
                </Link>
              </div>
            </div>

            <p className="mt-4 text-sm sm:text-base text-muted-foreground font-medium max-w-xl leading-relaxed">
              {todayOverviewCopy(metrics, isFocusSessionActiveToday, yesterdayFmt, avgFmt)}
            </p>

            <PaceColumns
              today={metrics.focusMinutesToday}
              yesterday={metrics.focusMinutesYesterday}
              average={metrics.recentAvgMinutes}
            />
          </div>

          <div className="relative z-10 mt-8 lg:mt-0 lg:w-[300px] xl:w-[320px] lg:ml-10 shrink-0 flex flex-col gap-3 self-stretch">
            <div className="rounded-3xl border border-indigo-200/70 dark:border-indigo-500/25 bg-gradient-to-b from-indigo-50/80 via-card/80 to-card dark:from-indigo-950/40 dark:via-card dark:to-card p-4 flex-1 flex flex-col">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-300 mb-4">
                Today at a glance
              </p>
              <div className="flex-1 flex flex-col gap-3">
                <InsightChip
                  tone="violet"
                  icon={Clock}
                  label="Best hour today"
                  value={
                    todayPeak.minutes > 0
                      ? `${hourShort(todayPeak.hour)}–${hourShort(todayPeak.hour + 1)}`
                      : metrics.peakFocusWindow || '—'
                  }
                  hint={
                    todayPeak.minutes > 0
                      ? `${formatFocusMinutes(todayPeak.minutes).label} in that hour`
                      : metrics.peakFocusWindow
                        ? 'Usual peak · nothing locked in today yet'
                        : 'Focus and a peak hour appears'
                  }
                />
                <InsightChip
                  tone="emerald"
                  icon={CheckCircle2}
                  label="Shipped today"
                  value={String(metrics.tasksCompletedToday)}
                  hint={shippedTodayHint(metrics)}
                  href="/tasks"
                />
                <InsightChip
                  tone="amber"
                  icon={TrendingUp}
                  label={vsAvgMinutes > 0 && metrics.recentAvgMinutes > 0 ? 'Ahead of usual' : 'Beat your usual'}
                  value={
                    metrics.recentAvgMinutes <= 0
                      ? '—'
                      : vsAvgMinutes === 0
                        ? 'Even'
                        : vsAvgMinutes > 0
                          ? `+${formatFocusMinutes(vsAvgMinutes).label}`
                          : formatFocusMinutes(-vsAvgMinutes).label
                  }
                  hint={
                    metrics.recentAvgMinutes <= 0
                      ? 'Needs a few prior days'
                      : vsAvgMinutes > 0
                        ? `Usual is ${avgFmt.label}`
                        : vsAvgMinutes < 0
                          ? `to pass your usual ${avgFmt.label}`
                          : `Matching your usual ${avgFmt.label}`
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-5 md:gap-6 mb-6 md:mb-8 items-stretch">
          <div className="lg:col-span-4 h-full">
            <WeekProgress
              days={chartData.slice(-7)}
              totalLabel={weekFmt.label}
              delta={metrics.weekFocusDeltaPct}
              priorMinutes={metrics.focusMinutesLastWeek}
              todayKey={metrics.date}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-8 h-full">
            <StreakForge
              streak={metrics.streak}
              atRisk={metrics.streakAtRisk}
              todayLocked={metrics.todayLocked}
              longest={metrics.longestStreak}
              title={metrics.streakTitle}
              nextTarget={metrics.nextStreakTarget}
              remaining={metrics.nextStreakRemaining}
              progress={metrics.streakRankProgress}
              chain={chartData.slice(-7)}
              todayKey={metrics.date}
            />
          </div>
        </div>

        <div className={`${dashboardWidePanelClass} mb-6 md:mb-8 bg-gradient-to-br from-teal-50/70 via-card to-emerald-50/40 dark:from-teal-950/25 dark:via-card dark:to-emerald-950/15 border-teal-200/60 dark:border-teal-500/20`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/15 dark:bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-5 mb-2">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">Focus vs output</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Last 14 days · time focused and tasks you actually finished
                </p>
              </div>
              <div className="flex gap-2">
                <LegendDot color={THRYV_PURPLE} label="Focus" />
                <LegendDot color={TASK_GREEN} label="Tasks done" />
              </div>
            </div>
            <div className="h-[260px] sm:h-[300px] w-full" ref={focusTrendChartRef}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="analyticsFocusFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={THRYV_PURPLE} stopOpacity={0.32} />
                      <stop offset="100%" stopColor={THRYV_PURPLE} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                    axisLine={{ stroke: 'var(--border)' }}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}`}
                    width={36}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    width={28}
                  />
                  <Tooltip content={<TrendTooltip />} cursor={{ fill: 'var(--muted)', fillOpacity: 0.35 }} />
                  <Bar
                    yAxisId="right"
                    dataKey="tasksCompleted"
                    name="tasksCompleted"
                    fill={TASK_GREEN}
                    fillOpacity={0.35}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={18}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="focusMinutes"
                    name="focusMinutes"
                    stroke={THRYV_PURPLE}
                    strokeWidth={2.5}
                    fill="url(#analyticsFocusFill)"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className={`${dashboardWidePanelClass} mb-6 md:mb-8 bg-gradient-to-br from-violet-50/80 via-card to-fuchsia-50/40 dark:from-violet-950/30 dark:via-card dark:to-fuchsia-950/15 border-violet-200/70 dark:border-violet-500/20`}>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-fuchsia-400/15 dark:bg-fuchsia-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">When you focus</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Today’s hours, then your usual week over the last 30 days
                </p>
              </div>
              {metrics.peakFocusWindow ? (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-500/25">
                  Peak {metrics.peakFocusWindow}
                </span>
              ) : null}
            </div>
            <FocusHeatmap
              dayLabels={dayLabels}
              peakByDayHour={peakByDayHour}
              todayByHour={todayByHour}
              maxPeakCell={maxPeakCell}
              focusingNow={isFocusSessionActiveToday}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
          <div className={`${dashboardPanelClass} lg:col-span-7 h-full !justify-start bg-gradient-to-br from-slate-50/90 via-card to-indigo-50/40 dark:from-slate-950/40 dark:via-card dark:to-indigo-950/20 border-slate-200/70 dark:border-slate-500/20`}>
            <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-400/15 dark:bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-slate-400/10 dark:bg-slate-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 h-full">
              <WorkInMotion
                todaysFocus={metrics.todaysFocusCount}
                inProgress={metrics.inProgressCount}
                backlog={metrics.backlogCount}
                done={metrics.doneCount}
              />
            </div>
          </div>

          <div className="lg:col-span-5 h-full">
            <ThryvAIInsightCard
              metrics={aiMetrics}
              enabled={Boolean(isSignedIn && !loading && !error && userId)}
              userId={userId}
              onInsightChange={setCachedInsight}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function DeltaPill({ pct, suffix = '' }) {
  if (pct == null) {
    return (
      <span className="mb-1 inline-flex items-center px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-muted/70 text-muted-foreground border border-border">
        No yesterday to compare
      </span>
    );
  }
  const up = pct >= 0;
  return (
    <span
      className={`mb-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold border shadow-sm ${
        up
          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-500/25'
          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-500/25'
      }`}
    >
      <ArrowUpRight className={`w-3.5 h-3.5 ${up ? '' : 'rotate-180'}`} />
      {up ? '+' : ''}
      {pct}% {suffix}
    </span>
  );
}

function signedDeltaLabel(minutes) {
  const n = Math.round(Number(minutes) || 0);
  if (n === 0) return 'even with';
  const abs = formatFocusMinutes(Math.abs(n)).label;
  return n > 0 ? `${abs} ahead of` : `${abs} behind`;
}

function todayOverviewCopy(metrics, isLive, yesterdayFmt, avgFmt) {
  if (!metrics.focusMinutesToday) {
    return 'Open Focus and turn on Focusing — today starts when the session is Active.';
  }
  const live = isLive ? ' Session is live.' : '';
  const parts = [];
  if (metrics.focusMinutesYesterday > 0) {
    parts.push(`${signedDeltaLabel(metrics.todayVsYesterdayMinutes)} yesterday (${yesterdayFmt.label})`);
  }
  if (metrics.recentAvgMinutes > 0) {
    parts.push(`${signedDeltaLabel(metrics.todayVsAvgMinutes)} your recent daily average (${avgFmt.label})`);
  }
  if (parts.length === 0) {
    return `Today is your first focused day in this window.${live}`;
  }
  return `${parts.join('. ')}.${live}`;
}

function todayPeakHour(todayByHour) {
  const hours = Array.isArray(todayByHour) ? todayByHour : [];
  let minutes = 0;
  let hour = -1;
  hours.forEach((value, index) => {
    const mins = Number(value) || 0;
    if (mins > minutes) {
      minutes = mins;
      hour = index;
    }
  });
  return { hour, minutes };
}

function shippedTodayHint(metrics) {
  const today = Number(metrics.tasksCompletedToday) || 0;
  const yesterday = Number(metrics.tasksCompletedYesterday) || 0;
  if (today <= 0) return yesterday > 0 ? `Yesterday ${yesterday} · close one` : 'Close a task to count today';
  if (yesterday <= 0) return today === 1 ? 'First ship today' : `${today} closed today`;
  const diff = today - yesterday;
  if (diff > 0) return `+${diff} vs yesterday`;
  if (diff < 0) return `${yesterday} yesterday`;
  return `Even with yesterday`;
}

function PaceColumns({ today, yesterday, average }) {
  const max = Math.max(today, yesterday, average, 1);
  const chartH = 112;
  const rows = [
    {
      label: 'Today',
      value: today,
      bar: 'bg-gradient-to-t from-indigo-600 to-violet-400',
      glow: today > 0 ? 'shadow-[0_0_18px_rgba(80,67,243,0.45)]' : '',
      num: 'text-indigo-600 dark:text-indigo-300',
    },
    {
      label: 'Yesterday',
      value: yesterday,
      bar: 'bg-indigo-300/90 dark:bg-indigo-400/50',
      glow: '',
      num: 'text-foreground',
    },
    {
      label: '6-day avg',
      value: average,
      bar: 'bg-slate-300 dark:bg-slate-500/60',
      glow: '',
      num: 'text-muted-foreground',
    },
  ];

  return (
    <div className="mt-6 rounded-2xl border border-indigo-200/60 dark:border-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-950/20 px-3 sm:px-5 pt-4 pb-3">
      <div className="flex items-end gap-3 sm:gap-5" style={{ height: chartH }}>
        {rows.map((row) => {
          const h = row.value <= 0 ? 10 : Math.max(24, Math.round((row.value / max) * chartH));
          return (
            <div key={row.label} className="flex-1 min-w-0 h-full flex flex-col items-center justify-end gap-2">
              <span className={`text-sm sm:text-base font-bold tabular-nums leading-none ${row.num}`}>
                {formatFocusMinutes(row.value).label}
              </span>
              <div
                className={`w-full max-w-[64px] sm:max-w-[80px] rounded-t-2xl rounded-b-md transition-all duration-500 ${
                  row.value > 0 ? `${row.bar} ${row.glow}` : 'bg-muted-foreground/15'
                }`}
                style={{ height: `${h}px` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2.5 pt-2.5 border-t border-indigo-200/50 dark:border-indigo-500/15 flex gap-3 sm:gap-5">
        {rows.map((row) => (
          <p
            key={`${row.label}-label`}
            className="flex-1 text-center text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {row.label}
          </p>
        ))}
      </div>
    </div>
  );
}

function WorkInMotion({ todaysFocus, inProgress, backlog, done }) {
  const stages = [
    {
      key: 'todaysFocus',
      name: "Today's focus",
      value: todaysFocus,
      bar: 'bg-indigo-400 dark:bg-indigo-400/90',
      glow: todaysFocus > 0 ? 'shadow-[0_0_14px_rgba(129,140,248,0.35)]' : '',
      dot: 'bg-indigo-400',
      num: 'text-indigo-600 dark:text-indigo-300',
    },
    {
      key: 'progress',
      name: 'In progress',
      value: inProgress,
      bar: 'bg-sky-400 dark:bg-sky-400/90',
      glow: inProgress > 0 ? 'shadow-[0_0_14px_rgba(56,189,248,0.35)]' : '',
      dot: 'bg-sky-400',
      num: 'text-sky-600 dark:text-sky-300',
    },
    {
      key: 'backlog',
      name: 'Backlog',
      value: backlog,
      bar: 'bg-slate-400 dark:bg-slate-400/80',
      glow: backlog > 0 ? 'shadow-[0_0_14px_rgba(148,163,184,0.3)]' : '',
      dot: 'bg-slate-400',
      num: 'text-slate-600 dark:text-slate-300',
    },
    {
      key: 'done',
      name: 'Done',
      value: done,
      bar: 'bg-emerald-400 dark:bg-emerald-400/90',
      glow: done > 0 ? 'shadow-[0_0_14px_rgba(52,211,153,0.35)]' : '',
      dot: 'bg-emerald-400',
      num: 'text-emerald-600 dark:text-emerald-300',
    },
  ];
  const chartH = 132;
  const max = Math.max(1, ...stages.map((s) => s.value));
  const open = todaysFocus + inProgress + backlog;
  const total = open + done;
  const status =
    total <= 0
      ? 'No personal tasks yet — add one on the board.'
      : `${open} open · ${done} done`;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 sm:p-2 bg-gradient-to-br from-slate-100 to-indigo-100 dark:from-slate-800/80 dark:to-indigo-950/40 rounded-xl border border-slate-200/80 dark:border-slate-600/40">
            <ListTodo size={14} className="text-slate-600 dark:text-slate-300" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-foreground tracking-tight">Work in motion</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{status}</p>
          </div>
        </div>
        <Link
          href="/tasks"
          className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:underline mt-1"
        >
          Open tasks
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex-1 rounded-2xl border border-border/80 bg-muted/30 dark:bg-muted/15 px-2.5 sm:px-4 pt-5 pb-4">
        <div className="flex gap-2 sm:gap-4 mb-3">
          {stages.map((stage) => (
            <div key={`${stage.key}-num`} className="flex-1 text-center">
              <span className={`text-xl sm:text-3xl font-bold tabular-nums leading-none ${stage.num}`}>
                {stage.value}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-end gap-2 sm:gap-4" style={{ height: chartH }}>
          {stages.map((stage) => {
            const h =
              stage.value <= 0 ? 8 : Math.max(28, Math.round((stage.value / max) * chartH));
            return (
              <div key={stage.key} className="flex-1 min-w-0 h-full flex items-end justify-center">
                <div
                  className={`w-full max-w-[48px] sm:max-w-[64px] rounded-t-xl rounded-b-md transition-all duration-500 ${
                    stage.value > 0
                      ? `${stage.bar} ${stage.glow}`
                      : 'bg-muted-foreground/20 dark:bg-muted-foreground/25'
                  }`}
                  style={{ height: `${h}px` }}
                  title={`${stage.name}: ${stage.value}`}
                />
              </div>
            );
          })}
        </div>

        <div className="mt-3 pt-3 border-t border-border/60 flex gap-2 sm:gap-4">
          {stages.map((stage) => (
            <div key={`${stage.key}-label`} className="flex-1 min-w-0 text-center">
              <div className="flex items-center justify-center gap-1 sm:gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${stage.dot}`} />
                <span className="text-[10px] sm:text-xs font-semibold text-foreground truncate">
                  {stage.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InsightChip({ icon: Icon, label, value, hint, href, tone = 'indigo' }) {
  const tones = {
    indigo: {
      card: 'border-indigo-200/80 dark:border-indigo-500/30 bg-gradient-to-br from-indigo-100 to-indigo-50/60 dark:from-indigo-950/55 dark:to-card shadow-[0_8px_24px_-12px_rgba(80,67,243,0.45)]',
      iconWrap: 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30',
      value: 'text-indigo-700 dark:text-indigo-300',
      hover: 'hover:border-indigo-400/80 dark:hover:border-indigo-400/40',
    },
    violet: {
      card: 'border-violet-200/80 dark:border-violet-500/30 bg-gradient-to-br from-violet-100 to-fuchsia-50/70 dark:from-violet-950/55 dark:to-card shadow-[0_8px_24px_-12px_rgba(139,92,246,0.45)]',
      iconWrap: 'bg-violet-500 text-white shadow-md shadow-violet-500/35',
      value: 'text-violet-700 dark:text-violet-300',
      hover: 'hover:border-violet-400/80 dark:hover:border-violet-400/40',
    },
    emerald: {
      card: 'border-emerald-200/80 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-100 to-teal-50/70 dark:from-emerald-950/50 dark:to-card shadow-[0_8px_24px_-12px_rgba(16,185,129,0.4)]',
      iconWrap: 'bg-emerald-500 text-white shadow-md shadow-emerald-500/35',
      value: 'text-emerald-700 dark:text-emerald-300',
      hover: 'hover:border-emerald-400/80 dark:hover:border-emerald-400/40',
    },
    amber: {
      card: 'border-amber-200/80 dark:border-amber-500/30 bg-gradient-to-br from-amber-100 to-orange-50/70 dark:from-amber-950/50 dark:to-card shadow-[0_8px_24px_-12px_rgba(245,158,11,0.4)]',
      iconWrap: 'bg-amber-500 text-white shadow-md shadow-amber-500/35',
      value: 'text-amber-800 dark:text-amber-300',
      hover: 'hover:border-amber-400/80 dark:hover:border-amber-400/40',
    },
  };
  const t = tones[tone] || tones.indigo;
  const body = (
    <div className="flex items-start gap-3">
      <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${t.iconWrap}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        <p className={`text-2xl font-bold tracking-tight leading-tight mt-0.5 ${t.value}`}>{value}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{hint}</p>
      </div>
    </div>
  );
  const className = `flex-1 rounded-2xl border ${t.card} px-3.5 py-4 flex flex-col justify-center min-h-[88px]`;
  if (href) {
    return (
      <Link href={href} className={`${className} ${t.hover} transition-colors`}>
        {body}
      </Link>
    );
  }
  return <div className={className}>{body}</div>;
}

function StreakForge({
  streak,
  atRisk,
  todayLocked,
  longest,
  title,
  nextTarget,
  remaining,
  progress,
  chain,
  todayKey,
}) {
  const [ranksOpen, setRanksOpen] = useState(false);
  const lit = streak > 0;
  const theme = streakRankTheme(title);
  const headline = !lit
    ? 'Light today’s flame'
    : atRisk
      ? `Day ${streak} is on the line`
      : `Day ${streak} locked in`;
  const nextName = nextTarget ? nextRankTitle(nextTarget) : null;
  const nextTheme = nextName ? streakRankTheme(nextName) : null;
  const sub = !lit
    ? 'One focused session today starts the chain. Come back tomorrow and it grows.'
    : atRisk
      ? `Focus today or this ${streak}-day run resets at midnight.`
      : remaining > 0 && nextName
        ? `Come back tomorrow. ${remaining} more ${remaining === 1 ? 'day' : 'days'} to ${nextName}.`
        : 'Come back tomorrow — the flame only grows if you show up.';
  const infoStyle = streakRankPillStyle(title) || {
    backgroundColor: 'var(--muted)',
    color: 'var(--muted-foreground)',
    borderColor: 'var(--border)',
  };

  return (
    <div className={`${dashboardPanelClass} !justify-start h-full bg-gradient-to-br from-amber-50/80 via-card to-orange-50/50 dark:from-amber-950/30 dark:via-card dark:to-orange-950/20 border-amber-200/70 dark:border-amber-500/20`}>
      <div
        className="absolute -top-8 -right-8 w-40 h-40 rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: theme.glowSoft }}
      />
      <div
        className="absolute bottom-0 left-0 w-24 h-24 rounded-full blur-2xl pointer-events-none"
        style={{ backgroundColor: hexToRgba(theme.hex, lit ? 0.14 : 0.06) }}
      />
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-300">
                Daily streak
              </span>
              <button
                type="button"
                onClick={() => setRanksOpen(true)}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border transition-colors hover:brightness-110"
                style={infoStyle}
                aria-label="What streak ranks mean"
              >
                <Info className="h-3.5 w-3.5" strokeWidth={2.25} />
              </button>
              {title ? (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                  style={
                    streakRankPillStyle(title) || {
                      backgroundColor: 'var(--muted)',
                      color: 'var(--muted-foreground)',
                      borderColor: 'var(--border)',
                    }
                  }
                >
                  {title}
                </span>
              ) : null}
            </div>
            <p className="text-lg sm:text-xl font-bold text-foreground tracking-tight leading-tight">{headline}</p>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{sub}</p>
          </div>
          <div className="shrink-0 flex flex-col items-center">
            <div
              className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center border ${
                lit ? '' : 'bg-muted border-border'
              } ${atRisk ? 'animate-pulse' : ''} ${lit && theme.motion === 'orbit' ? 'srk-mark--orbit' : ''} ${
                lit && theme.motion === 'shine' ? 'srk-mark--shine' : ''
              }`}
              style={
                lit
                  ? {
                      background: theme.well,
                      borderColor: hexToRgba(theme.hex, 0.7),
                      boxShadow: theme.shadow,
                    }
                  : undefined
              }
            >
              {lit && theme.motion === 'orbit' ? (
                <>
                  <span className="srk-orbit srk-orbit--a" />
                  <span className="srk-orbit srk-orbit--b" />
                </>
              ) : null}
              {lit && theme.motion === 'shine' ? <span className="srk-sheen" /> : null}
              <Flame
                className={`relative z-[1] w-8 h-8 sm:w-10 sm:h-10 ${lit ? 'text-white' : 'text-muted-foreground'}`}
                fill={lit ? 'currentColor' : 'none'}
                strokeWidth={lit ? 1.5 : 2}
              />
            </div>
            <p className="mt-1.5 text-3xl sm:text-4xl font-bold tabular-nums text-foreground leading-none">{streak}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
              {streak === 1 ? 'day' : 'days'}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          {(Array.isArray(chain) ? chain : []).map((day) => {
            const on = day.focusMinutes > 0;
            const isToday = day.date === todayKey;
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  className={`w-full max-w-[36px] aspect-square rounded-xl flex items-center justify-center border transition-transform ${
                    on
                      ? 'text-white'
                      : isToday
                        ? 'border-dashed'
                        : 'border-border bg-muted/60 text-muted-foreground'
                  } ${isToday && !on ? 'animate-pulse' : ''}`}
                  style={
                    on
                      ? {
                          background: theme.well,
                          borderColor: hexToRgba(theme.from, 0.85),
                          boxShadow: `0 4px 12px ${hexToRgba(theme.to, 0.28)}`,
                        }
                      : isToday
                        ? {
                            borderColor: theme.hex,
                            backgroundColor: hexToRgba(theme.hex, 0.12),
                            color: theme.to,
                          }
                        : undefined
                  }
                  title={`${day.label}: ${on ? 'lit' : isToday ? 'today — still open' : 'missed'}`}
                >
                  <Flame className="w-3.5 h-3.5" fill={on ? 'currentColor' : 'none'} strokeWidth={2} />
                </div>
                <span className="text-[9px] font-semibold uppercase text-muted-foreground" style={isToday ? { color: theme.to } : undefined}>
                  {day.weekday || day.label}
                </span>
              </div>
            );
          })}
        </div>

        {nextTarget ? (
          <div className="mt-4">
            <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              <span>
                Next: {nextTarget}-day{' '}
                <span style={nextTheme ? { color: nextTheme.to } : undefined}>{nextName}</span>
              </span>
              <span>{remaining} to go</span>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: hexToRgba(theme.hex, 0.16) }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max(lit ? 8 : 0, progress || 0)}%`,
                  background: nextTheme
                    ? `linear-gradient(90deg, ${theme.hex}, ${nextTheme.hex})`
                    : theme.progress,
                }}
              />
            </div>
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-[11px] font-medium text-muted-foreground">
            Best run {longest || 0} {longest === 1 ? 'day' : 'days'}
          </p>
          {todayLocked ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              Today’s flame is locked
            </span>
          ) : (
            <Link
              href="/focus"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-xs font-bold transition-all hover:brightness-110"
              style={{ background: theme.ctaH, boxShadow: `0 4px 14px ${hexToRgba(theme.to, 0.32)}` }}
            >
              {lit ? `Keep day ${streak + 1}` : 'Light it now'}
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
      <StreakRanksModal
        open={ranksOpen}
        onClose={() => setRanksOpen(false)}
        streak={streak}
        currentTitle={title}
      />
    </div>
  );
}

function nextRankTitle(target) {
  if (target === 1) return 'Spark';
  if (target === 3) return 'Ember';
  if (target === 7) return 'Week flame';
  if (target === 14) return 'On fire';
  if (target === 21) return 'Deep burn';
  if (target === 30) return 'Inferno';
  if (target === 50) return 'Legend';
  if (target === 100) return 'Mythic';
  return 'rank';
}

function WeekProgress({ days, totalLabel, delta, priorMinutes, todayKey }) {
  const list = Array.isArray(days) ? days : [];
  const maxDay = Math.max(1, ...list.map((d) => Number(d.focusMinutes) || 0));
  const total = list.reduce((sum, d) => sum + (Number(d.focusMinutes) || 0), 0);
  const lit = list.filter((d) => (Number(d.focusMinutes) || 0) > 0).length;
  const best = list.reduce(
    (acc, d) => {
      const mins = Number(d.focusMinutes) || 0;
      return mins > acc.mins ? { weekday: d.weekday || d.label, mins } : acc;
    },
    { weekday: '', mins: 0 }
  );
  const tankMax = Math.max(total, priorMinutes || 0, 1);
  const thisPct = Math.min(100, (total / tankMax) * 100);
  const priorPct = Math.min(100, ((priorMinutes || 0) / tankMax) * 100);
  const beating = (priorMinutes || 0) > 0 && total >= priorMinutes;
  const raceHint =
    (priorMinutes || 0) <= 0
      ? 'First week on the board — keep stacking days.'
      : beating
        ? `Ahead of the prior 7 days (${formatFocusMinutes(priorMinutes).label}).`
        : `${formatFocusMinutes(Math.max(0, priorMinutes - total)).label} to match last week.`;

  return (
    <div className={`${dashboardPanelClass} !justify-start h-full bg-gradient-to-br from-sky-50/90 via-card to-cyan-50/50 dark:from-sky-950/30 dark:via-card dark:to-cyan-950/20 border-sky-200/70 dark:border-sky-500/20`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-sky-400/20 dark:bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-300 uppercase tracking-widest">
            Last 7 days
          </span>
          <div className="p-1.5 sm:p-2 bg-gradient-to-br from-sky-100 to-cyan-100 dark:from-sky-950/55 dark:to-cyan-950/35 rounded-xl shadow-sm border border-sky-200/50 dark:border-sky-500/25">
            <Focus size={14} className="text-sky-600 dark:text-sky-400" />
          </div>
        </div>
        <p className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums tracking-tight">{totalLabel}</p>
        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          {delta != null ? (
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
                delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              <TrendingUp className={`w-3 h-3 ${delta < 0 ? 'rotate-180' : ''}`} />
              {delta >= 0 ? '+' : ''}
              {delta}% vs prior 7
            </span>
          ) : null}
          <span className="text-[10px] font-medium text-muted-foreground">
            {lit} of 7 days
            {best.mins > 0 ? ` · peak ${best.weekday}` : ''}
          </span>
        </div>

        <div className="mt-5">
          <div className="flex items-end gap-1.5 h-[72px]">
            {list.map((day) => {
              const mins = Number(day.focusMinutes) || 0;
              const isToday = day.date === todayKey;
              const isPeak = best.mins > 0 && mins === best.mins;
              const h = mins <= 0 ? 6 : Math.max(14, Math.round((mins / maxDay) * 72));
              return (
                <div
                  key={day.date}
                  title={`${day.weekday || day.label}: ${formatFocusMinutes(mins).label}`}
                  className="flex-1 flex items-end h-full min-w-0"
                >
                  <div
                    className={`w-full rounded-md transition-all ${
                      mins > 0
                        ? isToday
                          ? 'bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.45)]'
                          : isPeak
                            ? 'bg-cyan-400 dark:bg-cyan-400/90'
                            : 'bg-sky-300/90 dark:bg-sky-500/55'
                        : isToday
                          ? 'bg-sky-200 dark:bg-sky-900/70 animate-pulse'
                          : 'bg-muted'
                    }`}
                    style={{ height: `${h}px` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-1.5 flex gap-1.5">
            {list.map((day) => {
              const isToday = day.date === todayKey;
              const letter = String(day.weekday || day.label || '').slice(0, 1);
              return (
                <span
                  key={`${day.date}-label`}
                  className={`flex-1 text-center text-[9px] font-bold uppercase tracking-wider ${
                    isToday ? 'text-sky-700 dark:text-sky-300' : 'text-muted-foreground'
                  }`}
                >
                  {letter}
                </span>
              );
            })}
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Week vs last
            </span>
            {beating ? (
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Ahead</span>
            ) : (priorMinutes || 0) > 0 ? (
              <span className="text-[10px] font-medium text-muted-foreground">Catching up</span>
            ) : null}
          </div>
          <div className="relative h-2 rounded-full bg-muted overflow-visible">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-sky-500"
              style={{ width: `${thisPct}%` }}
            />
            {(priorMinutes || 0) > 0 ? (
              <span
                title={`Prior 7 days: ${formatFocusMinutes(priorMinutes).label}`}
                className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3.5 rounded-full bg-foreground/70"
                style={{ left: `calc(${priorPct}% - 1px)` }}
              />
            ) : null}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground leading-snug">{raceHint}</p>
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border bg-card/60">
      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const focus = payload.find((p) => p.dataKey === 'focusMinutes')?.value ?? 0;
  const tasks = payload.find((p) => p.dataKey === 'tasksCompleted')?.value ?? 0;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-[11px] font-semibold text-muted-foreground mb-1">{label}</p>
      <p className="text-xs font-semibold text-foreground">
        {formatFocusMinutes(focus).label} focused
      </p>
      <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
        {tasks} {tasks === 1 ? 'task' : 'tasks'} shipped
      </p>
    </div>
  );
}

function formatHeatmapMinutes(minutes) {
  const m = Number(minutes) || 0;
  if (m <= 0) return '0m';
  if (m < 1) return `${Math.max(1, Math.round(m * 60))}s`;
  return formatFocusMinutes(m).label;
}

function hourShort(hour) {
  const h = ((Number(hour) || 0) + 24) % 24;
  const suffix = h < 12 ? 'am' : 'pm';
  return `${h % 12 || 12}${suffix}`;
}

function heatmapTone(intensity) {
  if (intensity <= 0) return 'bg-muted/70 dark:bg-muted/40';
  if (intensity < 0.25) return 'bg-violet-200 dark:bg-violet-900/80';
  if (intensity < 0.5) return 'bg-violet-400/80 dark:bg-violet-700';
  if (intensity < 0.75) return 'bg-fuchsia-500';
  return 'bg-fuchsia-600 dark:bg-fuchsia-400';
}

function FocusHeatmap({ dayLabels, peakByDayHour, todayByHour, maxPeakCell, focusingNow = false }) {
  const [tip, setTip] = useState(null);
  const labels = Array.isArray(dayLabels) && dayLabels.length ? dayLabels : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const matrix = Array.isArray(peakByDayHour) ? peakByDayHour : [];
  const todayHours = Array.isArray(todayByHour) ? todayByHour : Array.from({ length: 24 }, () => 0);
  const max = Math.max(0, Number(maxPeakCell) || 0);
  const todayMax = Math.max(0, ...todayHours.map((n) => Number(n) || 0));
  const todayIndex = (new Date().getDay() + 6) % 7;
  const nowHour = new Date().getHours();

  let peakDay = -1;
  let peakHour = -1;
  let peakMins = 0;
  labels.forEach((_, dayIndex) => {
    for (let hour = 0; hour < 24; hour += 1) {
      const mins = Number(matrix[dayIndex]?.[hour]) || 0;
      if (mins > peakMins) {
        peakMins = mins;
        peakDay = dayIndex;
        peakHour = hour;
      }
    }
  });

  const hourTotals = Array.from({ length: 24 }, (_, hour) =>
    labels.reduce((sum, _, dayIndex) => sum + (Number(matrix[dayIndex]?.[hour]) || 0), 0)
  );
  const dayTotals = labels.map((_, dayIndex) =>
    (matrix[dayIndex] || []).reduce((sum, mins) => sum + (Number(mins) || 0), 0)
  );
  const nightMins = hourTotals.slice(0, 6).reduce((s, n) => s + n, 0) + hourTotals.slice(22).reduce((s, n) => s + n, 0);
  const startHour = nightMins > 0 || nowHour < 6 ? 0 : 6;
  const endHour = nightMins > 0 || nowHour >= 22 ? 24 : 22;
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const typicalPeakHour = hourTotals.reduce((best, mins, hour) => (mins > hourTotals[best] ? hour : best), 0);
  const heaviestDay = dayTotals.reduce((best, mins, i) => (mins > dayTotals[best] ? i : best), 0);

  const insight =
    max <= 0 && todayMax <= 0
      ? 'No focused hours in the last 30 days yet. Turn on Focusing and this map fills in as you work.'
      : `Most time on ${labels[heaviestDay]}s, around ${hourShort(typicalPeakHour)}.`;

  const showTip = (event, payload) => {
    setTip({
      x: event.clientX,
      y: event.clientY,
      ...payload,
    });
  };

  const hourTick = (hour) => `${((hour + 11) % 12) + 1}${hour < 12 ? 'a' : 'p'}`;

  return (
    <div className="min-w-0">
      <p className="text-sm text-muted-foreground mb-4">{insight}</p>

      <div
        className="grid gap-y-1.5 gap-x-1 min-w-0"
        style={{ gridTemplateColumns: `2.75rem repeat(${hours.length}, minmax(0, 1fr))` }}
      >
        <span />
        {hours.map((hour) => (
          <span
            key={`hlabel-${hour}`}
            className={`text-center text-[10px] font-semibold leading-none pb-1 ${
              hour === nowHour ? 'text-violet-600 dark:text-violet-300' : 'text-muted-foreground'
            }`}
          >
            {hour === nowHour || hour % 3 === startHour % 3 ? hourTick(hour) : ''}
          </span>
        ))}

        <span className="self-center leading-tight pr-1 text-violet-700 dark:text-violet-300">
          <span className="block text-xs font-bold">Today</span>
          <span className="block text-[10px] font-semibold tabular-nums">
            {formatHeatmapMinutes(todayHours.reduce((s, n) => s + (Number(n) || 0), 0))}
          </span>
        </span>
        {hours.map((hour) => {
          const minutes = Number(todayHours[hour]) || 0;
          const upcoming = hour > nowHour;
          const isNow = hour === nowHour;
          const intensity = todayMax > 0 ? minutes / todayMax : 0;
          let cellClass = heatmapTone(intensity);
          if (upcoming) {
            cellClass = 'bg-violet-50/80 dark:bg-violet-950/20 ring-1 ring-inset ring-violet-200/70 dark:ring-violet-500/20';
          } else if (isNow && minutes <= 0) {
            cellClass = focusingNow
              ? 'bg-violet-200 dark:bg-violet-800/70 animate-pulse'
              : 'bg-violet-100 dark:bg-violet-900/40 ring-1 ring-inset ring-violet-400/70';
          }
          return (
            <button
              key={`today-${hour}`}
              type="button"
              className={`h-8 sm:h-9 w-full rounded-md border-0 p-0 cursor-default ${cellClass} ${
                isNow && minutes > 0 ? 'ring-1 ring-inset ring-white/80 dark:ring-white/50' : ''
              }`}
              onMouseEnter={(e) =>
                showTip(e, {
                  title: `Today ${hourShort(hour)}–${hourShort(hour + 1)}`,
                  body: upcoming
                    ? 'Still ahead — this hour hasn’t started'
                    : minutes <= 0
                      ? isNow
                        ? focusingNow
                          ? 'Focusing now — time will land here'
                          : 'No focus in this hour yet'
                        : 'No focus in this hour'
                      : `${formatHeatmapMinutes(minutes)} today`,
                  hint: isNow ? 'This hour' : '',
                })
              }
              onMouseMove={(e) =>
                setTip((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : prev))
              }
              onMouseLeave={() => setTip(null)}
              aria-label={`Today ${hourShort(hour)}: ${formatHeatmapMinutes(minutes)}`}
            />
          );
        })}

        {labels.map((label, dayIndex) => (
          <React.Fragment key={label}>
            <span
              className={`self-center leading-tight pr-1 ${
                dayIndex === todayIndex ? 'text-violet-600 dark:text-violet-300' : 'text-muted-foreground'
              }`}
            >
              <span className="block text-xs font-semibold">{label}</span>
              <span className="block text-[10px] font-semibold tabular-nums">
                {formatHeatmapMinutes(dayTotals[dayIndex])}
              </span>
            </span>
            {hours.map((hour) => {
              const minutes = Number(matrix[dayIndex]?.[hour]) || 0;
              const intensity = max > 0 ? minutes / max : 0;
              const isPeak = dayIndex === peakDay && hour === peakHour && minutes > 0;
              return (
                <button
                  key={`${label}-${hour}`}
                  type="button"
                  className={`h-8 sm:h-9 w-full rounded-md border-0 p-0 cursor-default ${heatmapTone(intensity)} ${
                    isPeak ? 'ring-1 ring-inset ring-white/80 dark:ring-white/50' : ''
                  }`}
                  onMouseEnter={(e) =>
                    showTip(e, {
                      title: `${label} ${hourShort(hour)}–${hourShort(hour + 1)}`,
                      body:
                        minutes <= 0
                          ? 'No focus in this hour'
                          : `${formatHeatmapMinutes(minutes)} over the last 30 days`,
                      hint: isPeak ? 'Your strongest slot' : '',
                    })
                  }
                  onMouseMove={(e) =>
                    setTip((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : prev))
                  }
                  onMouseLeave={() => setTip(null)}
                  aria-label={`${label} ${hourShort(hour)}: ${formatHeatmapMinutes(minutes)}`}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
          <span>Less</span>
          {[0, 0.2, 0.45, 0.7, 1].map((i) => (
            <span key={i} className={`h-3.5 w-3.5 rounded-sm ${heatmapTone(i)}`} />
          ))}
          <span>More</span>
        </div>
        <span className="text-[11px] text-muted-foreground">
          Top row is today · rows below are a typical week
        </span>
      </div>

      {tip ? (
        <div
          className="pointer-events-none fixed z-50 w-52 rounded-xl border border-border bg-card px-3 py-2 shadow-xl"
          style={{
            left: Math.min(tip.x + 12, (typeof window !== 'undefined' ? window.innerWidth : 400) - 220),
            top: Math.max(8, tip.y - 64),
          }}
        >
          <p className="text-[11px] font-semibold text-foreground">{tip.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{tip.body}</p>
          {tip.hint ? (
            <p className="text-[10px] font-semibold text-violet-600 dark:text-violet-300 mt-1">{tip.hint}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
