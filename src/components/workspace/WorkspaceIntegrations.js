'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { workspaceApiFetch } from '@/lib/workspace/clientApi';
import { CheckCircle2, Loader2, RefreshCw, Unlink, ArrowLeft, Sparkles } from 'lucide-react';
import { getRequiredApiFixes } from '@/lib/workspace/googleApiErrors';
import {
  formatIntegrationsQueryError,
  formatWorkspaceSyncError,
  isAuthWorkspaceError,
} from '@/lib/workspace/userMessages';

const GOOGLE_ICON = (
  <svg className="w-10 h-10" viewBox="0 0 24 24" aria-hidden>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

export default function WorkspaceIntegrations() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const searchParams = useSearchParams();
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
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    if (connected === 'google') {
      setToast({ type: 'success', text: 'Google connected. Run sync to pull calendar and Gmail.' });
    } else if (error) {
      const text = formatIntegrationsQueryError(error);
      if (text) setToast({ type: 'error', text });
    }
  }, [searchParams]);

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
      if (googleResult && !googleResult.ok) {
        if (googleResult.calendarOk && !googleResult.gmailOk) {
          await load();
          setToast({ type: 'error', text: 'Calendar synced. Gmail still pending—retry in a few minutes.' });
          return;
        }
        throw new Error(googleResult.error || 'Sync failed');
      }
      await load();
      setToast({ type: 'success', text: 'Calendar and Gmail are synced.' });
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

  const syncErrorDisplay = formatWorkspaceSyncError(connection?.sync_error);
  const showReconnectHint = Boolean(connection && isAuthWorkspaceError(connection?.sync_error));
  const apiFixes = getRequiredApiFixes(syncErrorDisplay || connection?.sync_error);
  const isConnected = Boolean(connection);

  return (
    <div className="max-w-lg mx-auto">
      <Link
        href="/home"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 mb-8 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to dashboard
      </Link>

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-md border border-gray-100 mb-4">
          {GOOGLE_ICON}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Google Workspace</h1>
        <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto leading-relaxed">
          Calendar meetings and unread Gmail on your dashboard. Meeting time counts toward productive hours.
        </p>
      </div>

      {toast ? (
        <div
          className={`mb-6 rounded-2xl px-4 py-3 text-sm text-center ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/60'
              : 'bg-red-50 text-red-800 ring-1 ring-red-200/60'
          }`}
        >
          {toast.text}
        </div>
      ) : null}

      <div className="bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.12)] border border-gray-100/80 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <>
            <div className="px-6 sm:px-8 pt-8 pb-6 border-b border-gray-50">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Account</p>
                  {isConnected ? (
                    <p className="text-base font-semibold text-gray-900 mt-1">{connection.account_email}</p>
                  ) : (
                    <p className="text-base font-medium text-gray-400 mt-1">Not connected</p>
                  )}
                </div>
                {isConnected ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
                    <CheckCircle2 size={14} />
                    Linked
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                    <Sparkles size={14} />
                    Optional
                  </span>
                )}
              </div>
              {connection?.last_synced_at ? (
                <p className="text-xs text-gray-400 mt-3">
                  Last synced {new Date(connection.last_synced_at).toLocaleString()}
                </p>
              ) : null}
            </div>

            {showReconnectHint ? (
              <div className="px-6 sm:px-8 py-4 bg-indigo-50/80 border-b border-indigo-100/80">
                <p className="text-sm text-indigo-950 leading-relaxed">
                  Your Google connection expired. Disconnect below, then connect again to restore calendar and
                  Gmail.
                </p>
              </div>
            ) : null}

            {syncErrorDisplay ? (
              <div className="px-6 sm:px-8 py-4 bg-gray-50/80 border-b border-gray-100">
                <p className="text-sm text-gray-700 leading-relaxed">{syncErrorDisplay}</p>
                {apiFixes.length > 0 ? (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                    {apiFixes.map((fix) => (
                      <a
                        key={fix.id}
                        href={fix.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        {fix.label} →
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="px-6 sm:px-8 py-6 flex flex-col sm:flex-row gap-3">
              {isConnected ? (
                <>
                  <button
                    type="button"
                    disabled={syncing || disconnecting}
                    onClick={syncNow}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {syncing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw size={16} />
                    )}
                    Sync now
                  </button>
                  <button
                    type="button"
                    disabled={disconnecting || syncing}
                    onClick={disconnect}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    {disconnecting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Unlink size={16} />
                    )}
                    Disconnect
                  </button>
                </>
              ) : (
                <a
                  href="/api/workspace/connect/google"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
                >
                  Connect with Google
                </a>
              )}
            </div>

            <ul className="px-6 sm:px-8 pb-8 text-xs text-gray-400 space-y-1.5">
              <li>· Calendar — meetings & availability</li>
              <li>· Gmail — unread messages in alerts</li>
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
