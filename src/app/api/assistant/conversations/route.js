import { NextResponse } from 'next/server';
import { getWorkspaceUserId } from '@/lib/workspace/requireAuth';
import { listConversations, createConversation } from '@/lib/assistant/conversations';

export async function GET() {
  const userId = await getWorkspaceUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const conversations = await listConversations(userId);
    return NextResponse.json({ conversations });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load conversations' },
      { status: 500 }
    );
  }
}

export async function POST() {
  const userId = await getWorkspaceUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const conversation = await createConversation(userId);
    return NextResponse.json({ conversation });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
