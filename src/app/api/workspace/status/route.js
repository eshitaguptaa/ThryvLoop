import { NextResponse } from 'next/server';
import { ensureGoogleConnectionFresh } from '@/lib/workspace/connections';
import { getWorkspaceStatus } from '@/lib/workspace/status';
import { getWorkspaceUserId } from '@/lib/workspace/requireAuth';

export async function GET() {
  const userId = await getWorkspaceUserId();
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized', hint: 'Sign in again to load workspace status.' },
      { status: 401 }
    );
  }
  try {
    await ensureGoogleConnectionFresh(userId);
    const status = await getWorkspaceStatus(userId);
    return NextResponse.json(status);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load status' },
      { status: 500 }
    );
  }
}
