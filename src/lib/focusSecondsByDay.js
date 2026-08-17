import { dateKeyInTimeZone } from '@/lib/dateRanges';
import { sanitizeTimeZone } from '@/lib/focusTrend';

const PAGE_SIZE = 1000;
const MAX_PAGES = 120;

/**
 * Sum duration_seconds by local calendar day for a user.
 * Prefers the focus_seconds_by_day RPC; paginates raw rows if the RPC is missing.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId
 * @param {string} startIso
 * @param {string} endIso
 * @param {string} timeZone
 * @returns {Promise<Record<string, number>>}
 */
export async function fetchFocusSecondsByDay(supabase, userId, startIso, endIso, timeZone) {
  const tz = sanitizeTimeZone(timeZone);

  const rpc = await supabase.rpc('focus_seconds_by_day', {
    p_user_id: userId,
    p_start: startIso,
    p_end: endIso,
    p_timezone: tz,
  });

  if (!rpc.error && Array.isArray(rpc.data)) {
    /** @type {Record<string, number>} */
    const map = {};
    for (const row of rpc.data) {
      const key = String(row.day || '').slice(0, 10);
      if (!key) continue;
      map[key] = Math.max(0, Number(row.seconds) || 0);
    }
    return map;
  }

  /** @type {Record<string, number>} */
  const map = {};
  let from = 0;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('completed_at, duration_seconds')
      .eq('user_id', userId)
      .eq('phase', 'session')
      .gte('completed_at', startIso)
      .lt('completed_at', endIso)
      .order('completed_at', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    const rows = data || [];
    for (const row of rows) {
      if (!row.completed_at) continue;
      const key = dateKeyInTimeZone(new Date(row.completed_at), tz);
      map[key] = (map[key] || 0) + Math.max(0, Number(row.duration_seconds) || 0);
    }
    if (rows.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return map;
}
