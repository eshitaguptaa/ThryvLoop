import Link from 'next/link';
import { Suspense } from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { authModalUrl } from '@/lib/authRoutes';
import AcceptOrgInvitation from '@/components/b2b/AcceptOrgInvitation';
import OrgWorkspaceNav from '@/components/b2b/OrgWorkspaceNav';
import SetActiveOrg from '@/components/b2b/SetActiveOrg';
import {
  workspaceContentClass,
  workspaceInsetClass,
  workspaceNavbarCardClass,
  workspaceSurfaceClass,
} from '@/components/b2b/workspaceShellClasses';
import { decodeOrgSlug, getMembershipForSlug, isOrgAdmin } from '@/lib/org';

function JoiningFallback() {
  return (
    <div className={`min-h-[40vh] flex items-center justify-center text-muted-foreground text-sm ${workspaceNavbarCardClass}`}>
      Loading…
    </div>
  );
}

export default async function OrgSlugLayout({ children, params }) {
  const { userId } = await auth();
  if (!userId) redirect(authModalUrl('signin'));

  const { orgSlug } = await params;
  const decodedSlug = decodeOrgSlug(orgSlug);
  const membership = await getMembershipForSlug(userId, orgSlug);

  if (!membership) {
    return (
      <div className={workspaceSurfaceClass}>
        <div className={workspaceInsetClass}>
          <Suspense fallback={<JoiningFallback />}>
            <AcceptOrgInvitation orgSlug={decodedSlug} mode="gate" />
          </Suspense>
        </div>
      </div>
    );
  }

  const org = membership.organization;

  return (
    <div className={workspaceSurfaceClass}>
      <SetActiveOrg organizationId={org.id} />
      <Suspense fallback={null}>
        <AcceptOrgInvitation orgSlug={decodedSlug} mode="inline" />
      </Suspense>
      <div className={workspaceInsetClass}>
        <div className={workspaceContentClass}>
          <header className={`${workspaceNavbarCardClass} mb-4 md:mb-6`}>
            <div className="grid grid-cols-1 gap-2 items-center sm:gap-3 lg:grid-cols-[auto_1fr] lg:gap-4">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm sm:text-base lg:justify-self-start leading-tight">
                <Link
                  href="/o"
                  className="font-normal text-muted-foreground hover:text-[#5D3FD3] dark:hover:text-indigo-400 transition-colors"
                >
                  Workspaces
                </Link>
                <span className="text-muted-foreground select-none font-normal" aria-hidden>
                  /
                </span>
                <span className="font-bold text-foreground tracking-tight">{org.name}</span>
              </div>

              <div className="flex justify-start lg:justify-center min-w-0">
                <OrgWorkspaceNav orgSlug={org.slug} isAdmin={isOrgAdmin(membership)} />
              </div>
            </div>
          </header>
        </div>

        <div className={workspaceContentClass}>{children}</div>
      </div>
    </div>
  );
}
