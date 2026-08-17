'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useId, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const THEMES = {
  completions: {
    eyebrow: 'Throughput',
    title: 'Completions',
    formatHero: (n) => String(Math.max(0, Math.round(Number(n) || 0))),
    formatPoint: (n) => `${Math.max(0, Math.round(Number(n) || 0))} shipped`,
    unitShort: 'shipped',
    accent: '#5D3FD3',
    accentSoft: '#7c5cff',
    accentGlow: 'rgba(93, 63, 211, 0.45)',
    accentText: 'text-[#5D3FD3] dark:text-[#c4b5fd]',
    chipBg: 'bg-[#5D3FD3]/12 text-[#5D3FD3] dark:bg-[#5D3FD3]/25 dark:text-[#ddd6fe]',
    panelRing: 'ring-[#5D3FD3]/20 dark:ring-[#5D3FD3]/35',
    orbA: 'ti-chart-orb--violet',
    orbB: 'ti-chart-orb--cyan',
    dataKey: 'completed',
    gradientFrom: '#5D3FD3',
    peakLabel: 'Best day',
    heroSuffix: 'tasks shipped',
  },
  focus: {
    eyebrow: 'Depth',
    title: 'Focus per person',
    formatHero: (n) => formatMinutes(n),
    formatPoint: (n) => `${formatMinutes(n)} / person`,
    unitShort: 'focus',
    accent: '#ea580c',
    accentSoft: '#fb923c',
    accentGlow: 'rgba(234, 88, 12, 0.4)',
    accentText: 'text-orange-600 dark:text-orange-300',
    chipBg: 'bg-orange-500/12 text-orange-700 dark:bg-orange-500/20 dark:text-orange-200',
    panelRing: 'ring-orange-400/25 dark:ring-orange-400/35',
    orbA: 'ti-chart-orb--orange',
    orbB: 'ti-chart-orb--amber',
    dataKey: 'focusMinutes',
    gradientFrom: '#ea580c',
    peakLabel: 'Deepest day',
    heroSuffix: 'avg / person',
  },
};

function formatMinutes(minutes) {
  const m = Math.max(0, Math.round(Number(minutes) || 0));
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
}

function TrendBadge({ delta, compareLabel }) {
  if (delta == null) {
    return (
      <span className="text-[11px] font-semibold text-muted-foreground">vs {compareLabel}</span>
    );
  }
  if (delta === 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
        Flat vs {compareLabel}
      </span>
    );
  }
  const up = delta > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-black tabular-nums ${
        up
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

function ChartTooltip({ active, payload, label, theme, formatValue }) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value ?? 0;
  return (
    <div
      className="rounded-xl border border-white/15 bg-slate-950/95 px-3 py-2 shadow-[0_20px_50px_-18px_rgba(0,0,0,0.65)] backdrop-blur-md"
      style={{ boxShadow: `0 20px 50px -18px ${theme.accentGlow}` }}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">{label}</p>
      <p className="mt-0.5 text-sm font-black tabular-nums text-white">
        {formatValue(value)}
      </p>
    </div>
  );
}

/**
 * Living rhythm chart card for Completions / Focus minutes.
 *
 * @param {{
 *   variant: 'completions' | 'focus',
 *   data: Array<{ day: string, completed?: number, focusMinutes?: number }>,
 *   rangeLabel: string,
 *   total: number,
 *   trend?: number | null,
 *   compareLabel?: string,
 *   Icon?: import('lucide-react').LucideIcon,
 * }} props
 */
