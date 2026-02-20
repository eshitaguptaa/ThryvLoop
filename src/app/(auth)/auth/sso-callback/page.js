'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

/**
 * This page must be the redirectUrl for OAuth (Google/Microsoft) when using
 * authenticateWithRedirect(). It handles the callback from the provider
 * and completes the sign-in/sign-up, then redirects to /home.
 */
export default function SSOCallbackPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
      <AuthenticateWithRedirectCallback
        signInFallbackRedirectUrl="/home"
        signUpFallbackRedirectUrl="/home"
      />
      <p className="text-white/70 text-sm">Completing sign in...</p>
    </div>
  );
}
