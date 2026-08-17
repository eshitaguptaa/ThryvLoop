import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { authModalUrl } from '@/lib/authRoutes';
import CreateWorkspaceForm from '@/components/b2b/CreateWorkspaceForm';
import WorkspaceAtmosphere from '@/components/b2b/WorkspaceAtmosphere';
import WorkspaceDirectoryTheme from '@/components/b2b/WorkspaceDirectoryTheme';
import WorkspacePageHeader from '@/components/b2b/WorkspacePageHeader';
import {
  workspaceCardClass,
  workspaceContentClass,
  workspaceInsetClass,
  workspaceMutedLinkClass,
  workspaceSurfaceClass,
} from '@/components/b2b/workspaceShellClasses';

export default async function NewWorkspacePage() {
  const { userId } = await auth();
  if (!userId) redirect(authModalUrl('signin'));

  return (
    <div className={workspaceSurfaceClass}>
      <WorkspaceAtmosphere variant="directory" />
      <div className={workspaceInsetClass}>
        <div className={workspaceContentClass}>
          {/* Full-width chrome: back + theme track the main column edges */}
          <div className="ws-rise flex items-center justify-between gap-3">
            <Link href="/o" className={workspaceMutedLinkClass}>
              ← Workspaces
            </Link>
            <WorkspaceDirectoryTheme />
          </div>

          {/* Narrow form centered in the main column (sidebar-aware) */}
          <div className="mx-auto mt-8 w-full max-w-md sm:mt-10 sm:max-w-lg">
            <WorkspacePageHeader
              eyebrow="New"
              title="Create workspace"
              description="You become admin. Invite the team and run Pulse from one hub."
              showTheme={false}
            />
            <div className={`ws-rise ws-rise-delay-2 ${workspaceCardClass} p-5 sm:p-6`}>
              <CreateWorkspaceForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
