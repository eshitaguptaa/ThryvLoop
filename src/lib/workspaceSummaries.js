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

      const [{ data: mems }, { data: orgRow }] = await Promise.all([
        client.organizations.getOrganizationMembershipList({
          organizationId: clerkOrgId,
          limit: 500,
        }),
        supabase
          .from('organizations')
          .select('id, updated_at')
          .eq('clerk_organization_id', clerkOrgId)
          .maybeSingle(),
      ]);

      let taskDone = 0;
      let taskTotal = 0;
      let lastActiveAt = null;
      if (orgRow?.id) {
        const { data: tasks } = await supabase
          .from('organization_tasks')
          .select('column_key, updated_at')
          .eq('organization_id', orgRow.id);
        const t = tasks ?? [];
        taskTotal = t.length;
        taskDone = t.filter((row) => row.column_key === 'done').length;

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

      return {
        id: String(m.id),
        role: String(m.role ?? ''),
        organization: {
          id: String(m.organization.id),
          name: String(m.organization.name ?? ''),
          slug: String(m.organization.slug ?? ''),
        },
        memberCount: mems?.length ?? 0,
        taskDone,
        taskTotal,
        lastActiveAt,
      };
    })
  );
}
