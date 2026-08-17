import { addDaysToDateKey, localEndOfDay, localStartOfDay } from '@/lib/dateRanges';
import {
  buildStreakCelebrationView,
  fallbackSecondsByDay,
  getFocusStreakLookbackRange,
  secondsByDayFromSessions,
} from '@/lib/focusStreak';
import { getFocusTrendRange } from '@/lib/focusTrend';
import { getSupabaseClient, setSupabaseAuthToken } from '@/utils/userStorage';
import { workspaceApiFetch } from '@/lib/workspace/clientApi';

const PAGE_SIZE = 1000;
const MAX_PAGES = 60;

export async function sumFocusSecondsInRange(supabase, userId, startIso, endIso) {
  let total = 0;
  let from = 0;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('duration_seconds')
      .eq('user_id', userId)
      .eq('phase', 'session')
      .gte('completed_at', startIso)
      .lte('completed_at', endIso)
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const rows = data || [];
    total += rows.reduce((sum, row) => sum + (Number(row.duration_seconds) || 0), 0);
    if (rows.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return total;
}

function formatFocusFetchError(err) {
  if (err == null) return 'unknown error';
  if (typeof err === 'string') return err;
  if (err instanceof Error && err.message) return err.message;
  if (typeof err.message === 'string' && err.message) return err.message;
  if (typeof err.details === 'string' && err.details) return err.details;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

/**
 * Logged focus timer seconds for today and yesterday (local calendar).
 * Prefers the server focus-trend route (service role + RPC) so browser RLS /
 * PostgREST flakiness cannot zero out the productivity timer after login.
 *
 * @param {string} userId
 * @param {() => Promise<string | null | undefined>} getClerkToken useAuth().getToken
 * @param {(() => Promise<string | null>) | null} [getSupabaseToken] optional client fallback
 * @returns {Promise<{ today: number, yesterday: number, ok: boolean }>}
 */
export async function fetchTodayAndYesterdayFocusSeconds(
  userId,
  getClerkToken,
  getSupabaseToken = null
) {
  if (!userId) return { today: 0, yesterday: 0, ok: false };

  const range = getFocusTrendRange();
  const tz =
    typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      : 'UTC';

  if (typeof getClerkToken === 'function') {
    try {
      const params = new URLSearchParams({
        start: range.startIso,
        end: range.endIso,
        tz,
      });
      const res = await workspaceApiFetch(
        `/api/analytics/focus-trend?${params}`,
        {},
        getClerkToken
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `focus-trend ${res.status}`);
      }
      const json = await res.json();
      const todayKey = json.todayKey || range.todayKey;
      const yesterdayKey = addDaysToDateKey(todayKey, -1);
      /** @type {Record<string, number>} */
      const byKey = {};
      for (const day of Array.isArray(json.days) ? json.days : []) {
        if (!day?.key) continue;
        byKey[day.key] = Math.max(0, Number(day.seconds) || 0);
      }
      return {
        today: byKey[todayKey] || 0,
        yesterday: byKey[yesterdayKey] || 0,
        ok: true,
      };
    } catch (e) {
      console.error('fetchTodayAndYesterdayFocusSeconds (api):', formatFocusFetchError(e));
      // Fall through to client query if available.
    }
  }

  if (typeof getSupabaseToken !== 'function') {
    return { today: 0, yesterday: 0, ok: false };
  }

  try {
    const token = await getSupabaseToken();
    if (!token) return { today: 0, yesterday: 0, ok: false };
    setSupabaseAuthToken(token);
    const supabase = getSupabaseClient();
    if (!supabase) return { today: 0, yesterday: 0, ok: false };

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const [today, yesterdayTotal] = await Promise.all([
      sumFocusSecondsInRange(supabase, userId, localStartOfDay(now), localEndOfDay(now)),
      sumFocusSecondsInRange(
        supabase,
        userId,
        localStartOfDay(yesterday),
        localEndOfDay(yesterday)
      ),
    ]);
    return { today, yesterday: yesterdayTotal, ok: true };
  } catch (e) {
    console.error('fetchTodayAndYesterdayFocusSeconds (client):', formatFocusFetchError(e));
    return { today: 0, yesterday: 0, ok: false };
  }
}

/**
 * Seconds-by-day map for the daily streak modal (calendar + consecutive count).
 * @param {() => Promise<string | null | undefined>} getClerkToken
 * @param {{ startIso: string, endIso: string }} range
 * @returns {Promise<Record<string, number>>}
 */
export async function fetchFocusSecondsByDayWindow(getClerkToken, range) {
  const params = new URLSearchParams({
    start: range.startIso,
    end: range.endIso,
  });
  const res = await workspaceApiFetch(`/api/analytics/focus-sessions?${params}`, {}, getClerkToken);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `focus-sessions ${res.status}`);
  }
  const json = await res.json();
  return secondsByDayFromSessions(Array.isArray(json.sessions) ? json.sessions : []);
}

/**
 * Payload for the +1 streak modal. Falls back to today/yesterday if history fails.
 * @param {() => Promise<string | null | undefined>} getClerkToken
 * @param {{ yesterdaySeconds?: number, now?: Date }} [opts]
 */
export async function loadStreakCelebrationPayload(getClerkToken, opts = {}) {
  const range = getFocusStreakLookbackRange(opts.now);
  let secondsByDay = {};
  try {
    secondsByDay = await fetchFocusSecondsByDayWindow(getClerkToken, range);
  } catch (e) {
    console.warn('[streak-celebration] history failed, using local fallback:', formatFocusFetchError(e));
    secondsByDay = fallbackSecondsByDay({
      todayKey: range.todayKey,
      yesterdaySeconds: opts.yesterdaySeconds,
    });
  }
  return buildStreakCelebrationView(secondsByDay, range.todayKey);
}
