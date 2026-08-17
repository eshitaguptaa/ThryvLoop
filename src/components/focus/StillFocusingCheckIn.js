'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useFocusSession } from '@/contexts/FocusSessionContext';
import {
  FOCUS_SESSION_CHECKIN_RESPONSE_MS,
  isFocusSessionElsewhere,
  nextFocusCheckInDelayMs,
} from '@/lib/focusSession';
import { playFocusCheckInSound } from '@/utils/celebrationSound';

function readElsewhere() {
  if (typeof document === 'undefined') return false;
  return isFocusSessionElsewhere({
    tabVisible: document.visibilityState !== 'hidden',
    pageFocused: typeof document.hasFocus === 'function' ? document.hasFocus() : true,
  });
}

/**
 * Fallback (no IdleDetector): while Focusing and exclusively in another app/tab,
 * show a “Still focusing?” toast + sound on a random ~12–22 min cadence.
 * User has 2 minutes to confirm or the session pauses.
 */
export default function StillFocusingCheckIn() {
  const { sessionActive, systemActivityMode, setFocusSessionActive, hydrated } =
    useFocusSession();

  const [prompt, setPrompt] = useState(/** @type {null | { id: number }} */ (null));
  const [secondsLeft, setSecondsLeft] = useState(0);

  const scheduleTimerRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));
  const responseTimerRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));
  const tickTimerRef = useRef(/** @type {ReturnType<typeof setInterval> | null} */ (null));
  const promptOpenRef = useRef(false);
  const sessionActiveRef = useRef(sessionActive);
  const setActiveRef = useRef(setFocusSessionActive);

  sessionActiveRef.current = sessionActive;
  setActiveRef.current = setFocusSessionActive;

  const checkInsEnabled =
    hydrated && sessionActive && systemActivityMode !== 'system';

  const clearSchedule = () => {
    if (scheduleTimerRef.current) {
      clearTimeout(scheduleTimerRef.current);
      scheduleTimerRef.current = null;
    }
  };

  const clearResponse = () => {
    if (responseTimerRef.current) {
      clearTimeout(responseTimerRef.current);
      responseTimerRef.current = null;
    }
    if (tickTimerRef.current) {
      clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
    }
  };

  const closePrompt = () => {
    promptOpenRef.current = false;
    clearResponse();
    setPrompt(null);
    setSecondsLeft(0);
  };

  useEffect(() => {
    if (!checkInsEnabled) {
      clearSchedule();
      closePrompt();
      return undefined;
    }

    const openPrompt = () => {
      if (promptOpenRef.current) return;
      if (!sessionActiveRef.current || !readElsewhere()) return;

      promptOpenRef.current = true;
      const expiresAt = Date.now() + FOCUS_SESSION_CHECKIN_RESPONSE_MS;
      setPrompt({ id: Date.now() });
      setSecondsLeft(Math.ceil(FOCUS_SESSION_CHECKIN_RESPONSE_MS / 1000));
      playFocusCheckInSound();

      tickTimerRef.current = setInterval(() => {
        setSecondsLeft(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
      }, 250);

      responseTimerRef.current = setTimeout(() => {
        closePrompt();
        void setActiveRef.current(false, {
          source: 'system_idle',
          idleKind: 'elsewhere',
        });
      }, FOCUS_SESSION_CHECKIN_RESPONSE_MS);
    };

    const scheduleNext = () => {
      clearSchedule();
      if (promptOpenRef.current) return;
      const delay = nextFocusCheckInDelayMs();
      scheduleTimerRef.current = setTimeout(() => {
        scheduleTimerRef.current = null;
        openPrompt();
      }, delay);
    };

    const sync = () => {
      if (!readElsewhere()) {
        clearSchedule();
        if (promptOpenRef.current) closePrompt();
        return;
      }
      if (!promptOpenRef.current && scheduleTimerRef.current == null) {
        scheduleNext();
      }
    };

    sync();
    window.addEventListener('focus', sync);
    window.addEventListener('blur', sync);
    document.addEventListener('visibilitychange', sync);

    return () => {
      window.removeEventListener('focus', sync);
      window.removeEventListener('blur', sync);
      document.removeEventListener('visibilitychange', sync);
      clearSchedule();
      clearResponse();
      promptOpenRef.current = false;
    };
  }, [checkInsEnabled]);

  const onStillFocusing = () => {
    closePrompt();
    // Next check-in is scheduled when they leave ThryvLoop again (blur/visibility sync).
  };

  const onAway = () => {
    closePrompt();
    void setFocusSessionActive(false, { source: 'user' });
  };

  return (
    <AnimatePresence>
      {prompt ? (
        <motion.div
          key={prompt.id}
          className="fixed top-5 right-5 z-[210] max-w-sm w-[calc(100%-2rem)] sm:w-auto"
          initial={{ opacity: 0, y: -12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        >
          <div
            className="relative overflow-hidden rounded-2xl border border-emerald-400/25 bg-slate-950/95 shadow-xl backdrop-blur-xl"
            style={{
              boxShadow:
                '0 0 0 1px rgba(255,255,255,0.06), 0 20px 40px -12px rgba(0,0,0,0.4), 0 0 80px -20px rgba(52,211,153,0.35)',
            }}
            role="alertdialog"
            aria-labelledby="still-focusing-title"
            aria-describedby="still-focusing-desc"
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-50"
              style={{
                background:
                  'radial-gradient(ellipse at 0% 0%, rgba(52,211,153,0.2), transparent 55%)',
              }}
              aria-hidden
            />
            <div className="relative px-5 py-4">
              <p
                id="still-focusing-title"
                className="text-sm font-semibold text-white tracking-tight"
              >
                Still focusing?
              </p>
              <p id="still-focusing-desc" className="mt-1.5 text-xs leading-relaxed text-white/55">
                You’ve been in another app for a while. Confirm within {secondsLeft}s or Focusing
                pauses.
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={onStillFocusing}
                  className="flex-1 h-10 rounded-xl bg-emerald-400 text-slate-950 text-sm font-semibold transition hover:bg-emerald-300 active:scale-[0.98]"
                >
                  Still focusing
                </button>
                <button
                  type="button"
                  onClick={onAway}
                  className="h-10 rounded-xl border border-white/15 bg-white/5 px-3.5 text-sm font-semibold text-white/80 transition hover:bg-white/10 active:scale-[0.98]"
                >
                  Away
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
