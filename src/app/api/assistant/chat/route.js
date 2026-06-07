import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getWorkspaceUserId } from '@/lib/workspace/requireAuth';
import { rateLimitResponse } from '@/lib/security/rateLimit';
import { runAssistantChat } from '@/lib/assistant/gemini';
import { formatGeminiError } from '@/lib/assistant/errors';
import {
  createConversation,
  getConversation,
  loadMessages,
  saveMessage,
  autoTitleConversation,
} from '@/lib/assistant/conversations';

export async function POST(request) {
  const userId = await getWorkspaceUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limited = rateLimitResponse(userId, 'assistant-chat', { limit: 20, windowMs: 60_000 });
  if (limited) return limited;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }
  if (message.length > 4000) {
    return NextResponse.json({ error: 'Message too long' }, { status: 400 });
  }

  let conversationId = body.conversationId || null;

  try {
    if (conversationId) {
      const existing = await getConversation(userId, conversationId);
      if (!existing) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }
    } else {
      const conv = await createConversation(userId);
      conversationId = conv.id;
    }

    const priorMessages = await loadMessages(userId, conversationId);
    const isFirstMessage = priorMessages.filter((m) => m.role === 'user').length === 0;

    await saveMessage(userId, conversationId, 'user', message);

    const user = await currentUser();
    const userName = user?.firstName || user?.username || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'there';

    const { reply, metadata } = await runAssistantChat({
      messages: priorMessages,
      userMessage: message,
      userId,
      userName: typeof userName === 'string' ? userName : 'there',
    });

    const assistantMsg = await saveMessage(userId, conversationId, 'assistant', reply, metadata);

    if (isFirstMessage) {
      await autoTitleConversation(userId, conversationId, message);
    }

    return NextResponse.json({
      conversationId,
      reply,
      metadata,
      message: {
        id: assistantMsg.id,
        role: 'assistant',
        content: reply,
        metadata,
        created_at: assistantMsg.created_at,
      },
    });
  } catch (err) {
    const { message, status } = formatGeminiError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
