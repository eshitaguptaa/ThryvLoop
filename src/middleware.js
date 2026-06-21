import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { B2B_WORKSPACES_ENABLED } from '@/lib/featureFlags';

const WORKSPACE_OAUTH_COOKIE = 'workspace_oauth_state';

const isB2BWorkspaceRoute = createRouteMatcher(['/o(.*)']);

const isProtectedRoute = createRouteMatcher([
  '/home(.*)',
  '/calendar(.*)',
  '/tasks(.*)',
  '/analysis(.*)',
  '/focus(.*)',
  '/meet(.*)',
  '/settings(.*)',
  '/o(.*)',
]);

const isPublicRoute = createRouteMatcher([
  '/signin(.*)',
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
  const { userId } = await auth();

  if (!B2B_WORKSPACES_ENABLED) {
    if (isB2BWorkspaceRoute(req)) {
      const destination = userId ? '/home' : '/';
      return NextResponse.redirect(new URL(destination, req.url));
    }
  }

  if (!userId && req.cookies.get(WORKSPACE_OAUTH_COOKIE)) {
    const res = NextResponse.next();
    res.cookies.delete(WORKSPACE_OAUTH_COOKIE);
    return res;
  }

  if (userId && req.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/home', req.url));
  }

  if (isProtectedWorkspaceApi(req) && !isPublicWorkspaceApi(req)) {
    await auth.protect();
  }

  if (!isPublicRoute(req) && isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
