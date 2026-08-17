'use client';

/**
 * Keeps organization_presence fresh while the user is anywhere in this workspace.
 * Focus timer → focusing; otherwise available (or away if they set that on Rhythm).
 */

import { useAuth } from '@clerk/nextjs';
import { useEffect, useRef } from 'react';
import {
  computeAutoPresenceStatus,
  readPresencePref,
  writePresencePref,
} from '@/lib/orgPresence';
import { useTimer } from '@/contexts/TimerContext';
import { useFocusSession } from '@/contexts/FocusSessionContext';
import { getSupabaseClient, setSupabaseAuthToken } from '@/utils/userStorage';

const HEARTBEAT_MS = 45_000;

/**
 * @param {{ organizationId: string | null, userId: string }} props
 */
export default function OrgPresenceSync({ organizationId, userId }) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { isRunning } = useTimer();
  const { sessionActive } = useFocusSession();
  const focusing = Boolean(sessionActive || isRunning);
  const runningRef = useRef(focusing);
  runningRef.current = focusing;
  const wasRunningRef = useRef(focusing);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !organizationId || !userId) return undefined;

    let cancelled = false;

    const beat = async () => {
      try {
        const token = await getToken({ template: 'supabase' });
        if (!token || cancelled) return;
        setSupabaseAuthToken(token);
        const supabase = getSupabaseClient();
        if (!supabase) return;

        const pref = readPresencePref(organizationId, userId);
        const running = runningRef.current;
        // Timer stop → clear manual focusing so they go Available
        if (wasRunningRef.current && !running) {
          const p = readPresencePref(organizationId, userId);
          if (p === 'focusing') writePresencePref(organizationId, userId, 'available');
        }
        wasRunningRef.current = running;

        const nextPref = readPresencePref(organizationId, userId);
        const status = computeAutoPresenceStatus(running, nextPref ?? pref);
        if (running) writePresencePref(organizationId, userId, 'focusing');

        const now = new Date().toISOString();
        await supabase.from('organization_presence').upsert(
          {
            organization_id: organizationId,
            user_id: userId,
            status,
            last_seen_at: now,
            updated_at: now,
          },
          { onConflict: 'organization_id,user_id' }
        );
      } catch (e) {
        console.warn('[presence] heartbeat failed:', e);
      }
    };

    void beat();
    const id = setInterval(beat, HEARTBEAT_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [isLoaded, isSignedIn, organizationId, userId, getToken, focusing]);

  return null;
}
