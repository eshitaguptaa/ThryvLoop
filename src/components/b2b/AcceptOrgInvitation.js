'use client';

import Link from 'next/link';
import { useAuth, useClerk, useOrganization, useSignIn, useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  workspaceCardClass,
  workspacePrimaryButtonClass,
  workspaceSecondaryButtonClass,
} from '@/components/b2b/workspaceShellClasses';
import { formatClerkActionError } from '@/lib/clerkErrors';
import { authModalUrl, getOauthRedirectUrls, setPostAuthRedirect } from '@/lib/authRoutes';
import { markAuthLoginTransition, setAuthLoginProgress } from '@/lib/authTransition';
import { suspendClerkAuthRequests } from '@/lib/clerkSupabaseToken';
import { acceptWorkspaceInvitation } from '@/app/(b2b)/o/actions';

function JoiningMessage({ title = 'Joining workspace…', detail = 'Completing your invitation' }) {
  return (
    <div className={`min-h-[50vh] flex flex-col items-center justify-center px-6 text-center ${workspaceCardClass}`}>
      <p className="text-foreground text-lg font-semibold">{title}</p>
      <p className="text-muted-foreground text-sm mt-2 font-medium">{detail}</p>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function JoinInviteCard({ displayName, oauthLoading, onGoogle, signInHref }) {
  return (
    <div className={`mx-auto max-w-md ${workspaceCardClass} p-6 sm:p-8 text-center`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5D3FD3]">
        You&apos;re invited
      </p>
      <h1 className="mt-2 text-2xl font-bold text-foreground tracking-tight">
        Join {displayName}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
        Continue with the Gmail this invite was sent to. You&apos;ll land in the workspace right away.
      </p>
      <button
        type="button"
        disabled={oauthLoading}
        onClick={onGoogle}
        className={`${workspaceSecondaryButtonClass} w-full mt-6 h-11`}
      >
        {oauthLoading ? (
          'Continuing…'
        ) : (
          <>
            <GoogleMark />
            Continue with Google
          </>
        )}
      </button>
      <Link
        href={signInHref}
        className="mt-4 inline-block text-sm font-semibold text-[#5D3FD3] hover:underline"
      >
        Sign in with email instead
      </Link>
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
  const invitations = result?.data || [];
  const match =
    invitations.find((inv) => invitationOrgSlug(inv) === orgSlug)
    || (invitations.length === 1 ? invitations[0] : null);
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
  const [error, setError] = useState(null);
  const [oauthLoading, setOauthLoading] = useState(false);
  const attempted = useRef(false);

  useEffect(() => {
    attempted.current = false;
  }, [token, accountStatus, orgSlug]);

  const cleanUrl = `/o/${encodeURIComponent(orgSlug)}`;
  const displayName = workspaceName || 'this workspace';

  const finishJoin = async (organizationId) => {
    if (organizationId && setActiveClerk) {
      try {
        await setActiveClerk({ organization: organizationId });
      } catch {
        /* session may not expose the org until refresh */
      }
    }
    try {
      await user?.reload?.();
    } catch {
      /* layout refresh is enough */
    }
    router.replace(cleanUrl);
    router.refresh();
  };

  // Already in this workspace — drop invite query params
  useEffect(() => {
    if (!token && !fromInvite) return;
    if (organization?.slug === orgSlug) {
      router.replace(cleanUrl);
      router.refresh();
    }
  }, [token, fromInvite, organization?.slug, orgSlug, cleanUrl, router]);

  // Signed-in invitee: join even when Clerk marks the ticket "complete"
  // without accepting the organization invitation.
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
    const hasInviteIntent = Boolean(
      token
      || fromInvite
      || accountStatus === 'complete'
      || accountStatus === 'sign_in'
      || accountStatus === 'sign_up'
    );
    if (!hasInviteIntent) return;

    attempted.current = true;

    const run = async () => {
      try {
        const acceptedClient = await acceptPendingInvitationForOrg(user, orgSlug);
        if (acceptedClient) {
          await finishJoin(organization?.id);
          return;
        }

        const acceptedServer = await acceptWorkspaceInvitation(orgSlug);
        if (acceptedServer?.success) {
          await finishJoin(acceptedServer.organizationId);
          return;
        }

        if (token && accountStatus === 'sign_in') {
          if (signOut) {
            suspendClerkAuthRequests();
            await signOut();
            attempted.current = false;
            return;
          }
        }

        setError(
          acceptedServer?.error
          || 'This invite is for a different account. Sign out and open the email link with the invited Gmail.'
        );
      } catch (e) {
        setError(clerkErrorMessage(e, 'Failed to join workspace.'));
      }
    };

    void run();
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

    const run = async () => {
      try {
        await completeTicketSignIn(signIn, setActiveFromSignIn, token);
        const joined = await acceptWorkspaceInvitation(orgSlug);
        if (joined?.success) {
          await finishJoin(joined.organizationId);
          return;
        }
        router.replace(`${cleanUrl}?from_invite=1`);
        router.refresh();
      } catch (e) {
        setError(clerkErrorMessage(e, 'Failed to join workspace.'));
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

  if (!authLoaded) {
    return <JoiningMessage title="Just a moment" detail="Opening your invite" />;
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
      <div className={`mx-auto max-w-md ${workspaceCardClass} p-6 sm:p-8 text-center`}>
        <h1 className="text-xl font-bold text-foreground">Couldn&apos;t join</h1>
        <p className="text-muted-foreground text-sm mt-3 font-medium">{error}</p>
        <button
          type="button"
          className={`${workspacePrimaryButtonClass} mt-6`}
          onClick={() => void handleGoogleJoin()}
          disabled={oauthLoading}
        >
          {oauthLoading ? 'Continuing…' : 'Try Google again'}
        </button>
        <Link href="/o" className="block mt-4 text-sm font-semibold text-muted-foreground hover:text-foreground">
          Back to workspaces
        </Link>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <JoinInviteCard
        displayName={displayName}
        oauthLoading={oauthLoading}
        onGoogle={() => void handleGoogleJoin()}
        signInHref={authModalUrl('signin', `${cleanUrl}?from_invite=1`)}
      />
    );
  }

  return <JoiningMessage title="Joining workspace…" detail={`Adding you to ${displayName}`} />;
}
