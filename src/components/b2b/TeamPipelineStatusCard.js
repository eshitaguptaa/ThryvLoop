'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { CheckCircle2, CircleDashed, Loader } from 'lucide-react';

const STATUS_META = {
  'To do': {
    key: 'todo',
    label: 'To do',
    short: 'Todo',
    Icon: CircleDashed,
    accent: '#64748b',
    soft: '#94a3b8',
    glow: 'rgba(100, 116, 139, 0.35)',
    chip: 'bg-slate-500/12 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200',
    bar: 'from-slate-400 to-slate-500',
    text: 'text-slate-600 dark:text-slate-300',
  },
  'In progress': {
    key: 'progress',
    label: 'In progress',
    short: 'Active',
    Icon: Loader,
    accent: '#ea580c',
    soft: '#fb923c',
    glow: 'rgba(234, 88, 12, 0.4)',
    chip: 'bg-orange-500/12 text-orange-700 dark:bg-orange-500/20 dark:text-orange-200',
    bar: 'from-orange-400 to-orange-600',
    text: 'text-orange-600 dark:text-orange-300',
  },
  Done: {
    key: 'done',
    label: 'Done',
    short: 'Shipped',
    Icon: CheckCircle2,
    accent: '#16a34a',
    soft: '#4ade80',
    glow: 'rgba(34, 197, 94, 0.4)',
    chip: 'bg-emerald-500/12 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
    bar: 'from-emerald-400 to-emerald-600',
    text: 'text-emerald-600 dark:text-emerald-300',
  },
};

/**
 * Magnificent pipeline status card for Team Insights.
 *
 * @param {{
 *   data?: Array<{ status: string, count: number }>,
 *   rangeLabel?: string,
 *   overdue?: number,
 *   overdueTrend?: number | null,
 *   compareLabel?: string,
 * }} props
 */
