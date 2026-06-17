'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Suspense } from 'react';
import { useUser } from '@clerk/nextjs';
import Sidebar from '@/components/Sidebar';
import SpacesBackgroundVideo from '@/components/focus/SpacesBackgroundVideo';
import { MusicProvider } from '@/contexts/MusicContext';
import ThryvBotWidget from '@/components/assistant/ThryvBotWidget';
import { isSpacesPlaybackIntent } from '@/lib/spacesPlayback';
import { loadYouTubeIframeApi } from '@/lib/youtubeIframeApi';

export default function AuthenticatedAppShell({ children }) {
  const pathname = usePathname();
  const { user } = useUser();
  const userId = user?.id ?? null;
  const isMeetRoom = pathname?.startsWith('/meet');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hideSidebar = isFullscreen || isMeetRoom;

  useEffect(() => {
    if (!userId) return;
    if (isSpacesPlaybackIntent(userId)) {
      void loadYouTubeIframeApi();
    }
  }, [userId]);

  useEffect(() => {
    if (!pathname?.startsWith('/focus')) return;

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [pathname]);

  const isOnFocusRoute = pathname?.startsWith('/focus');

  useEffect(() => {
    if (!isOnFocusRoute) return;

    const html = document.documentElement;
    const prevGutter = html.style.scrollbarGutter;
    const prevOverflow = document.body.style.overflow;

    html.style.scrollbarGutter = 'auto';
    document.body.style.overflow = 'hidden';

    return () => {
      html.style.scrollbarGutter = prevGutter;
      document.body.style.overflow = prevOverflow;
    };
  }, [isOnFocusRoute]);

  return (
    <>
      <SpacesBackgroundVideo />
      <div
        className={`relative z-10 flex min-h-screen ${
          isOnFocusRoute ? 'bg-transparent' : 'bg-background'
        }`}
      >
        <MusicProvider>
          <Suspense fallback={null}>
            <Sidebar className={hideSidebar ? 'opacity-0 pointer-events-none' : ''} />
          </Suspense>
          <main className={`flex-1 min-w-0 ${hideSidebar ? '' : 'pb-[4.5rem] lg:pb-0 lg:ml-24'}`}>{children}</main>
          <ThryvBotWidget />
        </MusicProvider>
      </div>
    </>
  );
}
