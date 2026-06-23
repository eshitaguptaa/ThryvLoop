'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { workspaceApiFetch } from '@/lib/workspace/clientApi';

const POLL_MS = 60_000;

/**
 * In-app notifications for the home header bell (not Gmail).
 */
export function useAppNotifications({ enabled = true, poll = true } = {}) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotifications = useCallback(async () => {
    if (!enabled || !isLoaded || !isSignedIn) {
      setLoading(false);
      return;
    }
    try {
      const res = await workspaceApiFetch('/api/notifications', {}, getToken);
      const json = await res.json();
      if (res.status === 401) {
        throw new Error(json.hint || json.error || 'Sign in again');
      }
      if (!res.ok) throw new Error(json.error || 'Failed to load notifications');
      setNotifications(json.notifications ?? []);
      setUnreadCount(json.unreadCount ?? 0);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [enabled, isLoaded, isSignedIn, getToken]);

  const markRead = useCallback(
    async (notificationId) => {
      if (!notificationId) return;
      try {
        const res = await workspaceApiFetch(
          `/api/notifications/${notificationId}`,
          { method: 'PATCH' },
          getToken
        );
        if (!res.ok) return;
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // non-blocking
      }
    },
    [getToken]
  );

  useEffect(() => {
    if (!enabled) return;
    queueMicrotask(() => {
      void fetchNotifications();
    });
  }, [enabled, fetchNotifications]);

  useEffect(() => {
    if (!enabled || !poll) return;
    const id = setInterval(() => {
      void fetchNotifications();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [enabled, poll, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markRead,
  };
}
