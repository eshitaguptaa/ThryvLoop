'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Check, X } from 'lucide-react';
import { workspaceApiFetch } from '@/lib/workspace/clientApi';

/**
 * When a teammate joins, the inviter sees a toast in the workspace
 * (not only later on Home) and People refreshes.
 */
export default function OrgJoinNotice({ orgSlug }) {
  const router = useRouter();
  const pathname = usePathname();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const shownIds = useRef(new Set());
  const [banner, setBanner] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !orgSlug) return undefined;
    let cancelled = false;

    const tick = async () => {
      try {
        const res = await workspaceApiFetch('/api/notifications', {}, getToken);
        if (!res.ok || cancelled) return;
        const json = await res.json();
        const peoplePath = `/o/${orgSlug}/people`;
        const match = (json.notifications || []).find((item) => {
          if (!item?.id || shownIds.current.has(item.id) || item.is_read) return false;
          const url = String(item.link_url || item.linkUrl || '');
          return url.includes(peoplePath) && /joined/i.test(String(item.title || ''));
        });
        if (!match || cancelled) return;
        shownIds.current.add(match.id);
        const joinedId = String(match.link_url || match.linkUrl || '').match(/[?&]joined=([^&]+)/)?.[1] || '';
        setBanner({
          id: match.id,
          title: match.title,
          body: match.body || match.body_text || '',
          href: match.link_url || match.linkUrl || `/o/${orgSlug}/people`,
        });
        setVisible(true);
        if (pathname?.includes('/people') && joinedId) {
          router.replace(`/o/${encodeURIComponent(orgSlug)}/people?joined=${encodeURIComponent(joinedId)}`);
        } else {
          router.refresh();
        }
        await workspaceApiFetch(
          `/api/notifications/${match.id}`,
          { method: 'PATCH' },
          getToken,
        );
      } catch {
        /* ignore polling errors */
      }
    };

    void tick();
    const interval = window.setInterval(() => void tick(), 8000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [getToken, isLoaded, isSignedIn, orgSlug, pathname, router]);

  useEffect(() => {
    if (!visible) return undefined;
    const timer = window.setTimeout(() => setVisible(false), 6000);
    return () => window.clearTimeout(timer);
  }, [visible, banner?.id]);

  if (!banner) return null;

  const toast = (
    <div
      className={`ws-save-toast fixed z-[100] bottom-5 right-4 sm:bottom-6 sm:right-6 max-w-[min(22rem,calc(100vw-2rem))] cursor-pointer ${
        visible ? 'ws-save-toast--in' : 'ws-save-toast--out'
      }`}
      role="status"
      aria-live="polite"
      onClick={() => {
        if (banner.href) router.push(banner.href);
      }}
    >
      <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200/80 bg-white/95 pl-3 pr-2 py-2.5 shadow-[0_10px_32px_-12px_rgba(15,23,42,0.28)] backdrop-blur-md text-emerald-900 dark:border-emerald-500/25 dark:bg-[#0f1a14]/95 dark:text-emerald-50">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white" aria-hidden>
          <Check className="h-3.5 w-3.5" strokeWidth={2.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold tracking-tight">{banner.title}</p>
          {banner.body ? (
            <p className="text-xs mt-0.5 opacity-80 leading-snug">{banner.body}</p>
          ) : null}
        </div>
        <button
          type="button"
          className="shrink-0 rounded-lg p-1.5 text-current/50 transition-colors hover:bg-black/5 hover:text-current dark:hover:bg-white/10"
          aria-label="Dismiss"
          onClick={(event) => {
            event.stopPropagation();
            setVisible(false);
          }}
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.25} />
        </button>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(toast, document.body);
}
