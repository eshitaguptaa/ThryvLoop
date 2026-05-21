import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import CreateWorkspaceForm from '@/components/b2b/CreateWorkspaceForm';
import {
  workspaceCardClass,
  workspaceContentClass,
  workspaceEyebrowClass,
  workspaceInsetClass,
  workspacePageTitleClass,
  workspaceSurfaceClass,
} from '@/components/b2b/workspaceShellClasses';

export default async function NewWorkspacePage() {
  const { userId } = await auth();
  if (!userId) redirect('/signin');

  return (
    <div className={workspaceSurfaceClass}>
      <div className={workspaceInsetClass}>
        <div className={workspaceContentClass}>
          <Link
            href="/o"
            className="text-sm font-medium text-gray-500 hover:text-[#5D3FD3] transition-colors inline-block"
          >
            ← Workspaces
          </Link>
          <p className={`${workspaceEyebrowClass} mt-8`}>New workspace</p>
          <h1 className={workspacePageTitleClass}>Create workspace</h1>
          <p className="text-gray-500 text-sm sm:text-base mt-2 mb-8 leading-relaxed max-w-md">
            You become the workspace admin. Team data syncs to Supabase when members join via Clerk.
          </p>
          <div className={`${workspaceCardClass} max-w-md p-6 sm:p-8`}>
            <CreateWorkspaceForm />
          </div>
        </div>
      </div>
    </div>
  );
}
