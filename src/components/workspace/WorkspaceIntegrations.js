'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { workspaceApiFetch } from '@/lib/workspace/clientApi';
import { CheckCircle2, Loader2, RefreshCw, Unlink, Sparkles } from 'lucide-react';
import { getRequiredApiFixes } from '@/lib/workspace/googleApiErrors';
import {
  formatIntegrationsQueryError,
  formatWorkspaceSyncError,
  isAuthWorkspaceError,
} from '@/lib/workspace/userMessages';
import {
  getGoogleConnectionAccess,
  getGoogleResyncMessage,
  needsGoogleResync,
} from '@/lib/workspace/googleAccess';

const GOOGLE_ICON = (
  <svg className="w-8 h-8" viewBox="0 0 24 24" aria-hidden>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

export default function WorkspaceIntegrations({
  embedded = true,
  oauthConnected = null,
  oauthError = null,
  onOAuthNoticeConsumed,
}) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [connection, setConnection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    if (!isLoaded || !isSignedIn) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await workspaceApiFetch('/api/workspace/status', {}, getToken);
      const json = await res.json();
      if (res.status === 401) {
        setToast({
          type: 'error',
          text: 'Your session expired. Refresh the page or sign in again, then retry.',
        });
        return;
      }
      if (res.ok) {
        const google = (json.connections || []).find((c) => c.provider === 'google');
        setConnection(google || null);
      }
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (oauthConnected === 'google') {
      setToast({ type: 'success', text: 'Google connected. You can sync anytime from here.' });
      void load();
      onOAuthNoticeConsumed?.();
    } else if (oauthError) {
      const text = formatIntegrationsQueryError(oauthError);
      if (text) setToast({ type: 'error', text });
      onOAuthNoticeConsumed?.();
    }
  }, [oauthConnected, oauthError, onOAuthNoticeConsumed, load]);

  const syncNow = async () => {
    if (!isLoaded || !isSignedIn) {
      setToast({ type: 'error', text: 'Sign in to sync.' });
      return;
    }
    setSyncing(true);
    try {
      const res = await workspaceApiFetch('/api/workspace/sync', { method: 'POST' }, getToken);
      const json = await res.json();
      if (res.status === 401) {
        throw new Error('Your session expired. Refresh the page or sign in again, then retry.');
      }
      if (!res.ok) throw new Error(json.error || 'Sync failed');
      const googleResult = (json.results || []).find((r) => r.provider === 'google');
      await load();
      if (googleResult?.ok) {
        const parts = [];
        if (googleResult.calendarOk) parts.push('Calendar');
        if (googleResult.gmailOk) parts.push('Gmail');
        const syncedLabel = parts.length ? parts.join(' & ') : 'Google account';
        setToast({ type: 'success', text: `${syncedLabel} synced.` });
        return;
      }
      if (googleResult && !googleResult.ok) {
        throw new Error(googleResult.error || 'Sync failed');
      }
      setToast({ type: 'success', text: 'Sync complete.' });
    } catch (e) {
      setToast({ type: 'error', text: e instanceof Error ? e.message : 'Sync failed' });
      await load();
    } finally {
      setSyncing(false);
    }
  };

  const disconnect = async () => {
    setDisconnecting(true);
    try {
      const res = await workspaceApiFetch(
        '/api/workspace/disconnect',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider: 'google' }),
        },
        getToken
      );
      if (res.status === 401) {
        setToast({ type: 'error', text: 'Sign in again.' });
        return;
      }
      await load();
      setToast({ type: 'success', text: 'Disconnected.' });
    } catch {
      setToast({ type: 'error', text: 'Could not disconnect.' });
    } finally {
      setDisconnecting(false);
    }
  };

  const isConnected = Boolean(connection);
  const syncErrorDisplay = formatWorkspaceSyncError(connection?.sync_error);
  const showReconnectHint = Boolean(connection && isAuthWorkspaceError(connection?.sync_error));
  const apiFixes = getRequiredApiFixes(syncErrorDisplay || connection?.sync_error);
  const googleAccess = getGoogleConnectionAccess(connection);
  const resyncMessage = getGoogleResyncMessage(googleAccess);
  const showResyncHint = Boolean(isConnected && needsGoogleResync(googleAccess));

  const cardClass = embedded
    ? 'rounded-2xl border border-white/[0.06] bg-[#141416]/80 overflow-hidden backdrop-blur-sm'
    : 'bg-card rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.12)] border border-border overflow-hidden';

  return (
    <section className={embedded ? cardClass : `max-w-lg mx-auto ${cardClass}`}>
      <div className={embedded ? 'p-6 pb-4 border-b border-white/[0.06]' : 'px-6 sm:px-8 pt-8 pb-6 border-b border-border'}>
        <div className="flex items-start gap-4">
          <div
            className={
              embedded
                ? 'shrink-0 w-12 h-12 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center'
                : 'shrink-0 w-12 h-12 rounded-xl bg-card shadow-md border border-border flex items-center justify-center'
            }
          >
            {GOOGLE_ICON}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={`text-base font-semibold ${embedded ? 'text-white' : 'text-foreground'}`}>
              Google Workspace
            </h3>
            <p className={`text-sm mt-1 leading-relaxed ${embedded ? 'text-white/50' : 'text-muted-foreground'}`}>
              Calendar meetings and unread Gmail on your dashboard.
            </p>
          </div>
        </div>
      </div>

      {toast ? (
        <div
          className={`mx-6 mt-4 rounded-xl px-4 py-3 text-sm ${
            toast.type === 'success'
              ? embedded
                ? 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20'
                : 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/60'
              : embedded
                ? 'bg-red-500/10 text-red-300 ring-1 ring-red-500/20'
                : 'bg-red-50 text-red-800 ring-1 ring-red-200/60'
          }`}
        >
          {toast.text}
        </div>
      ) : null}

      {loading ? (
        <div className={`flex justify-center py-12 ${embedded ? 'text-white/40' : 'text-muted-foreground'}`}>
          <Loader2 className="w-7 h-7 animate-spin" />
        </div>
      ) : (
        <>
          <div className={embedded ? 'px-6 py-4 border-b border-white/[0.06]' : 'px-6 sm:px-8 py-4 border-b border-border'}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wider ${embedded ? 'text-white/40' : 'text-muted-foreground'}`}>
                  Account
                </p>
                {isConnected ? (
                  <p className={`text-sm font-semibold mt-1 truncate ${embedded ? 'text-white' : 'text-foreground'}`}>
                    {connection.account_email}
                  </p>
                ) : (
                  <p className={`text-sm font-medium mt-1 ${embedded ? 'text-white/40' : 'text-muted-foreground'}`}>
                    Not connected
                  </p>
                )}
              </div>
              {isConnected ? (
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 ${
                    embedded ? 'text-emerald-300 bg-emerald-500/15' : 'text-emerald-700 bg-emerald-50'
                  }`}
                >
                  <CheckCircle2 size={14} />
                  Linked
                </span>
              ) : (
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 ${
                    embedded ? 'text-white/50 bg-white/[0.06]' : 'text-muted-foreground bg-muted'
                  }`}
                >
                  <Sparkles size={14} />
                  Optional
                </span>
              )}
            </div>
            {connection?.last_synced_at ? (
              <p className={`text-xs mt-3 ${embedded ? 'text-white/35' : 'text-muted-foreground'}`}>
                Last synced {new Date(connection.last_synced_at).toLocaleString()}
              </p>
            ) : null}
          </div>

          {showReconnectHint ? (
            <div
              className={
                embedded
                  ? 'px-6 py-3 bg-indigo-500/10 border-b border-indigo-500/15'
                  : 'px-6 sm:px-8 py-4 bg-indigo-50/80 border-b border-indigo-100/80'
              }
            >
              <p className={`text-sm leading-relaxed ${embedded ? 'text-indigo-200' : 'text-indigo-950'}`}>
                Your Google session needs a quick resync. Use Resync Google below — no need to disconnect.
              </p>
            </div>
          ) : null}

          {showResyncHint ? (
            <div
              className={
                embedded
                  ? 'px-6 py-3 bg-indigo-500/10 border-b border-indigo-500/15'
                  : 'px-6 sm:px-8 py-4 bg-indigo-50/80 border-b border-indigo-100/80'
              }
            >
              <p className={`text-sm leading-relaxed ${embedded ? 'text-indigo-200' : 'text-indigo-950'}`}>
                {resyncMessage}
              </p>
              <a
                href="/api/workspace/connect/google"
                className={`inline-flex items-center gap-1.5 mt-2 text-xs font-semibold ${embedded ? 'text-[#c4b5fd] hover:text-white' : 'text-indigo-600 hover:text-indigo-800'}`}
              >
                Resync Google account →
              </a>
            </div>
          ) : null}

          {syncErrorDisplay ? (
            <div
              className={
                embedded
                  ? 'px-6 py-3 bg-white/[0.03] border-b border-white/[0.06]'
                  : 'px-6 sm:px-8 py-4 bg-muted/80 border-b border-border'
              }
            >
              <p className={`text-sm leading-relaxed ${embedded ? 'text-white/70' : 'text-foreground'}`}>
                {syncErrorDisplay}
              </p>
              {apiFixes.length > 0 ? (
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                  {apiFixes.map((fix) => (
                    <a
                      key={fix.id}
                      href={fix.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-xs font-medium ${embedded ? 'text-[#a78bfa] hover:text-[#c4b5fd]' : 'text-indigo-600 hover:text-indigo-800'}`}
                    >
                      {fix.label} →
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className={`px-6 py-5 flex flex-col sm:flex-row gap-3 ${embedded ? '' : 'sm:px-8'}`}>
            {isConnected ? (
              <>
                <button
                  type="button"
                  disabled={syncing || disconnecting}
                  onClick={syncNow}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors ${
                    embedded
                      ? 'bg-[#8b5cf6] text-white hover:bg-[#7c3aed]'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw size={16} />}
                  Sync now
                </button>
                <button
                  type="button"
                  disabled={disconnecting || syncing}
                  onClick={disconnect}
                  className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors ${
                    embedded
                      ? 'border border-white/10 text-white/70 hover:bg-white/[0.06]'
                      : 'border border-border text-muted-foreground hover:bg-muted/60'
                  }`}
                >
                  {disconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlink size={16} />}
                  Disconnect
                </button>
              </>
            ) : (
              <a
                href="/api/workspace/connect/google"
                className={`flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold transition-colors ${
                  embedded
                    ? 'bg-white text-gray-900 hover:bg-white/90'
                    : 'bg-foreground text-background hover:bg-foreground/90'
                }`}
              >
                Connect with Google
              </a>
            )}
          </div>

          <ul className={`px-6 pb-6 text-xs space-y-1 ${embedded ? 'text-white/35' : 'text-muted-foreground'}`}>
            <li>
              · Calendar — meetings &amp; availability
              {isConnected ? (
                <span className={googleAccess.calendarGranted ? ' text-emerald-500' : ''}>
                  {googleAccess.calendarGranted ? ' · enabled' : ' · not enabled'}
                </span>
              ) : null}
            </li>
            <li>
              · Gmail — unread messages in alerts
              {isConnected ? (
                <span className={googleAccess.gmailGranted ? ' text-emerald-500' : ''}>
                  {googleAccess.gmailGranted ? ' · enabled' : ' · not enabled'}
                </span>
              ) : null}
            </li>
          </ul>
        </>
      )}
    </section>
  );
}
