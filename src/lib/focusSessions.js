import { getSupabaseClient, setSupabaseAuthToken } from '@/utils/userStorage';
import { localEndOfDay, localStartOfDay } from '@/lib/dateRanges';

export async function sumFocusSecondsInRange(supabase, userId, startIso, endIso) {
  const { data, error } = await supabase
    .from('focus_sessions')
    .select('duration_seconds')
    .eq('user_id', userId)
    .eq('phase', 'session')
    .gte('completed_at', startIso)
    .lte('completed_at', endIso);
  if (error) throw error;
  return (data || []).reduce((total, row) => total + (row.duration_seconds || 0), 0);
}

/** Logged focus timer seconds for today and yesterday (local calendar). */
export async function fetchTodayAndYesterdayFocusSeconds(userId, getToken) {
  if (!userId) return { today: 0, yesterday: 0 };
  const token = await getToken({ template: 'supabase' }).catch(() => null);
  if (!token) return { today: 0, yesterday: 0 };
  setSupabaseAuthToken(token);
  const supabase = getSupabaseClient();
  if (!supabase) return { today: 0, yesterday: 0 };

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  try {
    const [today, yesterdayTotal] = await Promise.all([
      sumFocusSecondsInRange(supabase, userId, localStartOfDay(now), localEndOfDay(now)),
      sumFocusSecondsInRange(supabase, userId, localStartOfDay(yesterday), localEndOfDay(yesterday)),
    ]);
    return { today, yesterday: yesterdayTotal };
  } catch (e) {
    console.error('fetchTodayAndYesterdayFocusSeconds:', e);
    return { today: 0, yesterday: 0 };
  }
}
