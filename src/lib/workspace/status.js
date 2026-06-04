import { createSupabaseAdmin } from '@/lib/supabaseAdmin';
import { mapCalendarBlockForClient } from '@/lib/workspace/meetUrl';

/**
 * Current meeting + today's meeting minutes + recent workspace notifications.
 * @param {string} userId
 */
export async function getWorkspaceStatus(userId) {
  const supabase = createSupabaseAdmin();
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setUTCHours(23, 59, 59, 999);

  const horizonEnd = new Date(now);
  horizonEnd.setDate(horizonEnd.getDate() + 7);
  horizonEnd.setUTCHours(23, 59, 59, 999);

  const [connectionsRes, todayBlocksRes, upcomingBlocksRes, notifRes] = await Promise.all([
    supabase
      .from('workspace_connections')
      .select('provider, account_email, last_synced_at, sync_error')
      .eq('user_id', userId),
    supabase
      .from('workspace_calendar_blocks')
      .select('id, provider, title, starts_at, ends_at, is_online_meeting, meet_url, show_as')
      .eq('user_id', userId)
      .gte('ends_at', todayStart.toISOString())
      .lte('starts_at', todayEnd.toISOString()),
    supabase
      .from('workspace_calendar_blocks')
      .select('id, provider, title, starts_at, ends_at, is_online_meeting, meet_url, show_as')
      .eq('user_id', userId)
      .gt('starts_at', now.toISOString())
      .lte('starts_at', horizonEnd.toISOString())
      .order('starts_at', { ascending: true })
      .limit(8),
    supabase
      .from('workspace_notifications')
      .select('id, provider, source, subject, preview, received_at, is_read, link_url')
      .eq('user_id', userId)
      .eq('is_read', false)
      .gte('received_at', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('received_at', { ascending: false })
      .limit(20),
  ]);

  const blocks = todayBlocksRes.data || [];
  const upcomingBlocks = (upcomingBlocksRes.data || []).filter((b) => b.show_as !== 'free');
  const nowMs = now.getTime();

  const currentMeeting = blocks.find((b) => {
    const start = new Date(b.starts_at).getTime();
    const end = new Date(b.ends_at).getTime();
    return start <= nowMs && end > nowMs && b.show_as !== 'free';
  }) || null;

  const upcomingMeetings = upcomingBlocks.slice(0, 8).map((m) => ({
    ...mapCalendarBlockForClient(m),
    provider: m.provider,
  }));

  let meetingMinutesToday = 0;
  const dayStartMs = todayStart.getTime();
  const dayEndMs = todayEnd.getTime();
  for (const b of blocks) {
    if (b.show_as === 'free') continue;
    const start = Math.max(new Date(b.starts_at).getTime(), dayStartMs);
    const end = Math.min(new Date(b.ends_at).getTime(), dayEndMs);
    if (end > start) meetingMinutesToday += Math.round((end - start) / 60_000);
  }

  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 6);
  weekAgo.setUTCHours(0, 0, 0, 0);
  const { data: weekBlocks } = await supabase
    .from('workspace_calendar_blocks')
    .select('starts_at, ends_at, show_as')
    .eq('user_id', userId)
    .gte('ends_at', weekAgo.toISOString());

  let meetingMinutesThisWeek = 0;
  for (const b of weekBlocks || []) {
    if (b.show_as === 'free') continue;
    const start = Math.max(new Date(b.starts_at).getTime(), weekAgo.getTime());
    const end = Math.min(new Date(b.ends_at).getTime(), dayEndMs);
    if (end > start) meetingMinutesThisWeek += Math.round((end - start) / 60_000);
  }

  return {
    connections: connectionsRes.data || [],
    inMeeting: Boolean(currentMeeting),
    currentMeeting: currentMeeting
      ? {
          ...mapCalendarBlockForClient(currentMeeting),
          provider: currentMeeting.provider,
        }
      : null,
    upcomingMeetings,
    meetingMinutesToday,
    meetingMinutesThisWeek,
    notifications: notifRes.data || [],
    unreadCount: (notifRes.data || []).filter((n) => !n.is_read).length,
  };
}
