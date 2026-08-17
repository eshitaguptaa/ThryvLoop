'use client';

import { useEffect, useRef } from 'react';
import { useClerk } from '@clerk/nextjs';
import AppLoadingScreen from '@/components/ui/AppLoadingScreen';
import { AFTER_AUTH_PATH, authModalUrl } from '@/lib/authRoutes';

const CONTINUE_PATH = '/auth/continue';

/**
 * Completes Clerk's OAuth handshake after Google/Microsoft.
 * Missing required fields (name, legal) must go to /auth/continue — the landing
 * signup modal cannot resume this SignUp object, which is why the loader hung.
 */
export default function SSOCallbackPage() {
  const clerk = useClerk();
  const started = useRef(false);

  useEffect(() => {
    if (!clerk?.loaded || started.current) return;
    started.current = true;

    void clerk.handleRedirectCallback({
      continueSignUpUrl: CONTINUE_PATH,
      continueSignInUrl: CONTINUE_PATH,
      signInUrl: authModalUrl('signin'),
      signUpUrl: authModalUrl('signup'),
      firstFactorUrl: authModalUrl('signin'),
      secondFactorUrl: authModalUrl('signin'),
      resetPasswordUrl: authModalUrl('signin'),
      transferable: true,
      signInFallbackRedirectUrl: AFTER_AUTH_PATH,
      signUpFallbackRedirectUrl: AFTER_AUTH_PATH,
    });
  }, [clerk]);

  return (
    <>
      <div id="clerk-captcha" />
      <AppLoadingScreen message="Signing you in" />
    </>
  );
}
