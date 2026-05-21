'use client';

import { ClerkLoading, RedirectToSignIn, SignedIn, SignedOut } from '@clerk/nextjs';
import AuthenticatedAppShell from '@/components/AuthenticatedAppShell';
import { FocusProvider } from '@/contexts/FocusContext';
import { CelebrationProvider } from '@/contexts/CelebrationContext';
import CelebrationModal from '@/components/CelebrationModal';
import CelebrationToast from '@/components/CelebrationToast';
import SupabaseAuthBridge from '@/components/SupabaseAuthBridge';
import ClerkGoogleWorkspaceBridge from '@/components/workspace/ClerkGoogleWorkspaceBridge';
import UserPreferencesHydrator from '@/components/UserPreferencesHydrator';
import { TimerProvider } from '@/contexts/TimerContext';

export default function ProtectedLayout({ children }) {
  return (
    <>
      <ClerkLoading>
        <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </ClerkLoading>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        <SupabaseAuthBridge />
        <ClerkGoogleWorkspaceBridge />
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

