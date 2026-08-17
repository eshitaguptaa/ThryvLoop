/**
 * B2B team workspace features (org routes, shared tasks, org analytics).
 * Workspaces stay available in production even if an old Vercel env still
 * has NEXT_PUBLIC_ENABLE_B2B_WORKSPACES=false from the B2C launch checklist.
 */
export const B2B_WORKSPACES_ENABLED = true;

/** Guard server actions and API handlers that require B2B workspaces. */
export function assertB2BWorkspacesEnabled() {
  if (!B2B_WORKSPACES_ENABLED) {
    throw new Error('B2B workspace features are not enabled.');
  }
}
