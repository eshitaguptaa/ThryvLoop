import { computeTeamInsights, normalizeTeamInsightsRangeDays } from '@/lib/b2b/teamInsights';
import { archivedTaskPurgeCutoff } from '@/lib/taskArchive';
import { createSupabaseAdmin } from '@/lib/supabaseAdmin';

const PAGE_SIZE = 1000;
const MAX_PAGES = 40;

/**
 * Paginate a Supabase select builder until exhausted.
 * @param {() => import('@supabase/supabase-js').PostgrestFilterBuilder} buildQuery
 *   factory that returns a fresh query (without range) each call
 */
async function fetchAllRows(buildQuery) {
  /** @type {Array<Record<string, unknown>>} */
  const all = [];
  let from = 0;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const { data, error } = await buildQuery().range(from, from + PAGE_SIZE - 1);
    if (error) return { data: null, error };
    const rows = data || [];
    all.push(...rows);
    if (rows.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return { data: all, error: null };
}

/**
 * Load org tasks + member focus sessions and compute Team Insights.
 * Service-role only — caller must verify workspace membership.
 *
 * @param {{
 *   organizationId: string | null | undefined,
 *   members: Array<{
 *     userId: string,
 *     label: string,
 *     email?: string | null,
 *     imageUrl?: string | null,
 *     roleLabel?: string,
 *     clerkRole?: string | null,
 *   }>,
 *   rangeDays?: number,
 * }} args
 * @returns {Promise<{ data: ReturnType<typeof computeTeamInsights> | null, error: string }>}
 */
export async function fetchTeamInsightsPayload({ organizationId, members, rangeDays = 7 }) {
  const range = normalizeTeamInsightsRangeDays(rangeDays);

  if (!organizationId) {
    return {
      data: null,
      error:
        'Workspace could not be linked to Supabase. Apply the organization migrations, then refresh.',
    };
  }

  try {
    const supabase = createSupabaseAdmin();
    const now = new Date();
    // Current + prior period + streak lookback (~120 days)
    const since = new Date(now);
    since.setDate(since.getDate() - Math.max(range * 2, 120));
    const sinceIso = since.toISOString();

    const memberIds = (members || []).map((m) => m.userId).filter(Boolean);

    await supabase
      .from('organization_tasks')
      .delete()
      .eq('organization_id', organizationId)
      .eq('column_key', 'done')
      .not('archived_at', 'is', null)
      .lt('archived_at', archivedTaskPurgeCutoff(now).toISOString());

    const tasksRes = await fetchAllRows(() =>
      supabase
        .from('organization_tasks')
        .select(
          'id, organization_id, title, column_key, assignee_user_id, due_date, priority, completed_at, created_at, updated_at'
        )
        .eq('organization_id', organizationId)
        .or(`column_key.neq.done,completed_at.gte.${sinceIso}`)
        .order('created_at', { ascending: false })
    );

    if (tasksRes.error) {
      return { data: null, error: tasksRes.error.message || 'Failed to load tasks' };
    }

    /** @type {Array<Record<string, unknown>>} */
    let sessionRows = [];
    if (memberIds.length > 0) {
      // Chunk .in() lists to stay under PostgREST URL limits
      const CHUNK = 80;
      for (let i = 0; i < memberIds.length; i += CHUNK) {
        const chunk = memberIds.slice(i, i + CHUNK);
        const sessionsRes = await fetchAllRows(() =>
          supabase
            .from('focus_sessions')
            .select('user_id, completed_at, duration_seconds, active_seconds, phase, is_credited')
            .in('user_id', chunk)
            .gte('completed_at', sinceIso)
            .order('completed_at', { ascending: true })
        );
        if (sessionsRes.error) {
          return {
            data: null,
            error: sessionsRes.error.message || 'Failed to load focus sessions',
          };
        }
        sessionRows = sessionRows.concat(sessionsRes.data || []);
      }
    }

    /** @type {Record<string, Array<Record<string, unknown>>>} */
    const focusSessionsByUser = {};
    for (const id of memberIds) {
      focusSessionsByUser[id] = [];
    }
    for (const row of sessionRows) {
      const uid = /** @type {string} */ (row.user_id);
      if (!focusSessionsByUser[uid]) focusSessionsByUser[uid] = [];
      focusSessionsByUser[uid].push(row);
    }

    const data = computeTeamInsights({
      tasks: tasksRes.data || [],
      focusSessionsByUser,
      members: members || [],
      rangeDays: range,
      now,
    });

    return { data, error: '' };
  } catch (err) {
    return {
      data: null,
      error: err?.message || 'Failed to load team insights',
    };
  }
}
