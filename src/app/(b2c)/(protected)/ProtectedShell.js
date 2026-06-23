'use client';

import { ClerkLoading, SignedIn, SignedOut } from '@clerk/nextjs';
import RedirectToAuthModal from '@/components/auth/RedirectToAuthModal';
import ClerkGoogleWorkspaceBridge from '@/components/workspace/ClerkGoogleWorkspaceBridge';

export default function ProtectedShell({ children }) {
  return (
    <>
      <ClerkLoading>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-foreground text-xl">Loading…</div>
        </div>
      </ClerkLoading>
      <SignedOut>
        <RedirectToAuthModal />
      </SignedOut>
      <SignedIn>
        <ClerkGoogleWorkspaceBridge />
        {children}
      </SignedIn>
    </>
  );
}
