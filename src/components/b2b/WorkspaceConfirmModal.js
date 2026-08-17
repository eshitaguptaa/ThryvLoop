'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { AlertTriangle, Loader2, LogOut, Trash2, X } from 'lucide-react';
import { createPortal } from 'react-dom';

/**
 * ThryvLoop-themed confirm dialog for leave / delete workspace.
 *
 * @param {{
 *   open: boolean,
 *   variant: 'leave' | 'delete',
 *   workspaceName: string,
 *   busy?: boolean,
 *   error?: string,
 *   onCancel: () => void,
 *   onConfirm: () => void | Promise<void>,
 * }} props
 */
export default function WorkspaceConfirmModal({
  open,
  variant,
  workspaceName,
  busy = false,
  error = '',
  onCancel,
  onConfirm,
}) {
  const titleId = useId();
  const descId = useId();
  const inputRef = useRef(/** @type {HTMLInputElement | null} */ (null));
  const [typed, setTyped] = useState('');
  const [mounted, setMounted] = useState(false);

  const isDelete = variant === 'delete';
  const name = workspaceName || 'this workspace';
  const requireMatch = isDelete;
  const nameMatches = !requireMatch || typed.trim() === name.trim();
  const canConfirm = !busy && nameMatches;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setTyped('');
      return undefined;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = window.setTimeout(() => {
      if (requireMatch) inputRef.current?.focus();
    }, 40);
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, busy, onCancel, requireMatch]);

  if (!open || !mounted) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
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
        className="ws-confirm-modal relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_64px_-20px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-[#121826] dark:shadow-[0_24px_64px_-16px_rgba(0,0,0,0.75)]"
      >
        <div
          className={`pointer-events-none absolute -top-24 -right-16 h-48 w-48 rounded-full blur-3xl ${
            isDelete ? 'bg-rose-500/25' : 'bg-[#5D3FD3]/25'
          }`}
          aria-hidden
        />
        <div
          className={`pointer-events-none absolute -bottom-20 -left-12 h-40 w-40 rounded-full blur-3xl ${
            isDelete ? 'bg-orange-500/15' : 'bg-sky-500/15'
          }`}
          aria-hidden
        />

        <div className="relative z-[1] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                isDelete
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                  : 'bg-[#5D3FD3]/12 text-[#5D3FD3] dark:text-[#c4b5fd]'
              }`}
            >
              {isDelete ? (
                <Trash2 className="h-5 w-5" strokeWidth={2.25} aria-hidden />
              ) : (
                <LogOut className="h-5 w-5" strokeWidth={2.25} aria-hidden />
              )}
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
            {isDelete ? 'Delete workspace' : 'Leave workspace'}
          </h2>
          <p id={descId} className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {isDelete ? (
              <>
                This permanently deletes{' '}
                <span className="font-semibold text-foreground">{name}</span> for everyone —
                tasks, members, and shared data. This cannot be undone.
              </>
            ) : (
              <>
                You will lose access to shared work in{' '}
                <span className="font-semibold text-foreground">{name}</span>. You can rejoin
                later if invited again. If you are the last member, the workspace will be deleted.
              </>
            )}
          </p>

          {isDelete ? (
            <div className="mt-4 rounded-xl border border-rose-200/70 bg-rose-50/80 px-3 py-2.5 dark:border-rose-500/25 dark:bg-rose-950/30">
              <p className="flex items-start gap-2 text-xs font-medium text-rose-800 dark:text-rose-200 leading-relaxed">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                Type the workspace name to confirm deletion.
              </p>
              <label className="mt-2.5 block">
                <span className="sr-only">Workspace name</span>
                <input
                  ref={inputRef}
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  disabled={busy}
                  placeholder={name}
                  autoComplete="off"
                  spellCheck={false}
                  className="mt-1 w-full rounded-lg border border-rose-200/80 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-rose-400/40 dark:border-rose-500/30"
                />
              </label>
            </div>
          ) : null}

          {error ? (
            <p className="mt-3 text-sm font-medium text-rose-600 dark:text-rose-300" role="alert">
              {error}
            </p>
          ) : null}

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canConfirm}
              onClick={() => {
                void onConfirm();
              }}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed ${
                isDelete
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-600/25'
                  : 'bg-[#5D3FD3] hover:bg-[#4c33b8] shadow-sm shadow-[#5D3FD3]/25'
              }`}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {busy
                ? isDelete
                  ? 'Deleting…'
                  : 'Leaving…'
                : isDelete
                  ? 'Delete forever'
                  : 'Leave workspace'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
