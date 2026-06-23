'use client';

import { ClerkLoading, SignedIn, SignedOut } from '@clerk/nextjs';
import RedirectToAuthModal from '@/components/auth/RedirectToAuthModal';

export default function OrgAreaShell({ children }) {
  return (
    <>
      <ClerkLoading>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-foreground text-lg">Loading…</div>
        </div>
      </ClerkLoading>
      <SignedOut>
        <RedirectToAuthModal />
      </SignedOut>
      <SignedIn>{children}</SignedIn>
    </>
  );
}
