'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';
import { markAuthLoginTransition } from '@/lib/authTransition';

if (typeof window !== 'undefined') {
  markAuthLoginTransition();
}

/** OAuth redirect handler — completes sign-in/sign-up then sends users to /home. */
export default function SSOCallbackPage() {
  return (
    <AuthenticateWithRedirectCallback
      signInFallbackRedirectUrl="/home"
      signUpFallbackRedirectUrl="/home"
    />
  );
}
