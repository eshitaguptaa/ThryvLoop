import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';
import { authModalUrl } from '@/lib/authRoutes';
import OrgPulseDashboard from '@/components/b2b/OrgPulseDashboard';
import { getOrgMembers, getWorkspaceContext, isOrgAdmin } from '@/lib/org';
import { mapOrgMembersForTasks } from '@/lib/orgTasks';
import {
  computePulseStats,
  groupPresence,
  parseFocusHours,
} from '@/lib/orgPulse';
import { createSupabaseAdmin } from '@/lib/supabaseAdmin';

export default async function OrgPulsePage({ params }) {
  const { userId } = await auth();
  if (!userId) redirect(authModalUrl('signin'));

  const { orgSlug } = await params;
  const ctx = await getWorkspaceContext(userId, orgSlug);
  if (!ctx) notFound();

  const admin = isOrgAdmin(ctx.membership);
  const clerkMembers = await getOrgMembers(ctx.clerkOrgId);
  const members = mapOrgMembersForTasks(clerkMembers);

  let tasks = [];
  let activity = [];
  let presenceRows = [];

  if (ctx.supabaseOrgId) {
    try {
      const supabase = createSupabaseAdmin();
      const [tasksRes, activityRes, presenceRes] = await Promise.all([
        supabase
          .from('organization_tasks')
          .select(
            'id, title, column_key, assignee_user_id, due_date, completed_at, created_at, updated_at, priority, archived_at'
          )
          .eq('organization_id', ctx.supabaseOrgId)
          .is('archived_at', null),
        supabase
          .from('organization_activity')
          .select('id, actor_user_id, event_type, summary, created_at, metadata')
          .eq('organization_id', ctx.supabaseOrgId)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('organization_presence')
          .select('user_id, status, last_seen_at, note')
          .eq('organization_id', ctx.supabaseOrgId),
      ]);

      tasks = tasksRes.error ? [] : tasksRes.data ?? [];
      activity = activityRes.error ? [] : activityRes.data ?? [];
      presenceRows = presenceRes.error ? [] : presenceRes.data ?? [];
    } catch (e) {
      console.warn('[pulse] load failed:', e);
    }
  }

  const pulse = computePulseStats(tasks, userId, admin);
  const presence = groupPresence(presenceRows);
  const focusHours = parseFocusHours(ctx.focusHours);

  return (
    <OrgPulseDashboard
      orgName={ctx.name}
      orgSlug={ctx.slug}
      isAdmin={admin}
      role={ctx.membership.role}
      pulse={pulse}
      activity={activity}
      presence={presence}
      members={members}
      focusHours={focusHours}
      insightsPolicy={ctx.insightsPolicy}
    />
  );
}
