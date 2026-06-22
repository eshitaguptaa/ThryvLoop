'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { workspaceApiFetch } from '@/lib/workspace/clientApi';
import { getGoogleConnectionAccess, getGoogleResyncMessage, needsGoogleResync } from '@/lib/workspace/googleAccess';
import { formatWorkspaceSyncError, isAuthWorkspaceError } from '@/lib/workspace/userMessages';

const POLL_MS = 60_000;

/**
 * Workspace status (meetings, mail notifications) from connected Google Workspace.
 */
export function useWorkspace({ enabled = true, poll = true } = {}) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');

  const fetchStatus = useCallback(async () => {
    if (!enabled || !isLoaded || !isSignedIn) {
      setLoading(false);
      return;
    }
    try {
      const res = await workspaceApiFetch('/api/workspace/status', {}, getToken);
      const json = await res.json();
      if (res.status === 401) {
        throw new Error(json.hint || json.error || 'Sign in again');
      }
      if (!res.ok) throw new Error(json.error || 'Failed to load workspace status');
      setStatus(json);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [enabled, isLoaded, isSignedIn, getToken]);

  const sync = useCallback(async () => {
    if (!isLoaded || !isSignedIn) {
      throw new Error('Sign in to sync your workspace');
    }
    setSyncing(true);
    try {
      const res = await workspaceApiFetch('/api/workspace/sync', { method: 'POST' }, getToken);
      const json = await res.json();
      if (res.status === 401) {
        throw new Error(json.hint || json.error || 'Sign in again');
      }
      if (!res.ok) throw new Error(json.error || 'Sync failed');
      if (json.status) setStatus(json.status);
      setError('');
      return json;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sync failed');
      throw e;
    } finally {
      setSyncing(false);
    }
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    if (!enabled) return;
    queueMicrotask(() => {
      void fetchStatus();
    });
  }, [enabled, fetchStatus]);

  useEffect(() => {
    if (!enabled || !poll) return;
    const id = setInterval(() => {
      void fetchStatus();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [enabled, poll, fetchStatus]);

  const connections = status?.connections ?? [];
  const hasConnection = connections.length > 0;
  const googleConnection = connections.find((c) => c.provider === 'google') ?? null;
  const googleAccess =
    status?.googleAccess ?? getGoogleConnectionAccess(googleConnection);
  const syncError = googleConnection?.sync_error ?? null;
  const needsWorkspaceReconnect = Boolean(googleConnection && isAuthWorkspaceError(syncError));
  const needsWorkspaceSync = Boolean(formatWorkspaceSyncError(syncError));
  const needsGoogleResyncPrompt = needsGoogleResync(googleAccess);
  const googleResyncMessage = getGoogleResyncMessage(googleAccess);

  return {
    status,
    loading,
    syncing,
    error,
    hasConnection,
    inMeeting: status?.inMeeting ?? false,
    currentMeeting: status?.currentMeeting,
    upcomingMeetings: status?.upcomingMeetings ?? [],
    meetingMinutesToday: status?.meetingMinutesToday ?? 0,
    meetingMinutesThisWeek: status?.meetingMinutesThisWeek ?? 0,
    notifications: status?.notifications ?? [],
    unreadCount: status?.unreadCount ?? 0,
    connections,
    googleConnection,
    googleAccess,
    needsWorkspaceSync,
    needsWorkspaceReconnect,
    needsGoogleResyncPrompt,
    googleResyncMessage,
    fetchStatus,
    sync,
  };
}
