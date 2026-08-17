'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticateWithRedirectCallback, useAuth } from '@clerk/nextjs';
import { markAuthLoginTransition } from '@/lib/authTransition';
import AppLoadingScreen from '@/components/ui/AppLoadingScreen';
import { AFTER_AUTH_PATH, authModalUrl, consumePostAuthRedirect } from '@/lib/authRoutes';

function safePath(path) {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//')
    ? path
    : AFTER_AUTH_PATH;
}

/**
 * Completes Google/Microsoft OAuth. Clerk handshake must run on first paint —
 * do not delay AuthenticateWithRedirectCallback behind other state.
 */
export default function SSOCallbackPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [destination] = useState(() => AFTER_AUTH_PATH);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    markAuthLoginTransition();
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    const next = consumePostAuthRedirect() || destination;
    router.replace(safePath(next));
  }, [isLoaded, isSignedIn, destination, router]);

  useEffect(() => {
    const id = window.setTimeout(() => setTimedOut(true), 12000);
    return () => window.clearTimeout(id);
  }, []);

  if (timedOut && isLoaded && !isSignedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <p className="text-lg font-semibold text-foreground">Sign-in did not finish</p>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          Google succeeded, but ThryvLoop could not complete the session. Try again from
          {' '}
          <a className="text-indigo-500 font-semibold" href="https://www.thryvloop.com/?auth=signin">
            www.thryvloop.com
          </a>
          {' '}
          (include www).
        </p>
        <a
          href={authModalUrl('signin')}
          className="mt-6 text-sm font-semibold text-indigo-500 hover:underline"
        >
          Back to sign in
        </a>
      </div>
    );
  }

  return (
    <>
      <AuthenticateWithRedirectCallback
        signInUrl={authModalUrl('signin')}
        signUpUrl={authModalUrl('signup')}
        continueSignUpUrl={authModalUrl('signup')}
        signInFallbackRedirectUrl={AFTER_AUTH_PATH}
        signUpFallbackRedirectUrl={AFTER_AUTH_PATH}
        transferable
      />
      <div id="clerk-captcha" />
      <AppLoadingScreen message="Signing you in" />
    </>
  );
}
