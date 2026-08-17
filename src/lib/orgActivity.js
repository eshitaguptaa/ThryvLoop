import { createSupabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Append a row to the org activity feed (service role — use from server actions / webhooks).
 * @param {{
 *   organizationId: string,
 *   actorUserId: string,
 *   eventType: string,
 *   summary: string,
 *   metadata?: Record<string, unknown>,
 * }} args
 */
export async function logOrgActivity({
  organizationId,
  actorUserId,
  eventType,
  summary,
  metadata = {},
}) {
  if (!organizationId || !actorUserId || !eventType || !summary) return;
  try {
    const supabase = createSupabaseAdmin();
    await supabase.from('organization_activity').insert({
      organization_id: organizationId,
      actor_user_id: actorUserId,
      event_type: eventType,
      summary,
      metadata,
    });
  } catch (e) {
    console.warn('[orgActivity] log failed:', e);
  }
}

/**
 * Client-side helper: insert activity with the authenticated Supabase client.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {{
 *   organizationId: string,
 *   actorUserId: string,
 *   eventType: string,
 *   summary: string,
 *   metadata?: Record<string, unknown>,
 * }} args
 */
export async function insertOrgActivityClient(supabase, {
  organizationId,
  actorUserId,
  eventType,
  summary,
  metadata = {},
}) {
  if (!supabase || !organizationId || !actorUserId) return;
  await supabase.from('organization_activity').insert({
    organization_id: organizationId,
    actor_user_id: actorUserId,
    event_type: eventType,
    summary,
    metadata,
  });
}
