import { createSupabaseAdmin } from '@/lib/supabaseAdmin';
import { mapCalendarBlockForClient } from '@/lib/workspace/meetUrl';

/**
 * Calendar events overlapping [rangeStart, rangeEnd].
 * @param {string} userId
 * @param {Date} rangeStart
 * @param {Date} rangeEnd
 */
export async function getWorkspaceCalendarEvents(userId, rangeStart, rangeEnd) {
  const supabase = createSupabaseAdmin();

  const [connectionsRes, eventsRes] = await Promise.all([
    supabase
      .from('workspace_connections')
      .select('provider, account_email, last_synced_at, sync_error')
      .eq('user_id', userId),
    supabase
      .from('workspace_calendar_blocks')
      .select('id, provider, title, starts_at, ends_at, is_online_meeting, meet_url, show_as')
      .eq('user_id', userId)
      .gt('ends_at', rangeStart.toISOString())
      .lt('starts_at', rangeEnd.toISOString())
      .order('starts_at', { ascending: true }),
  ]);

  const connections = connectionsRes.data || [];
  const google = connections.find((c) => c.provider === 'google') ?? null;

  const events = (eventsRes.data || []).map((block) => ({
    ...mapCalendarBlockForClient(block),
    provider: block.provider,
  }));

  return {
    events,
    connections,
    googleConnection: google,
    hasConnection: connections.length > 0,
    range: {
      start: rangeStart.toISOString(),
      end: rangeEnd.toISOString(),
    },
  };
}
