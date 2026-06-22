import { clerkClient } from '@clerk/nextjs/server';
import { upsertConnection } from '@/lib/workspace/connections';
import { buildScopesFromProbe } from '@/lib/workspace/googleAccess';
import { isGoogleScopeDeniedBody } from '@/lib/workspace/googleApiErrors';
import { GOOGLE_SCOPES } from '@/lib/workspace/oauth';
import { syncUserWorkspaces } from '@/lib/workspace/sync';

const CLERK_GOOGLE_PROVIDERS = ['google', 'oauth_google'];

/**
 * @returns {Promise<{ token: string, expiresAt?: string | null, scopes?: string[] } | null>}
 */
export async function fetchClerkGoogleAccessToken(userId) {
  const client = await clerkClient();

  for (const provider of CLERK_GOOGLE_PROVIDERS) {
    try {
      const tokenRes = await client.users.getUserOauthAccessToken(userId, provider);
      const tokens = tokenRes?.data || [];
      const entry =
        tokens.find((t) => t.token && CLERK_GOOGLE_PROVIDERS.includes(t.provider)) ||
        tokens.find((t) => t.token);
      if (entry?.token) {
        return {
          token: entry.token,
          expiresAt: entry.expiresAt ?? null,
          scopes: entry.scopes ?? [],
        };
      }
    } catch {
      // Try next provider slug.
    }
  }

  return null;
}

/** @param {string} accessToken */
export async function probeGoogleServiceAccess(accessToken) {
  const [calRes, gmailRes] = await Promise.all([
    fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=1', {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
    fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  ]);

  const calJson = calRes.ok ? null : await calRes.json().catch(() => ({}));
  const gmailJson = gmailRes.ok ? null : await gmailRes.json().catch(() => ({}));

  return {
    calendarGranted: calRes.ok || !isGoogleScopeDeniedBody(calJson),
    gmailGranted: gmailRes.ok || !isGoogleScopeDeniedBody(gmailJson),
  };
}

function getGoogleExternalAccount(user) {
  return (
    user?.externalAccounts?.find(
      (a) =>
        a.provider === 'google' ||
        a.provider === 'oauth_google' ||
        String(a.provider || '').includes('google')
    ) ?? null
  );
}

/**
 * Link workspace Google connection using Clerk's Google OAuth token (after sign-in with Google).
 *
 * @param {string} userId
 */
export async function linkGoogleWorkspaceFromClerk(userId) {
  const { listConnections } = await import('@/lib/workspace/connections');
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

  const probed = await probeGoogleServiceAccess(clerkToken.token);
  const scopes =
    clerkToken.scopes?.length > 0
      ? clerkToken.scopes
      : buildScopesFromProbe(probed);

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
    scopes: scopes.length ? scopes : GOOGLE_SCOPES.split(' ').filter(Boolean),
  });

  const results = await syncUserWorkspaces(userId);
  return {
    status: 'linked_and_synced',
    synced: true,
    results,
    calendarGranted: probed.calendarGranted,
    gmailGranted: probed.gmailGranted,
  };
}
