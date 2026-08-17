import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';
import { authModalUrl } from '@/lib/authRoutes';
import OrgTasksBoard from '@/components/b2b/OrgTasksBoard';
import { mapOrgMembersForTasks } from '@/lib/orgTasks';
import { fetchOrganizationTasksServer } from '@/lib/orgTaskServer';
import { getOrgMembers, getWorkspaceContext, isOrgAdmin } from '@/lib/org';
import { createSupabaseAdmin } from '@/lib/supabaseAdmin';

export default async function OrgWorkPage({ params }) {
  const { userId } = await auth();
  if (!userId) redirect(authModalUrl('signin'));

  const { orgSlug } = await params;
  const ctx = await getWorkspaceContext(userId, orgSlug);
  if (!ctx) notFound();

  const admin = isOrgAdmin(ctx.membership);
  const clerkMembers = await getOrgMembers(ctx.clerkOrgId);
  const members = mapOrgMembersForTasks(clerkMembers);

  const [{ tasks: initialTasks, error: initialError }, projects] = await Promise.all([
    fetchOrganizationTasksServer(ctx.supabaseOrgId, {
      assigneeUserId: admin ? null : userId,
    }),
    (async () => {
      if (!ctx.supabaseOrgId) return [];
      try {
        const supabase = createSupabaseAdmin();
        const { data, error } = await supabase
          .from('organization_projects')
          .select('id, name, status, owner_user_id')
          .eq('organization_id', ctx.supabaseOrgId)
          .eq('status', 'active')
          .order('name', { ascending: true });
        if (error) return [];
        return data ?? [];
      } catch {
        return [];
      }
    })(),
  ]);

  return (
    <OrgTasksBoard
      organizationId={ctx.supabaseOrgId}
      isAdmin={admin}
      members={members}
      currentUserId={userId}
      orgName={ctx.name}
      projects={projects}
      initialTasks={initialTasks}
      initialError={initialError}
    />
  );
}
