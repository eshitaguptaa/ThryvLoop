'use client';

import { useEffect, useRef } from 'react';
import { AuthenticateWithRedirectCallback, useAuth, useSignUp } from '@clerk/nextjs';
import AppLoadingScreen from '@/components/ui/AppLoadingScreen';
import { AFTER_AUTH_PATH, authModalUrl, consumePostAuthRedirect } from '@/lib/authRoutes';
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

/**
 * Google returns here. Only the Clerk callback component may consume the
 * handshake. When a session exists, leave this page with a full navigation.
 */
export default function SSOCallbackPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { signUp } = useSignUp();
  const left = useRef(false);

  useEffect(() => {
    if (!isLoaded || left.current) return;

    if (isSignedIn) {
      left.current = true;
      markAuthLoginTransition();
      go(consumePostAuthRedirect() || AFTER_AUTH_PATH);
      return;
    }

    if (signUp?.status === 'missing_requirements') {
      left.current = true;
      go(CONTINUE_PATH);
    }
  }, [isLoaded, isSignedIn, signUp?.status]);

  return (
    <>
      <AuthenticateWithRedirectCallback
        continueSignUpUrl={CONTINUE_PATH}
        signInUrl={authModalUrl('signin')}
        signUpUrl={authModalUrl('signup')}
        firstFactorUrl={authModalUrl('signin')}
        transferable
      />
      <div id="clerk-captcha" />
      <AppLoadingScreen message="Signing you in" />
    </>
  );
}
