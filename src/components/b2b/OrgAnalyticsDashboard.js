'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@clerk/nextjs';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
} from 'recharts';
import {
  CalendarDays,
  Crown,
  Flame,
  Loader2,
  Radio,
  Sparkles,
  Timer,
  Trophy,
  Zap,
  ListTodo,
  CheckCircle2,
  CircleDot,
  AlertTriangle,
  Clock3,
} from 'lucide-react';
import TeamFocusForge from '@/components/b2b/TeamFocusForge';
import TeamPipelineStatusCard from '@/components/b2b/TeamPipelineStatusCard';
import TeamRhythmChartCard from '@/components/b2b/TeamRhythmChartCard';
import {
  workspacePanelHero,
  workspacePanelRaised,
} from '@/components/b2b/workspaceShellClasses';
import WorkspacePageHeader from '@/components/b2b/WorkspacePageHeader';
import WorkspaceSelect from '@/components/b2b/WorkspaceSelect';
import { canAccessMemberPersonalReport } from '@/lib/orgRoles';
import { streakRankPillStyle } from '@/lib/focusStreak';
import { getSupabaseClient, setSupabaseAuthToken } from '@/utils/userStorage';

const RANGE_OPTIONS = [
  { value: 7, label: 'Last 7 days' },
  { value: 14, label: 'Last 14 days' },
  { value: 30, label: 'Last 30 days' },
];

/** Poll focus + delivery aggregates (focus_sessions are not org-realtime for peers). */
const LIVE_POLL_MS = 12_000;
const REALTIME_DEBOUNCE_MS = 450;

/** Visual order: silver, gold, bronze */
const PODIUM_ORDER = [1, 0, 2];
const PODIUM_META = [
  {
    height: 'h-24 sm:h-28',
    medal: '#94a3b8',
    label: '2nd',
    ring: 'ring-slate-300/80 dark:ring-slate-500/50',
    bar: 'from-slate-200/90 to-slate-100/40 dark:from-slate-600/50 dark:to-slate-900/20',
  },
  {
    height: 'h-32 sm:h-40',
    medal: '#eab308',
    label: '1st',
    ring: 'ring-amber-300/90 dark:ring-amber-400/60',
    bar: 'from-amber-300/90 via-yellow-200/50 to-amber-100/20 dark:from-amber-500/40 dark:via-amber-700/20 dark:to-transparent',
  },
  {
    height: 'h-20 sm:h-24',
    medal: '#d97706',
    label: '3rd',
    ring: 'ring-orange-300/80 dark:ring-orange-500/40',
    bar: 'from-orange-200/80 to-orange-50/30 dark:from-orange-700/35 dark:to-transparent',
  },
];

function TrendChip({ delta, compareLabel, inverse = false }) {
  if (delta == null) {
    return (
      <span className="inline-flex items-center rounded-full bg-white/50 dark:bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
        vs {compareLabel}
      </span>
    );
  }
  if (delta === 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-white/50 dark:bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
        Flat vs {compareLabel}
      </span>
    );
  }
  const up = delta > 0;
  const good = inverse ? !up : up;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
        good
          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
          : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
      }`}
    >
      {up ? '↑' : '↓'}
      {up ? '+' : ''}
      {delta}%
      <span className="font-semibold opacity-70">vs {compareLabel}</span>
    </span>
  );
}

function RankDelta({ delta }) {
  if (delta == null || delta === 0) {
    return <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">—</span>;
  }
  const up = delta > 0;
  return (
    <span className={`text-[10px] font-bold tabular-nums ${up ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
      {up ? '↑' : '↓'}
      {Math.abs(delta)}
    </span>
  );
}

function formatFocusMinutes(minutes) {
  const m = Math.max(0, Math.round(Number(minutes) || 0));
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
}

