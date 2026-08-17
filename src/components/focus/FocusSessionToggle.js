'use client';

import { useCallback, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useFocusSession } from '@/contexts/FocusSessionContext';
import FocusSessionConsentModal from '@/components/focus/FocusSessionConsentModal';
import { FOCUS_SESSION_CONSENT_KEY } from '@/lib/focusSession';
import { setUserStorageItem } from '@/utils/userStorage';

/**
 * Compact Focusing / Away switch — Focus page chrome only (beside Theme).
 * Turning Focusing on opens a browser-specific consent modal.
 */
export default function FocusSessionToggle() {
  const { user } = useUser();
  const userId = user?.id ?? null;
  const {
    sessionActive,
    hydrated,
    setFocusSessionActive,
    ensureSystemActivityPermission,
  } = useFocusSession();

  const [consentOpen, setConsentOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const markConsent = useCallback(() => {
    if (!userId) return;
    setUserStorageItem(userId, FOCUS_SESSION_CONSENT_KEY, 'accepted');
  }, [userId]);

  const startFocusing = useCallback(
    async ({ requestActivity }) => {
      setBusy(true);
      try {
        if (requestActivity) {
          await ensureSystemActivityPermission();
        }
        markConsent();
        await setFocusSessionActive(true, { source: 'user' });
        setConsentOpen(false);
      } finally {
        setBusy(false);
      }
    },
    [ensureSystemActivityPermission, markConsent, setFocusSessionActive]
  );

  const title = sessionActive ? 'Set Away' : 'Start Focusing';

  return (
    <>
      <button
        type="button"
        role="switch"
        aria-checked={sessionActive}
        aria-label={sessionActive ? 'Focus session active' : 'Focus session inactive'}
        title={title}
        disabled={!hydrated || busy}
        onClick={() => {
          if (sessionActive) {
            void setFocusSessionActive(false, { source: 'user' });
            return;
          }
          setConsentOpen(true);
        }}
        className={[
          'group relative inline-flex h-12 cursor-pointer items-center gap-2.5 rounded-2xl border px-3.5',
          'backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
          'transition-[background-color,border-color,box-shadow,transform] duration-300 ease-out',
          'hover:scale-[1.02] active:scale-[0.98]',
          'disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
          sessionActive
            ? 'bg-emerald-500/20 border-emerald-400/35 hover:bg-emerald-500/28 hover:border-emerald-300/50'
            : 'bg-black/40 border-white/[0.08] hover:bg-black/55 hover:border-white/20',
        ].join(' ')}
      >
        <span
          className={[
            'relative flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-300',
            sessionActive ? 'bg-emerald-400/90' : 'bg-white/15',
          ].join(' ')}
          aria-hidden
        >
          <span
            className={[
              'h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
              sessionActive ? 'translate-x-5' : 'translate-x-0',
            ].join(' ')}
          />
          {sessionActive ? (
            <span className="pointer-events-none absolute inset-0 rounded-full animate-pulse bg-emerald-300/25" />
          ) : null}
        </span>

        <span className="flex min-w-[4.75rem] flex-col items-start leading-none">
          <span
            className={[
              'text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors duration-300',
              sessionActive ? 'text-emerald-200/90' : 'text-white/45',
            ].join(' ')}
          >
            Session
          </span>
          <span
            className={[
              'mt-0.5 text-sm font-semibold tracking-tight transition-colors duration-300',
              sessionActive ? 'text-white' : 'text-white/70',
            ].join(' ')}
          >
            {sessionActive ? 'Focusing' : 'Away'}
          </span>
        </span>

        {sessionActive ? (
          <span
            className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.85)]"
            aria-hidden
          />
        ) : null}
      </button>

      <FocusSessionConsentModal
        open={consentOpen}
        busy={busy}
        onClose={() => {
          if (!busy) setConsentOpen(false);
        }}
        onAllowAndStart={() => startFocusing({ requestActivity: true })}
        onStartWithoutActivity={() => startFocusing({ requestActivity: false })}
      />
    </>
  );
}
