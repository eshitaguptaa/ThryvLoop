'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Loader2, X } from 'lucide-react';

/**
 * Bottom-right save toast: Saving → Saved (or error). Dismissible with X.
 * @param {{ status: 'idle' | 'saving' | 'saved' | 'error', message?: string }} props
 */
export default function SettingsSaveToast({ status, message = '' }) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [display, setDisplay] = useState(
    /** @type {'saving' | 'saved' | 'error' | null} */ (null)
  );
  const [errorText, setErrorText] = useState('');

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (status === 'idle') return undefined;

    if (status === 'saving') {
      setDisplay('saving');
      setErrorText('');
      setVisible(true);
      return undefined;
    }

    if (status === 'saved') {
      setDisplay('saved');
      setErrorText('');
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 1800);
      return () => clearTimeout(t);
    }

    if (status === 'error') {
      setDisplay('error');
      setErrorText(message || 'Could not save');
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 4000);
      return () => clearTimeout(t);
    }

    return undefined;
  }, [status, message]);

  useEffect(() => {
    if (visible || !display) return undefined;
    const t = setTimeout(() => setDisplay(null), 280);
    return () => clearTimeout(t);
  }, [visible, display]);

  if (!mounted || !display) return null;

  const isSaving = display === 'saving';
  const isSaved = display === 'saved';
  const isError = display === 'error';
  const label = isSaving ? 'Saving…' : isSaved ? 'Saved' : errorText;

  const dismiss = () => setVisible(false);

  const toast = (
    <div
      className={`ws-save-toast fixed z-[100] bottom-5 right-4 sm:bottom-6 sm:right-6 max-w-[min(18rem,calc(100vw-2rem))] ${
        visible ? 'ws-save-toast--in' : 'ws-save-toast--out'
      }`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className={`flex items-center gap-2.5 rounded-xl border pl-3 pr-2 py-2.5 shadow-[0_10px_32px_-12px_rgba(15,23,42,0.28)] backdrop-blur-md ${
          isError
            ? 'border-rose-200/90 bg-white/95 text-rose-800 dark:border-rose-500/30 dark:bg-[#1a1214]/95 dark:text-rose-100'
            : 'border-emerald-200/80 bg-white/95 text-emerald-900 dark:border-emerald-500/25 dark:bg-[#0f1a14]/95 dark:text-emerald-50'
        }`}
      >
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
            isError
              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
              : isSaving
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                : 'bg-emerald-500 text-white'
          }`}
          aria-hidden
        >
          {isSaving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.5} />
          ) : isSaved ? (
            <Check className="h-3.5 w-3.5" strokeWidth={2.75} />
          ) : (
            <X className="h-3.5 w-3.5" strokeWidth={2.5} />
          )}
        </span>

        <p className="min-w-0 flex-1 text-sm font-semibold tracking-tight truncate">{label}</p>

        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-lg p-1.5 text-current/50 transition-colors hover:bg-black/5 hover:text-current dark:hover:bg-white/10"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
        </button>
      </div>
    </div>
  );

  return createPortal(toast, document.body);
}
