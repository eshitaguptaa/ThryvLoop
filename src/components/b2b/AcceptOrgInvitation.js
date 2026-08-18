'use client';

import { useAuth, useClerk, useOrganization, useSignIn, useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, useCallback } from 'react';
import InviteJoinModal from '@/components/b2b/InviteJoinModal';
import { formatClerkActionError } from '@/lib/clerkErrors';
import { getOauthRedirectUrls, setPostAuthRedirect } from '@/lib/authRoutes';
import { markAuthDestinationReady, setAuthLoginProgress } from '@/lib/authTransition';
import { suspendClerkAuthRequests } from '@/lib/clerkSupabaseToken';
import { acceptWorkspaceInvitation } from '@/app/(b2b)/o/actions';
import {
  buildWorkspaceWelcomePath,
  clearInviteJoin,
  clearInviteJustJoined,
  consumeInviteWrongEmail,
  hasInviteJoinResume,
  markInviteJoinResume,
  markInviteJustJoined,
  markInviteWrongEmail,
  peekInviteJoin,
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
  const welcome = searchParams.get('welcome') === '1';
  const invitedEmail = (searchParams.get('invite_email') || '').trim().toLowerCase();
  const router = useRouter();
  const { organization } = useOrganization();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const { signOut, setActive: setActiveClerk } = useClerk();
  const { isLoaded: signInLoaded, signIn, setActive: setActiveFromSignIn } = useSignIn();
  const [phase, setPhase] = useState(() => (welcome ? 'congrats' : 'prompt'));
  const [joinedName, setJoinedName] = useState(workspaceName);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [unavailableReason, setUnavailableReason] = useState('');
  const attempted = useRef(false);
  const enteredRef = useRef(false);

  const cleanUrl = `/o/${encodeURIComponent(orgSlug)}`;
  const welcomeUrl = buildWorkspaceWelcomePath(orgSlug);
  const displayName = workspaceName || joinedName || 'this workspace';
  const hasInviteIntent = Boolean(fromInvite || invitedEmail);
  const shouldAutoJoin = mode === 'gate' || hasInviteIntent;
  const invitePath = invitedEmail
    ? `${cleanUrl}?from_invite=1&invite_email=${encodeURIComponent(invitedEmail)}`
    : `${cleanUrl}?from_invite=1`;
  const alreadyInWorkspace = organization?.slug === orgSlug;

  useEffect(() => {
    if (mode === 'inline' && !hasInviteIntent && !welcome) return;
    rememberInviteJoin({
      slug: orgSlug,
      email: invitedEmail,
      name: displayName,
      resume: false,
    });
    if (consumeInviteWrongEmail()) setPhase('wrong-email');
  }, [orgSlug, invitedEmail, displayName, shouldAutoJoin, mode, hasInviteIntent, welcome]);

  useEffect(() => {
    const remembered = peekInviteJoin();
    const justJoined = peekInviteJustJoined();
    const name = workspaceName || justJoined?.name || remembered?.name;
    if (name) setJoinedName(name);
    if (enteredRef.current || phase === 'done') return;
    if (justJoined?.slug === orgSlug || welcome) setPhase('congrats');
  }, [orgSlug, workspaceName, welcome, phase]);

  useEffect(() => {
    if (mode === 'inline') {
      markAuthDestinationReady();
      return;
    }
    if (!isSignedIn && phase === 'prompt') markAuthDestinationReady();
    if (phase === 'unavailable' || phase === 'wrong-email' || phase === 'no-invite') {
      markAuthDestinationReady();
    }
  }, [mode, phase, isSignedIn]);

  useEffect(() => {
    attempted.current = false;
  }, [orgSlug, invitedEmail]);

  useEffect(() => {
    if (!token && !accountStatus) return;
    router.replace(invitePath, { scroll: false });
  }, [token, accountStatus, invitePath, router]);

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
    setAuthLoginProgress({ percent: 96, message: 'Opening your workspace' });

    if (mode === 'inline') {
      setPhase('congrats');
      router.replace(welcomeUrl);
      return;
    }

    window.location.assign(welcomeUrl);
  };

  const enterWorkspace = useCallback(() => {
    if (enteredRef.current) return;
    enteredRef.current = true;
    clearInviteJustJoined();
    setPhase('done');
    if (mode === 'gate') {
      window.location.assign(cleanUrl);
      return;
    }
    router.replace(cleanUrl);
  }, [mode, router, cleanUrl]);

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
      || phase === 'done'
      || phase === 'wrong-email'
      || phase === 'unavailable'
      || attempted.current
    ) {
      return;
    }

    if (invitedEmail && !userHasInviteEmail(user, invitedEmail)) {
      if (!hasInviteJoinResume(orgSlug)) return;
      rejectWrongEmail();
      return;
    }

    if (!hasInviteJoinResume(orgSlug)) return;

    if (alreadyInWorkspace) {
      if (peekInviteJustJoined()?.slug === orgSlug || welcome) {
        if (mode === 'gate') {
          window.location.assign(welcomeUrl);
          return;
        }
        setPhase('congrats');
        return;
      }
      if (mode === 'gate') {
        if (phase === 'joining') return;
        window.location.assign(cleanUrl);
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
    setAuthLoginProgress({ percent: 88, message: 'Adding you to the team' });

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

  if (phase === 'done') return null;

  if (mode === 'inline' && phase !== 'congrats' && !hasInviteIntent && !welcome) {
    return null;
  }

  if (alreadyInWorkspace && phase !== 'congrats' && phase !== 'joining' && peekInviteJustJoined()?.slug !== orgSlug) {
    return null;
  }

  if (!shouldAutoJoin && phase !== 'congrats') {
    return null;
  }

  const overlaySurface = mode === 'inline' ? 'dialog' : 'page';
  const joinAuthorized = hasInviteJoinResume(orgSlug);

  if (!authLoaded) {
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
        surface={overlaySurface}
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

  if (isSignedIn && (phase === 'joining' || joinAuthorized)) {
    return (
      <InviteJoinModal
        phase="joining"
        workspaceName={displayName}
        invitedEmail={invitedEmail}
        surface={overlaySurface}
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
