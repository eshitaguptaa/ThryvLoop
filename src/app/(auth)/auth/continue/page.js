'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSignUp } from '@clerk/nextjs';
import LegalAuthConsent from '@/components/legal/LegalAuthConsent';
import { AFTER_AUTH_PATH, authModalUrl } from '@/lib/authRoutes';
import { ensureAuthLoginTransition, setAuthLoginProgress } from '@/lib/authTransition';
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
  const [password, setPassword] = useState('');
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
  const needsPassword = missing.includes('password');
  const canSubmit = needsName || needsLegal || needsPassword;

  useEffect(() => {
    ensureAuthLoginTransition();
    setAuthLoginProgress({ percent: 58, message: 'Finish creating your account' });
  }, []);

  useEffect(() => {
    if (!isLoaded || !signUp) return;

    if (signUp.status === 'complete' && signUp.createdSessionId && setActive) {
      ensureAuthLoginTransition();
      setAuthLoginProgress({ percent: 72, message: 'Opening your workspace' });
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
      ensureAuthLoginTransition();
      setAuthLoginProgress({ percent: 72, message: 'Opening your workspace' });
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
      if (needsPassword) patch.password = password;

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

  if (!isLoaded || signUp?.status === 'complete') {
    return null;
  }

  return (
    <div className="auth-continue-panel min-h-screen flex items-center justify-center px-4 py-12">
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

          {needsPassword ? (
            <div>
              <label htmlFor="continue-password" className="block text-xs font-semibold mb-1">
                Choose a password
              </label>
              <input
                id="continue-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                autoComplete="new-password"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Google verified your email. This password is only for signing in with email later.
              </p>
            </div>
          ) : null}

          {!canSubmit ? (
            <p className="text-sm text-muted-foreground">
              Clerk still needs a field this form does not collect (
              {missing.join(', ') || 'unknown'}
              ). Check Phone / Username tabs in Clerk if those are required.
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
            disabled={busy || !canSubmit}
            className="w-full rounded-lg bg-[#5D3FD3] text-white py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {busy ? 'Continuing…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
