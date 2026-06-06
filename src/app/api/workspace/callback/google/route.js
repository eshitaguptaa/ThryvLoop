import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import {
  exchangeGoogleCode,
  verifyState,
  getStateErrorReason,
  WORKSPACE_OAUTH_COOKIE,
} from '@/lib/workspace/oauth';
import { upsertConnection } from '@/lib/workspace/connections';
import { syncUserWorkspaces } from '@/lib/workspace/sync';

function getRedirectBase(request) {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  const url = new URL(request.url);
  return url.origin;
}

function redirectWithError(base, reason) {
  const res = NextResponse.redirect(
    `${base}/home?error=${encodeURIComponent(reason)}`
  );
  res.cookies.delete(WORKSPACE_OAUTH_COOKIE);
  return res;
}

export async function GET(request) {
  const base = getRedirectBase(request);
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const cookieState = request.cookies.get(WORKSPACE_OAUTH_COOKIE)?.value;
  const oauthError = searchParams.get('error');

  if (oauthError) {
    return redirectWithError(base, oauthError);
  }

  if (!code) {
    return redirectWithError(base, 'missing_code');
  }

  if (!cookieState) {
    return redirectWithError(base, 'missing_state');
  }

  const stateReason = getStateErrorReason(cookieState);
  const parsed = verifyState(cookieState);
  if (stateReason || !parsed?.userId || parsed.provider !== 'google') {
    return redirectWithError(base, stateReason || 'invalid_state');
  }

  const { userId } = await auth();
  if (!userId || userId !== parsed.userId) {
    return redirectWithError(base, 'session_mismatch');
  }

  try {
    const tokens = await exchangeGoogleCode(code);
    let accountEmail = null;
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (profileRes.ok) {
      const profile = await profileRes.json();
      accountEmail = profile.email || null;
    }

    await upsertConnection({
      userId: parsed.userId,
      provider: 'google',
      accountEmail,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
      scopes: (tokens.scope || '').split(' ').filter(Boolean),
    });

    await syncUserWorkspaces(parsed.userId);
    const res = NextResponse.redirect(`${base}/home?connected=google`);
    res.cookies.delete(WORKSPACE_OAUTH_COOKIE);
    return res;
  } catch (err) {
    console.error('Google OAuth callback failed:', err);
    return redirectWithError(base, 'connection_failed');
  }
}
