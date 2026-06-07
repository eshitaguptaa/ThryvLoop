'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import SpacesBackgroundVideo from '@/components/focus/SpacesBackgroundVideo';
import { MusicProvider } from '@/contexts/MusicContext';
import ThryvBotWidget from '@/components/assistant/ThryvBotWidget';

export default function AuthenticatedAppShell({ children }) {
  const pathname = usePathname();
  const isMeetRoom = pathname?.startsWith('/meet');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hideSidebar = isFullscreen || isMeetRoom;

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

  return (
    <>
      <SpacesBackgroundVideo />
      <div
        className={`relative z-10 flex min-h-screen ${
          isOnFocusRoute
            ? 'bg-transparent'
            : 'bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-background dark:via-surface dark:to-background'
        }`}
      >
        <MusicProvider>
          <Suspense fallback={null}>
            <Sidebar className={hideSidebar ? 'opacity-0 pointer-events-none' : ''} />
          </Suspense>
          <main className={`flex-1 min-w-0 ${hideSidebar ? '' : 'ml-24'}`}>{children}</main>
          <ThryvBotWidget />
        </MusicProvider>
      </div>
    </>
  );
}
