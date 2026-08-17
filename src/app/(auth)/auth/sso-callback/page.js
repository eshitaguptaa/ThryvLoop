'use client';

import { useEffect, useRef } from 'react';
import { AuthenticateWithRedirectCallback, useAuth, useSignIn, useSignUp } from '@clerk/nextjs';
import AppLoadingScreen from '@/components/ui/AppLoadingScreen';
import { AFTER_AUTH_PATH, consumePostAuthRedirect } from '@/lib/authRoutes';
import { markAuthLoginTransition } from '@/lib/authTransition';

const CONTINUE_PATH = '/auth/continue';

function canonicalOrigin() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  if (configured) return configured;
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

function go(path) {
  const origin = canonicalOrigin();
  const next = path.startsWith('/') ? path : AFTER_AUTH_PATH;
  window.location.replace(`${origin}${next}`);
}

function needsContinue(signUp) {
  if (!signUp) return false;
  if (signUp.status === 'missing_requirements') return true;
  return Array.isArray(signUp.missingFields) && signUp.missingFields.length > 0;
}

/**
 * Google/Microsoft return here.
 *
 * Real hang causes this page must handle:
 * 1. Handshake must finish on THIS path (not /home) or middleware strips it.
 * 2. Clerk bot protection waits on #clerk-captcha — it was hidden under the loader.
 * 3. Password-required sign-up leaves status missing_requirements; we must leave
 *    for /auth/continue instead of waiting for a session that will never exist.
 */
export default function SSOCallbackPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const left = useRef(false);

  useEffect(() => {
    if (!isLoaded || left.current) return;

    if (isSignedIn || signIn?.status === 'complete' || signUp?.status === 'complete') {
      left.current = true;
      markAuthLoginTransition();
      go(consumePostAuthRedirect() || AFTER_AUTH_PATH);
      return;
    }

    if (needsContinue(signUp)) {
      left.current = true;
      go(CONTINUE_PATH);
    }
  }, [isLoaded, isSignedIn, signIn?.status, signUp, signUp?.status]);

  return (
    <>
      <AuthenticateWithRedirectCallback
        continueSignUpUrl={CONTINUE_PATH}
        transferable
      />
      {/* Clerk waits on this node. It must sit above the full-screen loader. */}
      <div
        id="clerk-captcha"
        className="fixed bottom-6 left-1/2 z-[100001] -translate-x-1/2"
      />
      <AppLoadingScreen message="Signing you in" />
    </>
  );
}
