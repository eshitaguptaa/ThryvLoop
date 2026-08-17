'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { useCelebration } from '@/contexts/CelebrationContext';
import { previewStreakCelebrationPayload, streakRankPillStyle, streakRankTheme } from '@/lib/focusStreak';
import { playStreakChime } from '@/utils/celebrationSound';

const EMBER_COUNT = 11;
const SPARK_COUNT = 14;

function FlameParticles({ reduced, colors }) {
  const swatch = Array.isArray(colors) && colors.length ? colors.join('|') : '#fdba74|#fb923c|#f97316|#fbbf24|#fff7ed';
  const embers = useMemo(() => {
    const palette = swatch.split('|');
    return Array.from({ length: EMBER_COUNT }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 28,
      delay: Math.random() * 1.3,
      duration: 1.4 + Math.random() * 0.7,
      size: 1.6 + Math.random() * 1.8,
      color: palette[i % palette.length],
    }));
  }, [swatch]);
  const sparks = useMemo(() => {
    const palette = swatch.split('|');
    return Array.from({ length: SPARK_COUNT }, (_, i) => {
      const angle = -Math.PI * 0.18 - Math.random() * Math.PI * 0.64;
      const dist = 12 + Math.random() * 16;
      return {
        id: i,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        delay: 0.1 + Math.random() * 0.18,
        size: 1.6 + Math.random() * 1.8,
        color: palette[i % palette.length],
      };
    });
  }, [swatch]);

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        maskImage: 'radial-gradient(ellipse 55% 70% at 50% 58%, #000 0%, transparent 72%)',
        WebkitMaskImage: 'radial-gradient(ellipse 55% 70% at 50% 58%, #000 0%, transparent 72%)',
      }}
      aria-hidden
    >
      {embers.map((bit) => (
        <motion.span
          key={`e-${bit.id}`}
          className="absolute left-1/2 top-[64%] rounded-full"
          style={{
            width: bit.size,
            height: bit.size,
            background: bit.color,
            boxShadow: `0 0 6px ${bit.color}`,
          }}
          animate={reduced ? undefined : { opacity: [0, 1, 0], x: bit.x, y: -26, scale: [0.4, 1, 0.2] }}
          transition={{ duration: bit.duration, delay: bit.delay, repeat: Infinity, ease: 'easeOut' }}
        />
      ))}
      {sparks.map((s) => (
        <motion.span
          key={`s-${s.id}`}
          className="absolute left-1/2 top-[42%] rounded-full"
          style={{
            width: s.size,
            height: s.size,
            background: s.color,
            boxShadow: `0 0 6px ${s.color}`,
          }}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0.2 }}
          animate={{ opacity: [0, 1, 0], x: s.x, y: s.y, scale: [0.2, 1, 0.2] }}
          transition={{ duration: 0.6, delay: s.delay, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
    </div>
  );
}

function MiniFlame({ core }) {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
      <path
        d="M8 1.2c-.3 2.4-2.6 3.2-2.9 6.1C4.8 9.8 6.2 11.6 8 12.2c1.8-.6 3.2-2.4 2.9-4.9C10.6 4.4 8.3 3.6 8 1.2Z"
        fill="#fff7ed"
      />
      <path
        d="M8 5.2c-.2 1.3-1.3 1.7-1.4 3.1C6.5 9.6 7.1 10.5 8 10.8c.9-.3 1.5-1.2 1.4-2.5C9.3 6.9 8.2 6.5 8 5.2Z"
        fill={core || '#fb923c'}
      />
    </svg>
  );
}

