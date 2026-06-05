import { NextResponse } from 'next/server';
import { getWorkspaceUserId } from '@/lib/workspace/requireAuth';
import {
  deleteUserCalendarEvent,
  updateUserCalendarEvent,
  validateCalendarEventInput,
} from '@/lib/workspace/userCalendarEvents';

/** @param {Request} request @param {{ params: Promise<{ id: string }> }} context */
export async function PATCH(request, context) {
  const userId = await getWorkspaceUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: 'Event id is required' }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const input = validateCalendarEventInput(body);
    const { event, googleSyncError } = await updateUserCalendarEvent(userId, id, input);
    return NextResponse.json({ event, googleSyncError: googleSyncError ?? null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update event';
    const status = message.includes('not found') ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

/** @param {Request} _request @param {{ params: Promise<{ id: string }> }} context */
export async function DELETE(_request, context) {
  const userId = await getWorkspaceUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: 'Event id is required' }, { status: 400 });
  }

  try {
    const { googleSyncError } = await deleteUserCalendarEvent(userId, id);
    return NextResponse.json({ ok: true, googleSyncError: googleSyncError ?? null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete event';
    const status = message.includes('not found') ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
