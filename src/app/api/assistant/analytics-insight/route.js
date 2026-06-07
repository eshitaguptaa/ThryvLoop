import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getWorkspaceUserId } from '@/lib/workspace/requireAuth';
import { rateLimitResponse } from '@/lib/security/rateLimit';
import { buildAnalyticsInsight } from '@/lib/assistant/gemini';
import { formatGeminiError } from '@/lib/assistant/errors';

export async function POST(request) {
  const userId = await getWorkspaceUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limited = rateLimitResponse(userId, 'assistant-analytics-insight', {
    limit: 8,
    windowMs: 60_000,
  });
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
    });

    return NextResponse.json(insight);
  } catch (err) {
    const { message, status } = formatGeminiError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
