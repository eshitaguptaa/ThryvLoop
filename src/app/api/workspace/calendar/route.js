import { NextResponse } from 'next/server';
import { getWorkspaceCalendarEvents } from '@/lib/workspace/calendar';
import { getWorkspaceUserId } from '@/lib/workspace/requireAuth';

/** @param {Request} request */
export async function GET(request) {
  const userId = await getWorkspaceUserId();
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized', hint: 'Sign in again to load your calendar.' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const startParam = searchParams.get('start');
  const endParam = searchParams.get('end');

  if (!startParam || !endParam) {
    return NextResponse.json({ error: 'start and end query params are required' }, { status: 400 });
  }

  const rangeStart = new Date(startParam);
  const rangeEnd = new Date(endParam);
  if (Number.isNaN(rangeStart.getTime()) || Number.isNaN(rangeEnd.getTime())) {
    return NextResponse.json({ error: 'Invalid start or end date' }, { status: 400 });
  }

  const maxSpanMs = 90 * 24 * 60 * 60 * 1000;
  if (rangeEnd.getTime() - rangeStart.getTime() > maxSpanMs) {
    return NextResponse.json({ error: 'Date range too large (max 90 days)' }, { status: 400 });
  }

  try {
    const data = await getWorkspaceCalendarEvents(userId, rangeStart, rangeEnd);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load calendar' },
      { status: 500 }
    );
  }
}
