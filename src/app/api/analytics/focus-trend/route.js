import { NextResponse } from 'next/server';
import { addDaysToDateKey } from '@/lib/dateRanges';
import { getWorkspaceUserId } from '@/lib/workspace/requireAuth';
import { createSupabaseAdmin } from '@/lib/supabaseAdmin';
import { rateLimitResponse } from '@/lib/security/rateLimit';
import { fetchFocusSecondsByDay } from '@/lib/focusSecondsByDay';
import {
  FOCUS_TREND_DAYS,
  buildFocusTrendDays,
  sanitizeTimeZone,
  splitFocusTrendWeeks,
  sumDaySeconds,
  todayKeyInTimeZone,
} from '@/lib/focusTrend';

export const dynamic = 'force-dynamic';

function parseIso(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export async function GET(request) {
  const userId = await getWorkspaceUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limited = rateLimitResponse(userId, 'focus-trend', { limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const timeZone = sanitizeTimeZone(
    searchParams.get('tz') || request.headers.get('x-user-timezone') || 'UTC'
  );
  const startIso = parseIso(searchParams.get('start'));
  const endIso = parseIso(searchParams.get('end'));
  if (!startIso || !endIso) {
    return NextResponse.json({ error: 'start and end are required' }, { status: 400 });
  }
  if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
    return NextResponse.json({ error: 'end must be after start' }, { status: 400 });
  }

  const todayKey = todayKeyInTimeZone(timeZone);
  const keys = Array.from({ length: FOCUS_TREND_DAYS }, (_, i) =>
    addDaysToDateKey(todayKey, i - (FOCUS_TREND_DAYS - 1))
  );

  try {
    const supabase = createSupabaseAdmin();
    const secondsByDay = await fetchFocusSecondsByDay(
      supabase,
      userId,
      startIso,
      endIso,
      timeZone
    );
    const days = buildFocusTrendDays(keys, secondsByDay);
    const { prior, current } = splitFocusTrendWeeks(days);

    return NextResponse.json({
      timezone: timeZone,
      todayKey,
      days,
      currentWeek: current,
      priorWeekTotalSeconds: sumDaySeconds(prior),
      currentWeekTotalSeconds: sumDaySeconds(current),
    });
  } catch (err) {
    console.error('focus-trend failed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load focus trend' },
      { status: 500 }
    );
  }
}
