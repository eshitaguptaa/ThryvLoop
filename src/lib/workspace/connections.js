import { createSupabaseAdmin } from '@/lib/supabaseAdmin';
import { decryptToken, encryptToken } from '@/lib/workspace/crypto';
import { fetchClerkGoogleAccessToken } from '@/lib/workspace/clerkGoogle';
import { refreshGoogleToken } from '@/lib/workspace/oauth';
import { isAuthWorkspaceError } from '@/lib/workspace/userMessages';

const REFRESH_BUFFER_MS = 5 * 60 * 1000;

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
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} rowId
 * @param {Record<string, unknown>} patch
 */
async function persistTokenPatch(supabase, rowId, patch) {
  await supabase
    .from('workspace_connections')
    .update({ ...patch, sync_error: null })
    .eq('id', rowId);
}

/**
 * Refresh via Clerk OAuth token for older connections that stored no refresh token.
 * New Calendar/Gmail links use in-app OAuth and always store a refresh token.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {{ id: string, user_id: string, scopes?: string[] | null }} row
 */
async function refreshAccessTokenFromClerk(supabase, row) {
  const clerkToken = await fetchClerkGoogleAccessToken(row.user_id);
  if (!clerkToken?.token) return null;

  const patch = {
    access_token_encrypted: encryptToken(clerkToken.token),
    token_expires_at: clerkToken.expiresAt
      ? new Date(clerkToken.expiresAt).toISOString()
      : new Date(Date.now() + 3600 * 1000).toISOString(),
  };

  if (clerkToken.scopes?.length) {
    const merged = [...new Set([...(row.scopes || []), ...clerkToken.scopes])];
    patch.scopes = merged;
  }

  await persistTokenPatch(supabase, row.id, patch);
  return clerkToken.token;
}

/**
 * @param {string} userId
 * @param {'google'} provider
 * @returns {Promise<string | null>}
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

  const expiresAt = row.token_expires_at ? new Date(row.token_expires_at).getTime() : 0;
  const needsRefresh = !expiresAt || Date.now() > expiresAt - REFRESH_BUFFER_MS;

  if (!needsRefresh) {
    return decryptToken(row.access_token_encrypted);
  }

  const refreshPlain = row.refresh_token_encrypted
    ? decryptToken(row.refresh_token_encrypted)
    : null;

  if (refreshPlain) {
    try {
      const refreshed = await refreshGoogleToken(refreshPlain);
      const patch = {
        access_token_encrypted: encryptToken(refreshed.access_token),
        token_expires_at: refreshed.expires_in
          ? new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
          : row.token_expires_at,
      };
      if (refreshed.refresh_token) {
        patch.refresh_token_encrypted = encryptToken(refreshed.refresh_token);
      }
      await persistTokenPatch(supabase, row.id, patch);
      return refreshed.access_token;
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (!isAuthWorkspaceError(message)) {
        throw err;
      }
      // Refresh token revoked/expired — fall through to Clerk before failing.
    }
  }

  const clerkToken = await refreshAccessTokenFromClerk(supabase, row);
  if (clerkToken) return clerkToken;

  // Do not reuse a known-expired access token (causes repeated auth errors).
  return null;
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

  const { data: existing } = await supabase
    .from('workspace_connections')
    .select('refresh_token_encrypted, scopes')
    .eq('user_id', userId)
    .eq('provider', provider)
    .maybeSingle();

  const mergedScopes = [
    ...new Set([...(existing?.scopes || []), ...(scopes || [])]),
  ];

  const row = {
    user_id: userId,
    provider,
    account_email: accountEmail,
    access_token_encrypted: encryptToken(accessToken),
    refresh_token_encrypted: refreshToken
      ? encryptToken(refreshToken)
      : existing?.refresh_token_encrypted ?? null,
    token_expires_at: expiresIn
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null,
    scopes: mergedScopes,
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
      ? 'Google session needs a quick resync. Open Integrations and tap Resync Google.'
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

/**
 * Proactively refresh tokens and clear stale auth errors when possible.
 * @param {string} userId
 */
export async function ensureGoogleConnectionFresh(userId) {
  const token = await getValidAccessToken(userId, 'google');
  return Boolean(token);
}
