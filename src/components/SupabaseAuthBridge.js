'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';
import { setSupabaseAuthToken } from '@/utils/userStorage';

/**
 * When the user is signed in, fetches the Clerk Supabase JWT and stores it
 * so getSupabaseClient() returns an authenticated client. Renders nothing.
 */
export default function SupabaseAuthBridge() {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isSignedIn) return;

    let cancelled = false;
    (async () => {
      try {
        const token = await getToken({ template: 'supabase' });
        if (!cancelled && token) {
          setSupabaseAuthToken(token);
        }
      } catch {
        if (!cancelled) setSupabaseAuthToken(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [getToken, isSignedIn]);

  return null;
}
