'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Archive, Loader2, Trash2, X } from 'lucide-react';

/**
 * Destructive confirm dialog (portal).
 *
 * @param {{
 *   open: boolean,
 *   title?: string,
 *   description?: import('react').ReactNode,
 *   confirmLabel?: string,
 *   cancelLabel?: string,
 *   busy?: boolean,
 *   onCancel: () => void,
 *   onConfirm: () => void | Promise<void>,
 *   tone?: 'danger' | 'archive',
 *   busyLabel?: string,
 * }} props
 */
export default function ConfirmModal({
  open,
  title = 'Delete this task?',
  description = 'This cannot be undone.',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  busy = false,
  busyLabel,
  tone = 'danger',
  onCancel,
  onConfirm,
}) {
  const titleId = useId();
  const descId = useId();
  const cancelRef = useRef(/** @type {HTMLButtonElement | null} */ (null));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = window.setTimeout(() => cancelRef.current?.focus(), 40);
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open, busy, onCancel]);

  if (!open || !mounted) return null;

  const isArchive = tone === 'archive';
  const Icon = isArchive ? Archive : Trash2;
  const glow = isArchive
    ? {
        a: 'bg-[#5D3FD3]/25',
        b: 'bg-sky-500/15',
        icon: 'bg-[#5D3FD3]/12 text-[#5D3FD3] dark:text-[#c4b5fd]',
        action:
          'bg-[#5D3FD3] hover:bg-[#4c33b8] shadow-sm shadow-[#5D3FD3]/25',
      }
    : {
        a: 'bg-rose-500/25',
        b: 'bg-orange-500/15',
        icon: 'bg-rose-500/15 text-rose-600 dark:text-rose-300',
        action: 'bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-600/25',
      };
  const workingLabel = busyLabel || (isArchive ? 'Archiving…' : 'Deleting…');

  const modal = (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6" role="presentation">
      <button
        type="button"
        aria-label="Dismiss"
        className="absolute inset-0 bg-slate-950/55 dark:bg-black/70 backdrop-blur-sm"
        disabled={busy}
        onClick={() => {
          if (!busy) onCancel();
        }}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_64px_-20px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-[#121826] dark:shadow-[0_24px_64px_-16px_rgba(0,0,0,0.75)]"
      >
        <div
          className={`pointer-events-none absolute -top-24 -right-16 h-48 w-48 rounded-full blur-3xl ${glow.a}`}
          aria-hidden
        />
        <div
          className={`pointer-events-none absolute -bottom-20 -left-12 h-40 w-40 rounded-full blur-3xl ${glow.b}`}
          aria-hidden
        />

        <div className="relative z-[1] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${glow.icon}`}>
              <Icon className="h-5 w-5" strokeWidth={2.25} aria-hidden />
            </div>
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <h2 id={titleId} className="mt-4 text-lg font-bold tracking-tight text-foreground">
            {title}
          </h2>
          <div id={descId} className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              ref={cancelRef}
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                void onConfirm();
              }}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${glow.action}`}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Icon className="h-4 w-4" aria-hidden />}
              {busy ? workingLabel : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
