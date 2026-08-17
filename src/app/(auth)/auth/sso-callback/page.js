'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticateWithRedirectCallback, useAuth } from '@clerk/nextjs';
import { markAuthLoginTransition } from '@/lib/authTransition';
import AppLoadingScreen from '@/components/ui/AppLoadingScreen';
import { AFTER_AUTH_PATH, authModalUrl, consumePostAuthRedirect } from '@/lib/authRoutes';

/** Completes Google/Microsoft OAuth and always returns to the app, never Clerk's hosted pages. */
export default function SSOCallbackPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [destination, setDestination] = useState(null);

  useEffect(() => {
    markAuthLoginTransition();
    setDestination(consumePostAuthRedirect() || AFTER_AUTH_PATH);
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn && destination) {
      router.replace(destination);
    }
  }, [isLoaded, isSignedIn, destination, router]);

  if (!destination) {
    return <AppLoadingScreen message="Signing you in" />;
  }

  return (
    <>
      <AuthenticateWithRedirectCallback
        signInUrl={authModalUrl('signin', destination)}
        signUpUrl={authModalUrl('signup', destination)}
        continueSignUpUrl={authModalUrl('signup', destination)}
        signInFallbackRedirectUrl={destination}
        signUpFallbackRedirectUrl={destination}
        signInForceRedirectUrl={destination}
        signUpForceRedirectUrl={destination}
        transferable
      />
      <div id="clerk-captcha" />
      <AppLoadingScreen message="Signing you in" />
    </>
  );
}
