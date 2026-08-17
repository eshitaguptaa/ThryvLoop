'use client';

import Link from 'next/link';
import { useAuth, useClerk, useOrganization, useSignIn, useSignUp, useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  workspaceCardClass,
  workspaceInputClass,
  workspacePrimaryButtonClass,
  workspaceSecondaryButtonClass,
} from '@/components/b2b/workspaceShellClasses';
import { formatClerkActionError } from '@/lib/clerkErrors';
import { getOauthRedirectUrls, setPostAuthRedirect } from '@/lib/authRoutes';
import { markAuthLoginTransition, setAuthLoginProgress } from '@/lib/authTransition';
import { suspendClerkAuthRequests } from '@/lib/clerkSupabaseToken';

function JoiningMessage({ title = 'Joining workspace…', detail = 'Completing your invitation' }) {
  return (
    <div className={`min-h-[50vh] flex flex-col items-center justify-center px-6 text-center ${workspaceCardClass}`}>
      <p className="text-foreground text-lg font-semibold">{title}</p>
      <p className="text-muted-foreground text-sm mt-2 font-medium">{detail}</p>
    </div>
  );
}

function invitationOrgSlug(invitation) {
  return (
    invitation?.publicOrganizationData?.slug
    || invitation?.organization?.slug
    || invitation?.public_organization_data?.slug
    || null
  );
}

async function acceptPendingInvitationForOrg(user, orgSlug) {
  if (!user?.getOrganizationInvitations) return false;
  const result = await user.getOrganizationInvitations({ status: ['pending'], limit: 50 });
  const match = (result?.data || []).find((inv) => invitationOrgSlug(inv) === orgSlug);
  if (!match?.accept) return false;
  await match.accept();
  return true;
}

