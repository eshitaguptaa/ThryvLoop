'use client';

import { ClerkLoading, RedirectToSignIn, SignedIn, SignedOut } from '@clerk/nextjs';
import AuthenticatedAppShell from '@/components/AuthenticatedAppShell';
import CelebrationModal from '@/components/CelebrationModal';
import CelebrationToast from '@/components/CelebrationToast';
import SupabaseAuthBridge from '@/components/SupabaseAuthBridge';
import UserPreferencesHydrator from '@/components/UserPreferencesHydrator';
import { CelebrationProvider } from '@/contexts/CelebrationContext';
import { FocusProvider } from '@/contexts/FocusContext';
import { TimerProvider } from '@/contexts/TimerContext';

export default function OrgAreaLayout({ children }) {
  return (
    <>
      <ClerkLoading>
        <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <div className="text-white text-lg">Loading…</div>
        </div>
      </ClerkLoading>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        <SupabaseAuthBridge />
        <UserPreferencesHydrator />
        <CelebrationProvider>
          <CelebrationModal />
          <CelebrationToast />
          <FocusProvider>
            <TimerProvider>
              <AuthenticatedAppShell>{children}</AuthenticatedAppShell>
            </TimerProvider>
          </FocusProvider>
        </CelebrationProvider>
      </SignedIn>
    </>
  );
}
