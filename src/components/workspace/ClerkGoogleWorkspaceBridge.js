'use client';

import { useEffect, useRef } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { workspaceApiFetch } from '@/lib/workspace/clientApi';

const SESSION_KEY = 'thryvloop-clerk-google-workspace-attempted';

function userSignedInWithGoogle(user) {
  if (!user?.externalAccounts?.length) return false;
  return user.externalAccounts.some(
    (a) =>
      a.provider === 'google' ||
      a.provider === 'oauth_google' ||
      String(a.provider || '').toLowerCase().includes('google')
  );
}

/**
 * After sign-in with Google via Clerk, auto-link workspace (calendar + Gmail) when scopes allow.
 */
export default function ClerkGoogleWorkspaceBridge() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    if (!userSignedInWithGoogle(user)) return;
    if (attemptedRef.current) return;
    if (typeof window !== 'undefined' && sessionStorage.getItem(SESSION_KEY)) return;

    attemptedRef.current = true;

    (async () => {
      try {
        await workspaceApiFetch('/api/workspace/link-clerk-google', { method: 'POST' }, getToken);
      } catch {
        // Silent — user can still connect manually on Integrations
      } finally {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(SESSION_KEY, '1');
        }
      }
    })();
  }, [isLoaded, isSignedIn, user, getToken]);

  return null;
}
