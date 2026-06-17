/**
 * B2B team workspace features (org routes, shared tasks, org analytics).
 *
 * Set NEXT_PUBLIC_ENABLE_B2B_WORKSPACES=true to expose B2B workspace UI and routes.
 * Defaults to false for the B2C launch.
 */
export const B2B_WORKSPACES_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_B2B_WORKSPACES === 'true';

/** Guard server actions and API handlers that require B2B workspaces. */
export function assertB2BWorkspacesEnabled() {
  if (!B2B_WORKSPACES_ENABLED) {
    throw new Error('B2B workspace features are not enabled.');
  }
}
