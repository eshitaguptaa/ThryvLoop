import { NextResponse } from 'next/server';
import { getWorkspaceUserId } from '@/lib/workspace/requireAuth';
import { getConversation, loadMessages } from '@/lib/assistant/conversations';

/** @param {Request} _request @param {{ params: Promise<{ id: string }> }} context */
export async function GET(_request, context) {
  const userId = await getWorkspaceUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: 'Conversation id required' }, { status: 400 });
  }

  try {
    const conversation = await getConversation(userId, id);
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const messages = await loadMessages(userId, id, 50);
    return NextResponse.json({ conversation, messages });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load conversation' },
      { status: 500 }
    );
  }
}