function BoardStat({ icon: Icon, label, value, hint, tone = 'default', className = '' }) {
  const tones = {
    default: 'border-border/70 bg-background/60 dark:bg-white/[0.03]',
    accent: 'border-[#5D3FD3]/25 bg-[#5D3FD3]/8',
    good: 'border-emerald-500/25 bg-emerald-500/8',
    warn: 'border-rose-500/30 bg-rose-500/10',
  };
  const valueClass =
    tone === 'warn'
      ? 'text-rose-600 dark:text-rose-300'
      : tone === 'good'
        ? 'text-emerald-700 dark:text-emerald-300'
        : tone === 'accent'
          ? 'text-[#5D3FD3] dark:text-[#c4b5fd]'
          : 'text-foreground';
  return (
    <div className={`min-w-0 rounded-xl border px-3 py-2.5 ${tones[tone] || tones.default} ${className}`}>
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {Icon ? <Icon className="h-3 w-3 shrink-0" aria-hidden /> : null}
        {label}
      </p>
      <p className={`mt-1.5 text-xl font-black tabular-nums leading-none tracking-tight ${valueClass}`}>
        {value}
      </p>
      {hint ? <p className="mt-1.5 truncate text-[11px] leading-snug text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function MemberAvatar({ label, imageUrl, size = 'md', ringClass = '' }) {
  const sizeClass =
    size === 'xl'
      ? 'h-16 w-16 sm:h-20 sm:w-20 text-base'
      : size === 'lg'
        ? 'h-14 w-14 text-sm'
        : size === 'sm'
          ? 'h-9 w-9 text-[10px]'
          : 'h-11 w-11 text-xs';
  const initials = (label || '?').slice(0, 2).toUpperCase();
  const ring = ringClass ? `ring-2 ${ringClass} ring-offset-2 ring-offset-background` : 'border border-border';
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt=""
        className={`${sizeClass} shrink-0 rounded-full object-cover ${ring}`}
      />
    );
  }
  return (
    <div
      className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#5D3FD3] to-[#7c5cff] font-bold text-white ${ring}`}
    >
      {initials}
    </div>
  );
}

function InsightsRangeUpdating({ rangeLabel }) {
  return (
    <div className="ti-range-loader" role="status" aria-live="polite" aria-atomic="true">
      <span className="ti-range-loader__orb ti-range-loader__orb--a" aria-hidden />
      <span className="ti-range-loader__orb ti-range-loader__orb--b" aria-hidden />
      <div className="ti-range-loader__mark" aria-hidden>
        <span className="ti-range-loader__ring ti-range-loader__ring--outer" />
        <span className="ti-range-loader__ring ti-range-loader__ring--mid" />
        <span className="ti-range-loader__core">
          <Image
            src="/LandingPageImages/logo.png"
            alt=""
            width={28}
            height={28}
            className="ti-range-loader__logo"
            priority
          />
        </span>
      </div>
      <p className="ti-range-loader__brand">ThryvLoop</p>
      <p className="ti-range-loader__title">Updating {rangeLabel.toLowerCase()}</p>
      <div className="ti-range-loader__track" aria-hidden>
        <span className="ti-range-loader__fill">
          <span className="ti-range-loader__shimmer" />
        </span>
      </div>
    </div>
  );
}

