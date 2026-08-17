import Link from 'next/link';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { ArrowRight, Building2 } from 'lucide-react';
import { authModalUrl } from '@/lib/authRoutes';
import WorkspaceAtmosphere from '@/components/b2b/WorkspaceAtmosphere';
import WorkspaceDirectory from '@/components/b2b/WorkspaceDirectory';
import WorkspaceDirectoryTheme from '@/components/b2b/WorkspaceDirectoryTheme';
import PendingWorkspaceInvites from '@/components/b2b/PendingWorkspaceInvites';
import {
  workspaceDirectoryContentClass,
  workspaceEyebrowClass,
  workspaceInsetClass,
  workspaceMutedTextClass,
  workspacePageTitleClass,
  workspacePrimaryButtonClass,
  workspacesDirectorySurfaceClass,
} from '@/components/b2b/workspaceShellClasses';
import { enrichMembershipsForDirectory } from '@/lib/workspaceSummaries';

export default async function WorkspacesPage() {
  const { userId } = await auth();
  if (!userId) redirect(authModalUrl('signin'));

  const client = await clerkClient();
  const list = await client.users.getOrganizationMembershipList({ userId, limit: 100 });
  const items = list.data ?? [];

  const summaries = items.length ? await enrichMembershipsForDirectory(userId) : [];

  return (
    <div className={workspacesDirectorySurfaceClass}>
      <WorkspaceAtmosphere variant="directory" />
      <div className={workspaceInsetClass}>
        <div className={workspaceDirectoryContentClass}>
          <header className="ws-rise mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 max-w-2xl">
              <div className="mb-2.5 flex items-center gap-2.5">
                <span
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#5D3FD3] text-white shadow-sm dark:bg-gradient-to-br dark:from-[#5D3FD3] dark:to-sky-400"
                  aria-hidden
                >
                  <Building2 className="h-3.5 w-3.5" />
                </span>
                <p className={`${workspaceEyebrowClass} mb-0`}>Workspaces</p>
              </div>
              <h1 className={workspacePageTitleClass}>Team workspaces</h1>
              <p
                className={`${workspaceMutedTextClass} text-sm sm:text-[0.95rem] mt-2.5 sm:mt-3 leading-relaxed max-w-xl`}
              >
                Work with your teams in one place — Pulse, Work, and Rhythm.
                Enabled policies show as badges on each workspace.
              </p>
              {items.length === 0 ? (
                <Link href="/o/new" className={`${workspacePrimaryButtonClass} mt-5`}>
                  Create your first workspace
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              ) : null}
            </div>
            <WorkspaceDirectoryTheme />
          </header>

          <PendingWorkspaceInvites />

          {items.length === 0 ? (
            <div className="ws-rise ws-rise-delay-2 rounded-2xl border border-border bg-card px-6 py-12 sm:px-10 sm:py-14 text-center w-full shadow-sm dark:border-white/[0.08] dark:bg-card/60">
              <p
                className={`${workspaceMutedTextClass} text-sm sm:text-base leading-relaxed max-w-lg mx-auto`}
              >
                You are not in any workspace yet. Create one to become admin, then invite your team
                from People.
              </p>
              <Link
                href="/o/new"
                className="inline-flex items-center gap-2 mt-6 text-sm font-semibold text-[#5D3FD3] dark:text-[#c4b5fd] hover:opacity-90"
              >
                Get started
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          ) : (
            <WorkspaceDirectory summaries={summaries} />
          )}
        </div>
      </div>
    </div>
  );
}
