import { auth } from '@clerk/nextjs/server';

/** @returns {Promise<string | null>} Clerk user id for workspace API routes */
export async function getWorkspaceUserId() {
  const { userId } = await auth();
  return userId || null;
}
