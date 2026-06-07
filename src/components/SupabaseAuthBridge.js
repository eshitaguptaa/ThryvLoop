'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';
import { setSupabaseAuthToken } from '@/utils/userStorage';
import {
  getClerkSupabaseToken,
  resumeClerkAuthRequests,
} from '@/lib/clerkSupabaseToken';

/**
 * When the user is signed in, fetches the Clerk Supabase JWT and stores it
 * so getSupabaseClient() returns an authenticated client. Renders nothing.
 */
export default function SupabaseAuthBridge() {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isSignedIn) {
      setSupabaseAuthToken(null);
      return;
    }

    resumeClerkAuthRequests();

    let cancelled = false;
    (async () => {
      const token = await getClerkSupabaseToken(getToken, isSignedIn);
      if (!cancelled) {
        setSupabaseAuthToken(token);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [getToken, isSignedIn]);

  return null;
}
