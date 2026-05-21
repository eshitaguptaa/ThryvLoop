import { createSupabaseAdmin } from '@/lib/supabaseAdmin';
import { canJoinCalendarMeeting, isGoogleMeetUrl, mapCalendarBlockForClient } from '@/lib/workspace/meetUrl';

/**
 * @param {string} userId
 * @param {string} blockId
 */
export async function getMeetSessionForUser(userId, blockId) {
  const supabase = createSupabaseAdmin();
  const { data: block, error } = await supabase
    .from('workspace_calendar_blocks')
    .select('id, title, starts_at, ends_at, is_online_meeting, meet_url, show_as')
    .eq('user_id', userId)
    .eq('id', blockId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!block) return null;

  const mapped = mapCalendarBlockForClient(block);
  if (!mapped.meetUrl || !isGoogleMeetUrl(mapped.meetUrl)) {
    return { ...mapped, joinable: false, reason: 'no_meet_link' };
  }
  if (!canJoinCalendarMeeting(mapped)) {
    return { ...mapped, joinable: false, reason: 'outside_join_window' };
  }

  return { ...mapped, joinable: true, reason: null };
}
