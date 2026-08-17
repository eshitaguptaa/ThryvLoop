import { clerkClient } from '@clerk/nextjs/server';

const CLERK_GOOGLE_PROVIDERS = ['google', 'oauth_google'];

/**
 * Clerk Google tokens are for sign-in only (profile/email). Calendar and Gmail
 * use the separate in-app OAuth flow. This helper remains for older connections
 * that were linked from Clerk before that split.
 *
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
