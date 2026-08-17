import { NextResponse } from 'next/server';
import { getWorkspaceUserId } from '@/lib/workspace/requireAuth';
import { createSupabaseAdmin } from '@/lib/supabaseAdmin';
import { rateLimitResponse } from '@/lib/security/rateLimit';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 1000;
const MAX_PAGES = 120;

function parseIso(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Paginated focus_sessions for personal analytics (heatmap / streaks).
 * Uses service role so browser RLS / PostgREST limits cannot blank the page.
 */
export async function GET(request) {
  const userId = await getWorkspaceUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limited = rateLimitResponse(userId, 'focus-sessions', { limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const startIso = parseIso(searchParams.get('start'));
  const endIso = parseIso(searchParams.get('end'));
  if (!startIso || !endIso) {
    return NextResponse.json({ error: 'start and end are required' }, { status: 400 });
  }
  if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
    return NextResponse.json({ error: 'end must be after start' }, { status: 400 });
  }

  try {
    const supabase = createSupabaseAdmin();
    /** @type {Array<{ started_at: string, completed_at: string, duration_seconds: number, phase: string }>} */
    const sessions = [];
    let from = 0;

    for (let page = 0; page < MAX_PAGES; page += 1) {
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('started_at, completed_at, duration_seconds, phase')
        .eq('user_id', userId)
        .eq('phase', 'session')
        .gte('completed_at', startIso)
        .lt('completed_at', endIso)
        .order('completed_at', { ascending: true })
        .range(from, from + PAGE_SIZE - 1);

      if (error) throw error;
      const rows = data || [];
      for (const row of rows) {
        sessions.push({
          started_at: row.started_at,
          completed_at: row.completed_at,
          duration_seconds: Math.max(0, Number(row.duration_seconds) || 0),
          phase: row.phase || 'session',
        });
      }
      if (rows.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    return NextResponse.json({ sessions });
  } catch (err) {
    console.error('focus-sessions failed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load focus sessions' },
      { status: 500 }
    );
  }
}
