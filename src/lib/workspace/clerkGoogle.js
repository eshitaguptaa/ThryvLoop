import { clerkClient } from '@clerk/nextjs/server';
import { listConnections, upsertConnection } from '@/lib/workspace/connections';
import { GOOGLE_SCOPES } from '@/lib/workspace/oauth';
import { syncUserWorkspaces } from '@/lib/workspace/sync';

const CLERK_GOOGLE_PROVIDERS = ['google', 'oauth_google'];

/**
 * @param {string} userId
 * @returns {Promise<{ token: string, expiresAt?: string | null, scopes?: string[] } | null>}
 */
export async function fetchClerkGoogleAccessToken(userId) {
  const client = await clerkClient();
  for (const provider of CLERK_GOOGLE_PROVIDERS) {
    try {
      const res = await client.users.getUserOauthAccessToken(userId, provider);
      const entry = res.data?.[0];
      if (entry?.token) {
        return {
          token: entry.token,
          expiresAt: entry.expiresAt ?? null,
          scopes: entry.scopes ?? [],
        };
      }
    } catch {
      // try next provider id
    }
  }
  return null;
}

/** @param {string} accessToken */
async function googleWorkspaceScopesWork(accessToken) {
  const [calRes, gmailRes] = await Promise.all([
    fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=1', {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
    fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  ]);
  return calRes.ok && gmailRes.ok;
}

/**
 * @param {import('@clerk/backend').User} user
 */
function getGoogleExternalAccount(user) {
  return (
    user.externalAccounts?.find(
      (a) =>
        a.provider === 'google' ||
        a.provider === 'oauth_google' ||
        String(a.provider || '').includes('google')
    ) ?? null
  );
}

/**
 * Link workspace Google connection using Clerk's Google OAuth token (after sign-in with Google).
 * Requires Calendar + Gmail scopes on the Clerk Google social connection.
 *
 * @param {string} userId
 */
export async function linkGoogleWorkspaceFromClerk(userId) {
  const existing = await listConnections(userId);
  const hasGoogle = existing.some((c) => c.provider === 'google');

  if (hasGoogle) {
    const results = await syncUserWorkspaces(userId);
    return { status: 'already_connected', synced: true, results };
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const googleAccount = getGoogleExternalAccount(user);
  if (!googleAccount) {
    return { status: 'no_google_account' };
  }

  const clerkToken = await fetchClerkGoogleAccessToken(userId);
  if (!clerkToken?.token) {
    return { status: 'token_unavailable' };
  }

  const scopesOk = await googleWorkspaceScopesWork(clerkToken.token);
  if (!scopesOk) {
    return {
      status: 'needs_clerk_scopes',
      hint:
        'Add Calendar and Gmail readonly scopes to the Google provider in Clerk Dashboard, then sign in with Google again.',
    };
  }

  const expiresIn = clerkToken.expiresAt
    ? Math.max(60, Math.floor((new Date(clerkToken.expiresAt).getTime() - Date.now()) / 1000))
    : 3600;

  await upsertConnection({
    userId,
    provider: 'google',
    accountEmail:
      googleAccount.emailAddress ||
      user.emailAddresses?.[0]?.emailAddress ||
      null,
    accessToken: clerkToken.token,
    refreshToken: null,
    expiresIn,
    scopes: clerkToken.scopes?.length ? clerkToken.scopes : GOOGLE_SCOPES.split(' ').filter(Boolean),
  });

  const results = await syncUserWorkspaces(userId);
  return { status: 'linked_and_synced', synced: true, results };
}
