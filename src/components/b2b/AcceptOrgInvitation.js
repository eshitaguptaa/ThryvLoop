'use client';

import { useAuth, useClerk, useOrganization, useSignIn, useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, useCallback } from 'react';
import InviteJoinModal from '@/components/b2b/InviteJoinModal';
import { formatClerkActionError } from '@/lib/clerkErrors';
import { getOauthRedirectUrls, setPostAuthRedirect } from '@/lib/authRoutes';
import { markAuthDestinationReady } from '@/lib/authTransition';
import { suspendClerkAuthRequests } from '@/lib/clerkSupabaseToken';
import { acceptWorkspaceInvitation } from '@/app/(b2b)/o/actions';
import {
  clearInviteJoin,
  clearInviteJustJoined,
  consumeInviteWrongEmail,
  markInviteJoinResume,
  markInviteJustJoined,
  markInviteWrongEmail,
  peekInviteJustJoined,
  rememberInviteJoin,
  userHasInviteEmail,
} from '@/lib/inviteJoin';

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

/**
 * Invite join overlay: Google (creates an account if needed), email match,
 * auto-join, then congratulations. No extra Accept click on Workspaces.
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
  const invitedEmail = (searchParams.get('invite_email') || '').trim().toLowerCase();
  const router = useRouter();
  const { organization } = useOrganization();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const { signOut, setActive: setActiveClerk } = useClerk();
  const { isLoaded: signInLoaded, signIn, setActive: setActiveFromSignIn } = useSignIn();
  const [phase, setPhase] = useState('prompt');
  const [oauthLoading, setOauthLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [unavailableReason, setUnavailableReason] = useState('');
  const attempted = useRef(false);

  const cleanUrl = `/o/${encodeURIComponent(orgSlug)}`;
  const displayName = workspaceName || 'this workspace';
  const hasInviteIntent = Boolean(
    token
    || fromInvite
    || invitedEmail
    || accountStatus === 'complete'
    || accountStatus === 'sign_in'
    || accountStatus === 'sign_up',
  );
  const shouldAutoJoin = mode === 'gate' || hasInviteIntent;
  const invitePath = invitedEmail
    ? `${cleanUrl}?from_invite=1&invite_email=${encodeURIComponent(invitedEmail)}`
    : `${cleanUrl}?from_invite=1`;
  const alreadyInWorkspace = organization?.slug === orgSlug;

  useEffect(() => {
    rememberInviteJoin({
      slug: orgSlug,
      email: invitedEmail,
      name: displayName,
      resume: false,
    });
    if (consumeInviteWrongEmail()) setPhase('wrong-email');
  }, [orgSlug, invitedEmail, displayName, shouldAutoJoin]);

  useEffect(() => {
    const justJoined = peekInviteJustJoined();
    if (justJoined?.slug === orgSlug) setPhase('congrats');
  }, [orgSlug]);

  useEffect(() => {
    if (!shouldAutoJoin) return;
    markAuthDestinationReady();
  }, [shouldAutoJoin]);

  useEffect(() => {
    attempted.current = false;
  }, [token, accountStatus, orgSlug, invitedEmail]);

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
    markInviteJustJoined({ slug: orgSlug, name: displayName });
    clearInviteJoin();
    setPhase('congrats');
  };

  const enterWorkspace = useCallback(() => {
    clearInviteJustJoined();
    router.replace(cleanUrl);
    router.refresh();
  }, [router, cleanUrl]);

  const leaveToWorkspaces = useCallback(() => {
    clearInviteJoin();
    router.replace('/o');
  }, [router]);

  const rejectWrongEmail = () => {
    attempted.current = true;
    markInviteWrongEmail();
    setPhase('wrong-email');
    suspendClerkAuthRequests();
    void signOut?.({ redirectUrl: invitePath });
  };

  useEffect(() => {
    if (mode === 'inline' && phase !== 'congrats' && !hasInviteIntent) return;
    if (
      !authLoaded
      || !userLoaded
      || !isSignedIn
      || !user
      || phase === 'congrats'
      || phase === 'wrong-email'
      || phase === 'unavailable'
      || attempted.current
    ) {
      return;
    }

    if (invitedEmail && !userHasInviteEmail(user, invitedEmail)) {
      rejectWrongEmail();
      return;
    }

    if (alreadyInWorkspace) {
      if (peekInviteJustJoined()?.slug === orgSlug) {
        setPhase('congrats');
        return;
      }
      clearInviteJoin();
      if (hasInviteIntent && !attempted.current) {
        attempted.current = true;
        void acceptWorkspaceInvitation(orgSlug, invitedEmail);
      }
      return;
    }

    if (!shouldAutoJoin) return;

    attempted.current = true;
    setPhase('joining');

    const run = async () => {
      try {
        const acceptedServer = await acceptWorkspaceInvitation(orgSlug, invitedEmail);
        if (acceptedServer?.success) {
          await finishJoin(acceptedServer.organizationId);
          return;
        }

        if (acceptedServer?.code === 'wrong_email') {
          rejectWrongEmail();
          return;
        }

        if (acceptedServer?.code === 'invite_unavailable' || acceptedServer?.code === 'join_failed' || acceptedServer?.code === 'no_invite') {
          setUnavailableReason(acceptedServer?.reason || '');
          setPhase('unavailable');
          return;
        }

        const acceptedClient = await acceptPendingInvitationForOrg(user, orgSlug);
        if (acceptedClient) {
          const synced = await acceptWorkspaceInvitation(orgSlug, invitedEmail);
          if (synced?.success) {
            await finishJoin(synced.organizationId || organization?.id);
            return;
          }
          if (synced?.code === 'wrong_email') {
            rejectWrongEmail();
            return;
          }
        }

        setUnavailableReason(acceptedServer?.reason || '');
        setPhase('unavailable');
      } catch (e) {
        console.error('[invite] join failed', formatClerkActionError(e, 'join failed'));
        setPhase('unavailable');
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
    invitedEmail,
    mode,
    phase,
    hasInviteIntent,
    shouldAutoJoin,
    alreadyInWorkspace,
  ]);

  useEffect(() => {
    if (
      !token
      || (accountStatus && accountStatus !== 'sign_in')
      || alreadyInWorkspace
      || !authLoaded
      || !signInLoaded
      || !signIn
      || isSignedIn
      || attempted.current
    ) {
      return;
    }
    attempted.current = true;
    setPhase('joining');

    const run = async () => {
      try {
        await completeTicketSignIn(signIn, setActiveFromSignIn, token);
      } catch (e) {
        console.error('[invite] ticket sign-in failed', formatClerkActionError(e, 'sign-in failed'));
        setPhase('prompt');
        attempted.current = false;
      }
    };

    void run();
  }, [
    token,
    accountStatus,
    alreadyInWorkspace,
    orgSlug,
    authLoaded,
    signInLoaded,
    signIn,
    isSignedIn,
    setActiveFromSignIn,
  ]);

  const handleGoogleJoin = async () => {
    if (!signInLoaded || !signIn) return;
    setOauthLoading(true);
    rememberInviteJoin({ slug: orgSlug, email: invitedEmail, name: displayName, resume: true });
    markInviteJoinResume();
    try {
      if (isSignedIn && signOut) {
        suspendClerkAuthRequests();
        await signOut();
      }
      setPostAuthRedirect(invitePath);
      const { redirectUrl, redirectUrlComplete } = getOauthRedirectUrls(invitePath);
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl,
        redirectUrlComplete,
        oidcPrompt: 'select_account',
      });
    } catch (e) {
      console.error('[invite] google join failed', e);
      setOauthLoading(false);
      setPhase('prompt');
    }
  };

  const retryGoogle = () => {
    attempted.current = false;
    setPhase('prompt');
    void handleGoogleJoin();
  };

  const handleEmailJoin = async (password) => {
    if (!signInLoaded || !signIn || !invitedEmail) return;
    setEmailError('');
    setEmailLoading(true);
    rememberInviteJoin({ slug: orgSlug, email: invitedEmail, name: displayName, resume: true });
    markInviteJoinResume();
    try {
      const result = await signIn.create({
        identifier: invitedEmail,
        password,
      });
      if (result.status === 'complete' && result.createdSessionId && setActiveFromSignIn) {
        await setActiveFromSignIn({ session: result.createdSessionId });
        return;
      }
      if (result.status === 'needs_first_factor') {
        const firstFactor = await signIn.attemptFirstFactor({
          strategy: 'password',
          password,
        });
        if (firstFactor.status === 'complete' && firstFactor.createdSessionId && setActiveFromSignIn) {
          await setActiveFromSignIn({ session: firstFactor.createdSessionId });
          return;
        }
      }
      setEmailError('Could not sign in with that password. If you usually use Google, use the button above.');
    } catch (e) {
      setEmailError(
        formatClerkActionError(
          e,
          'No account for this email yet. Continue with Google to create one automatically.',
        ),
      );
    } finally {
      setEmailLoading(false);
    }
  };

  if (mode === 'inline' && phase !== 'congrats' && !hasInviteIntent) {
    return null;
  }

  if (alreadyInWorkspace && phase !== 'congrats' && peekInviteJustJoined()?.slug !== orgSlug) {
    return null;
  }

  if (!shouldAutoJoin && phase !== 'congrats') {
    return null;
  }

  if (!authLoaded) {
    return (
      <InviteJoinModal
        phase="joining"
        workspaceName={displayName}
        invitedEmail={invitedEmail}
      />
    );
  }

  if (phase === 'congrats') {
    return (
      <InviteJoinModal
        phase="congrats"
        workspaceName={displayName}
        invitedEmail={invitedEmail}
        onEnter={enterWorkspace}
      />
    );
  }

  if (phase === 'unavailable') {
    return (
      <InviteJoinModal
        phase="unavailable"
        workspaceName={displayName}
        invitedEmail={invitedEmail}
        unavailableReason={unavailableReason}
        onLeave={leaveToWorkspaces}
      />
    );
  }

  if (phase === 'wrong-email' || phase === 'no-invite') {
    return (
      <InviteJoinModal
        phase={phase}
        workspaceName={displayName}
        invitedEmail={invitedEmail}
        oauthLoading={oauthLoading}
        onRetry={retryGoogle}
      />
    );
  }

  if (isSignedIn && (phase === 'joining' || shouldAutoJoin)) {
    return (
      <InviteJoinModal
        phase="joining"
        workspaceName={displayName}
        invitedEmail={invitedEmail}
      />
    );
  }

  return (
    <InviteJoinModal
      phase="prompt"
      workspaceName={displayName}
      invitedEmail={invitedEmail}
      oauthLoading={oauthLoading}
      onGoogle={() => void handleGoogleJoin()}
      onEmailJoin={invitedEmail ? handleEmailJoin : undefined}
      emailLoading={emailLoading}
      emailError={emailError}
    />
  );
}
