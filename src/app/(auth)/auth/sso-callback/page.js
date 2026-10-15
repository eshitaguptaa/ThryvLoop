'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticateWithRedirectCallback, useAuth, useSignIn, useSignUp } from '@clerk/nextjs';
import {
  AFTER_AUTH_PATH,
  SSO_CALLBACK_PATH,
  authModalUrl,
  consumePostAuthRedirect,
} from '@/lib/authRoutes';
import {
  ensureAuthLoginTransition,
  setAuthLoginProgress,
} from '@/lib/authTransition';
import {
  invitedEmailFromPath,
  markInviteJoinResume,
  peekInviteJoin,
  peekInviteJoinPath,
  rememberInviteJoin,
} from '@/lib/inviteJoin';

const CONTINUE_PATH = '/auth/continue';

function needsContinue(signUp) {
  if (!signUp) return false;
  if (signUp.status === 'missing_requirements') return true;
  return Array.isArray(signUp.missingFields) && signUp.missingFields.length > 0;
}

/**
 * Completes Google/Microsoft OAuth on this path.
 * AuthTransitionHost is the only loader so the bar does not reset.
 * Captcha sits above that overlay (#clerk-captcha) so it can be clicked.
 */
export default function SSOCallbackPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const left = useRef(false);

  useEffect(() => {
    ensureAuthLoginTransition();
    setAuthLoginProgress({ percent: 32, message: 'Returning from Google' });
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    setAuthLoginProgress({ percent: 44, message: 'Completing sign-in' });
  }, [isLoaded]);

  useEffect(() => {
    if (!isLoaded || left.current) return;

    if (isSignedIn || signIn?.status === 'complete' || signUp?.status === 'complete') {
      left.current = true;
      const next = peekInviteJoinPath() || consumePostAuthRedirect() || AFTER_AUTH_PATH;
      if (next.includes('from_invite') || next.includes('invite_email')) {
        const stored = peekInviteJoin();
        const slugMatch = next.match(/^\/o\/([^/?#]+)/);
        const slug = stored?.slug || (slugMatch ? decodeURIComponent(slugMatch[1]) : '');
        if (slug) {
          rememberInviteJoin({
            slug,
            email: stored?.email || invitedEmailFromPath(next),
            name: stored?.name,
            resume: true,
          });
        } else {
          markInviteJoinResume();
        }
      }
      setAuthLoginProgress({
        percent: 72,
        message: next.includes('from_invite') ? 'Joining your team' : 'Opening your workspace',
      });
      router.replace(next);
      return;
    }

    if (needsContinue(signUp)) {
      left.current = true;
      setAuthLoginProgress({ percent: 58, message: 'Finish creating your account' });
      router.replace(CONTINUE_PATH);
    }
  }, [isLoaded, isSignedIn, signIn?.status, signUp, signUp?.status, router]);

  return (
    <>
      {/* Above the login overlay so Clerk bot-protection can render and be clicked. */}
      <div id="clerk-captcha" className="sso-callback-captcha" />
      {/*
        Only run Clerk's callback handler while the OAuth attempt is still pending.
        Clerk often finishes Google sign-in server-side before this page loads; if the
        handler runs anyway it finds nothing to process and falls back to Clerk's
        hosted /sign-in page. Explicit URLs keep every fallback inside this app.
      */}
      {isLoaded && !isSignedIn ? (
        <AuthenticateWithRedirectCallback
          signInUrl={authModalUrl('signin')}
          signUpUrl={authModalUrl('signup')}
          signInFallbackRedirectUrl={SSO_CALLBACK_PATH}
          signUpFallbackRedirectUrl={SSO_CALLBACK_PATH}
          continueSignUpUrl={CONTINUE_PATH}
          transferable
        />
      ) : null}
    </>
  );
}
