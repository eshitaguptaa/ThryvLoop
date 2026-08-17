'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Video } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { workspaceApiFetch } from '@/lib/workspace/clientApi';
import ThemeToggle from '@/components/ThemeToggle';

export default function MeetRoom({ meetingId }) {
  const router = useRouter();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !meetingId) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await workspaceApiFetch(`/api/workspace/meet/${meetingId}`, {}, getToken);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || 'Could not load meeting');
        }
        if (!cancelled) setSession(json);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not load meeting');
          setSession(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, meetingId, getToken]);

  const openMeetPopup = useCallback(() => {
    if (!session?.meetUrl) return;
    const w = Math.min(1280, window.screen.width - 80);
    const h = Math.min(800, window.screen.height - 80);
    const left = Math.round((window.screen.width - w) / 2);
    const top = Math.round((window.screen.height - h) / 2);
    window.open(
      session.meetUrl,
      'thryvloop-google-meet',
      `noopener,noreferrer,width=${w},height=${h},left=${left},top=${top}`
    );
  }, [session?.meetUrl]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white/80">
        Loading meeting…
      </div>
    );
  }

  if (error || !session?.meetUrl) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-white/90 text-lg font-medium">{error || 'Meeting unavailable'}</p>
        <Link
          href="/home"
          className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0f0f12] text-white">
      <header className="flex shrink-0 items-center gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => router.push('/home')}
          className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/15 transition-colors"
        >
          <ArrowLeft size={16} />
          Leave
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Video size={18} className="shrink-0 text-indigo-400" />
          <p className="truncate text-sm font-semibold sm:text-base">{session.title || 'Google Meet'}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle
            variant="compact"
            className="rounded-full border border-white/15 bg-white/5 text-white/90 hover:bg-white/10"
          />
          <button
            type="button"
            onClick={openMeetPopup}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-2 text-xs font-semibold text-white/90 hover:bg-white/10 transition-colors"
          >
            <ExternalLink size={14} />
            Pop-out
          </button>
        </div>
      </header>

      <div className="relative flex flex-1 min-h-0 flex-col">
        <iframe
          title={session.title || 'Google Meet'}
          src={session.meetUrl}
          className="flex-1 w-full min-h-0 border-0 bg-black"
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="shrink-0 border-t border-white/10 bg-[#0f0f12]/95 px-4 py-2 text-center">
          <p className="text-[11px] text-white/50">
            If the meeting does not load above,{' '}
            <button
              type="button"
              onClick={openMeetPopup}
              className="font-semibold text-indigo-300 hover:text-indigo-200 underline-offset-2 hover:underline"
            >
              open Google Meet in a window
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
