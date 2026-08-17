import Link from 'next/link';
import { Suspense } from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { authModalUrl } from '@/lib/authRoutes';
import WorkspaceRouteLoading from '@/components/b2b/WorkspaceRouteLoading';
import AcceptOrgInvitation from '@/components/b2b/AcceptOrgInvitation';
import WorkspaceJoinRetry from '@/components/b2b/WorkspaceJoinRetry';
import OrgWorkspaceNav from '@/components/b2b/OrgWorkspaceNav';
import OrgPresenceSync from '@/components/b2b/OrgPresenceSync';
import OrgJoinNotice from '@/components/b2b/OrgJoinNotice';
import SetActiveOrg from '@/components/b2b/SetActiveOrg';
import WorkspaceAtmosphere from '@/components/b2b/WorkspaceAtmosphere';
import WorkspaceSwitcher from '@/components/b2b/WorkspaceSwitcher';
import {
  workspaceChromeBarClass,
  workspaceChromeInsetClass,
  workspaceContentClass,
  workspaceInsetClass,
  workspaceSurfaceClass,
} from '@/components/b2b/workspaceShellClasses';
import { decodeOrgSlug, getWorkspaceContext, getWorkspacePublicPreview, isOrgAdmin, workspaceDisplayName } from '@/lib/org';
import { organizationLogoUrl } from '@/lib/workspaceLogo';
import { headers } from 'next/headers';

function JoiningFallback() {
  return <WorkspaceRouteLoading message="Joining workspace" variant="page" />;
}

function InviteLanding({ orgSlug, workspaceName }) {
  return (
    <div className={workspaceSurfaceClass}>
      <WorkspaceAtmosphere variant="org" />
      <div className={workspaceInsetClass}>
        <Suspense fallback={<JoiningFallback />}>
          <AcceptOrgInvitation orgSlug={orgSlug} mode="gate" workspaceName={workspaceName} />
        </Suspense>
      </div>
    </div>
  );
}

export default async function OrgSlugLayout({ children, params }) {
  const { userId } = await auth();
  const { orgSlug } = await params;
  const decodedSlug = decodeOrgSlug(orgSlug);
  const headerList = await headers();
  const isInvite = headerList.get('x-thryv-invite') === '1';
  const isWelcome = headerList.get('x-thryv-welcome') === '1';

  if (!userId) {
    if (isInvite) {
      const preview = await getWorkspacePublicPreview(decodedSlug);
      return <InviteLanding orgSlug={decodedSlug} workspaceName={preview.name} />;
    }
    redirect(authModalUrl('signin', `/o/${encodeURIComponent(decodedSlug)}`));
  }

  const ctx = await getWorkspaceContext(userId, orgSlug);

  if (!ctx) {
    if (isInvite) {
      const preview = await getWorkspacePublicPreview(decodedSlug);
      return <InviteLanding orgSlug={decodedSlug} workspaceName={preview.name} />;
    }
    if (isWelcome) {
      const preview = await getWorkspacePublicPreview(decodedSlug);
      return (
        <div className={workspaceSurfaceClass}>
          <WorkspaceAtmosphere variant="org" />
          <WorkspaceJoinRetry orgSlug={decodedSlug} workspaceName={preview.name} />
        </div>
      );
    }
    redirect('/o');
  }

  const org = ctx.membership.organization;
  const admin = isOrgAdmin(ctx.membership);
  // Prefer hydrated ctx.imageUrl (hasImage-gated); organizationLogoUrl as fallback.
  const logoUrl = ctx.imageUrl ?? organizationLogoUrl(org);

  return (
    <div className={workspaceSurfaceClass}>
      <WorkspaceAtmosphere variant="org" />
      <SetActiveOrg organizationId={org.id} />
      <OrgPresenceSync organizationId={ctx.supabaseOrgId} userId={userId} />
      <OrgJoinNotice orgSlug={org.slug} />
      <Suspense fallback={null}>
        <AcceptOrgInvitation
          orgSlug={decodedSlug}
          mode="inline"
          workspaceName={workspaceDisplayName(org.name, org.slug)}
        />
      </Suspense>

      <div className={workspaceChromeBarClass}>
        <div className={workspaceChromeInsetClass}>
          <div className={workspaceContentClass}>
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between xl:gap-4">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <div className="min-w-0 max-w-[min(100%,18rem)] sm:max-w-[16rem] md:max-w-[18rem]">
                  <WorkspaceSwitcher
                    name={org.name}
                    slug={org.slug}
                    imageUrl={logoUrl}
                  />
                </div>
                <span
                  className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    admin
                      ? 'bg-[rgba(93,63,211,0.12)] text-[#5D3FD3] border border-[rgba(93,63,211,0.18)] dark:bg-[rgba(93,63,211,0.22)] dark:text-[#c4b5fd]'
                      : 'bg-muted/70 text-muted-foreground border border-border/70'
                  }`}
                >
                  {admin ? 'Admin' : 'Member'}
                </span>
                <Link
                  href="/o"
                  className="hidden lg:inline-flex shrink-0 text-xs font-semibold text-muted-foreground hover:text-[#5D3FD3] dark:hover:text-[#c4b5fd] transition-colors"
                >
                  All workspaces
                </Link>
              </div>

              <div className="flex min-w-0 w-full items-center gap-2 xl:w-auto xl:max-w-none">
                <div className="min-w-0 flex-1 overflow-x-auto xl:flex-initial">
                  <OrgWorkspaceNav orgSlug={org.slug} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={workspaceInsetClass}>
        <div className={workspaceContentClass}>
          {children}
        </div>
      </div>
    </div>
  );
}
