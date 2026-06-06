import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import {
  buildGoogleAuthUrl,
  createOAuthState,
  WORKSPACE_OAUTH_COOKIE,
} from '@/lib/workspace/oauth';
import { rateLimitResponse } from '@/lib/security/rateLimit';

export async function GET() {
  const { userId } = await auth();
  const base = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').trim().replace(/\/$/, '');
  if (!userId) {
    return NextResponse.redirect(new URL('/signin', base));
  }

  const limited = rateLimitResponse(userId, 'workspace-connect-google', { limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const state = createOAuthState(userId, 'google');
    const url = buildGoogleAuthUrl(state);
    const res = NextResponse.redirect(url);
    res.cookies.set(WORKSPACE_OAUTH_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/',
    });
    return res;
  } catch (err) {
    const msg = encodeURIComponent(err instanceof Error ? err.message : 'Google OAuth not configured');
    return NextResponse.redirect(`${base}/home?error=${msg}`);
  }
}
