import { archiveTimestampPatch, archivedTaskPurgeCutoff, doneBoardCutoff } from '@/lib/taskArchive';
import { createSupabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Server-side org tasks for route hydration (keeps route loading until data is ready).
 * @param {string | null | undefined} organizationId
 * @param {{ assigneeUserId?: string | null }} [options]
 * @returns {Promise<{ tasks: Array<Record<string, unknown>>, error: string }>}
 */
export async function fetchOrganizationTasksServer(organizationId, options = {}) {
  const assigneeUserId = options.assigneeUserId || null;

  if (!organizationId) {
    return {
      tasks: [],
      error:
        'Workspace could not be linked to Supabase. Apply the organization migrations, then refresh.',
    };
  }

  try {
    const supabase = createSupabaseAdmin();
    const cutoffIso = doneBoardCutoff().toISOString();
    const patch = archiveTimestampPatch();
    await supabase
      .from('organization_tasks')
      .update(patch)
      .eq('organization_id', organizationId)
      .eq('column_key', 'done')
      .is('archived_at', null)
      .lt('completed_at', cutoffIso);

    await supabase
      .from('organization_tasks')
      .delete()
      .eq('organization_id', organizationId)
      .eq('column_key', 'done')
      .not('archived_at', 'is', null)
      .lt('archived_at', archivedTaskPurgeCutoff().toISOString());

    let query = supabase
      .from('organization_tasks')
      .select('*')
      .eq('organization_id', organizationId)
      .is('archived_at', null)
      .order('created_at', { ascending: false });

    if (assigneeUserId) {
      query = query.eq('assignee_user_id', assigneeUserId);
    }

    const { data, error } = await query;
    if (error) {
      return { tasks: [], error: error.message || 'Failed to load tasks' };
    }
    return { tasks: data || [], error: '' };
  } catch (err) {
    return {
      tasks: [],
      error: err?.message || 'Failed to load tasks',
    };
  }
}
