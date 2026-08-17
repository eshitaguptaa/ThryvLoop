'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useCelebration } from '@/contexts/CelebrationContext';
import { workspaceApiFetch } from '@/lib/workspace/clientApi';
import { checkCalendarReminders } from '@/lib/calendarReminderPrefs';

const POLL_MS = 30_000;

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function formatReminderTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/**
 * Polls calendar events and fires in-app ThryvLoop toasts for reminders.
 * Does not request browser Notification permission.
 */
export default function CalendarReminderHost() {
  const { isSignedIn, getToken, isLoaded } = useAuth();
  const { user } = useUser();
  const userId = user?.id || null;
  const { showToast } = useCelebration();
  const eventsRef = useRef([]);

  const fetchUpcomingEvents = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;
    const start = startOfDay(new Date());
    const end = addDays(start, 3);
    try {
      const res = await workspaceApiFetch(
        `/api/workspace/calendar?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`,
        {},
        getToken
      );
      const json = await res.json();
      if (res.ok && Array.isArray(json.events)) {
        eventsRef.current = json.events;
      }
    } catch {
      // ignore — retry on next poll
    }
  }, [getToken, isLoaded, isSignedIn]);

  const fireReminder = useCallback(
    (payload) => {
      const timeLabel = formatReminderTime(payload.startsAt);
      showToast(
        `${payload.title}`,
        `Starting in ${payload.minutes} min · ${timeLabel}`
      );
    },
    [showToast]
  );

  const tick = useCallback(() => {
    checkCalendarReminders(eventsRef.current, userId, { onReminder: fireReminder });
  }, [fireReminder, userId]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    void fetchUpcomingEvents();
    tick();

    const pollId = setInterval(() => {
      void fetchUpcomingEvents().then(tick);
    }, POLL_MS);

    const onFocus = () => {
      void fetchUpcomingEvents().then(tick);
    };
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(pollId);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchUpcomingEvents, isLoaded, isSignedIn, tick]);

  return null;
}
