'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import AppLoadingScreen from '@/components/ui/AppLoadingScreen';
import {
  AUTH_TRANSITION_EVENT,
  clearAuthTransition,
  getAuthTransitionMode,
  isProtectedAppRoute,
} from '@/lib/authTransition';
import { authTransitionMessage } from '@/lib/authTransitionMessages';

const LOGIN_FINISH_DELAY_MS = 380;
const LOGIN_SAFETY_TIMEOUT_MS = 4000;

/** Full-screen loader during explicit login / logout transitions. */
export default function AuthTransitionHost() {
  const { isLoaded, isSignedIn } = useAuth();
  const pathname = usePathname();
  const [mode, setMode] = useState(null);
  const [finishing, setFinishing] = useState(false);
  const finishTimerRef = useRef(null);
  const safetyTimerRef = useRef(null);

  const syncMode = useCallback(() => {
    setMode(getAuthTransitionMode());
  }, []);

  const beginFinish = useCallback(() => {
    setFinishing((current) => (current ? current : true));
  }, []);

  const handleFinish = useCallback(() => {
    if (finishTimerRef.current) {
      window.clearTimeout(finishTimerRef.current);
      finishTimerRef.current = null;
    }
    if (safetyTimerRef.current) {
      window.clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
    setMode(null);
    setFinishing(false);
    clearAuthTransition();
  }, []);

  useLayoutEffect(() => {
    syncMode();
    window.addEventListener(AUTH_TRANSITION_EVENT, syncMode);
    return () => window.removeEventListener(AUTH_TRANSITION_EVENT, syncMode);
  }, [syncMode]);

  const isLoginReady =
    mode === 'login' &&
    isLoaded &&
    isSignedIn &&
    (isProtectedAppRoute(pathname) || pathname === '/');

  useEffect(() => {
    if (!mode || finishing) return;

    if (mode === 'login') {
      if (!isLoginReady) return;
      finishTimerRef.current = window.setTimeout(beginFinish, LOGIN_FINISH_DELAY_MS);
      return () => {
        if (finishTimerRef.current) {
          window.clearTimeout(finishTimerRef.current);
          finishTimerRef.current = null;
        }
      };
    }

    if (mode === 'logout') {
      if (!isLoaded || isSignedIn) return;
      finishTimerRef.current = window.setTimeout(beginFinish, LOGIN_FINISH_DELAY_MS);
      return () => {
        if (finishTimerRef.current) {
          window.clearTimeout(finishTimerRef.current);
          finishTimerRef.current = null;
        }
      };
    }
  }, [beginFinish, finishing, isLoaded, isLoginReady, isSignedIn, mode]);

  useEffect(() => {
    if (mode !== 'login' || finishing) return;
    if (!isLoaded || !isSignedIn) return;

    safetyTimerRef.current = window.setTimeout(beginFinish, LOGIN_SAFETY_TIMEOUT_MS);
    return () => {
      if (safetyTimerRef.current) {
        window.clearTimeout(safetyTimerRef.current);
        safetyTimerRef.current = null;
      }
    };
  }, [beginFinish, finishing, isLoaded, isSignedIn, mode]);

  if (!mode) return null;

  return createPortal(
    <AppLoadingScreen
      message={authTransitionMessage(mode)}
      finishing={finishing}
      onFinish={handleFinish}
    />,
    document.body,
  );
}
