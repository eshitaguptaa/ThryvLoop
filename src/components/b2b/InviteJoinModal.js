'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { Check, MailWarning, Clock } from 'lucide-react';

function GoogleMark() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function InviteShell({ children }) {
  const node = (
    <div className="invite-join-overlay" role="dialog" aria-modal="true">
      <div className="invite-join-overlay__mesh" aria-hidden />
      <div className="invite-join-overlay__orb invite-join-overlay__orb--a" aria-hidden />
      <div className="invite-join-overlay__orb invite-join-overlay__orb--b" aria-hidden />
      <div className="invite-join-card">{children}</div>
    </div>
  );
  if (typeof document === 'undefined') return node;
  return createPortal(node, document.body);
}

function LogoMark() {
  return (
    <div className="invite-join-brand">
      <div className="invite-join-logo">
        <Image
          src="/LandingPageImages/logo.png"
          alt=""
          width={64}
          height={64}
          priority
        />
      </div>
      <p className="invite-join-wordmark">ThryvLoop</p>
    </div>
  );
}

function GoogleButton({ oauthLoading, onClick, label }) {
  return (
    <button type="button" className="invite-join-google" onClick={onClick} disabled={oauthLoading}>
      {oauthLoading ? 'Continuing…' : (
        <>
          <GoogleMark />
          {label}
        </>
      )}
    </button>
  );
}

export default function InviteJoinModal({
  phase = 'prompt',
  workspaceName,
  invitedEmail,
  oauthLoading = false,
  emailLoading = false,
  emailError = '',
  onGoogle,
  onEmailJoin,
  onEnter,
  onRetry,
  onLeave,
  unavailableReason = '',
}) {
  const name = workspaceName || 'this workspace';
  const [showEmail, setShowEmail] = useState(false);
  const [password, setPassword] = useState('');
  const enteredRef = useRef(false);

  useEffect(() => {
    if (phase !== 'congrats' || !onEnter || enteredRef.current) return undefined;
    const timer = window.setTimeout(() => {
      enteredRef.current = true;
      onEnter();
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [phase, onEnter]);

  if (phase === 'joining') {
    return (
      <InviteShell>
        <LogoMark />
        <p className="invite-join-kicker">Team workspace</p>
        <h1 className="invite-join-title">Joining {name}</h1>
        <p className="invite-join-copy">Adding you to the team. This only takes a moment.</p>
        <div className="invite-join-spinner" aria-hidden />
      </InviteShell>
    );
  }

  if (phase === 'unavailable') {
    const used = unavailableReason === 'used';
    const expired = unavailableReason === 'expired';
    return (
      <InviteShell>
        <div className="invite-join-warn-icon" aria-hidden>
          <Clock className="h-7 w-7" strokeWidth={2.25} />
        </div>
        <p className="invite-join-kicker">
          {used ? 'Invite already used' : expired ? 'Invite expired' : 'Invite no longer valid'}
        </p>
        <h1 className="invite-join-title">Ask an admin to resend</h1>
        <p className="invite-join-copy">
          {used
            ? 'This invite was already used. If you are not in the team yet, ask an admin on People to send a new invite.'
            : expired
              ? 'This invite has expired. Ask an admin on People to resend it, then open the new email.'
              : 'This invite expired, was revoked, or was already used. Ask an admin on People to resend it.'}
        </p>
        <button type="button" className="invite-join-primary" onClick={onLeave}>
          Back to workspaces
        </button>
      </InviteShell>
    );
  }

  if (phase === 'wrong-email' || phase === 'no-invite') {
    const wrongEmail = phase === 'wrong-email';
    return (
      <InviteShell>
        <div className="invite-join-warn-icon" aria-hidden>
          <MailWarning className="h-7 w-7" strokeWidth={2.25} />
        </div>
        <p className="invite-join-kicker">{wrongEmail ? 'Wrong Google account' : 'No invitation found'}</p>
        <h1 className="invite-join-title">
          {wrongEmail ? 'That email is not invited' : 'This account has no invite'}
        </h1>
        <p className="invite-join-copy">
          {wrongEmail ? (
            <>
              This invite is only for{' '}
              <strong className="invite-join-email">{invitedEmail || 'the invited Gmail'}</strong>.
              You were not added to the team. Sign in again with that exact Gmail — no other Google account.
            </>
          ) : (
            <>
              Sign in with{' '}
              <strong className="invite-join-email">{invitedEmail || 'the invited Gmail'}</strong>
              {' '}to join {name}. Other accounts cannot accept this invite.
            </>
          )}
        </p>
        <GoogleButton
          oauthLoading={oauthLoading}
          onClick={onRetry}
          label={`Try again with ${invitedEmail || 'the invited Gmail'}`}
        />
      </InviteShell>
    );
  }

  if (phase === 'congrats') {
    return (
      <InviteShell>
        <div className="invite-join-check" aria-hidden>
          <Check className="h-8 w-8" strokeWidth={2.5} />
        </div>
        <p className="invite-join-kicker">You&apos;re in</p>
        <h1 className="invite-join-title">Welcome to {name}</h1>
        <p className="invite-join-copy">
          Congratulations — you joined the team. Your host has been notified. Opening the workspace…
        </p>
        <button type="button" className="invite-join-primary" onClick={onEnter}>
          Enter workspace
        </button>
      </InviteShell>
    );
  }

  const busy = oauthLoading || emailLoading;

  return (
    <InviteShell>
      <LogoMark />
      <p className="invite-join-kicker">You&apos;re invited</p>
      <h1 className="invite-join-title">Join {name}</h1>
      <p className="invite-join-copy">
        Use the exact Gmail this invite was sent to. If you don&apos;t have a ThryvLoop account yet,
        continuing with Google creates one automatically.
      </p>
      {invitedEmail ? (
        <div className="invite-join-email-card">
          <p className="invite-join-email-card__label">Sign in only with</p>
          <p className="invite-join-email-card__value">{invitedEmail}</p>
          <p className="invite-join-email-card__hint">
            Any other Google account will be signed out and will not join the team.
          </p>
        </div>
      ) : (
        <p className="invite-join-pill">Use the invited Gmail only</p>
      )}
      <GoogleButton
        oauthLoading={busy}
        onClick={onGoogle}
        label="Continue with Google"
      />
      {invitedEmail && onEmailJoin ? (
        showEmail ? (
          <form
            className="invite-join-email-form"
            onSubmit={(event) => {
              event.preventDefault();
              void onEmailJoin(password);
            }}
          >
            <label className="invite-join-email-form__label" htmlFor="invite-join-password">
              Password for {invitedEmail}
            </label>
            <input
              id="invite-join-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              className="invite-join-email-form__input"
              placeholder="Your ThryvLoop password"
            />
            {emailError ? (
              <p className="invite-join-email-form__error" role="alert">{emailError}</p>
            ) : (
              <p className="invite-join-email-form__hint">
                No account yet? Use Google above — it creates one for this Gmail.
              </p>
            )}
            <button type="submit" className="invite-join-primary" disabled={busy || !password}>
              {emailLoading ? 'Signing in…' : 'Sign in with this email'}
            </button>
            <button
              type="button"
              className="invite-join-alt"
              onClick={() => setShowEmail(false)}
            >
              Back to Google
            </button>
          </form>
        ) : (
          <button
            type="button"
            className="invite-join-alt"
            onClick={() => setShowEmail(true)}
          >
            Sign in with this email instead
          </button>
        )
      ) : null}
    </InviteShell>
  );
}
