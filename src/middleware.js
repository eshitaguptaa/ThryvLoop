import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { B2B_WORKSPACES_ENABLED } from '@/lib/featureFlags';
import { authModalUrl } from '@/lib/authRoutes';

const WORKSPACE_OAUTH_COOKIE = 'workspace_oauth_state';

const isB2BWorkspaceRoute = createRouteMatcher(['/o(.*)']);
const isB2BApiRoute = createRouteMatcher(['/api/b2b(.*)']);

const isProtectedRoute = createRouteMatcher([
  '/home(.*)',
  '/calendar(.*)',
  '/tasks(.*)',
  '/analytics(.*)',
  '/analysis(.*)',
  '/focus(.*)',
  '/meet(.*)',
  '/settings(.*)',
  '/o(.*)',
]);

const isPublicRoute = createRouteMatcher([
  '/signup(.*)',
  '/auth(.*)',
]);

const isProtectedWorkspaceApi = createRouteMatcher([
  '/api/workspace/(.*)',
]);

const isPublicWorkspaceApi = createRouteMatcher([
  '/api/workspace/callback/google',
]);

export default clerkMiddleware(async (auth, req) => {
  const host = (req.headers.get('x-forwarded-host') || req.nextUrl.hostname || '')
    .split(',')[0]
    .trim()
    .replace(/:\d+$/, '');
  if (host === 'thryvloop.com') {
    const url = req.nextUrl.clone();
    url.hostname = 'www.thryvloop.com';
    url.protocol = 'https:';
    url.port = '';
    return NextResponse.redirect(url, 308);
  }

  const { userId } = await auth();
  const isInviteTicket = req.nextUrl.searchParams.has('__clerk_ticket');
  const isInviteReturn =
    req.nextUrl.searchParams.get('from_invite') === '1'
    || req.nextUrl.searchParams.has('invite_email');
  const isOrgInviteRequest = isB2BWorkspaceRoute(req) && (isInviteTicket || isInviteReturn);

  if (!B2B_WORKSPACES_ENABLED) {
    if (isB2BWorkspaceRoute(req)) {
      const destination = userId ? '/home' : '/';
      return NextResponse.redirect(new URL(destination, req.url));
    }
    if (isB2BApiRoute(req)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  }

  if (!userId && req.cookies.get(WORKSPACE_OAUTH_COOKIE)) {
    const res = NextResponse.next();
    res.cookies.delete(WORKSPACE_OAUTH_COOKIE);
    return res;
  }

  if (userId && req.nextUrl.pathname === '/') {
    const redirectUrl = req.nextUrl.searchParams.get('redirect_url');
    if (typeof redirectUrl === 'string' && redirectUrl.startsWith('/') && !redirectUrl.startsWith('//')) {
      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }
    if (req.nextUrl.searchParams.get('auth')) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/home', req.url));
  }

  if (req.nextUrl.pathname.startsWith('/signin')) {
    const ticket = req.nextUrl.searchParams.get('__clerk_ticket');
    const returnPath = req.nextUrl.searchParams.get('redirect_url');
    if (ticket && returnPath && returnPath.startsWith('/o/')) {
      const dest = new URL(returnPath, req.url);
      dest.searchParams.delete('__clerk_ticket');
      dest.searchParams.delete('__clerk_status');
      if (dest.searchParams.get('from_invite') !== '1') {
        dest.searchParams.set('from_invite', '1');
      }
      return NextResponse.redirect(dest);
    }
    return NextResponse.redirect(new URL(authModalUrl('signin', returnPath), req.url));
  }

  if (req.nextUrl.pathname.startsWith('/signup')) {
    const ticket = req.nextUrl.searchParams.get('__clerk_ticket');
    const redirectUrl = req.nextUrl.searchParams.get('redirect_url');
    if (ticket && redirectUrl && redirectUrl.startsWith('/o/')) {
      const dest = new URL(redirectUrl, req.url);
      dest.searchParams.delete('__clerk_ticket');
      dest.searchParams.delete('__clerk_status');
      if (dest.searchParams.get('from_invite') !== '1') {
        dest.searchParams.set('from_invite', '1');
      }
      return NextResponse.redirect(dest);
    }
    return NextResponse.redirect(new URL(authModalUrl('signup', redirectUrl), req.url));
  }

  if (!userId && !isPublicRoute(req) && isProtectedRoute(req) && !isOrgInviteRequest) {
    const returnPath = `${req.nextUrl.pathname}${req.nextUrl.search}`;
    return NextResponse.redirect(
      new URL(authModalUrl('signin', returnPath !== '/' ? returnPath : undefined), req.url),
    );
  }

  if (isProtectedWorkspaceApi(req) && !isPublicWorkspaceApi(req)) {
    await auth.protect();
  }

  if (isB2BWorkspaceRoute(req) && req.nextUrl.searchParams.has('__clerk_ticket')) {
    const url = req.nextUrl.clone();
    url.searchParams.delete('__clerk_ticket');
    url.searchParams.delete('__clerk_status');
    if (url.searchParams.get('from_invite') !== '1') {
      url.searchParams.set('from_invite', '1');
    }
    return NextResponse.redirect(url);
  }

  if (isB2BWorkspaceRoute(req) && req.nextUrl.searchParams.get('welcome') === '1') {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-thryv-welcome', '1');
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  if (isOrgInviteRequest) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-thryv-invite', '1');
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
