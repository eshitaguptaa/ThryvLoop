'use client';

import Link from 'next/link';
import { useAuth, useClerk, useOrganization, useSignIn } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

function JoiningMessage() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-6 text-center rounded-2xl border border-gray-100 bg-white shadow-sm">
      <p className="text-gray-900 text-lg font-semibold">Joining workspace…</p>
      <p className="text-gray-500 text-sm mt-2 font-medium">Completing your invitation</p>
    </div>
  );
}

async function acceptSignInTicket(signIn, setActive, token) {
  if (!signIn?.create) {
    throw new Error('Clerk sign-in is not ready. Refresh and try again.');
  }

  await signIn.create({ strategy: 'ticket', ticket: token });

  if (signIn.status !== 'complete') {
    throw new Error('Additional sign-in steps are required. Try opening the invite link again.');
  }

  if (setActive && signIn.createdSessionId) {
    await setActive({ session: signIn.createdSessionId });
  }
}

/**
 * Processes Clerk organization invitation tickets (__clerk_ticket / __clerk_status).
 * @see https://clerk.com/docs/guides/development/custom-flows/organizations/accept-organization-invitations
 */
export default function AcceptOrgInvitation({ orgSlug, mode = 'gate' }) {
  const searchParams = useSearchParams();
  const token = searchParams.get('__clerk_ticket');
  const accountStatus = searchParams.get('__clerk_status');
  const router = useRouter();
  const { organization } = useOrganization();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const { isLoaded: signInLoaded, signIn, setActive: setActiveFromSignIn } = useSignIn();
  const [error, setError] = useState(null);
  const [handling, setHandling] = useState(Boolean(token));
  const attempted = useRef(false);

  useEffect(() => {
    attempted.current = false;
  }, [token]);

  const cleanUrl = `/o/${encodeURIComponent(orgSlug)}`;

  // Invitation already accepted — drop query params
  useEffect(() => {
    if (!token) return;
    if (accountStatus === 'complete' || organization?.slug === orgSlug) {
      router.replace(cleanUrl);
      router.refresh();
    }
  }, [token, accountStatus, organization?.slug, orgSlug, cleanUrl, router]);

  // Existing user: consume ticket (classic Clerk API: signIn.create + ticket strategy)
  useEffect(() => {
    if (
      !token
      || accountStatus !== 'sign_in'
      || organization
      || !authLoaded
      || !signInLoaded
      || !signIn
      || attempted.current
    ) {
      return;
    }
    attempted.current = true;

    const run = async () => {
      try {
        // Ticket sign-in conflicts with an existing session (common after OAuth on /signin).
        if (isSignedIn && signOut) {
          await signOut();
        }

        await acceptSignInTicket(signIn, setActiveFromSignIn, token);
        router.replace(cleanUrl);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to join workspace.');
        setHandling(false);
      }
    };

    void run();
  }, [
    token,
    accountStatus,
    organization,
    authLoaded,
    signInLoaded,
    signIn,
    isSignedIn,
    signOut,
    setActiveFromSignIn,
    orgSlug,
    cleanUrl,
    router,
  ]);

  // New user on workspace URL: send to sign-up with ticket preserved
  useEffect(() => {
    if (!token || accountStatus !== 'sign_up' || organization) return;

    const params = new URLSearchParams({
      __clerk_ticket: token,
      __clerk_status: 'sign_up',
      redirect_url: `${window.location.origin}${cleanUrl}`,
    });
    router.replace(`/signup?${params.toString()}`);
  }, [token, accountStatus, organization, cleanUrl, router]);

  if (!token) {
    if (mode === 'gate') {
      return (
        <div className="px-2 py-12 max-w-md mx-auto text-center">
          <h1 className="text-xl font-bold text-gray-900">Workspace not found</h1>
          <p className="text-gray-500 text-sm mt-3 leading-relaxed font-medium">
            You don&apos;t have access to this workspace, or the invite link has expired.
          </p>
          <Link href="/o" className="inline-block mt-8 text-sm font-semibold text-indigo-600 hover:text-indigo-500">
            ← Back to workspaces
          </Link>
        </div>
      );
    }
    return null;
  }

  if (error) {
    return (
      <div className="px-2 py-12 max-w-md mx-auto text-center">
        <h1 className="text-xl font-bold text-red-700">Could not join workspace</h1>
        <p className="text-gray-600 text-sm mt-3 font-medium">{error}</p>
        <p className="text-gray-400 text-xs mt-4">
          Ask your admin to resend the invite, or open the link in a private window.
        </p>
        <Link href="/o" className="inline-block mt-8 text-sm font-semibold text-indigo-600 hover:text-indigo-500">
          ← Back to workspaces
        </Link>
      </div>
    );
  }

  if (handling || (accountStatus === 'sign_in' && !organization) || accountStatus === 'sign_up') {
    return <JoiningMessage />;
  }

  return null;
}
