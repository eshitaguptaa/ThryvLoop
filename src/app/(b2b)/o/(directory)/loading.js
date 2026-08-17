import AppPageLoader from '@/components/ui/AppPageLoader';

/**
 * Only for the workspaces directory (`/o`), not when opening a team.
 */
export default function WorkspacesDirectoryLoading() {
  return <AppPageLoader message="Loading workspace" />;
}
