'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { playCelebrationChime } from '@/utils/celebrationSound';

export const CelebrationContext = createContext(null);

const CELEBRATION_EVENT = 'celebration-trigger';

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
      if (detail.type === 'focus_session') {
        const mins = detail?.sessionMinutes ?? 25;
        playCelebrationChime();
        showToast('Focus session complete', `${mins} min of deep work. Nice one.`);
        return;
      }
      setCelebration(detail);
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
