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

export async function GET(request) {
  const base = getRedirectBase(request);
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state');
  const cookieState = request.cookies.get(WORKSPACE_OAUTH_COOKIE)?.value;
  const state = cookieState || stateParam;
  const oauthError = searchParams.get('error');

  if (oauthError) {
    const res = NextResponse.redirect(
      `${base}/settings/integrations?error=${encodeURIComponent(oauthError)}`
    );
    res.cookies.delete(WORKSPACE_OAUTH_COOKIE);
    return res;
  }

  if (!code) {
    const res = NextResponse.redirect(`${base}/settings/integrations?error=missing_code`);
    res.cookies.delete(WORKSPACE_OAUTH_COOKIE);
    return res;
  }

  const stateReason = getStateErrorReason(state);
  const parsed = verifyState(state);
  if (stateReason || !parsed?.userId || parsed.provider !== 'google') {
    const reason = stateReason || 'invalid_state';
    const res = NextResponse.redirect(`${base}/settings/integrations?error=${reason}`);
    res.cookies.delete(WORKSPACE_OAUTH_COOKIE);
    return res;
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
    const res = NextResponse.redirect(`${base}/settings/integrations?connected=google`);
    res.cookies.delete(WORKSPACE_OAUTH_COOKIE);
    return res;
  } catch (err) {
    const msg = encodeURIComponent(err instanceof Error ? err.message : 'connection_failed');
    const res = NextResponse.redirect(`${base}/settings/integrations?error=${msg}`);
    res.cookies.delete(WORKSPACE_OAUTH_COOKIE);
    return res;
  }
}
