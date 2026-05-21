import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';
import OrgAnalyticsDashboard from '@/components/b2b/OrgAnalyticsDashboard';
import { mapOrgMembersForTasks } from '@/lib/orgTasks';
import { getOrgMembers, getWorkspaceContext, isOrgAdmin } from '@/lib/org';

export default async function OrgAnalyticsPage({ params }) {
  const { userId } = await auth();
  if (!userId) redirect('/signin');

  const { orgSlug } = await params;
  const ctx = await getWorkspaceContext(userId, orgSlug);
  if (!ctx) notFound();

  const clerkMembers = await getOrgMembers(ctx.clerkOrgId);
  const members = mapOrgMembersForTasks(clerkMembers);

  return (
    <OrgAnalyticsDashboard
      organizationId={ctx.supabaseOrgId}
      isAdmin={isOrgAdmin(ctx.membership)}
      members={members}
      currentUserId={userId}
    />
  );
}
