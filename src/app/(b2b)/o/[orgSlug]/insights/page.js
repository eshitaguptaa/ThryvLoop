import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';
import { authModalUrl } from '@/lib/authRoutes';
import OrgAnalyticsDashboard from '@/components/b2b/OrgAnalyticsDashboard';
import { fetchTeamInsightsPayload } from '@/lib/b2b/fetchTeamInsights';
import { mapOrgMembersForTasks } from '@/lib/orgTasks';
import { getOrgMembers, getWorkspaceContext, isOrgAdmin } from '@/lib/org';

export default async function OrgInsightsPage({ params }) {
  const { userId } = await auth();
  if (!userId) redirect(authModalUrl('signin'));

  const { orgSlug } = await params;
  const ctx = await getWorkspaceContext(userId, orgSlug);
  if (!ctx) notFound();

  const admin = isOrgAdmin(ctx.membership);
  const clerkMembers = await getOrgMembers(ctx.clerkOrgId);
  const members = mapOrgMembersForTasks(clerkMembers);

  const { data: initialInsights, error: initialError } = await fetchTeamInsightsPayload({
    organizationId: ctx.supabaseOrgId,
    members,
    rangeDays: 7,
  });

  return (
    <OrgAnalyticsDashboard
      organizationId={ctx.supabaseOrgId}
      isAdmin={admin}
      members={members}
      currentUserId={userId}
      orgSlug={ctx.slug}
      insightsPolicy={ctx.insightsPolicy}
      initialInsights={initialInsights}
      initialError={initialError}
    />
  );
}
