'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Flame, Timer } from 'lucide-react';
import StreakRankMark from '@/components/analysis/StreakRankMark';
import { workspacePanelRaised } from '@/components/b2b/workspaceShellClasses';
import {
  hexToRgba,
  streakRankGuide,
  streakRankPillStyle,
  streakRankTheme,
} from '@/lib/focusStreak';

function formatFocusMinutes(minutes) {
  const m = Math.max(0, Math.round(Number(minutes) || 0));
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
}

function useCountUp(target, reduced) {
  const end = Math.max(0, Math.round(Number(target) || 0));
  const [value, setValue] = useState(reduced ? end : 0);

  useEffect(() => {
    if (reduced) {
      setValue(end);
      return undefined;
    }
    let frame = 0;
    const start = performance.now();
    const duration = 820;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setValue(Math.round(end * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [end, reduced]);

  return value;
}

function MiniAvatar({ label, imageUrl }) {
  const initials = (label || '?').slice(0, 2).toUpperCase();
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-white/20" />
    );
  }
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#5D3FD3] to-[#7c5cff] text-[10px] font-bold text-white ring-2 ring-white/20">
      {initials}
    </div>
  );
}

/**
 * Team focus hours, streaks, and ranks — Insights forge.
 */
export default function TeamFocusForge({
  members = [],
  rangeLabel = 'Last 7 days',
  currentUserId = null,
}) {
  const reduced = useReducedMotion();
  const [filterTitle, setFilterTitle] = useState(null);
  const roster = Array.isArray(members) ? members : [];

  const census = useMemo(() => {
    const ranks = streakRankGuide();
    const counts = Object.fromEntries(ranks.map((r) => [r.title, 0]));
    let unlit = 0;
    for (const row of roster) {
      const title = row.streakTitle && row.streakTitle !== 'Unlit' ? row.streakTitle : null;
      if (title && counts[title] != null) counts[title] += 1;
      else unlit += 1;
    }
    return ranks.map((r) => ({ ...r, count: counts[r.title] || 0 })).concat(
      unlit > 0 ? [{ title: 'Unlit', count: unlit, hex: '#78716c', from: '#a8a29e', to: '#57534e', min: 0 }] : []
    );
  }, [roster]);

  const visible = useMemo(() => {
    if (!filterTitle) return roster;
    if (filterTitle === 'Unlit') {
      return roster.filter((r) => !r.streakTitle || r.streakTitle === 'Unlit');
    }
    return roster.filter((r) => r.streakTitle === filterTitle);
  }, [roster, filterTitle]);

  const byHours = useMemo(
    () => [...visible].sort((a, b) => (b.focusMinutes || 0) - (a.focusMinutes || 0) || (b.streak || 0) - (a.streak || 0)),
    [visible]
  );
  const byStreak = useMemo(
    () => [...visible].sort((a, b) => (b.streak || 0) - (a.streak || 0) || (b.focusMinutes || 0) - (a.focusMinutes || 0)),
    [visible]
  );

  const totalMinutes = roster.reduce((sum, r) => sum + (Number(r.focusMinutes) || 0), 0);
  const counted = useCountUp(totalMinutes, Boolean(reduced));
  const maxHours = Math.max(1, ...byHours.map((r) => Number(r.focusMinutes) || 0));

  const hottest = [...roster].sort((a, b) => (b.streak || 0) - (a.streak || 0))[0] || null;
  const deepest = [...roster].sort((a, b) => (b.focusMinutes || 0) - (a.focusMinutes || 0))[0] || null;
  const hottestTheme = streakRankTheme(hottest?.streakTitle);
  const deepestTheme = streakRankTheme(deepest?.streakTitle);

  if (!roster.length) return null;

  return (
    <section className={`${workspacePanelRaised} tf-forge relative overflow-hidden p-5 sm:p-7`}>
      <div className="tf-forge-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="tf-forge-orb pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full blur-3xl" aria-hidden />

      <div className="relative z-[1]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-300">
              <Flame className="h-4 w-4" fill="currentColor" aria-hidden />
              <p className="text-[11px] font-bold uppercase tracking-[0.2em]">Focus forge</p>
            </div>
            <h2 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Hours, streaks, ranks
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {rangeLabel} — every flame is Active Focus time.
            </p>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl sm:text-5xl font-black tabular-nums tracking-tighter text-foreground leading-none">
              {formatFocusMinutes(counted)}
            </p>
            <span className="pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              team
            </span>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {hottest && hottest.streak > 0 ? (
            <div
              className="flex items-center gap-3 rounded-2xl border px-3.5 py-3"
              style={{
                borderColor: hexToRgba(hottestTheme.hex, 0.35),
                background: hexToRgba(hottestTheme.hex, 0.08),
              }}
            >
              <StreakRankMark title={hottest.streakTitle} size="sm" reduced={Boolean(reduced)} />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Hottest streak</p>
                <p className="truncate text-sm font-bold text-foreground">{hottest.label}</p>
                <p className="text-[12px] font-semibold tabular-nums" style={{ color: hottestTheme.to }}>
                  {hottest.streak} {hottest.streak === 1 ? 'day' : 'days'} · {hottest.streakTitle}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border px-3.5 py-3 text-sm text-muted-foreground">
              No live streaks yet — first session lights the forge.
            </div>
          )}
          {deepest && deepest.focusMinutes > 0 ? (
            <div
              className="flex items-center gap-3 rounded-2xl border px-3.5 py-3"
              style={{
                borderColor: hexToRgba(deepestTheme.hex, 0.35),
                background: hexToRgba(deepestTheme.hex, 0.08),
              }}
            >
              <Timer className="h-8 w-8 shrink-0" style={{ color: deepestTheme.hex }} aria-hidden />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Deepest hours</p>
                <p className="truncate text-sm font-bold text-foreground">{deepest.label}</p>
                <p className="text-[12px] font-semibold tabular-nums" style={{ color: deepestTheme.to }}>
                  {formatFocusMinutes(deepest.focusMinutes)} this period
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border px-3.5 py-3 text-sm text-muted-foreground">
              No focus hours logged in this window.
            </div>
          )}
        </div>

        <div className="mt-6">
          <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Rank constellation{filterTitle ? ` · ${filterTitle}` : ''}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
            {census.map((row) => {
              const active = filterTitle === row.title;
              const empty = row.count === 0;
              return (
                <button
                  key={row.title}
                  type="button"
                  onClick={() => setFilterTitle((prev) => (prev === row.title ? null : row.title))}
                  className={`flex min-w-[4.6rem] cursor-pointer flex-col items-center gap-1.5 rounded-2xl border px-2.5 py-2.5 transition-transform duration-200 ${
                    empty ? 'opacity-40' : 'hover:-translate-y-0.5'
                  }`}
                  style={{
                    borderColor: active ? row.hex : hexToRgba(row.hex || '#78716c', 0.28),
                    background: active ? hexToRgba(row.hex || '#78716c', 0.16) : hexToRgba(row.hex || '#78716c', 0.06),
                    boxShadow: active ? `0 10px 28px ${hexToRgba(row.hex || '#78716c', 0.28)}` : undefined,
                  }}
                >
                  <StreakRankMark
                    title={row.title}
                    row={row.title === 'Unlit' ? null : row}
                    size="sm"
                    reduced={Boolean(reduced) || empty}
                  />
                  <span className="text-[10px] font-bold leading-tight text-foreground">{row.title}</span>
                  <span className="text-[11px] font-black tabular-nums" style={{ color: row.hex || '#78716c' }}>
                    {row.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 grid items-stretch gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="flex min-h-0 flex-col">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Hour race</p>
            <ul className="flex flex-1 flex-col gap-4">
              {byHours.map((row, i) => {
                const theme = streakRankTheme(row.streakTitle);
                const pct = Math.max(row.focusMinutes > 0 ? 6 : 0, Math.round(((row.focusMinutes || 0) / maxHours) * 100));
                const isYou = row.userId === currentUserId;
                return (
                  <li
                    key={row.userId}
                    className="flex min-h-[4.75rem] flex-1 flex-col justify-center rounded-2xl border border-border/70 bg-background/40 px-3.5 py-3.5 dark:border-white/[0.08] dark:bg-white/[0.03]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <MiniAvatar label={row.label} imageUrl={row.imageUrl} />
                        <span className="truncate text-sm font-semibold text-foreground">
                          {row.label}
                          {isYou ? <span className="ml-1.5 text-[10px] font-black uppercase text-[#5D3FD3]">You</span> : null}
                        </span>
                      </div>
                      <span className="shrink-0 text-[12px] font-bold tabular-nums text-foreground">
                        {formatFocusMinutes(row.focusMinutes)}
                      </span>
                    </div>
                    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted/80 dark:bg-white/10">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: theme.ctaH }}
                        initial={reduced ? false : { width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{
                          delay: reduced ? 0 : 0.04 + i * 0.04,
                          duration: reduced ? 0 : 0.55,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex min-h-0 flex-col">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Streak lanterns</p>
            <ul className="grid flex-1 auto-rows-fr grid-cols-1 content-stretch gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {byStreak.map((row, i) => {
                const theme = streakRankTheme(row.streakTitle);
                const pill = streakRankPillStyle(row.streakTitle);
                const lit = (row.streak || 0) > 0;
                return (
                  <motion.li
                    key={row.userId}
                    className="flex min-h-[4.75rem] items-center gap-3 rounded-2xl border px-3.5 py-3.5"
                    style={{
                      borderColor: hexToRgba(theme.hex, 0.28),
                      background: hexToRgba(theme.hex, 0.07),
                    }}
                    initial={reduced ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: reduced ? 0 : 0.04 + i * 0.03, duration: 0.32 }}
                  >
                    <StreakRankMark
                      title={row.streakTitle}
                      size="sm"
                      reduced={Boolean(reduced) || !lit}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-foreground">{row.label}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="text-lg font-black tabular-nums leading-none text-foreground">
                          {row.streak || 0}
                        </span>
                        <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                          {(row.streak || 0) === 1 ? 'day' : 'days'}
                        </span>
                        {row.streakTitle ? (
                          <span
                            className="rounded-full border px-1.5 py-px text-[9px] font-bold uppercase tracking-wider"
                            style={
                              pill || {
                                backgroundColor: 'var(--muted)',
                                color: 'var(--muted-foreground)',
                                borderColor: 'var(--border)',
                              }
                            }
                          >
                            {row.streakTitle}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
