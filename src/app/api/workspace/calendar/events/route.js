import { NextResponse } from 'next/server';
import { getWorkspaceUserId } from '@/lib/workspace/requireAuth';
import {
  createUserCalendarEvent,
  validateCalendarEventInput,
} from '@/lib/workspace/userCalendarEvents';

/** @param {Request} request */
export async function POST(request) {
  const userId = await getWorkspaceUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const input = validateCalendarEventInput(body);
    const { event, googleSyncError } = await createUserCalendarEvent(userId, input);
    return NextResponse.json({ event, googleSyncError: googleSyncError ?? null }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create event';
    const status = message.includes('not found') ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
