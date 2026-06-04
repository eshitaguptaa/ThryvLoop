'use client';

import { ClerkLoading, RedirectToSignIn, SignedIn, SignedOut } from '@clerk/nextjs';
import ClerkGoogleWorkspaceBridge from '@/components/workspace/ClerkGoogleWorkspaceBridge';

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
        <ClerkGoogleWorkspaceBridge />
        {children}
      </SignedIn>
    </>
  );
}
