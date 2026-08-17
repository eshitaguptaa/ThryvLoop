import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';
import { authModalUrl } from '@/lib/authRoutes';
import OrgSettingsForm from '@/components/b2b/OrgSettingsForm';
import { getWorkspaceContext, isOrgAdmin } from '@/lib/org';

export default async function OrgSettingsPage({ params }) {
  const { userId } = await auth();
  if (!userId) redirect(authModalUrl('signin'));

  const { orgSlug } = await params;
  const ctx = await getWorkspaceContext(userId, orgSlug);
  if (!ctx) notFound();

  return (
    <OrgSettingsForm
      orgSlug={ctx.slug}
      orgName={ctx.name}
      orgImageUrl={ctx.imageUrl}
      insightsPolicy={ctx.insightsPolicy}
      focusHours={ctx.focusHours}
      isAdmin={isOrgAdmin(ctx.membership)}
    />
  );
}
