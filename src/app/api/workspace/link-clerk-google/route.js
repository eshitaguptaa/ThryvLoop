import { NextResponse } from 'next/server';
import { linkGoogleWorkspaceFromClerk } from '@/lib/workspace/clerkGoogle';
import { getWorkspaceUserId } from '@/lib/workspace/requireAuth';

export async function POST() {
  const userId = await getWorkspaceUserId();
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized', hint: 'Sign in again.' },
      { status: 401 }
    );
  }

  try {
    const result = await linkGoogleWorkspaceFromClerk(userId);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to link Google workspace' },
      { status: 500 }
    );
  }
}
