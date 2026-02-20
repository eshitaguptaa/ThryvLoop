import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/home(.*)',
  '/tasks(.*)',
  '/analysis(.*)',
  '/focus(.*)',
]);

const isPublicRoute = createRouteMatcher([
  '/signin(.*)',
  '/signup(.*)',
  '/auth(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req) && isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
