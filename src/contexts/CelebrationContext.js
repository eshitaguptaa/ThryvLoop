'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { playCelebrationChime } from '@/utils/celebrationSound';

export const CelebrationContext = createContext(null);

const CELEBRATION_EVENT = 'celebration-trigger';

// Varied focus-session toasts — different message each time (MS Teams style)
const FOCUS_TOAST_VARIANTS = [
  { message: 'Focus session complete', subtext: (mins) => `${mins} min of deep work. Nice one.` },
  { message: 'You stayed in the zone', subtext: (mins) => `${mins} min of flow. Well done.` },
  { message: 'Session shipped', subtext: (mins) => `${mins} min of focused work. That’s real progress.` },
  { message: 'Deep work done', subtext: (mins) => `${mins} minutes. You showed up.` },
  { message: 'Focus time: complete', subtext: (mins) => `${mins} min in the books. Nice one.` },
  { message: 'In the flow', subtext: (mins) => `${mins} min of uninterrupted focus.` },
  { message: 'Zone complete', subtext: (mins) => `${mins} min. Your future self will thank you.` },
  { message: 'Focus block done', subtext: (mins) => `${mins} min. One more brick in the wall.` },
  { message: 'Session complete', subtext: (mins) => `${mins} min of deep work. Keep it up.` },
  { message: 'You crushed it', subtext: (mins) => `${mins} min focused. No distractions.` },
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function CelebrationProvider({ children }) {
  const [celebration, setCelebration] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showCelebration = useCallback((payload) => {
    setCelebration(payload);
  }, []);

  const dismissCelebration = useCallback(() => {
    setCelebration(null);
  }, []);

  const showToast = useCallback((message, subtext) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ id: Date.now(), message, subtext });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, 4000);
  }, []);

  const dismissToast = useCallback(() => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = null;
    setToast(null);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (e) => {
      const detail = e?.detail;
      if (!detail || typeof detail.type !== 'string') return;
      // Defer state updates so we don't update CelebrationProvider while TimerProvider (or another component) is still rendering/effecting
      const runAfterCommit = (fn) => setTimeout(fn, 0);
      if (detail.type === 'focus_session') {
        const mins = detail?.sessionMinutes ?? 25;
        playCelebrationChime();
        runAfterCommit(() => {
          const variant = pickRandom(FOCUS_TOAST_VARIANTS);
          const subtext = typeof variant.subtext === 'function' ? variant.subtext(mins) : variant.subtext;
          showToast(variant.message, subtext);
        });
        return;
      }
      runAfterCommit(() => setCelebration(detail));
    };
    window.addEventListener(CELEBRATION_EVENT, handler);
    return () => window.removeEventListener(CELEBRATION_EVENT, handler);
  }, [showToast]);

  useEffect(() => () => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
  }, []);

  const value = {
    celebration,
    showCelebration,
    dismissCelebration,
    toast,
    dismissToast,
    showToast,
    triggerEvent: (payload) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(CELEBRATION_EVENT, { detail: payload }));
      }
    },
  };

  return (
    <CelebrationContext.Provider value={value}>
      {children}
    </CelebrationContext.Provider>
  );
}

export function useCelebration() {
  const ctx = useContext(CelebrationContext);
  if (!ctx) throw new Error('useCelebration must be used within CelebrationProvider');
  return ctx;
}
