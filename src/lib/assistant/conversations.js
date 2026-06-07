import { createSupabaseAdmin } from '@/lib/supabaseAdmin';

const MAX_HISTORY = 20;

export async function createConversation(userId, title = 'New chat') {
  const supabase = createSupabaseAdmin();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('assistant_conversations')
    .insert({ user_id: userId, title, updated_at: now })
    .select('id, title, created_at, updated_at')
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getConversation(userId, conversationId) {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('assistant_conversations')
    .select('id, title, created_at, updated_at')
    .eq('id', conversationId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function listConversations(userId, limit = 20) {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('assistant_conversations')
    .select('id, title, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data || [];
}

export async function loadMessages(userId, conversationId, limit = MAX_HISTORY) {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('assistant_messages')
    .select('id, role, content, metadata, created_at')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data || [];
}

export async function saveMessage(userId, conversationId, role, content, metadata = {}) {
  const supabase = createSupabaseAdmin();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('assistant_messages')
    .insert({
      conversation_id: conversationId,
      user_id: userId,
      role,
      content,
      metadata: metadata || {},
    })
    .select('id, role, content, metadata, created_at')
    .single();

  if (error) throw new Error(error.message);

  await supabase
    .from('assistant_conversations')
    .update({ updated_at: now })
    .eq('id', conversationId)
    .eq('user_id', userId);

  return data;
}

export async function autoTitleConversation(userId, conversationId, firstUserMessage) {
  const title = String(firstUserMessage || 'New chat')
    .trim()
    .slice(0, 60) || 'New chat';

  const supabase = createSupabaseAdmin();
  await supabase
    .from('assistant_conversations')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', conversationId)
    .eq('user_id', userId);

  return title;
}

/** Map DB messages to Gemini chat history (user/assistant only) */
export function toGeminiHistory(messages) {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-MAX_HISTORY)
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
}

export { MAX_HISTORY };
