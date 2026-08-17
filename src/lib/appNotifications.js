import { createSupabaseAdmin } from '@/lib/supabaseAdmin';

const MAX_LIST = 30;

/** How long product / team notices stay in the home bell. */
export const APP_NOTIFICATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** How long those notices also appear under Upcoming & Alerts. */
export const APP_NOTIFICATION_ALERTS_TTL_MS = 24 * 60 * 60 * 1000;

export function appNotificationVisibleAfter() {
  return new Date(Date.now() - APP_NOTIFICATION_TTL_MS).toISOString();
}

export function isAppNotificationActive(createdAt, nowMs = Date.now()) {
  if (!createdAt) return false;
  const t = new Date(createdAt).getTime();
  if (Number.isNaN(t)) return false;
  return nowMs - t <= APP_NOTIFICATION_TTL_MS;
}

/** Shorter window for the home Upcoming & Alerts strip. */
export function isAppNotificationInAlerts(createdAt, nowMs = Date.now()) {
  if (!createdAt) return false;
  const t = new Date(createdAt).getTime();
  if (Number.isNaN(t)) return false;
  return nowMs - t <= APP_NOTIFICATION_ALERTS_TTL_MS;
}

/**
 * Unread + recent in-app notifications for a user (within TTL).
 * @param {string} userId
 */
export async function listAppNotifications(userId) {
  const supabase = createSupabaseAdmin();
  const since = appNotificationVisibleAfter();
  const [listRes, countRes] = await Promise.all([
    supabase
      .from('app_notifications')
      .select('id, title, body, link_url, link_label, created_at, is_read')
      .eq('user_id', userId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(MAX_LIST),
    supabase
      .from('app_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .gte('created_at', since),
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

/**
 * Fan-out the same notification to many users (server/admin use).
 * @param {object} params
 * @param {string[]} params.userIds
 * @param {string} params.title
 * @param {string} [params.body]
 * @param {string} [params.linkUrl]
 * @param {string} [params.linkLabel]
 * @returns {Promise<number>} inserted row count
 */
export async function createAppNotificationsMany({
  userIds,
  title,
  body,
  linkUrl,
  linkLabel,
}) {
  if (!title?.trim()) {
    throw new Error('title is required');
  }
  const unique = [...new Set((userIds || []).filter(Boolean))];
  if (!unique.length) return 0;

  const row = {
    title: title.trim(),
    body: body?.trim() || null,
    link_url: linkUrl?.trim() || null,
    link_label: linkLabel?.trim() || null,
  };
  const rows = unique.map((userId) => ({ ...row, user_id: userId }));

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase.from('app_notifications').insert(rows).select('id');
  if (error) throw error;
  return data?.length ?? 0;
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