export default function TeamPipelineStatusCard({
  data = [],
  rangeLabel = '',
  overdue = 0,
  overdueTrend = null,
  compareLabel = 'prior period',
}) {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(null);

  const rows = useMemo(() => {
    const order = ['To do', 'In progress', 'Done'];
    const byStatus = Object.fromEntries((data || []).map((d) => [d.status, Number(d.count) || 0]));
    const total = order.reduce((sum, s) => sum + (byStatus[s] || 0), 0);
    const max = Math.max(1, ...order.map((s) => byStatus[s] || 0));
    return order.map((status) => {
      const count = byStatus[status] || 0;
      const meta = STATUS_META[status];
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      const heightPct = Math.max(12, Math.round((count / max) * 100));
      return { status, count, pct, heightPct, meta };
    });
  }, [data]);

  const total = rows.reduce((sum, r) => sum + r.count, 0);
  const donePct = rows.find((r) => r.status === 'Done')?.pct ?? 0;
  const activeRow = active != null ? rows[active] : null;
  const overdueN = Math.max(0, Math.round(Number(overdue) || 0));

  return (
    <motion.div
      className="ti-pipeline-card relative overflow-hidden rounded-2xl border border-border dark:border-white/8 ring-1 ring-teal-500/15 dark:ring-teal-400/25 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.16)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_16px_36px_-18px_rgba(0,0,0,0.55)]"
      whileHover={reduceMotion ? undefined : { y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      <div className="ti-pipeline-stage absolute inset-0" aria-hidden />
      <div className="ti-chart-orb--teal pointer-events-none absolute -top-14 -right-10 h-36 w-36 rounded-full blur-3xl" aria-hidden />
      <div className="ti-chart-orb--emerald pointer-events-none absolute -bottom-16 -left-8 h-32 w-32 rounded-full blur-3xl" aria-hidden />
      <div className="ti-rhythm-sheen pointer-events-none absolute inset-0 opacity-80" aria-hidden />

      <div className="relative z-1 flex flex-col p-3.5 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
              Pipeline
            </p>
            <h3 className="text-sm font-bold tracking-tight text-foreground leading-tight">
              By status
            </h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {overdueN > 0 ? (
              <span className="rounded-full border border-rose-200/80 bg-rose-50 px-2 py-0.5 text-[10px] font-black tabular-nums text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-200">
                {overdueN} overdue
                {overdueTrend != null && overdueTrend !== 0 ? (
                  <span className="ml-1 font-bold opacity-80">
                    {overdueTrend > 0 ? '↑' : '↓'}
                    {Math.abs(overdueTrend)}%
                  </span>
                ) : null}
              </span>
            ) : (
              <span className="rounded-full border border-emerald-200/70 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-950/40 dark:text-emerald-300">
                Clear aging
              </span>
            )}
            {rangeLabel ? (
              <span className="rounded-full border border-border/70 bg-background/50 dark:bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                {rangeLabel}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-2">
              <p
                className="text-3xl font-black tracking-tighter tabular-nums leading-none"
                style={{
                  background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #34d399 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                {total}
              </p>
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground pb-0.5">
                in play
              </span>
            </div>
            <p className="mt-1 text-[11px] font-semibold text-muted-foreground">
              <span className="text-emerald-600 dark:text-emerald-300 font-bold tabular-nums">
                {donePct}%
              </span>{' '}
              already shipped
            </p>
          </div>
        </div>

        {/* Stacked flow rail */}
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted/70 dark:bg-white/10 flex">
          {rows.map((row, i) =>
            row.pct > 0 ? (
              <motion.div
                key={row.status}
                className={`h-full bg-gradient-to-r ${row.meta.bar} ${i === 0 ? 'rounded-l-full' : ''} ${i === rows.length - 1 || rows.slice(i + 1).every((r) => r.pct === 0) ? 'rounded-r-full' : ''}`}
                initial={reduceMotion ? false : { width: 0 }}
                animate={{ width: `${row.pct}%` }}
                transition={{ duration: 0.7, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  boxShadow: active === i ? `0 0 14px ${row.meta.glow}` : undefined,
                }}
              />
            ) : null
          )}
        </div>

        {/* Status pillars */}
        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
          {rows.map((row, i) => {
            const { Icon } = row.meta;
            const lit = active == null || active === i;
            const focused = active === i;
            return (
              <button
                key={row.status}
                type="button"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className={`ti-pipeline-pillar group relative flex flex-col items-center rounded-2xl border px-2 py-3 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 ${
                  focused
                    ? 'border-transparent bg-background/80 dark:bg-black/30 shadow-lg scale-[1.02]'
                    : 'border-border/50 bg-background/35 dark:bg-white/[0.03] hover:bg-background/60'
                } ${!lit ? 'opacity-55' : ''}`}
                style={
                  focused
                    ? { boxShadow: `0 12px 28px -14px ${row.meta.glow}` }
                    : undefined
                }
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl ${row.meta.chip}`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 ${row.status === 'In progress' && !reduceMotion ? 'ti-pipeline-spin' : ''}`}
                    strokeWidth={2.4}
                    aria-hidden
                  />
                </div>
                <p className={`mt-2 text-[10px] font-black uppercase tracking-wider ${row.meta.text}`}>
                  {row.meta.short}
                </p>
                <p className="mt-1 text-2xl font-black tabular-nums tracking-tight text-foreground leading-none">
                  {row.count}
                </p>

                <div className="mt-3 flex h-16 w-full items-end justify-center">
                  <motion.div
                    className={`w-7 sm:w-8 rounded-t-lg bg-gradient-to-t ${row.meta.bar} ti-pipeline-column`}
                    initial={reduceMotion ? false : { height: '12%' }}
                    animate={{ height: `${row.heightPct}%` }}
                    transition={{ duration: 0.75, delay: 0.1 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      boxShadow: focused || row.count > 0 ? `0 0 18px ${row.meta.glow}` : undefined,
                    }}
                  />
                </div>

                <p className="mt-2 text-[10px] font-bold tabular-nums text-muted-foreground">
                  {row.pct}%
                </p>
              </button>
            );
          })}
        </div>

        {activeRow ? (
          <p className="mt-2.5 text-center text-[10px] font-bold text-muted-foreground tabular-nums">
            <span className={activeRow.meta.text}>{activeRow.meta.label}</span>
            {' · '}
            {activeRow.count} task{activeRow.count === 1 ? '' : 's'} · {activeRow.pct}% of pipeline
          </p>
        ) : (
          <p className="mt-2.5 text-center text-[10px] font-medium text-muted-foreground/80">
            Hover a stage to inspect the flow
          </p>
        )}
      </div>
    </motion.div>
  );
}
