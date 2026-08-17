'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSignUp } from '@clerk/nextjs';
import LegalAuthConsent from '@/components/legal/LegalAuthConsent';
import AppLoadingScreen from '@/components/ui/AppLoadingScreen';
import { AFTER_AUTH_PATH, authModalUrl } from '@/lib/authRoutes';
import { markAuthLoginTransition } from '@/lib/authTransition';
import { formatClerkActionError } from '@/lib/clerkErrors';

/**
 * Finishes Google/Microsoft sign-up when Clerk still needs first/last name
 * or legal acceptance. AuthenticateWithRedirectCallback sends users here.
 */
export default function AuthContinuePage() {
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const missing = signUp?.missingFields || [];
  const needsName =
    missing.includes('first_name')
    || missing.includes('last_name')
    || missing.includes('firstName')
    || missing.includes('lastName');
  const needsLegal =
    missing.includes('legal_accepted') || missing.includes('legalAccepted');

  useEffect(() => {
    if (!isLoaded || !signUp) return;

    if (signUp.status === 'complete' && signUp.createdSessionId && setActive) {
      markAuthLoginTransition();
      void setActive({ session: signUp.createdSessionId }).then(() => {
        router.replace(AFTER_AUTH_PATH);
      });
      return;
    }

    if (!signUp.status || signUp.status === 'abandoned') {
      router.replace(authModalUrl('signin'));
    }
  }, [isLoaded, signUp, setActive, router]);

  const finishIfComplete = async (result) => {
    const status = result?.status ?? signUp?.status;
    const sessionId = result?.createdSessionId ?? signUp?.createdSessionId;
    if (status === 'complete' && sessionId && setActive) {
      markAuthLoginTransition();
      await setActive({ session: sessionId });
      router.replace(AFTER_AUTH_PATH);
      return true;
    }
    return false;
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!signUp) return;
    setBusy(true);
    setError('');
    try {
      const patch = {};
      if (needsName) {
        patch.firstName = firstName.trim();
        patch.lastName = lastName.trim();
      }
      if (needsLegal) patch.legalAccepted = legalAccepted;

      const result = await signUp.update(patch);
      if (await finishIfComplete(result)) return;

      setError(
        'Google sign-up still needs another step. In Clerk Production, under User & authentication, set first/last name and extra identifiers to optional — not required.'
      );
    } catch (e) {
      setError(formatClerkActionError(e, 'Could not finish creating your account.'));
    } finally {
      setBusy(false);
    }
  };

  if (!isLoaded) {
    return <AppLoadingScreen message="Signing you in" />;
  }

  if (signUp?.status === 'complete') {
    return <AppLoadingScreen message="Signing you in" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <h1 className="text-xl font-bold text-foreground">Finish creating your account</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Google verified your email. Add the details Clerk still requires, then continue.
        </p>

        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          {needsName ? (
            <div className="flex gap-2">
              <div className="flex-1">
                <label htmlFor="continue-first" className="block text-xs font-semibold mb-1">
                  First name
                </label>
                <input
                  id="continue-first"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="continue-last" className="block text-xs font-semibold mb-1">
                  Last name
                </label>
                <input
                  id="continue-last"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
          ) : null}

          {needsLegal ? (
            <label className="flex items-start gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                className="mt-1"
                checked={legalAccepted}
                onChange={(e) => setLegalAccepted(e.target.checked)}
                required
              />
              <span>
                I agree to the Terms of Service and Privacy Policy.
              </span>
            </label>
          ) : null}

          {!needsName && !needsLegal ? (
            <p className="text-sm text-muted-foreground">
              Clerk is asking for extra account fields (username, phone, or similar) that Google
              does not provide. In Clerk Dashboard → User & authentication, turn those off or set
              them to optional, then try Google again.
            </p>
          ) : null}

          <LegalAuthConsent />
          <div id="clerk-captcha" />

          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy || (!needsName && !needsLegal)}
            className="w-full rounded-lg bg-[#5D3FD3] text-white py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {busy ? 'Continuing…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
