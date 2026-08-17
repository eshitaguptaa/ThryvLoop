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
  if (req.nextUrl.hostname === 'thryvloop.com') {
    const url = req.nextUrl.clone();
    url.hostname = 'www.thryvloop.com';
    url.protocol = 'https:';
    return NextResponse.redirect(url, 308);
  }

  const { userId } = await auth();
  const isInviteTicket = req.nextUrl.searchParams.has('__clerk_ticket');
  const isOrgInviteRequest = isB2BWorkspaceRoute(req) && isInviteTicket;

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
    const returnPath = req.nextUrl.searchParams.get('redirect_url');
    return NextResponse.redirect(new URL(authModalUrl('signin', returnPath), req.url));
  }

  if (req.nextUrl.pathname.startsWith('/signup')) {
    const ticket = req.nextUrl.searchParams.get('__clerk_ticket');
    const status = req.nextUrl.searchParams.get('__clerk_status') || 'sign_up';
    const redirectUrl = req.nextUrl.searchParams.get('redirect_url');
    if (ticket && redirectUrl && redirectUrl.startsWith('/o/')) {
      const dest = new URL(redirectUrl, req.url);
      dest.searchParams.set('__clerk_ticket', ticket);
      dest.searchParams.set('__clerk_status', status);
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
