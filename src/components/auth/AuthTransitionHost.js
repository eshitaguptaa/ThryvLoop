'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import AppLoadingScreen from '@/components/ui/AppLoadingScreen';
import {
  AUTH_DESTINATION_READY_EVENT,
  AUTH_LOGIN_PROGRESS_EVENT,
  AUTH_TRANSITION_EVENT,
  clearAuthTransition,
  getAuthLoginProgress,
  getAuthTransitionMode,
  isAuthDestinationReady,
  isProtectedAppRoute,
  setAuthLoginProgress,
  ensureAuthLoginTransition,
} from '@/lib/authTransition';
import { authTransitionMessage } from '@/lib/authTransitionMessages';

const LOGIN_FINISH_DELAY_MS = 280;
const LOGOUT_FINISH_DELAY_MS = 380;
const LOGIN_SAFETY_TIMEOUT_MS = 20000;

/** Full-screen loader during explicit login / logout transitions. */
export default function AuthTransitionHost() {
  const { isLoaded, isSignedIn } = useAuth();
  const pathname = usePathname();
  const [mode, setMode] = useState(null);
  const [finishing, setFinishing] = useState(false);
  const [destinationReady, setDestinationReady] = useState(false);
  const [loginProgress, setLoginProgress] = useState(() => getAuthLoginProgress());
  const finishTimerRef = useRef(null);
  const safetyTimerRef = useRef(null);

  const syncMode = useCallback(() => {
    const next = getAuthTransitionMode();
    setMode(next);
    if (next === 'login') {
      setDestinationReady(isAuthDestinationReady());
      setLoginProgress(getAuthLoginProgress());
    } else {
      setDestinationReady(false);
    }
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
    setDestinationReady(false);
    clearAuthTransition();
  }, []);

  useLayoutEffect(() => {
    if (pathname === '/auth/sso-callback') {
      ensureAuthLoginTransition();
    }
    syncMode();
    window.addEventListener(AUTH_TRANSITION_EVENT, syncMode);
    return () => window.removeEventListener(AUTH_TRANSITION_EVENT, syncMode);
  }, [pathname, syncMode]);

  useEffect(() => {
    const syncProgress = () => setLoginProgress(getAuthLoginProgress());
    syncProgress();
    window.addEventListener(AUTH_LOGIN_PROGRESS_EVENT, syncProgress);
    return () => window.removeEventListener(AUTH_LOGIN_PROGRESS_EVENT, syncProgress);
  }, []);

  useEffect(() => {
    if (mode !== 'login') return undefined;
    if (isAuthDestinationReady()) setDestinationReady(true);
    const onReady = () => setDestinationReady(true);
    window.addEventListener(AUTH_DESTINATION_READY_EVENT, onReady);
    return () => window.removeEventListener(AUTH_DESTINATION_READY_EVENT, onReady);
  }, [mode]);

  useEffect(() => {
    if (mode !== 'login' || finishing) return;
    if (!isLoaded || !isSignedIn) return;
    if (!isProtectedAppRoute(pathname)) return;
    setAuthLoginProgress({ percent: 78, message: 'Loading your workspace' });
  }, [mode, finishing, isLoaded, isSignedIn, pathname]);

  useEffect(() => {
    if (mode !== 'login' || pathname !== '/auth/sso-callback') return undefined;
    const node = document.getElementById('clerk-captcha');
    if (!node) return undefined;

    const syncCaptcha = () => {
      if (node.childElementCount > 0) {
        setAuthLoginProgress({ percent: 52, message: 'Confirm you are human' });
      }
    };
    syncCaptcha();
    const observer = new MutationObserver(syncCaptcha);
    observer.observe(node, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [mode, pathname]);

  const isLoginReady =
    mode === 'login' &&
    isLoaded &&
    isSignedIn &&
    isProtectedAppRoute(pathname) &&
    destinationReady;

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
      finishTimerRef.current = window.setTimeout(beginFinish, LOGOUT_FINISH_DELAY_MS);
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
    if (!isProtectedAppRoute(pathname)) return;

    safetyTimerRef.current = window.setTimeout(beginFinish, LOGIN_SAFETY_TIMEOUT_MS);
    return () => {
      if (safetyTimerRef.current) {
        window.clearTimeout(safetyTimerRef.current);
        safetyTimerRef.current = null;
      }
    };
  }, [beginFinish, finishing, isLoaded, isSignedIn, mode, pathname]);

  const isSso = pathname === '/auth/sso-callback';
  if (!mode && !isSso) return null;

  const loginMessage = loginProgress.message || authTransitionMessage('login');

  return createPortal(
    <AppLoadingScreen
      message={mode === 'logout' ? authTransitionMessage('logout') : loginMessage}
      percent={mode === 'logout' ? null : loginProgress.percent}
      finishing={finishing}
      onFinish={handleFinish}
    />,
    document.body,
  );
}
