import { createSupabaseAdmin } from '@/lib/supabaseAdmin';
import { decryptToken, encryptToken } from '@/lib/workspace/crypto';
import { fetchClerkGoogleAccessToken } from '@/lib/workspace/clerkGoogle';
import { refreshGoogleToken } from '@/lib/workspace/oauth';
import { isAuthWorkspaceError } from '@/lib/workspace/userMessages';

/** @param {string} userId */
export async function listConnections(userId) {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('workspace_connections')
    .select('id, provider, account_email, connected_at, last_synced_at, sync_error, scopes')
    .eq('user_id', userId);
  if (error) throw error;
  return data || [];
}

/**
 * @param {string} userId
 * @param {'google'} provider
 */
export async function getValidAccessToken(userId, provider) {
  const supabase = createSupabaseAdmin();
  const { data: row, error } = await supabase
    .from('workspace_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', provider)
    .maybeSingle();
  if (error) throw error;
  if (!row) return null;

  let accessToken = decryptToken(row.access_token_encrypted);
  const expiresAt = row.token_expires_at ? new Date(row.token_expires_at).getTime() : 0;
  const needsRefresh = expiresAt && Date.now() > expiresAt - 60_000;

  if (!needsRefresh) return accessToken;

  const refreshPlain = row.refresh_token_encrypted
    ? decryptToken(row.refresh_token_encrypted)
    : null;

  if (!refreshPlain) {
    const clerkToken = await fetchClerkGoogleAccessToken(userId);
    if (clerkToken?.token) {
      await supabase
        .from('workspace_connections')
        .update({
          access_token_encrypted: encryptToken(clerkToken.token),
          token_expires_at: clerkToken.expiresAt
            ? new Date(clerkToken.expiresAt).toISOString()
            : new Date(Date.now() + 3600 * 1000).toISOString(),
          sync_error: null,
        })
        .eq('id', row.id);
      return clerkToken.token;
    }
    return accessToken;
  }

  const refreshed = await refreshGoogleToken(refreshPlain);

  accessToken = refreshed.access_token;
  const patch = {
    access_token_encrypted: encryptToken(accessToken),
    token_expires_at: refreshed.expires_in
      ? new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
      : row.token_expires_at,
    sync_error: null,
  };
  if (refreshed.refresh_token) {
    patch.refresh_token_encrypted = encryptToken(refreshed.refresh_token);
  }
  await supabase.from('workspace_connections').update(patch).eq('id', row.id);
  return accessToken;
}

/**
 * @param {object} params
 */
export async function upsertConnection({
  userId,
  provider,
  accountEmail,
  accessToken,
  refreshToken,
  expiresIn,
  scopes,
}) {
  const supabase = createSupabaseAdmin();
  const row = {
    user_id: userId,
    provider,
    account_email: accountEmail,
    access_token_encrypted: encryptToken(accessToken),
    refresh_token_encrypted: refreshToken ? encryptToken(refreshToken) : null,
    token_expires_at: expiresIn
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null,
    scopes: scopes || [],
    sync_error: null,
    connected_at: new Date().toISOString(),
  };
  const { error } = await supabase.from('workspace_connections').upsert(row, {
    onConflict: 'user_id,provider',
  });
  if (error) throw error;
}

/** @param {string} userId @param {'google'} provider */
export async function deleteConnection(userId, provider) {
  const supabase = createSupabaseAdmin();
  await supabase.from('workspace_notifications').delete().eq('user_id', userId).eq('provider', provider);
  await supabase.from('workspace_calendar_blocks').delete().eq('user_id', userId).eq('provider', provider);
  const { error } = await supabase
    .from('workspace_connections')
    .delete()
    .eq('user_id', userId)
    .eq('provider', provider);
  if (error) throw error;
}

/** @param {string} userId @param {'google'} provider @param {string|null} message */
export async function setSyncError(userId, provider, message) {
  const supabase = createSupabaseAdmin();
  const sync_error =
    message && isAuthWorkspaceError(message)
      ? 'Google connection expired. Disconnect and connect again.'
      : message;
  await supabase
    .from('workspace_connections')
    .update({ sync_error, last_synced_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('provider', provider);
}

/** @param {string} userId @param {'google'} provider */
export async function markSynced(userId, provider) {
  const supabase = createSupabaseAdmin();
  await supabase
    .from('workspace_connections')
    .update({ sync_error: null, last_synced_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('provider', provider);
}
