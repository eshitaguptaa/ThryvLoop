import { NextResponse } from 'next/server';
import { getMeetSessionForUser } from '@/lib/workspace/getMeetSession';
import { getWorkspaceUserId } from '@/lib/workspace/requireAuth';

/** @param {Request} _req @param {{ params: Promise<{ id: string }> }} ctx */
export async function GET(_req, ctx) {
  const userId = await getWorkspaceUserId();
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized', hint: 'Sign in again to join this meeting.' },
      { status: 401 }
    );
  }

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: 'Meeting id required' }, { status: 400 });
  }

  try {
    const session = await getMeetSessionForUser(userId, id);
    if (!session) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }
    if (!session.joinable) {
      return NextResponse.json(
        {
          error:
            session.reason === 'no_meet_link'
              ? 'No Google Meet link for this event. Sync calendar after the organizer adds Meet.'
              : 'This meeting has already ended.',
          ...session,
        },
        { status: 403 }
      );
    }
    return NextResponse.json(session);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load meeting' },
      { status: 500 }
    );
  }
}
