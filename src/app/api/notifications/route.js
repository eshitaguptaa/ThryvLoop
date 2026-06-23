import { NextResponse } from 'next/server';
import { createAppNotification, listAppNotifications } from '@/lib/appNotifications';
import { getWorkspaceUserId } from '@/lib/workspace/requireAuth';

export async function GET() {
  const userId = await getWorkspaceUserId();
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized', hint: 'Sign in again to load notifications.' },
      { status: 401 }
    );
  }
  try {
    const result = await listAppNotifications(userId);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load notifications' },
      { status: 500 }
    );
  }
}

/**
 * Create an in-app notification for a user (admin / server use).
 * Requires APP_NOTIFICATIONS_ADMIN_SECRET header.
 *
 * Body: { userId, title, body?, linkUrl?, linkLabel? }
 */
export async function POST(request) {
  const secret = process.env.APP_NOTIFICATIONS_ADMIN_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: 'Notifications API is not configured.' }, { status: 503 });
  }
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (token !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { userId, title, body: messageBody, linkUrl, linkLabel } = body || {};
  if (!userId || !title) {
    return NextResponse.json({ error: 'userId and title are required' }, { status: 400 });
  }

  try {
    const notification = await createAppNotification({
      userId,
      title,
      body: messageBody,
      linkUrl,
      linkLabel,
    });
    return NextResponse.json({ notification }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create notification' },
      { status: 500 }
    );
  }
}
