import Link from 'next/link';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import WorkspaceDirectory from '@/components/b2b/WorkspaceDirectory';
import {
  workspaceCardClass,
  workspaceDirectoryContentClass,
  workspaceEyebrowClass,
  workspaceInsetClass,
  workspaceMutedLinkClass,
  workspaceMutedTextClass,
  workspacePageTitleClass,
  workspacesDirectorySurfaceClass,
} from '@/components/b2b/workspaceShellClasses';
import { enrichMembershipsForDirectory } from '@/lib/workspaceSummaries';

export default async function WorkspacesPage() {
  const { userId } = await auth();
  if (!userId) redirect('/signin');

  const client = await clerkClient();
  const list = await client.users.getOrganizationMembershipList({ userId, limit: 100 });
  const items = list.data ?? [];

  const summaries = items.length ? await enrichMembershipsForDirectory(userId) : [];

  return (
    <div className={workspacesDirectorySurfaceClass}>
      <div className={workspaceInsetClass}>
        <div className={workspaceDirectoryContentClass}>
          <header className="pb-1 mb-4 sm:mb-5">
            <div className="min-w-0 space-y-1">
              <p className={workspaceEyebrowClass}>
                Workspaces
              </p>
              <h1 className={workspacePageTitleClass}>Team workspaces</h1>
              <p className={`${workspaceMutedTextClass} text-sm sm:text-base mt-2 sm:mt-3 leading-relaxed max-w-2xl`}>
                Create a workspace, invite members by email, and keep team tasks and analytics in one
                place.
              </p>
            </div>
          </header>

          {items.length === 0 ? (
            <div className={`${workspaceCardClass} px-6 py-10 sm:px-8 sm:py-12 text-center w-full mt-6`}>
              <p className={`${workspaceMutedTextClass} text-sm sm:text-base leading-relaxed max-w-lg mx-auto`}>
                You are not in any workspace yet. Create a workspace to become admin, then invite your
                team from the Members page.
              </p>
              <Link
                href="/o/new"
                className="inline-block mt-6 text-sm font-semibold text-[#5D3FD3] hover:text-[#5032c4]"
              >
                Create your first workspace →
              </Link>
            </div>
          ) : (
            <div className="mt-1">
              <WorkspaceDirectory summaries={summaries} />
            </div>
          )}

          <Link
            href="/home"
            className={`inline-flex items-center gap-1 mt-8 sm:mt-10 text-sm font-medium ${workspaceMutedLinkClass}`}
          >
            ← Back to personal home
          </Link>
        </div>
      </div>
    </div>
  );
}
