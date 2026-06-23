import { createSupabaseAdmin } from '@/lib/supabaseAdmin';

const MAX_LIST = 30;

/**
 * Unread + recent in-app notifications for a user.
 * @param {string} userId
 */
export async function listAppNotifications(userId) {
  const supabase = createSupabaseAdmin();
  const [listRes, countRes] = await Promise.all([
    supabase
      .from('app_notifications')
      .select('id, title, body, link_url, link_label, created_at, is_read')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(MAX_LIST),
    supabase
      .from('app_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false),
  ]);

  if (listRes.error) throw listRes.error;
  if (countRes.error) throw countRes.error;

  return {
    notifications: listRes.data || [],
    unreadCount: countRes.count ?? 0,
  };
}

/**
 * Create an in-app notification for one user (server/admin use).
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.title
 * @param {string} [params.body]
 * @param {string} [params.linkUrl]
 * @param {string} [params.linkLabel]
 */
export async function createAppNotification({ userId, title, body, linkUrl, linkLabel }) {
  if (!userId || !title?.trim()) {
    throw new Error('userId and title are required');
  }
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('app_notifications')
    .insert({
      user_id: userId,
      title: title.trim(),
      body: body?.trim() || null,
      link_url: linkUrl?.trim() || null,
      link_label: linkLabel?.trim() || null,
    })
    .select('id, title, body, link_url, link_label, created_at, is_read')
    .single();

  if (error) throw error;
  return data;
}

/** @param {string} userId @param {string} notificationId */
export async function markAppNotificationRead(userId, notificationId) {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('app_notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('id', notificationId)
    .select('id')
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}
