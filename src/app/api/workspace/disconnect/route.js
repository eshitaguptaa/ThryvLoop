import { NextResponse } from 'next/server';
import { deleteConnection } from '@/lib/workspace/connections';
import { getWorkspaceUserId } from '@/lib/workspace/requireAuth';

export async function POST(request) {
  const userId = await getWorkspaceUserId();
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized', hint: 'Sign in again, then retry.' },
      { status: 401 }
    );
  }
  const body = await request.json().catch(() => ({}));
  const provider = body.provider;
  if (provider !== 'google') {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
  }
  try {
    await deleteConnection(userId, provider);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Disconnect failed' },
      { status: 500 }
    );
  }
}
