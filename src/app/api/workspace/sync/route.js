import { NextResponse } from 'next/server';
import { syncUserWorkspaces } from '@/lib/workspace/sync';
import { getWorkspaceStatus } from '@/lib/workspace/status';
import { getWorkspaceUserId } from '@/lib/workspace/requireAuth';
import { rateLimitResponse } from '@/lib/security/rateLimit';

export const maxDuration = 60;

export async function POST() {
  const userId = await getWorkspaceUserId();
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized', hint: 'Sign in again, then retry Sync now.' },
      { status: 401 }
    );
  }

  const limited = rateLimitResponse(userId, 'workspace-sync', { limit: 6, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const results = await syncUserWorkspaces(userId);
    const status = await getWorkspaceStatus(userId);
    return NextResponse.json({ results, status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Sync failed' },
      { status: 500 }
    );
  }
}
