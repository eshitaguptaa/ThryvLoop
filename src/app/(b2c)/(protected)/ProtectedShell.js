'use client';

import { ClerkLoading, RedirectToSignIn, SignedIn, SignedOut } from '@clerk/nextjs';
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
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        <ClerkGoogleWorkspaceBridge />
        {children}
      </SignedIn>
    </>
  );
}