function MiniSpark({ data, color, fillId }) {
  if (!data?.length) return null;
  return (
    <div className="h-16 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="completed"
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#${fillId})`}
            dot={false}
            isAnimationActive
            animationDuration={900}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * @param {{
 *   organizationId?: string | null,
 *   isAdmin?: boolean,
 *   members?: Array<unknown>,
 *   currentUserId?: string | null,
 *   orgSlug?: string | null,
 *   insightsPolicy?: string,
 *   initialInsights?: Record<string, unknown> | null,
 *   initialError?: string,
 * }} props
 */
export default function OrgAnalyticsDashboard({
  organizationId = null,
  isAdmin,
  currentUserId,
  orgSlug,
  insightsPolicy = 'team_only',
  initialInsights = null,
  initialError = '',
}) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const reduceMotion = useReducedMotion();
  const sparkFillId = `tiSpark-${useId().replace(/:/g, '')}`;
  const [insights, setInsights] = useState(() => initialInsights);
  const [loading, setLoading] = useState(() => initialInsights == null);
  const [refreshing, setRefreshing] = useState(false);
  const [liveAt, setLiveAt] = useState(() => (initialInsights ? Date.now() : null));
  const [error, setError] = useState(initialError || '');
  const [rangeDays, setRangeDays] = useState(
    () => Number(initialInsights?.rangeDays) || 7
  );
  const insightsRef = useRef(insights);
  insightsRef.current = insights;
  const rangeDaysRef = useRef(rangeDays);
  rangeDaysRef.current = rangeDays;
  const fetchGenRef = useRef(0);
  const realtimeTimerRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));

  const loadInsights = useCallback(async (days, { silent = false } = {}) => {
    if (!orgSlug) {
      setError('Workspace slug missing.');
      setLoading(false);
      return;
    }
    const gen = ++fetchGenRef.current;
    if (!silent) {
      if (insightsRef.current != null) setRefreshing(true);
      else setLoading(true);
    }
    try {
      const res = await fetch(
        `/api/b2b/team-insights?orgSlug=${encodeURIComponent(orgSlug)}&rangeDays=${days}`,
        { credentials: 'same-origin', cache: 'no-store' }
      );
      const body = await res.json().catch(() => ({}));
      if (gen !== fetchGenRef.current) return;
      if (!res.ok) {
        if (!silent) setError(body.error || 'Failed to load team insights');
      } else {
        setError('');
        setInsights(body);
        setLiveAt(Date.now());
      }
    } catch (err) {
      if (gen !== fetchGenRef.current) return;
      if (!silent) setError(err?.message || 'Failed to load team insights');
    }
    if (gen === fetchGenRef.current) {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orgSlug]);

  const silentRefresh = useCallback(() => {
    void loadInsights(rangeDaysRef.current, { silent: true });
  }, [loadInsights]);

  useEffect(() => {
    if (insights != null && Number(insights.rangeDays) === rangeDays) return;
    queueMicrotask(() => {
      void loadInsights(rangeDays, { silent: false });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- range-driven refetch
  }, [rangeDays, loadInsights]);

  // Live poll + refresh when the tab becomes visible again
  useEffect(() => {
    if (!orgSlug) return undefined;
    const tick = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      silentRefresh();
    };
    const id = setInterval(tick, LIVE_POLL_MS);
    const onVis = () => {
      if (document.visibilityState === 'visible') silentRefresh();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [orgSlug, silentRefresh]);

  // Instant refresh when org tasks change (same channel pattern as Work board)
  useEffect(() => {
    if (!organizationId || !isLoaded || !isSignedIn) return undefined;
    let channel;
    let cancelled = false;

    const scheduleRefresh = () => {
      if (realtimeTimerRef.current) clearTimeout(realtimeTimerRef.current);
      realtimeTimerRef.current = setTimeout(() => {
        silentRefresh();
      }, REALTIME_DEBOUNCE_MS);
    };

    (async () => {
      const token = await getToken({ template: 'supabase' });
      if (!token || cancelled) return;
      setSupabaseAuthToken(token);
      const supabase = getSupabaseClient();
      if (!supabase) return;

      channel = supabase
        .channel(`org-insights-${organizationId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'organization_tasks',
            filter: `organization_id=eq.${organizationId}`,
          },
          scheduleRefresh
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (realtimeTimerRef.current) clearTimeout(realtimeTimerRef.current);
      if (channel) {
        const supabase = getSupabaseClient();
        if (supabase) void supabase.removeChannel(channel);
      }
    };
  }, [organizationId, isLoaded, isSignedIn, getToken, silentRefresh]);

  const summary = insights?.summary || {
    total: 0,
    done: 0,
    inProgress: 0,
    overdue: 0,
    completionRate: 0,
    velocity: 0,
    focusMinutes: 0,
  };
  const trends = insights?.trends || {};
  const compareLabel = insights?.compareLabel || 'prior period';
  const velocitySeries = insights?.velocitySeries || [];
  const statusBreakdown = insights?.statusBreakdown || [];
  const leaderboard = insights?.leaderboard || [];

  const yourRow = leaderboard.find((r) => r.userId === currentUserId) || null;
  const podium = leaderboard.slice(0, 3);
  const rangeLabel = RANGE_OPTIONS.find((o) => o.value === rangeDays)?.label ?? 'Last 7 days';
  const memberCount = leaderboard.length;
  const focusPerPerson =
    memberCount > 0 ? Math.round((Number(summary.focusMinutes) || 0) / memberCount) : 0;
  const focusPerPersonSeries = velocitySeries.map((d) => ({
    ...d,
    focusMinutes:
      memberCount > 0 ? Math.round((Number(d.focusMinutes) || 0) / memberCount) : 0,
  }));

  const scoreDeg = useMemo(
    () => `${Math.min(100, Math.max(0, Number(yourRow?.score) || 0)) * 3.6}deg`,
    [yourRow?.score]
  );

  const rise = (delay) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
        };

  return (
    <div className="space-y-6 sm:space-y-8 w-full min-w-0">
      <WorkspacePageHeader
        eyebrow="Insights"
        title="Team velocity"
        description="Ship hard. Focus deep. Climb the board — same ranks for managers and the whole team."
        actions={
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {liveAt ? (
              <span
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300"
                title="Metrics refresh live as work and focus change"
              >
                <Radio className="h-3 w-3 ti-live-dot" aria-hidden />
                Live
              </span>
            ) : null}
            <WorkspaceSelect
              id="analytics-range"
              value={rangeDays}
              onChange={(e) => setRangeDays(Number(e.target.value))}
              aria-label="Analytics date range"
              size="sm"
              className="w-full sm:w-48 block"
              disabled={refreshing}
              leading={
                <CalendarDays
                  className={`h-3.5 w-3.5 ${refreshing ? 'ti-range-select-busy text-[#5D3FD3]' : ''}`}
                  aria-hidden
                />
              }
            >
              {RANGE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </WorkspaceSelect>
          </div>
        }
      />

      {error ? (
        <p className="text-sm text-rose-600 border border-rose-200 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-500/30 dark:text-rose-200 px-3 py-2 rounded-xl">
          {error}
        </p>
      ) : null}

      {loading && !insights ? (
        <div className="flex justify-center py-24 text-muted-foreground items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#5D3FD3]" />
          Loading the arena…
        </div>
      ) : (
        <div className="relative">
          <AnimatePresence>
            {refreshing ? (
              <motion.div
                key="insights-veil"
                className="absolute inset-0 z-20 rounded-3xl bg-background/55 backdrop-blur-[2px] dark:bg-[#0a0e18]/62"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                aria-hidden
              />
            ) : null}
          </AnimatePresence>
          <AnimatePresence>
            {refreshing ? (
              <motion.div
                key="insights-updating"
                className="pointer-events-none sticky top-3 z-30 h-0"
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.96 }}
                animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex justify-center px-3 pt-10 sm:pt-14">
                  <InsightsRangeUpdating rangeLabel={rangeLabel} />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
          <div
            className={`space-y-6 sm:space-y-8 ${refreshing ? 'pointer-events-none select-none' : ''}`}
            aria-busy={refreshing}
          >
          {/* Hero: velocity + personal rank as one composition */}
          <motion.section
            className={`${workspacePanelHero} ti-hero relative overflow-hidden p-5 sm:p-7 lg:p-8`}
            {...rise(0)}
          >
            <div
              className="ti-hero-orb--a pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full blur-3xl"
              aria-hidden
            />
            <div
              className="ti-hero-orb--b pointer-events-none absolute -bottom-28 -left-10 h-56 w-56 rounded-full blur-3xl"
              aria-hidden
            />
            <div className="relative z-[1] grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:items-center">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[#5D3FD3] dark:text-[#c4b5fd]">
                  <Zap className="h-4 w-4" aria-hidden />
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em]">
                    Team velocity
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <p className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter tabular-nums text-foreground leading-none">
                    {summary.velocity ?? summary.done}
                  </p>
                  <div className="pb-1.5">
                    <p className="text-sm font-semibold text-muted-foreground">tasks shipped</p>
                    <div className="mt-1.5">
                      <TrendChip
                        delta={trends.velocity ?? trends.completed}
                        compareLabel={compareLabel}
                      />
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground max-w-md leading-relaxed">
                  {rangeLabel} — outcomes that move the team forward.
                </p>
                <div className="mt-5 rounded-2xl border border-border/60 bg-background/40 dark:bg-black/20 p-3 sm:p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      Shipping rhythm
                    </span>
                    <Sparkles className="h-3.5 w-3.5 text-[#5D3FD3]/70" aria-hidden />
                  </div>
                  <MiniSpark data={velocitySeries} color="#5D3FD3" fillId={sparkFillId} />
                </div>
              </div>

              {yourRow ? (
                <div className="relative flex flex-col items-center justify-center rounded-2xl border border-[#5D3FD3]/20 bg-gradient-to-b from-[#5D3FD3]/08 to-transparent dark:from-[#5D3FD3]/18 px-5 py-6 sm:py-8">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5D3FD3] dark:text-[#c4b5fd] mb-4">
                    Your standing
                  </p>
                  <div
                    className="ti-score-ring relative flex h-36 w-36 sm:h-40 sm:w-40 items-center justify-center rounded-full p-[3px]"
                    style={{ ['--ti-score-deg']: scoreDeg }}
                  >
                    <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-card dark:bg-[#0c1220] shadow-inner">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Rank
                      </span>
                      <span className="text-4xl sm:text-5xl font-black tabular-nums text-foreground leading-none mt-0.5">
                        #{yourRow.rank}
                      </span>
                      <span className="mt-1 text-xs font-bold text-[#5D3FD3] dark:text-[#c4b5fd] tabular-nums">
                        {yourRow.score} pts
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <RankDelta delta={yourRow.rankDelta} />
                    {yourRow.streakTitle && yourRow.streakTitle !== 'Unlit' ? (
                      <span
                        className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold"
                        style={streakRankPillStyle(yourRow.streakTitle) || undefined}
                      >
                        <Flame className="h-3 w-3" aria-hidden />
                        {yourRow.streakTitle}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground">
                        Light a focus streak
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-center text-xs text-muted-foreground max-w-[14rem]">
                    Ship tasks and stay Active in Focus to climb.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-5 py-10 text-center">
                  <Trophy className="h-8 w-8 text-[#5D3FD3]/50 mb-2" aria-hidden />
                  <p className="text-sm font-semibold text-foreground">Join the race</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Your rank appears once you&apos;re on the roster.
                  </p>
                </div>
              )}
            </div>
          </motion.section>

          {/* Arena podium */}
          <motion.section
            className={`${workspacePanelRaised} ti-arena relative overflow-hidden p-5 sm:p-8`}
            {...rise(0.06)}
          >
            <div className="ti-arena-grid pointer-events-none absolute inset-0 opacity-80" aria-hidden />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#5D3FD3]/10 to-transparent"
              aria-hidden
            />
            <div className="relative z-[1]">
              <div className="flex flex-wrap items-end justify-between gap-3 mb-6 sm:mb-8">
                <div>
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-300">
                    <Crown className="h-4 w-4" aria-hidden />
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em]">Arena</p>
                  </div>
                  <h2 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    Top performers
                  </h2>
                </div>
                <p className="text-[11px] font-semibold text-muted-foreground">{rangeLabel}</p>
              </div>

              {podium.length === 0 ? (
                <p className="py-14 text-center text-sm text-muted-foreground">
                  Invite teammates — the podium is waiting.
                </p>
              ) : (
                <div className="flex items-end justify-center gap-2 sm:gap-5 pt-2">
                  {PODIUM_ORDER.map((idx, visualIdx) => {
                    const row = podium[idx];
                    // Meta is ordered for visual slots (2nd | 1st | 3rd), not leaderboard index
                    const meta = PODIUM_META[visualIdx];
                    if (!row) {
                      return <div key={`empty-${idx}`} className="w-[5.5rem] sm:w-36" />;
                    }
                    const isFirst = row.rank === 1;
                    return (
                      <motion.div
                        key={row.userId}
                        className={`flex w-[5.5rem] sm:w-36 flex-col items-center ${isFirst ? 'ti-podium-glow--gold' : 'ti-podium-glow'}`}
                        initial={reduceMotion ? false : { opacity: 0, y: 28 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: 0.15 + visualIdx * 0.08,
                          duration: 0.55,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        {isFirst ? (
                          <Crown
                            className="ti-crown mb-1.5 h-6 w-6 text-amber-500"
                            fill="currentColor"
                            aria-hidden
                          />
                        ) : (
                          <div className="mb-1.5 h-6" />
                        )}
                        <MemberAvatar
                          label={row.label}
                          imageUrl={row.imageUrl}
                          size={isFirst ? 'xl' : 'lg'}
                          ringClass={meta.ring}
                        />
                        <p className="mt-2.5 w-full truncate text-center text-sm font-bold text-foreground">
                          {row.label}
                        </p>
                        <p
                          className="text-xs font-bold tabular-nums"
                          style={{ color: meta.medal }}
                        >
                          {row.score} pts
                        </p>
                        <div
                          className={`mt-3 w-full ${meta.height} rounded-t-2xl bg-gradient-to-b ${meta.bar} border border-border/60 flex flex-col items-center pt-3 shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.15)]`}
                        >
                          <span
                            className="text-2xl font-black tabular-nums leading-none"
                            style={{ color: meta.medal }}
                          >
                            {meta.label}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.section>

          <motion.section {...rise(0.1)}>
            <TeamFocusForge
              members={leaderboard}
              rangeLabel={rangeLabel}
              currentUserId={currentUserId}
            />
          </motion.section>

          {/* Leaderboard */}
          <motion.section {...rise(0.14)}>
            <div className="mb-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Full board
              </p>
              <h2 className="text-lg font-bold tracking-tight text-foreground">Leaderboard</h2>
            </div>
            <div className={`${workspacePanelRaised} overflow-hidden p-0`}>
              {leaderboard.length === 0 ? (
                <p className="px-5 py-12 text-center text-sm text-muted-foreground">
                  Invite members to fill the board.
                </p>
              ) : (
                <ul className="divide-y divide-border/80">
                  {leaderboard.map((row, i) => {
                    const isYou = row.userId === currentUserId;
                    const canOpenPerson = canAccessMemberPersonalReport({
                      viewerIsAdmin: Boolean(isAdmin),
                      viewerUserId: currentUserId,
                      subjectUserId: row.userId,
                      subjectRole: row.clerkRole || 'org:member',
                      insightsPolicy,
                    });
                    const personHref =
                      canOpenPerson && orgSlug
                        ? `/o/${encodeURIComponent(orgSlug)}/people/${encodeURIComponent(row.userId)}`
                        : null;
                    const assigned = Number(row.assigned ?? (Number(row.todo) || 0) + (Number(row.inProgress) || 0));
                    const shipped = Number(row.shipped ?? row.done) || 0;
                    const inProgress = Number(row.inProgress) || 0;
                    const todo = Number(row.todo) || 0;
                    const overdue = Number(row.overdue) || 0;
                    const streak = Number(row.streak) || 0;
                    const topThree = row.rank <= 3;
                    return (
                      <li
                        key={row.userId}
                        className={`ti-row px-4 sm:px-5 py-5 flex flex-col gap-4 transition-all duration-300 ${
                          isYou
                            ? 'bg-gradient-to-r from-[#5D3FD3]/10 via-[#5D3FD3]/5 to-transparent'
                            : 'hover:bg-muted/40'
                        }`}
                        style={
                          reduceMotion
                            ? undefined
                            : { animationDelay: `${Math.min(i, 12) * 0.04}s` }
                        }
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl font-black tabular-nums ${
                                topThree
                                  ? 'bg-gradient-to-br from-[#5D3FD3] to-[#7c5cff] text-white shadow-md shadow-[#5D3FD3]/25'
                                  : 'bg-muted text-foreground'
                              }`}
                            >
                              <span className="text-sm leading-none">{row.rank}</span>
                              <RankDelta delta={row.rankDelta} />
                            </div>
                            <MemberAvatar label={row.label} imageUrl={row.imageUrl} size="sm" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                {personHref ? (
                                  <Link
                                    href={personHref}
                                    className="font-bold text-foreground hover:text-[#5D3FD3] transition-colors truncate"
                                  >
                                    {row.label}
                                  </Link>
                                ) : (
                                  <p className="font-bold text-foreground truncate">{row.label}</p>
                                )}
                                {isYou ? (
                                  <span className="text-[10px] font-black uppercase tracking-wide text-white bg-[#5D3FD3] px-1.5 py-0.5 rounded-md">
                                    You
                                  </span>
                                ) : null}
                                {row.streakTitle && row.streakTitle !== 'Unlit' ? (
                                  <span
                                    className="inline-flex items-center gap-0.5 text-[10px] font-bold border px-1.5 py-0.5 rounded-md"
                                    style={streakRankPillStyle(row.streakTitle) || undefined}
                                  >
                                    <Flame className="h-3 w-3" aria-hidden />
                                    {row.streakTitle}
                                  </span>
                                ) : null}
                              </div>
                              <p className="text-xs text-muted-foreground">{row.roleLabel}</p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 sm:min-w-[13rem] lg:w-56 shrink-0 pl-14 lg:pl-0">
                            <div className="flex items-end justify-between gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                                Score
                              </span>
                              <span className="text-2xl font-black tabular-nums leading-none text-foreground">
                                {row.score}
                              </span>
                            </div>
                            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/80 dark:bg-white/10">
                              <div
                                className="ti-bar-fill h-full rounded-full bg-gradient-to-r from-[#5D3FD3] via-[#7c5cff] to-[#38bdf8]"
                                style={{
                                  width: `${Math.min(100, row.score)}%`,
                                  animationDelay: `${Math.min(i, 10) * 0.05}s`,
                                }}
                              />
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              Ship + completion rate + focus this window
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2.5">
                          <BoardStat
                            icon={ListTodo}
                            label="Assigned"
                            value={assigned}
                            hint={
                              assigned === 0
                                ? 'Nothing open on the board'
                                : `${todo} to do · ${inProgress} in progress`
                            }
                            tone="accent"
                          />
                          <BoardStat
                            icon={CheckCircle2}
                            label="Shipped"
                            value={shipped}
                            hint={`${row.completionRate || 0}% of period work`}
                            tone="good"
                          />
                          <BoardStat
                            icon={CircleDot}
                            label="In progress"
                            value={inProgress}
                            hint={todo === 1 ? '1 still in to do' : `${todo} still in to do`}
                          />
                          <BoardStat
                            icon={AlertTriangle}
                            label="Overdue"
                            value={overdue}
                            hint={overdue > 0 ? 'Past due on the live board' : 'None past due'}
                            tone={overdue > 0 ? 'warn' : 'default'}
                          />
                          <BoardStat
                            icon={Clock3}
                            label="Hours focused"
                            value={formatFocusMinutes(row.focusMinutes)}
                            hint={
                              streak > 0
                                ? `${streak} day streak${row.focusMinutesToday ? ` · ${formatFocusMinutes(row.focusMinutesToday)} today` : ''}`
                                : row.focusMinutesToday
                                  ? `${formatFocusMinutes(row.focusMinutesToday)} today`
                                  : 'No streak yet'
                            }
                            className="col-span-2 sm:col-span-1 xl:col-span-1"
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.section>

          {/* Focus rhythm — shipping already lives in the hero */}
          <motion.section {...rise(0.18)}>
            <TeamRhythmChartCard
              variant="focus"
              data={focusPerPersonSeries}
              rangeLabel={rangeLabel}
              total={focusPerPerson}
              trend={trends.focusMinutes}
              compareLabel={compareLabel}
              Icon={Timer}
            />
          </motion.section>

          {/* Pipeline — single home for status + overdue */}
          <motion.section {...rise(0.22)}>
            <TeamPipelineStatusCard
              data={statusBreakdown}
              rangeLabel={rangeLabel}
              overdue={summary.overdue}
              overdueTrend={trends.overdue}
              compareLabel={compareLabel}
            />
          </motion.section>
          </div>
        </div>
      )}
    </div>
  );
}
