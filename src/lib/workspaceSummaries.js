import { clerkClient } from '@clerk/nextjs/server';
import { createSupabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * @param {string} userId
 * @returns {Promise<Array<{
 *   id: string,
 *   role: string,
 *   organization: { id: string, name: string, slug: string },
 *   memberCount: number,
 *   taskDone: number,
 *   taskTotal: number,
 *   taskOpen: number,
 *   focusHoursEnabled: boolean,
 *   insightsPolicy: 'team_only' | 'full_individual',
 *   healthScore: number,
 *   lastActiveAt: string | null,
 * }>>}
 */
export async function enrichMembershipsForDirectory(userId) {
  const client = await clerkClient();
  const list = await client.users.getOrganizationMembershipList({ userId, limit: 100 });
  const items = list.data ?? [];
  if (!items.length) return [];

  const supabase = createSupabaseAdmin();

  return Promise.all(
    items.map(async (m) => {
      const clerkOrgId = m.organization.id;

      const [{ data: mems }, orgRes] = await Promise.all([
        client.organizations.getOrganizationMembershipList({
          organizationId: clerkOrgId,
          limit: 500,
        }),
        supabase
          .from('organizations')
          .select('id, updated_at, focus_hours, insights_policy')
          .eq('clerk_organization_id', clerkOrgId)
          .maybeSingle(),
      ]);

      let orgRow = orgRes.data;
      if (orgRes.error) {
        const bare = await supabase
          .from('organizations')
          .select('id, updated_at, focus_hours')
          .eq('clerk_organization_id', clerkOrgId)
          .maybeSingle();
        orgRow = bare.data;
      }

      let taskDone = 0;
      let taskTotal = 0;
      let taskOpen = 0;
      let lastActiveAt = null;
      let focusHoursEnabled = false;
      let insightsPolicy = 'team_only';

      if (orgRow?.focus_hours && typeof orgRow.focus_hours === 'object') {
        focusHoursEnabled = Boolean(orgRow.focus_hours.enabled);
      }
      if (orgRow?.insights_policy === 'full_individual') {
        insightsPolicy = 'full_individual';
      }

      if (orgRow?.id) {
        const { data: tasks } = await supabase
          .from('organization_tasks')
          .select('column_key, updated_at')
          .eq('organization_id', orgRow.id)
          .is('archived_at', null);
        const t = tasks ?? [];
        taskTotal = t.length;
        taskDone = t.filter((row) => row.column_key === 'done').length;
        taskOpen = t.filter((row) => row.column_key !== 'done').length;

        const orgTs = orgRow.updated_at ? new Date(orgRow.updated_at).getTime() : 0;
        const taskTs = t.reduce((max, row) => {
          if (!row.updated_at) return max;
          const x = new Date(row.updated_at).getTime();
          return Number.isNaN(x) ? max : Math.max(max, x);
        }, 0);
        const best = Math.max(orgTs, taskTs);
        lastActiveAt = best > 0 ? new Date(best).toISOString() : null;
      } else {
        const updated = orgRow?.updated_at ? new Date(orgRow.updated_at) : null;
        lastActiveAt =
          updated && !Number.isNaN(updated.getTime()) ? updated.toISOString() : null;
      }

      const completion = taskTotal > 0 ? Math.round((taskDone / taskTotal) * 70) : 20;
      const teamBoost = Math.min(20, (mems?.length ?? 0) * 5);
      const focusBoost = focusHoursEnabled ? 10 : 0;
      const healthScore = Math.min(100, completion + teamBoost + focusBoost);

      return {
        id: String(m.id),
        role: String(m.role ?? ''),
        organization: {
          id: String(m.organization.id),
          name: String(m.organization.name ?? ''),
          slug: String(m.organization.slug ?? ''),
          imageUrl: m.organization.imageUrl ? String(m.organization.imageUrl) : null,
          hasImage: Boolean(m.organization.hasImage),
        },
        memberCount: mems?.length ?? 0,
        taskDone,
        taskTotal,
        taskOpen,
        focusHoursEnabled,
        insightsPolicy,
        healthScore,
        lastActiveAt,
      };
    })
  );
}
