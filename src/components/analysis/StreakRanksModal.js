'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { streakRankGuide } from '@/lib/focusStreak';
import StreakRankMark from '@/components/analysis/StreakRankMark';

export default function StreakRanksModal({ open, onClose, streak = 0, currentTitle }) {
  const reduced = useReducedMotion();
  const ranks = streakRankGuide();
  const currentMin = Math.max(0, Math.floor(Number(streak) || 0));
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            aria-label="Close streak ranks"
            className="absolute inset-0 bg-black/70 backdrop-blur-[10px]"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="streak-ranks-title"
            className="relative flex max-h-[min(88vh,40rem)] w-full max-w-[26rem] flex-col overflow-hidden rounded-[1.85rem] border border-white/[0.1] bg-[#14110e] shadow-[0_32px_90px_-18px_rgba(0,0,0,0.8)]"
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 8 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-36"
              style={{
                background:
                  'radial-gradient(ellipse 80% 90% at 50% 0%, rgba(249,115,22,0.22), transparent 70%)',
              }}
              aria-hidden
            />
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 z-20 rounded-full p-1.5 text-white/35 transition-colors hover:bg-white/8 hover:text-white/80"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative px-5 pb-2 pt-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200/75">
                Streak ranks
              </p>
              <h2 id="streak-ranks-title" className="mt-1 text-lg font-semibold tracking-tight text-[#fff6ea]">
                Climb the flame
              </h2>
              <p className="mt-1 text-[13px] leading-snug text-white/45">
                Consecutive focused days. Each rank has its own fire.
              </p>
            </div>

            <ul className="srk-scroll relative min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pb-8 pl-4 pr-2.5 pt-2">
              {ranks.map((row, i) => {
                const current = Boolean(currentTitle) && currentTitle !== 'Unlit' && row.title === currentTitle;
                const earned = currentMin >= row.min;
                return (
                  <motion.li
                    key={row.title}
                    initial={reduced ? { opacity: 1 } : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: reduced ? 0 : 0.04 + i * 0.05, duration: 0.28 }}
                    className={[
                      'flex items-center gap-3 rounded-2xl px-3 py-2.5',
                      earned ? '' : 'opacity-[0.62]',
                    ].join(' ')}
                    style={{
                      background: current ? `${row.hex}22` : `${row.hex}10`,
                      boxShadow: current ? `0 0 28px ${row.hex}28, inset 0 0 0 1px ${row.hex}55` : `inset 0 0 0 1px ${row.hex}26`,
                    }}
                  >
                    <StreakRankMark row={row} reduced={Boolean(reduced)} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-[#fff6ea]">{row.title}</p>
                        {current ? (
                          <span
                            className="shrink-0 rounded-full px-1.5 py-px text-[9px] font-bold uppercase tracking-[0.14em]"
                            style={{ background: `${row.hex}33`, color: row.hex }}
                          >
                            You
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-[12px] leading-snug text-white/45">{row.blurb}</p>
                    </div>
                    <p className="shrink-0 text-[11px] font-semibold tabular-nums" style={{ color: row.hex }}>
                      {row.days}
                    </p>
                  </motion.li>
                );
              })}
            </ul>
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#14110e] to-transparent"
              aria-hidden
            />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
