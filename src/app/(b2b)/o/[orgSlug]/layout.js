import Link from 'next/link';
import { Suspense } from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
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
    <div className="min-h-[40vh] flex items-center justify-center text-gray-500 text-sm rounded-2xl border border-slate-200/90 bg-white shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06),0_12px_32px_-12px_rgba(15,23,42,0.12)]">
      Loading…
    </div>
  );
}

export default async function OrgSlugLayout({ children, params }) {
  const { userId } = await auth();
  if (!userId) redirect('/signin');

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
                  className="font-normal text-gray-800 hover:text-[#5D3FD3] transition-colors"
                >
                  Workspaces
                </Link>
                <span className="text-gray-400 select-none font-normal" aria-hidden>
                  /
                </span>
                <span className="font-bold text-gray-900 tracking-tight">{org.name}</span>
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
