'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Flame } from 'lucide-react';
import { useCelebration } from '@/contexts/CelebrationContext';
import { previewStreakCelebrationPayload, streakRankGuide, streakRankPillStyle } from '@/lib/focusStreak';

/** Temporary local preview — pick a rank to open its +1 celebration. */
export default function StreakPreviewButton() {
  const { showCelebration } = useCelebration();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const ranks = streakRankGuide();

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('pointerdown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        title="Preview each streak rank"
        className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-2xl border border-amber-400/35 bg-amber-500/20 px-3.5 text-sm font-semibold text-amber-50 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-all hover:scale-[1.02] hover:bg-amber-500/30 active:scale-[0.98]"
      >
        <Flame className="h-4 w-4" fill="currentColor" />
        Preview ranks
        <ChevronDown className={`h-3.5 w-3.5 opacity-70 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <ul
          role="listbox"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-40 w-[16.5rem] overflow-hidden rounded-2xl border border-white/12 bg-[#171310]/95 p-1.5 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.75)] backdrop-blur-xl"
        >
          {ranks.map((row) => (
            <li key={row.title}>
              <button
                type="button"
                role="option"
                onClick={() => {
                  showCelebration(previewStreakCelebrationPayload(row.min));
                  setOpen(false);
                }}
                className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-white/8"
              >
                <span
                  className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  style={streakRankPillStyle(row.title, { onDark: true }) || undefined}
                >
                  {row.title}
                </span>
                <span className="text-[11px] tabular-nums text-white/40">{row.min === 1 ? 'day 1' : `day ${row.min}`}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