export default function TeamRhythmChartCard({
  variant,
  data = [],
  rangeLabel,
  total = 0,
  trend = null,
  compareLabel = 'prior period',
  Icon,
}) {
  const theme = THEMES[variant] || THEMES.completions;
  const reduceMotion = useReducedMotion();
  const uid = useId().replace(/:/g, '');
  const fillId = `ti-fill-${variant}-${uid}`;
  const glowId = `ti-glow-${variant}-${uid}`;
  const [hoverIndex, setHoverIndex] = useState(null);

  const { peak, bars } = useMemo(() => {
    const key = theme.dataKey;
    let peakRow = null;
    let peakVal = -1;
    const max = Math.max(1, ...data.map((d) => Number(d[key]) || 0));
    const mapped = data.map((d, i) => {
      const value = Number(d[key]) || 0;
      if (value > peakVal) {
        peakVal = value;
        peakRow = { ...d, index: i, value };
      }
      return {
        ...d,
        value,
        heightPct: Math.max(8, Math.round((value / max) * 100)),
        isPeak: false,
      };
    });
    if (peakRow) {
      mapped.forEach((row, i) => {
        if (i === peakRow.index) row.isPeak = true;
      });
    }
    return { peak: peakRow, bars: mapped };
  }, [data, theme.dataKey]);

  const formatPoint = theme.formatPoint;
  const formatHero = theme.formatHero;
  const activeBar = hoverIndex != null ? bars[hoverIndex] : null;

  return (
    <motion.div
      className={`ti-rhythm-card relative overflow-hidden rounded-2xl border border-border dark:border-white/8 ring-1 ${theme.panelRing} shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.16)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_16px_36px_-18px_rgba(0,0,0,0.55)]`}
      whileHover={reduceMotion ? undefined : { y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      <div className={`ti-rhythm-stage absolute inset-0 ${variant === 'focus' ? 'ti-rhythm-stage--focus' : ''}`} aria-hidden />
      <div className={`pointer-events-none absolute -top-16 -right-12 h-36 w-36 rounded-full blur-3xl ${theme.orbA}`} aria-hidden />
      <div className={`pointer-events-none absolute -bottom-16 -left-10 h-32 w-32 rounded-full blur-3xl ${theme.orbB}`} aria-hidden />
      <div className="ti-rhythm-sheen pointer-events-none absolute inset-0" aria-hidden />
      <div className="ti-rhythm-scan pointer-events-none absolute inset-0 opacity-30 dark:opacity-20" aria-hidden />

      <div className="relative z-1 flex flex-col p-3.5 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon ? (
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${theme.chipBg}`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden />
              </div>
            ) : null}
            <div className="min-w-0">
              <p className={`text-[9px] font-black uppercase tracking-[0.18em] ${theme.accentText}`}>
                {theme.eyebrow}
              </p>
              <h3 className="text-sm font-bold tracking-tight text-foreground leading-tight truncate">
                {theme.title}
              </h3>
            </div>
          </div>
          <span className="shrink-0 rounded-full border border-border/70 bg-background/50 dark:bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
            {rangeLabel}
          </span>
        </div>

        <div className="mt-3 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <p
                className="text-3xl font-black tracking-tighter tabular-nums leading-none"
                style={{
                  background: `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accentSoft} 55%, ${theme.accent} 100%)`,
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                {formatHero(total)}
              </p>
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground pb-0.5">
                {theme.heroSuffix}
              </span>
            </div>
            <div className="mt-1.5">
              <TrendBadge delta={trend} compareLabel={compareLabel} />
            </div>
          </div>
          {peak && peak.value > 0 ? (
            <div className="shrink-0 rounded-xl border border-border/60 bg-background/55 dark:bg-black/25 px-2.5 py-1.5 backdrop-blur-md">
              <p className="text-[8px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                {theme.peakLabel}
              </p>
              <p className="text-xs font-bold text-foreground tabular-nums">
                {peak.day}
                <span className={`ml-1 ${theme.accentText}`}>{formatPoint(peak.value)}</span>
              </p>
            </div>
          ) : null}
        </div>

        <div className="relative mt-2.5 h-32 sm:h-36">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 8, right: 4, left: -22, bottom: 0 }}
              onMouseMove={(state) => {
                if (state?.activeTooltipIndex != null) setHoverIndex(state.activeTooltipIndex);
              }}
              onMouseLeave={() => setHoverIndex(null)}
            >
              <defs>
                <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={theme.gradientFrom} stopOpacity={0.5} />
                  <stop offset="55%" stopColor={theme.gradientFrom} stopOpacity={0.1} />
                  <stop offset="100%" stopColor={theme.gradientFrom} stopOpacity={0} />
                </linearGradient>
                <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="2.8" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid
                strokeDasharray="4 8"
                stroke="rgba(148,163,184,0.14)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                content={<ChartTooltip theme={theme} formatValue={formatPoint} />}
                cursor={{
                  stroke: theme.accent,
                  strokeWidth: 1,
                  strokeDasharray: '4 6',
                  strokeOpacity: 0.4,
                }}
              />
              <Area
                type="monotone"
                dataKey={theme.dataKey}
                stroke={theme.accent}
                strokeWidth={2.75}
                fill={`url(#${fillId})`}
                filter={`url(#${glowId})`}
                className={reduceMotion ? undefined : 'ti-chart-flow-stroke'}
                dot={(props) => {
                  const { cx, cy, index, payload } = props;
                  if (cx == null || cy == null) return null;
                  const isPeak = peak && payload?.day === peak.day && peak.value > 0;
                  const isHover = index === hoverIndex;
                  if (!isPeak && !isHover) {
                    return (
                      <circle
                        key={`dot-${index}`}
                        cx={cx}
                        cy={cy}
                        r={2.5}
                        fill={theme.accent}
                        fillOpacity={0.85}
                      />
                    );
                  }
                  return (
                    <g key={`dot-${index}`}>
                      {isPeak ? (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={9}
                          fill={theme.accent}
                          fillOpacity={0.18}
                          className={reduceMotion ? undefined : 'ti-chart-peak-ring'}
                        />
                      ) : null}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isHover ? 5.5 : 5}
                        fill={theme.accent}
                        stroke="#fff"
                        strokeWidth={2}
                        style={{ filter: `drop-shadow(0 0 6px ${theme.accentGlow})` }}
                      />
                    </g>
                  );
                }}
                activeDot={false}
                isAnimationActive={!reduceMotion}
                animationDuration={900}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 flex items-end gap-0.5 sm:gap-1 h-7">
          {bars.map((bar, i) => {
            const lit = activeBar ? i === hoverIndex : bar.isPeak;
            return (
              <button
                key={`${bar.day}-${i}`}
                type="button"
                className="flex-1 h-full flex flex-col justify-end items-center rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5D3FD3]/40"
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
                onFocus={() => setHoverIndex(i)}
                onBlur={() => setHoverIndex(null)}
                aria-label={`${bar.day}: ${formatPoint(bar.value)}`}
              >
                <span
                  className={`w-full max-w-3 rounded-t-sm transition-all duration-300 origin-bottom ${
                    lit ? 'ti-day-bar--lit' : 'ti-day-bar'
                  }`}
                  style={{
                    height: `${bar.heightPct}%`,
                    background: lit
                      ? `linear-gradient(180deg, ${theme.accentSoft}, ${theme.accent})`
                      : undefined,
                    boxShadow: lit ? `0 0 10px ${theme.accentGlow}` : undefined,
                    animationDelay: reduceMotion ? undefined : `${i * 0.04}s`,
                  }}
                />
              </button>
            );
          })}
        </div>

        {activeBar ? (
          <p className="mt-1.5 text-center text-[10px] font-bold text-muted-foreground tabular-nums">
            <span className={theme.accentText}>{activeBar.day}</span>
            {' · '}
            {formatPoint(activeBar.value)}
          </p>
        ) : (
          <div className="mt-1.5 h-4" aria-hidden />
        )}
      </div>
    </motion.div>
  );
}
