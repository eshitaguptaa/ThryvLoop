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

/** Routes that should not show the app sidebar / focus shell (marketing + auth). */
function isPublicAppRoute(pathname) {
  if (!pathname) return false;
  if (pathname === '/') return true;
  if (pathname.startsWith('/signup')) return true;
  if (pathname.startsWith('/auth')) return true;
  return false;
}

/** Session-wide providers + shell that survive navigation between route groups (e.g. Focus ↔ Workspaces). */
export default function AppSessionProviders({ children }) {
  const { isSignedIn, isLoaded } = useAuth();
  const pathname = usePathname();

  if (!isLoaded) {
    return (
      <>
        <UserPreferencesHydrator />
        {children}
      </>
    );
  }

  if (!isSignedIn) {
    return (
      <>
        <UserPreferencesHydrator />
        {children}
      </>
    );
  }

  const showAppShell = !isPublicAppRoute(pathname);

  return (
    <>
      <UserPreferencesHydrator />
      <SupabaseAuthBridge />
      <CelebrationProvider>
        <CelebrationModal />
        <CelebrationToast />
        <CalendarReminderHost />
        <AssistantProvider>
          <FocusProvider>
            <TimerProvider>
              {showAppShell ? (
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
