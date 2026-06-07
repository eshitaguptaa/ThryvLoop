import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getWorkspaceUserId } from '@/lib/workspace/requireAuth';
import { rateLimitResponse } from '@/lib/security/rateLimit';
import { buildMorningBriefing } from '@/lib/assistant/gemini';

export async function GET() {
  const userId = await getWorkspaceUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limited = rateLimitResponse(userId, 'assistant-briefing', { limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const user = await currentUser();
    const userName = user?.firstName || user?.username || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'there';

    const briefing = await buildMorningBriefing(userId, userName);
    return NextResponse.json(briefing);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to build briefing' },
      { status: 500 }
    );
  }
}
