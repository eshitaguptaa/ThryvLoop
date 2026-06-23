import { NextResponse } from 'next/server';
import { markAppNotificationRead } from '@/lib/appNotifications';
import { getWorkspaceUserId } from '@/lib/workspace/requireAuth';

export async function PATCH(_request, { params }) {
  const userId = await getWorkspaceUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Notification id required' }, { status: 400 });
  }

  try {
    const ok = await markAppNotificationRead(userId, id);
    if (!ok) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update notification' },
      { status: 500 }
    );
  }
}
