import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';
import { authModalUrl } from '@/lib/authRoutes';
import OrgTasksBoard from '@/components/b2b/OrgTasksBoard';
import { mapOrgMembersForTasks } from '@/lib/orgTasks';
import { getOrgMembers, getWorkspaceContext, isOrgAdmin } from '@/lib/org';

export default async function OrgTasksPage({ params }) {
  const { userId } = await auth();
  if (!userId) redirect(authModalUrl('signin'));

  const { orgSlug } = await params;
  const ctx = await getWorkspaceContext(userId, orgSlug);
  if (!ctx) notFound();

  const clerkMembers = await getOrgMembers(ctx.clerkOrgId);
  const members = mapOrgMembersForTasks(clerkMembers);

  return (
    <OrgTasksBoard
      organizationId={ctx.supabaseOrgId}
      isAdmin={isOrgAdmin(ctx.membership)}
      members={members}
      currentUserId={userId}
      orgName={ctx.name}
    />
  );
}
