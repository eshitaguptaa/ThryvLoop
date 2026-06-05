import { createSupabaseAdmin } from '@/lib/supabaseAdmin';
import { mapCalendarBlockForClient } from '@/lib/workspace/meetUrl';
import { hasGoogleCalendarWriteScope } from '@/lib/workspace/oauth';
import {
  backfillUnsyncedCalendarEvents,
  getUserCalendarEventsInRange,
} from '@/lib/workspace/userCalendarEvents';

/**
 * Calendar events overlapping [rangeStart, rangeEnd].
 * @param {string} userId
 * @param {Date} rangeStart
 * @param {Date} rangeEnd
 */
export async function getWorkspaceCalendarEvents(userId, rangeStart, rangeEnd) {
  const supabase = createSupabaseAdmin();

  const [connectionsRes, eventsRes, linkedGoogleRes] = await Promise.all([
    supabase
      .from('workspace_connections')
      .select('provider, account_email, last_synced_at, sync_error, scopes')
      .eq('user_id', userId),
    supabase
      .from('workspace_calendar_blocks')
      .select('id, provider, external_id, title, starts_at, ends_at, is_online_meeting, meet_url, show_as')
      .eq('user_id', userId)
      .gt('ends_at', rangeStart.toISOString())
      .lt('starts_at', rangeEnd.toISOString())
      .order('starts_at', { ascending: true }),
    supabase
      .from('user_calendar_events')
      .select('google_event_id')
      .eq('user_id', userId)
      .not('google_event_id', 'is', null),
  ]);

  const connections = connectionsRes.data || [];
  const google = connections.find((c) => c.provider === 'google') ?? null;
  const canPushToGoogle = hasGoogleCalendarWriteScope(google?.scopes);

  if (canPushToGoogle) {
    try {
      await backfillUnsyncedCalendarEvents(userId, 20);
    } catch (err) {
      console.error('Failed to backfill unsynced calendar events:', err);
    }
  }

  const linkedGoogleIds = new Set(
    linkedGoogleRes.error
      ? []
      : (linkedGoogleRes.data || []).map((row) => row.google_event_id).filter(Boolean)
  );

  const googleEvents = (eventsRes.data || [])
    .filter((block) => !linkedGoogleIds.has(block.external_id))
    .map((block) => ({
      ...mapCalendarBlockForClient(block),
      provider: block.provider,
    }));

  let appEvents = [];
  try {
    appEvents = await getUserCalendarEventsInRange(userId, rangeStart, rangeEnd);
  } catch (err) {
    console.error('Failed to load ThryvLoop calendar events:', err);
  }

  const events = [...googleEvents, ...appEvents].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  );

  return {
    events,
    connections,
    googleConnection: google,
    hasConnection: connections.length > 0,
    canPushToGoogle,
    range: {
      start: rangeStart.toISOString(),
      end: rangeEnd.toISOString(),
    },
  };
}
