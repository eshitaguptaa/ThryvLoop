import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';
import { authModalUrl } from '@/lib/authRoutes';
import OrgRhythmClient from '@/components/b2b/OrgRhythmClient';
import { getOrgMembers, getWorkspaceContext, isOrgAdmin } from '@/lib/org';
import { mapOrgMembersForTasks } from '@/lib/orgTasks';

export default async function OrgRhythmPage({ params }) {
  const { userId } = await auth();
  if (!userId) redirect(authModalUrl('signin'));

  const { orgSlug } = await params;
  const ctx = await getWorkspaceContext(userId, orgSlug);
  if (!ctx) notFound();

  const clerkMembers = await getOrgMembers(ctx.clerkOrgId);
  const members = mapOrgMembersForTasks(clerkMembers);

  return (
    <OrgRhythmClient
      organizationId={ctx.supabaseOrgId}
      orgName={ctx.name}
      orgSlug={ctx.slug}
      isAdmin={isOrgAdmin(ctx.membership)}
      members={members}
      focusHours={ctx.focusHours}
      currentUserId={userId}
    />
  );
}
