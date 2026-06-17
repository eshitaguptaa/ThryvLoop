import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getWorkspaceUserId } from '@/lib/workspace/requireAuth';
import { geminiRateLimitResponse } from '@/lib/assistant/geminiRateLimit';
import { buildAnalyticsInsight } from '@/lib/assistant/gemini';
import { formatGeminiError } from '@/lib/assistant/errors';

export const maxDuration = 30;

export async function POST(request) {
  const userId = await getWorkspaceUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limited = geminiRateLimitResponse(userId);
  if (limited) return limited;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const metrics = body?.metrics;
  if (!metrics || typeof metrics !== 'object' || Array.isArray(metrics)) {
    return NextResponse.json({ error: 'metrics object is required' }, { status: 400 });
  }

  try {
    const user = await currentUser();
    const userName =
      user?.firstName ||
      user?.username ||
      user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ||
      'there';

    const insight = await buildAnalyticsInsight({
      metrics,
      userName: typeof userName === 'string' ? userName : 'there',
      userId,
    });

    return NextResponse.json(insight);
  } catch (err) {
    const { message, status, retryAfterSec } = formatGeminiError(err);
    const headers = retryAfterSec ? { 'Retry-After': String(retryAfterSec) } : undefined;
    return NextResponse.json({ error: message }, { status, headers });
  }
}
