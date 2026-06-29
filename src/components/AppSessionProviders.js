'use client';

import { useAuth } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { FocusProvider } from '@/contexts/FocusContext';
import { TimerProvider } from '@/contexts/TimerContext';
import { CelebrationProvider } from '@/contexts/CelebrationContext';
import CelebrationModal from '@/components/CelebrationModal';
import CelebrationToast from '@/components/CelebrationToast';
import SupabaseAuthBridge from '@/components/SupabaseAuthBridge';
import UserPreferencesHydrator from '@/components/UserPreferencesHydrator';
import AuthenticatedAppShell from '@/components/AuthenticatedAppShell';
import CalendarReminderHost from '@/components/workspace/CalendarReminderHost';
import { AssistantProvider } from '@/contexts/AssistantContext';
import AuthTransitionHost from '@/components/auth/AuthTransitionHost';
import ClerkShellLoader from '@/components/auth/ClerkShellLoader';
import { useAuthTransitionActive } from '@/hooks/useAuthTransitionActive';
import { isProtectedAppRoute } from '@/lib/authTransition';

/** Routes that should not show the app sidebar / focus shell (marketing + auth). */
function isPublicAppRoute(pathname) {
  if (!pathname) return false;
  if (pathname === '/') return true;
  if (pathname.startsWith('/help')) return true;
  if (pathname.startsWith('/privacy')) return true;
  if (pathname.startsWith('/terms')) return true;
  if (pathname.startsWith('/dpa')) return true;
  if (pathname.startsWith('/billing')) return true;
  if (pathname.startsWith('/signup')) return true;
  if (pathname.startsWith('/auth')) return true;
  return false;
}

/** Session-wide providers + shell that survive navigation between route groups (e.g. Focus ↔ Workspaces). */
export default function AppSessionProviders({ children }) {
  const { isSignedIn, isLoaded } = useAuth();
  const pathname = usePathname();
  const authTransition = useAuthTransitionActive();
  const isSsoCallback = pathname?.startsWith('/auth/sso-callback') ?? false;
  const hideUnderLoader =
    authTransition &&
    !isSsoCallback &&
    (isProtectedAppRoute(pathname) || pathname === '/');
  const clerkLoadingProtected =
    !isLoaded && isProtectedAppRoute(pathname) && !authTransition;

  if (!isLoaded) {
    return (
      <>
        <UserPreferencesHydrator />
        <AuthTransitionHost />
        {clerkLoadingProtected ? <ClerkShellLoader /> : null}
        {hideUnderLoader ? null : children}
      </>
    );
  }

  if (!isSignedIn) {
    return (
      <>
        <UserPreferencesHydrator />
        <AuthTransitionHost />
        {children}
      </>
    );
  }

  const showAppShell = !isPublicAppRoute(pathname);

  return (
    <>
      <UserPreferencesHydrator />
      <AuthTransitionHost />
      <SupabaseAuthBridge />
      <CelebrationProvider>
        <CelebrationModal />
        <CelebrationToast />
        <CalendarReminderHost />
        <AssistantProvider>
          <FocusProvider>
            <TimerProvider>
              {hideUnderLoader ? null : showAppShell ? (
                <AuthenticatedAppShell>{children}</AuthenticatedAppShell>
              ) : (
                children
              )}
            </TimerProvider>
          </FocusProvider>
        </AssistantProvider>
      </CelebrationProvider>
    </>
  );
}