function IgnitingFlame({ reduced, theme, rankedUp }) {
  const uid = useId().replace(/:/g, '');
  const outerId = `streak-flame-outer-${uid}`;
  const midId = `streak-flame-mid-${uid}`;
  const haloScale = rankedUp ? [0.98, 1.16, 1.02] : [0.94, 1.08, 1];

  return (
    <div
      className={[
        'relative mx-auto h-[6.5rem] w-36',
        theme?.motion === 'orbit' ? 'srk-mark--orbit' : '',
        theme?.motion === 'shine' ? 'srk-mark--shine' : '',
      ].join(' ')}
    >
      {theme?.motion === 'orbit' && !reduced ? (
        <>
          <span className="srk-orbit srk-orbit--a" />
          <span className="srk-orbit srk-orbit--b" />
        </>
      ) : null}
      {theme?.motion === 'shine' && !reduced ? <span className="srk-sheen" /> : null}
      <motion.div
        className="absolute left-1/2 top-[58%] h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: theme?.halo,
        }}
        animate={reduced ? undefined : { opacity: rankedUp ? [0.75, 1, 0.8] : [0.65, 1, 0.7], scale: haloScale }}
        transition={{ duration: rankedUp ? 1.6 : 2.2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <FlameParticles reduced={Boolean(reduced)} colors={theme?.particles} />
      <motion.svg
        viewBox="0 0 64 64"
        className="relative z-10 mx-auto mt-1 block h-[5.75rem] w-[5.75rem]"
        initial={reduced ? false : { scale: rankedUp ? 0.42 : 0.5, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 16, delay: 0.05 }}
      >
        <defs>
          <linearGradient id={outerId} x1="32" y1="2" x2="32" y2="62" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={theme?.from || '#ffedd5'} />
            <stop offset="32%" stopColor={theme?.hex || '#fb923c'} />
            <stop offset="100%" stopColor={theme?.to || '#9a3412'} />
          </linearGradient>
          <linearGradient id={midId} x1="32" y1="16" x2="32" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="48%" stopColor={theme?.from || '#fbbf24'} />
            <stop offset="100%" stopColor={theme?.hex || '#ea580c'} />
          </linearGradient>
        </defs>
        <motion.path
          d="M32 2.5C29.5 16 17.5 21 15.8 35.2 14.2 48.2 22.8 57 32 61.2 41.2 57 49.8 48.2 48.2 35.2 46.5 21 34.5 16 32 2.5Z"
          fill={`url(#${outerId})`}
          style={{ transformOrigin: '32px 58px' }}
          animate={reduced ? undefined : { scaleY: [1, 1.05, 0.97, 1.03, 1], scaleX: [1, 0.97, 1.03, 1] }}
          transition={{ duration: rankedUp ? 1.15 : 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.path
          d="M32 17C30.2 26.5 23.6 30 23 40.2 22.5 48 26.8 52.8 32 55 37.2 52.8 41.5 48 41 40.2 40.4 30 33.8 26.5 32 17Z"
          fill={`url(#${midId})`}
          style={{ transformOrigin: '32px 54px' }}
          animate={reduced ? undefined : { scaleY: [1, 0.94, 1.07, 1] }}
          transition={{ duration: 1.15, repeat: Infinity, ease: 'easeInOut', delay: 0.08 }}
        />
        <motion.ellipse
          cx="32"
          cy="44.5"
          rx="5.2"
          ry="8.2"
          fill="#fff7ed"
          animate={reduced ? undefined : { opacity: [0.82, 1, 0.72, 0.96] }}
          transition={{ duration: 0.85, repeat: Infinity }}
        />
      </motion.svg>
    </div>
  );
}

function RollingNumber({ from, to, reduced }) {
  const [value, setValue] = useState(reduced ? to : from);

  useEffect(() => {
    if (reduced) {
      setValue(to);
      return undefined;
    }
    let frame = 0;
    const startAt = performance.now() + 380;
    const duration = 700;
    const tick = (now) => {
      if (now < startAt) {
        frame = requestAnimationFrame(tick);
        return;
      }
      const t = Math.min(1, (now - startAt) / duration);
      const eased = 1 - (1 - t) ** 4;
      setValue(Math.round(from + (to - from) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [from, to, reduced]);

  return (
    <span className="tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
      {value}
    </span>
  );
}

function RankTrack({ nextTitle, remaining, fromPct, toPct, reduced, theme }) {
  if (!nextTitle) return null;
  const start = Math.max(0, Math.min(100, Number(fromPct) || 0));
  const end = Math.max(8, Math.min(100, Number(toPct) || 0));
  const daysOut = Math.max(0, Math.floor(Number(remaining) || 0));
  const nextTheme = streakRankTheme(nextTitle);

  return (
    <div className="mt-5">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="text-[12px] font-medium text-white/70">
          Next up · <span style={{ color: nextTheme.from }}>{nextTitle}</span>
        </p>
        <p className="text-[11px] tabular-nums text-white/40">
          {daysOut === 1 ? '1 day out' : `${daysOut} days out`}
        </p>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="relative h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${theme?.hex || '#fbbf24'}, ${nextTheme.hex})` }}
          initial={{ width: `${start}%` }}
          animate={{ width: `${end}%` }}
          transition={{ delay: reduced ? 0 : 0.9, duration: reduced ? 0 : 0.85, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.span
            className="absolute inset-y-0 right-0 w-6 bg-white/50 blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.4] }}
            transition={{ delay: 1.1, duration: 0.7 }}
          />
        </motion.div>
      </div>
    </div>
  );
}

function WeekDots({ week, reduced, theme }) {
  const days = Array.isArray(week) && week.length === 7 ? week : [];
  if (!days.length) return null;

  return (
    <div className="mt-6 grid grid-cols-7 gap-1.5">
      {days.map((day, i) => (
        <div key={day.key} className="flex flex-col items-center gap-1.5">
          <motion.div
            className={[
              'flex h-9 w-9 items-center justify-center rounded-xl',
              day.lit ? '' : 'bg-white/[0.06] ring-1 ring-inset ring-white/10',
            ].join(' ')}
            style={day.lit ? { background: theme?.well } : undefined}
            initial={reduced ? false : { scale: 0.7, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
              boxShadow: day.isToday
                ? theme?.todayRing
                : day.lit
                  ? theme?.tileShadow
                  : 'none',
            }}
            transition={{
              delay: reduced ? 0 : 0.5 + i * 0.045,
              type: 'spring',
              stiffness: 480,
              damping: 18,
            }}
          >
            {day.lit ? <MiniFlame core={theme?.hex} /> : null}
          </motion.div>
          <span
            className="text-[10px] font-medium"
            style={{ color: day.isToday ? theme?.from : 'rgba(255,255,255,0.4)' }}
          >
            {day.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function StreakCelebrationModal() {
  const { celebration, dismissCelebration, showCelebration } = useCelebration();
  const reduced = useReducedMotion();
  const open = celebration?.type === 'streak';
  const days = Math.max(1, Number(celebration?.days) || 1);
  const previousDays = Math.max(0, Number(celebration?.previousDays) || 0);
  const copy = celebration?.copy || {};
  const week = Array.isArray(celebration?.week) ? celebration.week : [];
  const rank =
    celebration?.rankTitle && celebration.rankTitle !== 'Unlit' ? celebration.rankTitle : null;
  const rankedUp = Boolean(celebration?.rankedUp);
  const theme = streakRankTheme(rank, { rankedUp });
  const previewedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const preview = (n = 2) => {
      showCelebration(previewStreakCelebrationPayload(n));
    };
    window.__thryvPreviewStreak = preview;

    const onKey = (e) => {
      if (e.altKey && e.shiftKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        preview(2);
      }
    };
    window.addEventListener('keydown', onKey);

    if (!previewedRef.current) {
      const params = new URLSearchParams(window.location.search);
      const flagged =
        params.get('streakPreview') === '1' ||
        window.sessionStorage.getItem('thryvloop:streak-preview') === '1';
      if (params.get('streakPreview') === '1') {
        window.sessionStorage.setItem('thryvloop:streak-preview', '1');
      }
      if (flagged) {
        previewedRef.current = true;
        window.sessionStorage.removeItem('thryvloop:streak-preview');
        const id = window.setTimeout(() => preview(2), 400);
        return () => {
          window.clearTimeout(id);
          window.removeEventListener('keydown', onKey);
          if (window.__thryvPreviewStreak === preview) {
            delete window.__thryvPreviewStreak;
          }
        };
      }
    }

    return () => {
      window.removeEventListener('keydown', onKey);
      if (window.__thryvPreviewStreak === preview) {
        delete window.__thryvPreviewStreak;
      }
    };
  }, [showCelebration]);

  useEffect(() => {
    if (!open) return undefined;
    document.body.style.overflow = 'hidden';
    playStreakChime();
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') dismissCelebration();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, dismissCelebration]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.button
            type="button"
            aria-label="Dismiss streak celebration"
            className="absolute inset-0 bg-black/70 backdrop-blur-[10px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismissCelebration}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="streak-celebrate-title"
            className="relative w-full max-w-[21rem] overflow-hidden rounded-[1.85rem] border bg-[#171310] shadow-[0_32px_90px_-18px_rgba(0,0,0,0.8)]"
            style={{ borderColor: theme.border }}
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: rankedUp ? 0.88 : 0.92, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-40"
              style={{ background: theme.wash }}
              aria-hidden
            />

            <button
              type="button"
              onClick={dismissCelebration}
              className="absolute right-3 top-3 z-20 rounded-full p-1.5 text-white/35 transition-colors hover:bg-white/8 hover:text-white/80"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative px-6 pb-6 pt-7">
              <h2 id="streak-celebrate-title" className="sr-only">
                {days}-day focus streak
              </h2>

              <motion.div
                className="flex flex-col items-center gap-2"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
              >
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.24em]"
                  style={{ color: theme.from, opacity: 0.8 }}
                >
                  {copy.eyebrow || 'Daily streak'}
                </p>
                {rank ? (
                  <span
                    className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]"
                    style={streakRankPillStyle(rank, { onDark: true }) || undefined}
                  >
                    {rank}
                  </span>
                ) : null}
              </motion.div>

              <div className="mt-2">
                <IgnitingFlame reduced={Boolean(reduced)} theme={theme} rankedUp={rankedUp} />
              </div>

              <div className="relative mx-auto mt-0.5 w-max">
                <motion.p
                  className="text-[4.25rem] font-semibold leading-none tracking-tight text-[#fff6ea]"
                  style={{ textShadow: theme.numberGlow }}
                  aria-hidden
                  initial={reduced ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.22, duration: 0.35 }}
                >
                  <RollingNumber from={previousDays} to={days} reduced={Boolean(reduced)} />
                </motion.p>
                <motion.span
                  className="absolute -right-8 top-2 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
                  style={{ background: theme.cta, boxShadow: theme.plusShadow }}
                  initial={reduced ? false : { opacity: 0, y: 8, scale: 0.6 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.52, type: 'spring', stiffness: 420, damping: 16 }}
                >
                  +1
                </motion.span>
              </div>

              <motion.p
                className="mt-1 text-center text-[15px] font-medium text-white/60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.48 }}
              >
                {copy.headline || 'days in a row'}
              </motion.p>

              <WeekDots week={week} reduced={Boolean(reduced)} theme={theme} />

              <RankTrack
                nextTitle={celebration?.nextRankTitle}
                remaining={celebration?.remaining}
                fromPct={celebration?.previousProgress}
                toPct={celebration?.progress}
                reduced={Boolean(reduced)}
                theme={theme}
              />

              <motion.p
                className="mt-4 text-center text-[13px] leading-snug text-white/45"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.05 }}
              >
                {copy.sub || 'You showed up. Tomorrow is what makes it a streak.'}
              </motion.p>

              <motion.button
                type="button"
                onClick={dismissCelebration}
                className="mt-5 w-full rounded-2xl py-3 text-sm font-semibold transition-transform hover:scale-[1.015] active:scale-[0.985]"
                style={{ background: theme.cta, color: theme.ctaInk, boxShadow: theme.ctaShadow }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.95 }}
              >
                {copy.cta || 'Keep focusing'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
