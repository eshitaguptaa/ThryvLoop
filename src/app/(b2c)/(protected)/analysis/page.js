'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useAuth, useUser } from '@clerk/nextjs';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { 
  Download, 
  TrendingUp,
  Target,
  CheckCircle2,
  ListTodo,
  Database,
  Activity,
  Flame,
  CircleDot,
  Video,
  Mail,
} from 'lucide-react';
import ThryvAIInsightCard from '@/components/analysis/ThryvAIInsightCard';
import { captureAnalyticsCharts } from '@/lib/analysis/captureChartImages';
import { useWorkspace } from '@/hooks/useWorkspace';
import { Outfit } from 'next/font/google';
import { getSupabaseClient, setSupabaseAuthToken, getFocusTimerStateFromSupabase } from '@/utils/userStorage';
import {
  appSurfaceClass,
  appSurfaceInsetClass,
  appContentClass,
  appPageTitleClass,
  appEyebrowClass,
  appMutedTextClass,
} from '@/lib/appShellClasses';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-outfit',
});

const SHOW_SAMPLE_DATA = process.env.NODE_ENV !== 'production';

export default function AnalyticsDashboard() {
  const { user } = useUser();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const userId = user?.id || null;

  const [tasks, setTasks] = useState([]);
  const [focusState, setFocusState] = useState(null);
  const [focusSessions, setFocusSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedMessage, setSeedMessage] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState('');
  const [cachedInsight, setCachedInsight] = useState(null);

  const focusSessionsChartRef = useRef(null);
  const sessionsPerDayChartRef = useRef(null);
  const taskDistributionChartRef = useRef(null);

  const {
    meetingMinutesToday,
    meetingMinutesThisWeek,
    inMeeting,
    hasConnection,
  } = useWorkspace({ enabled: Boolean(isSignedIn && userId) });

  const loadData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError('');
    try {
      const token = await getToken({ template: 'supabase' });
      if (!token) {
        setError('Unable to authenticate.');
        return;
      }
      setSupabaseAuthToken(token);
      const supabase = getSupabaseClient();
      if (!supabase) {
        setError('Database not configured.');
        return;
      }
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const sinceIso = since.toISOString();
      const [tasksRes, focusRes, sessionsRes] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
        getFocusTimerStateFromSupabase(userId),
        supabase.from('focus_sessions').select('*').eq('user_id', userId).gte('completed_at', sinceIso).order('completed_at', { ascending: true }),
      ]);
      if (tasksRes.error) throw new Error(tasksRes.error.message || 'Failed to load tasks');
      if (sessionsRes.error) {
        setFocusSessions([]);
      } else {
        setFocusSessions(sessionsRes.data || []);
      }
      setTasks(tasksRes.data || []);
      setFocusState(focusRes || null);
    } catch (e) {
      setError(e?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [getToken, userId]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) {
      setLoading(false);
      return;
    }
    loadData();
  }, [isLoaded, isSignedIn, userId, loadData]);

  const handleLoadSampleData = async () => {
    setSeedLoading(true);
    setSeedMessage('');
    try {
      const res = await fetch('/api/seed-insights', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSeedMessage(data.error || 'Failed to load sample data.');
        return;
      }
      await loadData();
      setSeedMessage(
        `Sample data loaded: ${data.focus_sessions_added ?? 0} focus session(s), ${data.tasks_added ?? 0} task(s). Charts refresh automatically.`
      );
    } catch (e) {
      setSeedMessage(e?.message || 'Request failed.');
    } finally {
      setSeedLoading(false);
    }
  };

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const dateString = today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

  const tasksByColumn = {
    todaysFocus: tasks.filter((t) => t.column_key === 'todaysFocus'),
    inProgress: tasks.filter((t) => t.column_key === 'inProgress'),
    backlog: tasks.filter((t) => t.column_key === 'backlog'),
    done: tasks.filter((t) => t.column_key === 'done'),
  };
  const todaysFocusCount = tasksByColumn.todaysFocus.length;
  const inProgressCount = tasksByColumn.inProgress.length;
  const backlogCount = tasksByColumn.backlog.length;
  const doneCount = tasksByColumn.done.length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed_at);
  const highPriorityCount = tasks.filter((t) => t.priority?.level === 'High Priority').length;
  const now = Date.now();
  const overdueCount = tasks.filter((t) => t.column_key !== 'done' && t.due_date && new Date(t.due_date).getTime() < now).length;

  const categoryCounts = tasks.reduce((acc, t) => {
    const cat = t.category || 'Other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const sessionsTodayFromDb = focusSessions.filter((s) => s.completed_at && s.completed_at.slice(0, 10) === todayStr).length;
  const sessionsDate = focusState?.sessions?.date || todayStr;
  const isToday = sessionsDate === todayStr;
  const displaySessions = isToday ? (focusState?.sessions?.today ?? sessionsTodayFromDb) : sessionsTodayFromDb;
  const sessionMinutes = focusState?.settings?.sessionMinutes ?? 25;
  const focusMinutesToday = displaySessions * sessionMinutes;
  const preferredMode = focusState?.timer?.mode || focusState?.settings?.timerMode || 'pomodoro';
  const modeLabel = preferredMode === 'pomodoro' ? 'Pomodoro' : preferredMode === 'stopwatch' ? 'Stopwatch' : 'Countdown';
  const focusEfficiency = totalTasks > 0 ? Math.min(100, Math.round((displaySessions / 8) * 100 + (todaysFocusCount / totalTasks) * 30)) : Math.min(100, Math.round((displaySessions / 8) * 100));

  const DAYS_TREND = 14;
  const trendDays = Array.from({ length: DAYS_TREND }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (DAYS_TREND - 1 - i));
    return d.toISOString().slice(0, 10);
  });
  const sessionsByDay = {};
  const focusMinutesByDay = {};
  trendDays.forEach((d) => {
    sessionsByDay[d] = 0;
    focusMinutesByDay[d] = 0;
  });
  focusSessions.forEach((s) => {
    if (!s.completed_at) return;
    const d = s.completed_at.slice(0, 10);
    if (trendDays.includes(d)) {
      sessionsByDay[d] = (sessionsByDay[d] || 0) + 1;
      focusMinutesByDay[d] = (focusMinutesByDay[d] || 0) + (s.duration_seconds || 0) / 60;
    }
  });
  const chartData = trendDays.map((d) => ({
    date: d,
    label: new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    sessions: sessionsByDay[d] ?? 0,
    focusMinutes: Math.round(focusMinutesByDay[d] ?? 0),
  }));

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const weekStartStr = startOfWeek.toISOString().slice(0, 10);
  const sessionsThisWeek = focusSessions.filter((s) => s.completed_at && s.completed_at.slice(0, 10) >= weekStartStr).length;
  const focusMinutesThisWeek = focusSessions
    .filter((s) => s.completed_at && s.completed_at.slice(0, 10) >= weekStartStr)
    .reduce((sum, s) => sum + (s.duration_seconds || 0) / 60, 0);
  const productiveMinutesToday = Math.round(focusMinutesToday + meetingMinutesToday);
  const productiveMinutesThisWeek = Math.round(focusMinutesThisWeek + meetingMinutesThisWeek);
  const tasksCompletedThisWeek = completedTasks.filter((t) => t.completed_at && t.completed_at.slice(0, 10) >= weekStartStr).length;

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const peakByDayHour = {};
  dayLabels.forEach((_, i) => { peakByDayHour[i] = Array.from({ length: 24 }, () => 0); });
  focusSessions.forEach((s) => {
    if (!s.completed_at) return;
    const d = new Date(s.completed_at);
    peakByDayHour[d.getDay()][d.getHours()]++;
  });
  const maxPeakCell = Math.max(1, ...dayLabels.flatMap((_, i) => peakByDayHour[i]));

  let streak = 0;
  for (let i = 0; i < DAYS_TREND; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    if ((sessionsByDay[ds] ?? 0) > 0) streak++;
    else break;
  }

  let peakDayIndex = 0;
  let peakHour = 0;
  let peakSessionCount = 0;
  dayLabels.forEach((_, dayIndex) => {
    for (let hour = 0; hour < 24; hour += 1) {
      const count = peakByDayHour[dayIndex]?.[hour] ?? 0;
      if (count > peakSessionCount) {
        peakSessionCount = count;
        peakDayIndex = dayIndex;
        peakHour = hour;
      }
    }
  });

  const aiMetrics = useMemo(() => {
    const cats = tasks.reduce((acc, t) => {
      const cat = t.category || 'Other';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    return {
      date: todayStr,
      sessionsToday: displaySessions,
      focusMinutesToday: Math.round(focusMinutesToday),
      focusMinutesThisWeek: Math.round(focusMinutesThisWeek),
      sessionsThisWeek,
      tasksCompletedThisWeek,
      streak,
      focusEfficiency,
      totalTasks,
      doneCount,
      highPriorityCount,
      overdueCount,
      todaysFocusCount,
      inProgressCount,
      backlogCount,
      meetingMinutesToday,
      productiveMinutesToday,
      productiveMinutesThisWeek,
      timerMode: modeLabel,
      categoryCounts: cats,
      peakFocusWindow:
        peakSessionCount > 0
          ? `${dayLabels[peakDayIndex]} ${peakHour % 12 || 12}${peakHour >= 12 ? 'pm' : 'am'} (${peakSessionCount} sessions)`
          : null,
      calendarConnected: hasConnection,
      inMeeting,
    };
  }, [
    tasks,
    todayStr,
    displaySessions,
    focusMinutesToday,
    focusMinutesThisWeek,
    sessionsThisWeek,
    tasksCompletedThisWeek,
    streak,
    focusEfficiency,
    totalTasks,
    doneCount,
    highPriorityCount,
    overdueCount,
    todaysFocusCount,
    inProgressCount,
    backlogCount,
    meetingMinutesToday,
    productiveMinutesToday,
    productiveMinutesThisWeek,
    modeLabel,
    peakSessionCount,
    peakDayIndex,
    peakHour,
    hasConnection,
    inMeeting,
  ]);

  const taskDistributionData = [
    { name: "Today's Focus", value: todaysFocusCount, color: '#5043F3' },
    { name: 'In Progress', value: inProgressCount, color: '#f59e0b' },
    { name: 'Backlog', value: backlogCount, color: '#64748b' },
    { name: 'Done', value: doneCount, color: '#10b981' },
  ].filter((d) => d.value > 0);

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
        focusSessions: focusSessionsChartRef.current,
        sessionsPerDay: sessionsPerDayChartRef.current,
        taskDistribution: taskDistributionChartRef.current,
      });

      const peakMatrix = dayLabels.map((_, dayIndex) =>
        Array.from({ length: 24 }, (_, hour) => peakByDayHour[dayIndex]?.[hour] ?? 0)
      );

      const res = await fetch('/api/analysis/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName:
            user?.firstName ||
            user?.username ||
            user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ||
            'User',
          dateString,
          metrics: aiMetrics,
          chartData,
          taskDistribution: taskDistributionData,
          peakByDayHour: peakMatrix,
          dayLabels,
          maxPeakCell,
          categoryCounts,
          insight,
          charts,
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
      a.download = `thryvloop-report-${todayStr}.pdf`;
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

  const THRYV_PURPLE = '#5043F3';

  if (loading) {
    return (
      <div className={`${appSurfaceClass} ${outfit.className} flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-2 border-indigo-200 border-t-[#5043F3] rounded-full animate-spin" />
          <p className={`${appMutedTextClass} font-medium tracking-wide`}>Loading analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${appSurfaceClass} ${appSurfaceInsetClass} ${outfit.className}`}>
      <main className={`${appContentClass} max-w-[1600px] py-4 lg:py-6`}>
        {error && (
          <div className="mb-6 py-3 px-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium">
            {error}
          </div>
        )}
        {SHOW_SAMPLE_DATA && seedMessage && (
          <div className="mb-6 py-3 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
            {seedMessage}
          </div>
        )}
        {exportError && (
          <div className="mb-6 py-3 px-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-medium">
            {exportError}
          </div>
        )}

        {/* Header */}
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">
          <div>
            <p className={appEyebrowClass}>Insights</p>
            <h1 className={appPageTitleClass}>
              Analytics
            </h1>
            <p className={`mt-2 ${appMutedTextClass} font-medium`}>{dateString}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {SHOW_SAMPLE_DATA ? (
            <button
              type="button"
              onClick={handleLoadSampleData}
              disabled={seedLoading || loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5043F3] hover:bg-[#4337D9] disabled:opacity-50 disabled:pointer-events-none text-white font-semibold text-sm transition-colors shadow-lg shadow-indigo-200/50"
            >
              {seedLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Database className="w-4 h-4" />
              )}
              Load sample data
            </button>
            ) : null}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={loading || !!error || exportLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5043F3] hover:bg-[#4337D9] disabled:opacity-50 disabled:pointer-events-none text-white font-semibold text-sm transition-colors shadow-lg shadow-indigo-200/50 dark:shadow-indigo-900/30"
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

        {/* Main chart: Focus time (area) + Sessions (line) — above KPI cards */}
        <div className="rounded-2xl bg-card border border-border overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 mb-8 lg:mb-10" style={{ boxShadow: '0 4px 24px -4px rgba(0,0,0,0.06)' }}>
          <div className="p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 mb-5 border-b border-border">
            <div>
              <h2 className="text-lg font-bold text-foreground tracking-tight">Focus & sessions</h2>
              <p className="text-sm text-muted-foreground mt-1">Last 14 days · focus time (min) & session count</p>
            </div>
            <div className="flex gap-3">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#5043F3]/10 text-[#5043F3] text-xs font-semibold border border-[#5043F3]/20">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5043F3]" /> Focus (min)
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#06b6d4]/10 text-[#06b6d4] text-xs font-semibold border border-[#06b6d4]/20">
                <span className="w-2.5 h-2.5 rounded-full bg-[#06b6d4]" /> Sessions
              </span>
            </div>
          </div>
          <div className="h-[320px] w-full" ref={focusSessionsChartRef}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={THRYV_PURPLE} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={THRYV_PURPLE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 40px -12px rgba(0,0,0,0.15)' }}
                  labelStyle={{ color: '#475569' }}
                  formatter={(value, name) => [name === 'focusMinutes' ? `${value} min` : value, name === 'focusMinutes' ? 'Focus' : 'Sessions']}
                  labelFormatter={(label) => label}
                />
                <Area yAxisId="left" type="monotone" dataKey="focusMinutes" name="focusMinutes" stroke={THRYV_PURPLE} strokeWidth={2} fill="url(#focusGradient)" />
                <Line yAxisId="right" type="monotone" dataKey="sessions" name="sessions" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4', r: 3 }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          </div>
        </div>

        {/* KPI strip — below Focus & sessions chart */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4 sm:gap-5 mb-10">
          {[
            { label: 'Sessions today', value: displaySessions, sub: `${focusMinutesToday} min timer`, icon: Activity, color: '#5043F3', bg: 'rgba(80, 67, 243, 0.08)' },
            { label: 'Meetings today', value: meetingMinutesToday, sub: inMeeting ? 'In meeting now' : hasConnection ? 'calendar' : 'Not connected', icon: Video, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.08)' },
            { label: 'Productive today', value: productiveMinutesToday, sub: 'focus + meetings', icon: TrendingUp, color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.08)' },
            { label: 'Productive (week)', value: productiveMinutesThisWeek, sub: 'minutes', icon: Mail, color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.08)' },
            { label: 'Tasks done (week)', value: tasksCompletedThisWeek, sub: 'completed', icon: CheckCircle2, color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)' },
            { label: 'Streak', value: streak, sub: 'days', icon: Flame, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)' },
            { label: 'Efficiency', value: `${focusEfficiency}%`, sub: modeLabel, icon: Target, color: '#5043F3', bg: 'rgba(80, 67, 243, 0.08)' },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="group relative rounded-2xl bg-card border border-border overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-black/10 hover:border-border hover:-translate-y-0.5"
              style={{ boxShadow: '0 4px 24px -4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.02)' }}
            >
              <div className="absolute top-0 left-0 w-1 h-full opacity-90" style={{ backgroundColor: kpi.color }} />
              <div className="relative p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">{kpi.label}</span>
                  <div
                    className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: kpi.bg }}
                  >
                    <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} strokeWidth={2.5} />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                  {kpi.value}
                </p>
                <p className="text-xs font-medium text-muted-foreground mt-1">{kpi.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Sessions trend – line chart */}
          <div className="lg:col-span-2 rounded-2xl bg-card border border-border overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)] hover:-translate-y-0.5" style={{ boxShadow: '0 4px 24px -4px rgba(0,0,0,0.06)' }}>
            <div className="p-6">
            <div className="pb-4 mb-4 border-b border-border">
              <h2 className="text-lg font-bold text-foreground tracking-tight mb-1">Sessions per day</h2>
              <p className="text-sm text-muted-foreground">Daily session count · last 14 days</p>
            </div>
            <div className="h-[240px]" ref={sessionsPerDayChartRef}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 40px -12px rgba(0,0,0,0.15)' }}
                    formatter={(value) => [value, 'Sessions']}
                  />
                  <Line type="monotone" dataKey="sessions" stroke={THRYV_PURPLE} strokeWidth={2} dot={{ fill: THRYV_PURPLE, r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            </div>
          </div>

          {/* Task distribution – bar chart */}
          <div className="rounded-2xl bg-card border border-border overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)] hover:-translate-y-0.5" style={{ boxShadow: '0 4px 24px -4px rgba(0,0,0,0.06)' }}>
            <div className="p-6">
            <div className="pb-4 mb-4 border-b border-border">
              <h2 className="text-lg font-bold text-foreground tracking-tight mb-1">Task distribution</h2>
              <p className="text-sm text-muted-foreground">By column</p>
            </div>
            {taskDistributionData.length > 0 ? (
              <div className="h-[240px]" ref={taskDistributionChartRef}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={taskDistributionData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={95} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 40px -12px rgba(0,0,0,0.15)' }}
                      formatter={(value) => [value, 'Tasks']}
                    />
                    <Bar dataKey="value" name="Tasks" radius={[0, 4, 4, 0]} maxBarSize={28}>
                      {taskDistributionData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm">No tasks yet</div>
            )}
            </div>
          </div>
        </div>
               
        {/* Peak hours heatmap */}
        <div className="rounded-2xl bg-card border border-border overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 mb-10" style={{ boxShadow: '0 4px 24px -4px rgba(0,0,0,0.06)' }}>
          <div className="p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 mb-5 border-b border-border">
            <div>
              <h2 className="text-lg font-bold text-foreground tracking-tight">Peak hours</h2>
              <p className="text-sm text-muted-foreground mt-1">When you focus · last 30 days</p>
            </div>
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#5043F3]/10 text-[#5043F3] border border-[#5043F3]/20">Sun–Sat · 0h–23h</span>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[320px] space-y-2">
              {dayLabels.map((label, dayIndex) => (
                <div key={dayIndex} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-muted-foreground w-9 shrink-0">{label}</span>
                  <div className="flex gap-0.5 flex-1">
                    {Array.from({ length: 24 }, (_, hour) => {
                      const count = peakByDayHour[dayIndex]?.[hour] ?? 0;
                      const intensity = maxPeakCell > 0 ? count / maxPeakCell : 0;
                      return (
                        <div
                          key={hour}
                          title={`${label} ${hour}:00 – ${count} session(s)`}
                          className="h-5 flex-1 min-w-[8px] rounded-sm transition-all hover:ring-2 hover:ring-indigo-300"
                          style={{
                            backgroundColor: intensity === 0 ? '#f1f5f9' : `rgba(80, 67, 243, ${0.2 + 0.7 * intensity})`,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          </div>
        </div>

        {/* Bottom row: Balance, Focus & tasks summary, AI */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Balance score */}
          <div className="rounded-2xl bg-card border border-border overflow-hidden flex flex-col transition-all duration-300 hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)] hover:-translate-y-0.5" style={{ boxShadow: '0 4px 24px -4px rgba(0,0,0,0.06)' }}>
            <div className="p-6 flex flex-col flex-1">
              <div className="pb-4 mb-4 border-b border-border">
                <h2 className="text-lg font-bold text-foreground tracking-tight mb-1">Balance score</h2>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Focus vs tasks</p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="shrink-0 flex justify-center sm:justify-start">
                  <div className="relative w-32 h-32 sm:w-36 sm:h-36">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <defs>
                        <linearGradient id="balanceGradAnalytics" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#5043F3" />
                          <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                      </defs>
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="url(#balanceGradAnalytics)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 42 * (focusEfficiency / 100)} ${2 * Math.PI * 42}`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums">{focusEfficiency}</span>
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">of 100</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-w-0 space-y-0">
                  <div className="flex items-center justify-between py-3 px-0 border-b border-border">
                    <span className="text-sm text-muted-foreground">High priority</span>
                    <span className="text-sm font-semibold text-foreground tabular-nums">{highPriorityCount}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 px-0 border-b border-border">
                    <span className="text-sm text-muted-foreground">Overdue</span>
                    <span className="text-sm font-semibold text-foreground tabular-nums">{overdueCount}</span>
                  </div>
                  <div className="pt-3">
                    <span
                      className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${
                        focusEfficiency >= 70
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : focusEfficiency >= 40
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : 'bg-muted text-muted-foreground border border-border'
                      }`}
                    >
                      {focusEfficiency >= 70 ? 'On track' : focusEfficiency >= 40 ? 'Good' : 'Getting started'}
                    </span>
                  </div>
                </div>
              </div>
              {/* Fill space: next milestone + tip */}
              <div className="mt-6 pt-5 border-t border-border flex-1 flex flex-col justify-end gap-4">
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Next milestone</p>
                  {focusEfficiency >= 70 ? (
                    <p className="text-sm text-muted-foreground">You&apos;re on track. Keep your rhythm with regular focus sessions.</p>
                  ) : focusEfficiency >= 40 ? (
                    <>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                        <span>70% · On track</span>
                        <span>{70 - focusEfficiency}% to go</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-500" style={{ width: `${((focusEfficiency - 40) / 30) * 100}%` }} />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                        <span>40% · Good</span>
                        <span>{40 - focusEfficiency}% to go</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-500" style={{ width: `${(focusEfficiency / 40) * 100}%` }} />
                      </div>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {displaySessions < 2 ? 'Complete more focus sessions and move tasks to Done to improve your balance score.' : highPriorityCount > 0 ? 'Tackle high-priority tasks in focus mode to see your score rise.' : 'Balance reflects focus time and task progress together.'}
                </p>
              </div>
            </div>
          </div>

          {/* Focus & tasks summary */}
          <div className="rounded-2xl bg-card border border-border overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)] hover:-translate-y-0.5" style={{ boxShadow: '0 4px 24px -4px rgba(0,0,0,0.06)' }}>
            <div className="p-6">
            <div className="pb-4 mb-4 border-b border-border">
              <h2 className="text-lg font-bold text-foreground tracking-tight">Focus & tasks</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Focus blocks today', value: displaySessions, icon: CircleDot, c: 'text-indigo-600', bg: 'bg-indigo-100' },
                { label: "Today's focus tasks", value: todaysFocusCount, icon: Target, c: 'text-amber-600', bg: 'bg-amber-100' },
                { label: 'In progress', value: inProgressCount, icon: Activity, c: 'text-cyan-600', bg: 'bg-cyan-100' },
                { label: 'Categories', value: Object.keys(categoryCounts).length, icon: ListTodo, c: 'text-muted-foreground', bg: 'bg-slate-100' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-border p-4 transition-all duration-200 hover:shadow-md hover:border-border" style={{ boxShadow: '0 2px 12px -4px rgba(0,0,0,0.06)' }}>
                  <div className="flex items-start gap-3">
                    <div className={`shrink-0 w-9 h-9 rounded-lg ${item.bg} flex items-center justify-center ${item.c}`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{item.label}</p>
                      <p className="text-xl font-bold text-foreground tabular-nums mt-0.5">{item.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {Object.keys(categoryCounts).length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">By category</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(categoryCounts).map(([cat, count]) => (
                    <span key={cat} className="px-2.5 py-1 rounded-lg bg-[#5043F3]/10 text-[#5043F3] text-xs font-semibold border border-[#5043F3]/20">
                      {cat}: {count}
                    </span>
                  ))}
                </div>
              </div>
            )}
            </div>
          </div>

          <ThryvAIInsightCard
            metrics={aiMetrics}
            enabled={Boolean(isSignedIn && !loading && !error)}
            onInsightChange={setCachedInsight}
          />
        </div>
      </main>
    </div>
  );
}
