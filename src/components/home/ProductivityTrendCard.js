'use client';

import { useMemo, useState } from 'react';
import { ArrowUpRight, Sparkles, Timer } from 'lucide-react';
import ProductivityTrendChart, {
  formatFocusDuration,
  formatFocusSeconds,
} from '@/components/home/ProductivityTrendChart';
import { SkeletonPulse, TrendStatSkeleton } from '@/components/ui/DashboardSkeletons';
import {
  dashboardGlowOrbClass,
  dashboardGlowOrbSmClass,
  dashboardStatBadgeClass,
  dashboardWidePanelClass,
} from '@/lib/appShellClasses';

/**
 * @param {{
 *   cardRef?: import('react').Ref<HTMLDivElement>,
 *   data: Array<{ key: string, label: string, minutes: number, seconds?: number }>,
 *   peakDay: { key: string, label: string, minutes: number } | null,
 *   todayKey: string,
 *   weekAvg: number,
 *   currentWeekTotalSeconds: number,
 *   vsPriorWeek: number,
 *   hasPriorWeekBaseline: boolean,
 *   loading?: boolean,
 *   error?: string,
 * }} props
 */
export default function ProductivityTrendCard({
  cardRef,
  data,
  peakDay,
  todayKey,
  weekAvg,
  currentWeekTotalSeconds,
  vsPriorWeek,
  hasPriorWeekBaseline,
  loading = false,
  error = '',
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const days = data || [];
  const weekLabel =
    days.length > 0 ? `${days[0].label} – ${days[days.length - 1].label}` : 'Last 7 days';
  const rising = vsPriorWeek >= 0;
  const peakShare =
    peakDay && currentWeekTotalSeconds > 0
      ? Math.min(100, Math.round(((peakDay.minutes * 60) / currentWeekTotalSeconds) * 100))
      : 0;

  const hovered = useMemo(() => {
    if (hoveredIndex == null) return null;
    return days[hoveredIndex] || null;
  }, [days, hoveredIndex]);

  return (
    <div ref={cardRef} className={`${dashboardWidePanelClass} productivity-trend-card`}>
      <div className="productivity-trend-orb productivity-trend-orb--a pointer-events-none absolute -right-8 -top-10 h-44 w-44 rounded-full blur-3xl" />
      <div className="productivity-trend-orb productivity-trend-orb--b pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full blur-3xl" />
      <div className={`pointer-events-none absolute top-0 right-0 h-32 w-32 ${dashboardGlowOrbClass} rounded-full blur-2xl`} />
      <div className={`pointer-events-none absolute bottom-0 left-0 h-24 w-24 ${dashboardGlowOrbSmClass} rounded-full blur-xl`} />
      <div className="productivity-trend-sheen pointer-events-none absolute inset-0 rounded-[inherit]" />

      <div className="relative z-10 flex flex-col">
        <div className="mb-4 flex items-start justify-between gap-4 sm:mb-5">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                {!loading && days.some((d) => d.key === todayKey && (d.minutes || 0) > 0) ? (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#615FFF] opacity-40" />
                ) : null}
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#615FFF]" />
              </span>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-400">
                Focus this week
              </p>
            </div>
            <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg md:text-xl">
              Productivity Trend
            </h3>
            <p className="mt-1 text-xs font-medium text-muted-foreground sm:text-sm">
              {loading ? 'Loading this week…' : weekLabel}
            </p>
          </div>

          {loading ? (
            <SkeletonPulse className="h-8 w-24 rounded-full" />
          ) : hasPriorWeekBaseline || currentWeekTotalSeconds > 0 ? (
            <div
              className={`${
                rising
                  ? 'border-emerald-200/60 bg-emerald-50/90 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'border-amber-200/60 bg-amber-50/90 text-amber-700 dark:border-amber-500/25 dark:bg-amber-950/40 dark:text-amber-300'
              } flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-semibold shadow-sm sm:px-3.5 sm:text-xs`}
            >
              <ArrowUpRight size={13} className={rising ? '' : 'rotate-180'} />
              <span className="font-bold">
                {rising ? '+' : ''}
                {vsPriorWeek}%
              </span>
              <span className="hidden font-medium opacity-80 sm:inline">vs last week</span>
            </div>
          ) : (
            <div className={`${dashboardStatBadgeClass} shrink-0 text-[10px] sm:text-xs`}>
              First week
            </div>
          )}
        </div>

        <div className="mb-3 flex items-end justify-between gap-3">
          <div className="min-w-0 flex-1">
            {loading ? (
              <div className="space-y-2 py-0.5" aria-busy="true" aria-label="Loading focus total">
                <SkeletonPulse className="h-9 w-28 rounded-xl sm:h-10 sm:w-32" />
                <SkeletonPulse className="h-3 w-36 rounded-full" delay={0.08} />
              </div>
            ) : (
              <>
                <p className="bg-gradient-to-br from-[#615FFF] via-violet-500 to-cyan-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
                  {formatFocusSeconds(currentWeekTotalSeconds)}
                </p>
                <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                  {hovered
                    ? `${hovered.label} · ${formatFocusDuration(hovered.minutes)}`
                    : 'Total Active Focus'}
                </p>
              </>
            )}
          </div>
        </div>

        <ProductivityTrendChart
          data={days}
          peakDay={peakDay}
          todayKey={todayKey}
          weekAvg={weekAvg}
          loading={loading}
          error={error}
          hoveredIndex={hoveredIndex}
          onHoverIndex={setHoveredIndex}
        />

        <div className="relative mt-1 h-6">
          {loading
            ? Array.from({ length: 7 }, (_, i) => (
                <div
                  key={i}
                  className="absolute top-1 -translate-x-1/2"
                  style={{ left: `${7 + (i / 6) * 86}%` }}
                >
                  <SkeletonPulse className="h-2.5 w-7 rounded-full" delay={i * 0.04} />
                </div>
              ))
            : days.map((day, i) => {
                const active = hoveredIndex === i;
                const isToday = day.key === todayKey;
                const isPeak = peakDay?.key === day.key && (day.minutes || 0) > 0;
                const span = Math.max(1, days.length - 1);
                return (
                  <button
                    key={day.key}
                    type="button"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onFocus={() => setHoveredIndex(i)}
                    style={{ left: `${7 + (i / span) * 86}%` }}
                    className={`absolute top-0 -translate-x-1/2 rounded-md px-1 py-1 text-center text-[9px] font-semibold uppercase tracking-wider transition-colors sm:text-[10px] ${
                      active || isToday
                        ? 'text-[#615FFF] dark:text-indigo-300'
                        : isPeak
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border/80 pt-4 sm:mt-6 sm:gap-4 sm:pt-5">
          {loading ? (
            <>
              <TrendStatSkeleton
                label="Peak day"
                icon={<Sparkles size={12} className="text-emerald-500" />}
              />
              <TrendStatSkeleton
                label="Daily avg"
                icon={<Timer size={12} className="text-[#615FFF]" />}
              />
            </>
          ) : (
            <>
              <div className="rounded-2xl border border-indigo-100/70 bg-indigo-50/40 px-3 py-3 dark:border-indigo-500/15 dark:bg-indigo-950/25 sm:px-4">
                <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Sparkles size={12} className="text-emerald-500" />
                  Peak day
                </div>
                <p className="text-sm font-semibold text-foreground sm:text-base">
                  {peakDay?.label ?? '—'}
                </p>
                <p className="mt-0.5 text-xs font-medium text-[#615FFF] dark:text-indigo-300">
                  {peakDay ? formatFocusDuration(peakDay.minutes) : 'No peak yet'}
                </p>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-indigo-100/80 dark:bg-indigo-950/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-[#615FFF]"
                    style={{ width: `${peakShare}%` }}
                  />
                </div>
              </div>
              <div className="rounded-2xl border border-indigo-100/70 bg-indigo-50/40 px-3 py-3 dark:border-indigo-500/15 dark:bg-indigo-950/25 sm:px-4">
                <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Timer size={12} className="text-[#615FFF]" />
                  Daily avg
                </div>
                <p className="text-sm font-semibold text-foreground sm:text-base">{weekAvg}m</p>
                <p className="mt-0.5 text-xs font-medium text-muted-foreground">per day this week</p>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-indigo-100/80 dark:bg-indigo-950/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#615FFF] to-cyan-400"
                    style={{ width: `${Math.min(100, weekAvg)}%` }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
