'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Zap,
  MoveRight,
  TrendingUp,
  Target,
  CheckCircle2,
  ListTodo,
  Clock,
  Database,
  Activity,
  Flame,
  BarChart3,
  CircleDot,
} from 'lucide-react';
import { Outfit } from 'next/font/google';
import { getSupabaseClient, setSupabaseAuthToken, getFocusTimerStateFromSupabase } from '@/utils/userStorage';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-outfit',
});

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
      setSeedMessage(`Added ${data.focus_sessions_added ?? 0} sessions and ${data.tasks_added ?? 0} tasks.`);
      await loadData();
      setSeedMessage('Sample data loaded.');
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

  const taskDistributionData = [
    { name: "Today's Focus", value: todaysFocusCount, color: '#5043F3' },
    { name: 'In Progress', value: inProgressCount, color: '#f59e0b' },
    { name: 'Backlog', value: backlogCount, color: '#64748b' },
    { name: 'Done', value: doneCount, color: '#10b981' },
  ].filter((d) => d.value > 0);

  const THRYV_PURPLE = '#5043F3';

  if (loading) {
    return (
      <div className={`min-h-screen bg-[#F1F5F9] ${outfit.className} text-gray-900 flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-2 border-indigo-200 border-t-[#5043F3] rounded-full animate-spin" />
          <p className="text-slate-600 font-medium tracking-wide">Loading analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#F1F5F9] ${outfit.className} text-gray-900 antialiased`}>
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        {error && (
          <div className="mb-6 py-3 px-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium">
            {error}
          </div>
        )}
        {seedMessage && (
          <div className="mb-6 py-3 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
            {seedMessage}
          </div>
        )}

        {/* Header */}
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">
          <div>
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-[0.2em] mb-2">Insights</p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900">
              Analytics
            </h1>
            <p className="mt-2 text-slate-500 font-medium">{dateString}</p>
          </div>
          <div className="flex flex-wrap gap-3">
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
            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-sm transition-colors shadow-sm">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </header>

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5 mb-10">
          {[
            { label: 'Sessions today', value: displaySessions, sub: `${focusMinutesToday} min`, icon: Activity, color: '#5043F3', bg: 'rgba(80, 67, 243, 0.08)' },
            { label: 'Focus this week', value: Math.round(focusMinutesThisWeek), sub: 'minutes', icon: TrendingUp, color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.08)' },
            { label: 'Tasks done (week)', value: tasksCompletedThisWeek, sub: 'completed', icon: CheckCircle2, color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)' },
            { label: 'Streak', value: streak, sub: 'days', icon: Flame, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)' },
            { label: 'Efficiency', value: `${focusEfficiency}%`, sub: modeLabel, icon: Target, color: '#5043F3', bg: 'rgba(80, 67, 243, 0.08)' },
            { label: 'Total tasks', value: totalTasks, sub: `${doneCount} done`, icon: BarChart3, color: '#64748b', bg: 'rgba(100, 116, 139, 0.08)' },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="group relative rounded-2xl bg-white border border-slate-200/80 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-300/80 hover:-translate-y-0.5"
              style={{ boxShadow: '0 4px 24px -4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.02)' }}
            >
              <div className="absolute top-0 left-0 w-1 h-full opacity-90" style={{ backgroundColor: kpi.color }} />
              <div className="relative p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">{kpi.label}</span>
                  <div
                    className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: kpi.bg }}
                  >
                    <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} strokeWidth={2.5} />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 tabular-nums tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                  {kpi.value}
                </p>
                <p className="text-xs font-medium text-slate-500 mt-1">{kpi.sub}</p>
              </div>
            </div>
          ))}
        </div>
                    
        {/* Main chart: Focus time (area) + Sessions (line) */}
        <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 mb-8" style={{ boxShadow: '0 4px 24px -4px rgba(0,0,0,0.06)' }}>
          <div className="p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 mb-5 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">Focus & sessions</h2>
              <p className="text-sm text-slate-500 mt-1">Last 14 days · focus time (min) & session count</p>
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
          <div className="h-[320px] w-full">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Sessions trend – line chart */}
          <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200/80 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)] hover:-translate-y-0.5" style={{ boxShadow: '0 4px 24px -4px rgba(0,0,0,0.06)' }}>
            <div className="p-6">
            <div className="pb-4 mb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-gray-900 tracking-tight mb-1">Sessions per day</h2>
              <p className="text-sm text-slate-500">Daily session count · last 14 days</p>
            </div>
            <div className="h-[240px]">
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
          <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)] hover:-translate-y-0.5" style={{ boxShadow: '0 4px 24px -4px rgba(0,0,0,0.06)' }}>
            <div className="p-6">
            <div className="pb-4 mb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-gray-900 tracking-tight mb-1">Task distribution</h2>
              <p className="text-sm text-slate-500">By column</p>
            </div>
            {taskDistributionData.length > 0 ? (
              <div className="h-[240px]">
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
              <div className="h-[240px] flex items-center justify-center text-slate-500 text-sm">No tasks yet</div>
            )}
            </div>
          </div>
        </div>
               
        {/* Peak hours heatmap */}
        <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 mb-10" style={{ boxShadow: '0 4px 24px -4px rgba(0,0,0,0.06)' }}>
          <div className="p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 mb-5 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">Peak hours</h2>
              <p className="text-sm text-slate-500 mt-1">When you focus · last 30 days</p>
            </div>
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#5043F3]/10 text-[#5043F3] border border-[#5043F3]/20">Sun–Sat · 0h–23h</span>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[320px] space-y-2">
              {dayLabels.map((label, dayIndex) => (
                <div key={dayIndex} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-500 w-9 shrink-0">{label}</span>
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
          <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)] hover:-translate-y-0.5" style={{ boxShadow: '0 4px 24px -4px rgba(0,0,0,0.06)' }}>
            <div className="p-6 flex flex-col flex-1">
              <div className="pb-4 mb-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-gray-900 tracking-tight mb-1">Balance score</h2>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Focus vs tasks</p>
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
                      <span className="text-2xl sm:text-3xl font-bold text-gray-900 tabular-nums">{focusEfficiency}</span>
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">of 100</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-w-0 space-y-0">
                  <div className="flex items-center justify-between py-3 px-0 border-b border-slate-100">
                    <span className="text-sm text-slate-500">High priority</span>
                    <span className="text-sm font-semibold text-gray-900 tabular-nums">{highPriorityCount}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 px-0 border-b border-slate-100">
                    <span className="text-sm text-slate-500">Overdue</span>
                    <span className="text-sm font-semibold text-gray-900 tabular-nums">{overdueCount}</span>
                  </div>
                  <div className="pt-3">
                    <span
                      className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${
                        focusEfficiency >= 70
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : focusEfficiency >= 40
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {focusEfficiency >= 70 ? 'On track' : focusEfficiency >= 40 ? 'Good' : 'Getting started'}
                    </span>
                  </div>
                </div>
              </div>
              {/* Fill space: next milestone + tip */}
              <div className="mt-6 pt-5 border-t border-slate-100 flex-1 flex flex-col justify-end gap-4">
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Next milestone</p>
                  {focusEfficiency >= 70 ? (
                    <p className="text-sm text-slate-600">You&apos;re on track. Keep your rhythm with regular focus sessions.</p>
                  ) : focusEfficiency >= 40 ? (
                    <>
                      <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                        <span>70% · On track</span>
                        <span>{70 - focusEfficiency}% to go</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-500" style={{ width: `${((focusEfficiency - 40) / 30) * 100}%` }} />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                        <span>40% · Good</span>
                        <span>{40 - focusEfficiency}% to go</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-500" style={{ width: `${(focusEfficiency / 40) * 100}%` }} />
                      </div>
                    </>
                  )}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {displaySessions < 2 ? 'Complete more focus sessions and move tasks to Done to improve your balance score.' : highPriorityCount > 0 ? 'Tackle high-priority tasks in focus mode to see your score rise.' : 'Balance reflects focus time and task progress together.'}
                </p>
              </div>
            </div>
          </div>

          {/* Focus & tasks summary */}
          <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)] hover:-translate-y-0.5" style={{ boxShadow: '0 4px 24px -4px rgba(0,0,0,0.06)' }}>
            <div className="p-6">
            <div className="pb-4 mb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">Focus & tasks</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Focus blocks today', value: displaySessions, icon: CircleDot, c: 'text-indigo-600', bg: 'bg-indigo-100' },
                { label: "Today's focus tasks", value: todaysFocusCount, icon: Target, c: 'text-amber-600', bg: 'bg-amber-100' },
                { label: 'In progress', value: inProgressCount, icon: Activity, c: 'text-cyan-600', bg: 'bg-cyan-100' },
                { label: 'Categories', value: Object.keys(categoryCounts).length, icon: ListTodo, c: 'text-slate-600', bg: 'bg-slate-100' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-200/80 p-4 transition-all duration-200 hover:shadow-md hover:border-slate-300/60" style={{ boxShadow: '0 2px 12px -4px rgba(0,0,0,0.06)' }}>
                  <div className="flex items-start gap-3">
                    <div className={`shrink-0 w-9 h-9 rounded-lg ${item.bg} flex items-center justify-center ${item.c}`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{item.label}</p>
                      <p className="text-xl font-bold text-gray-900 tabular-nums mt-0.5">{item.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {Object.keys(categoryCounts).length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">By category</p>
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

          {/* AI Insight */}
          <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)] hover:-translate-y-0.5" style={{ boxShadow: '0 4px 24px -4px rgba(0,0,0,0.06)' }}>
            <div className="p-6 flex flex-col flex-1">
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-[#5043F3] flex items-center justify-center shadow-lg shadow-indigo-200/50">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">Thryv AI</h2>
                <p className="text-[10px] font-semibold text-[#5043F3] uppercase tracking-wider">Personalized</p>
              </div>
            </div>
            <div className="flex-1 rounded-xl bg-indigo-50/50 border border-indigo-100 p-4 mb-4">
              {displaySessions >= 4 && todaysFocusCount <= 2 ? (
                <p className="text-sm text-slate-700 leading-relaxed">
                  Strong focus today — <span className="text-indigo-600 font-medium">{displaySessions} sessions</span>. Consider moving a task to Today&apos;s Focus.
                </p>
              ) : displaySessions < 2 && todaysFocusCount > 0 ? (
                <p className="text-sm text-slate-700 leading-relaxed">
                  You have <span className="text-indigo-600 font-medium">{todaysFocusCount} tasks</span> planned. Start a Pomodoro to build momentum.
                </p>
              ) : tasksCompletedThisWeek > 0 && streak >= 2 ? (
                <p className="text-sm text-slate-700 leading-relaxed">
                  <span className="text-emerald-600 font-medium">{tasksCompletedThisWeek} tasks</span> done this week and a <span className="text-amber-600 font-medium">{streak}-day</span> streak. Keep it up.
                </p>
              ) : highPriorityCount > 0 ? (
                <p className="text-sm text-slate-700 leading-relaxed">
                  <span className="text-amber-600 font-medium">{highPriorityCount} high-priority</span> tasks — tackle them in focus mode.
                </p>
              ) : totalTasks === 0 && focusSessions.length === 0 ? (
                <p className="text-sm text-slate-700 leading-relaxed">
                  Add tasks and run focus sessions to see personalized insights here.
                </p>
              ) : (
                <p className="text-sm text-slate-700 leading-relaxed">
                  Sessions and task progress are synced. Complete more to unlock detailed trends.
                </p>
              )}
            </div>
            <Link
              href="/tasks"
              className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#5043F3] hover:bg-[#4337D9] text-white font-semibold text-sm transition-colors shadow-lg shadow-indigo-200/50"
            >
              View tasks
              <MoveRight className="w-4 h-4" />
            </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