async function completeTicketSignIn(signIn, setActive, token) {
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

function clerkErrorMessage(error, fallback) {
  return formatClerkActionError(error, fallback);
}

/**
 * Processes Clerk organization invitation tickets (__clerk_ticket / __clerk_status)
 * and pending invitations after Google sign-in.
 * @see https://clerk.com/docs/guides/development/custom-flows/organizations/accept-organization-invitations
 */
export default function AcceptOrgInvitation({
  orgSlug,
  mode = 'gate',
  workspaceName = null,
}) {
  const searchParams = useSearchParams();
  const token = searchParams.get('__clerk_ticket');
  const accountStatus = searchParams.get('__clerk_status');
  const fromInvite = searchParams.get('from_invite') === '1';
  const router = useRouter();
  const { organization } = useOrganization();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const { signOut, setActive: setActiveClerk } = useClerk();
  const { isLoaded: signInLoaded, signIn, setActive: setActiveFromSignIn } = useSignIn();
  const { isLoaded: signUpLoaded, signUp, setActive: setActiveFromSignUp } = useSignUp();
  const [error, setError] = useState(null);
  const [handling, setHandling] = useState(Boolean(token) || fromInvite);
  const [joinBusy, setJoinBusy] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const attempted = useRef(false);

  useEffect(() => {
    attempted.current = false;
  }, [token, accountStatus, orgSlug]);

  const cleanUrl = `/o/${encodeURIComponent(orgSlug)}`;
  const displayName = workspaceName || 'this workspace';
  const showSignUpForm = Boolean(token) && accountStatus === 'sign_up' && authLoaded && !isSignedIn;

  const finishJoin = async (organizationId) => {
    if (organizationId && setActiveClerk) {
      try {
        await setActiveClerk({ organization: organizationId });
      } catch {
        /* session may not expose the org until refresh */
      }
    }
    router.replace(cleanUrl);
    router.refresh();
  };

  // Invitation already accepted — drop query params
  useEffect(() => {
    if (!token && !fromInvite) return;
    if (accountStatus === 'complete' || organization?.slug === orgSlug) {
      router.replace(cleanUrl);
      router.refresh();
    }
  }, [token, fromInvite, accountStatus, organization?.slug, orgSlug, cleanUrl, router]);

  // Signed-in invitee: accept a pending invitation for this workspace (ticket or Google return).
  useEffect(() => {
    if (mode === 'inline') return;
    if (
      !authLoaded
      || !userLoaded
      || !isSignedIn
      || !user
      || organization?.slug === orgSlug
      || attempted.current
    ) {
      return;
    }
    if (!token && !fromInvite && mode !== 'gate') return;

    attempted.current = true;
    setHandling(true);

    const run = async () => {
      try {
        const accepted = await acceptPendingInvitationForOrg(user, orgSlug);
        if (accepted) {
          await finishJoin(organization?.id);
          return;
        }

        if (token && (accountStatus === 'sign_in' || accountStatus === 'sign_up')) {
          if (signOut) {
            suspendClerkAuthRequests();
            await signOut();
            attempted.current = false;
            return;
          }
        }

        if (token || fromInvite) {
          setError(
            'This invite is for a different account. Sign out and open the email link with the invited Gmail.'
          );
        }
        setHandling(false);
      } catch (e) {
        setError(clerkErrorMessage(e, 'Failed to join workspace.'));
        setHandling(false);
      }
    };

    void run();
    // finishJoin is stable enough via router/cleanUrl; omit to avoid retriggering.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    authLoaded,
    userLoaded,
    isSignedIn,
    user,
    organization?.slug,
    organization?.id,
    orgSlug,
    token,
    fromInvite,
    accountStatus,
    mode,
    signOut,
  ]);

  // Existing user, signed out: consume ticket
  useEffect(() => {
    if (
      !token
      || (accountStatus && accountStatus !== 'sign_in')
      || organization?.slug === orgSlug
      || !authLoaded
      || !signInLoaded
      || !signIn
      || isSignedIn
      || attempted.current
    ) {
      return;
    }
    attempted.current = true;
    setHandling(true);

    const run = async () => {
      try {
        await completeTicketSignIn(signIn, setActiveFromSignIn, token);
        router.replace(cleanUrl);
        router.refresh();
      } catch (e) {
        setError(clerkErrorMessage(e, 'Failed to join workspace.'));
        setHandling(false);
      }
    };

    void run();
  }, [
    token,
    accountStatus,
    organization?.slug,
    orgSlug,
    authLoaded,
    signInLoaded,
    signIn,
    isSignedIn,
    setActiveFromSignIn,
    cleanUrl,
    router,
  ]);

  const handleSignUp = async (event) => {
    event.preventDefault();
    if (!signUpLoaded || !signUp || !token) return;
    setJoinBusy(true);
    setError(null);
    try {
      if (isSignedIn && signOut) {
        suspendClerkAuthRequests();
        await signOut();
      }

      await signUp.create({
        strategy: 'ticket',
        ticket: token,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password,
      });

      if (signUp.status !== 'complete') {
        throw new Error('Additional sign-up steps are required. Try opening the invite link again.');
      }

      if (setActiveFromSignUp && signUp.createdSessionId) {
        await setActiveFromSignUp({ session: signUp.createdSessionId });
      }
      router.replace(cleanUrl);
      router.refresh();
    } catch (e) {
      setError(clerkErrorMessage(e, 'Could not create your account.'));
      setJoinBusy(false);
    }
  };

  const handleGoogleJoin = async () => {
    if (!signInLoaded || !signIn) return;
    setOauthLoading(true);
    setError(null);
    try {
      if (isSignedIn && signOut) {
        suspendClerkAuthRequests();
        await signOut();
      }
      const returnPath = `${cleanUrl}?from_invite=1`;
      setPostAuthRedirect(returnPath);
      markAuthLoginTransition('Signing in with Google');
      setAuthLoginProgress({ percent: 18, message: 'Redirecting to Google' });
      const { redirectUrl, redirectUrlComplete } = getOauthRedirectUrls(returnPath);
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl,
        redirectUrlComplete,
      });
    } catch (e) {
      setError(clerkErrorMessage(e, 'Unable to continue with Google.'));
      setOauthLoading(false);
    }
  };

  if (organization?.slug === orgSlug) {
    return null;
  }

  if (!token && !fromInvite) {
    if (mode === 'gate') {
      return (
        <div className="px-2 py-12 max-w-md mx-auto text-center">
          <h1 className="text-xl font-bold text-foreground">Workspace not found</h1>
          <p className="text-muted-foreground text-sm mt-3 leading-relaxed font-medium">
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
        <p className="text-muted-foreground text-sm mt-3 font-medium">{error}</p>
        <p className="text-muted-foreground text-xs mt-4">
          Ask your admin to resend the invite, or open the link in a private window.
        </p>
        <Link href="/o" className="inline-block mt-8 text-sm font-semibold text-indigo-600 hover:text-indigo-500">
          ← Back to workspaces
        </Link>
      </div>
    );
  }

  if (showSignUpForm && !isSignedIn) {
    return (
      <div className={`mx-auto max-w-md ${workspaceCardClass} p-5 sm:p-6`}>
        <h1 className="text-lg font-semibold text-foreground">Join {displayName}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create your account with the Gmail this invite was sent to.
        </p>

        <button
          type="button"
          disabled={oauthLoading || joinBusy}
          onClick={() => void handleGoogleJoin()}
          className={`${workspaceSecondaryButtonClass} w-full mt-4`}
        >
          {oauthLoading ? 'Continuing…' : 'Continue with Google'}
        </button>

        <div className="my-4 flex items-center gap-2">
          <div className="flex-1 border-t border-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 border-t border-border" />
        </div>

        <form onSubmit={handleSignUp} className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <label htmlFor="invite-first-name" className="block text-xs font-semibold text-foreground mb-1">
                First name
              </label>
              <input
                id="invite-first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className={workspaceInputClass}
                autoComplete="given-name"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="invite-last-name" className="block text-xs font-semibold text-foreground mb-1">
                Last name
              </label>
              <input
                id="invite-last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className={workspaceInputClass}
                autoComplete="family-name"
              />
            </div>
          </div>
          <div>
            <label htmlFor="invite-password" className="block text-xs font-semibold text-foreground mb-1">
              Password
            </label>
            <input
              id="invite-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className={workspaceInputClass}
              autoComplete="new-password"
            />
          </div>
          <div id="clerk-captcha" />
          <button
            type="submit"
            disabled={joinBusy || oauthLoading}
            className={`${workspacePrimaryButtonClass} w-full`}
          >
            {joinBusy ? 'Joining…' : 'Join workspace'}
          </button>
        </form>
      </div>
    );
  }

  if (
    handling
    || (accountStatus === 'sign_in' && organization?.slug !== orgSlug)
    || (accountStatus === 'sign_up' && isSignedIn)
    || (fromInvite && !token)
  ) {
    return <JoiningMessage />;
  }

  return null;
}
