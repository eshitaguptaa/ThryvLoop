'use client';

import { ClerkLoading, RedirectToSignIn, SignedIn, SignedOut } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { FocusProvider } from '@/contexts/FocusContext';
import { MusicProvider } from '@/contexts/MusicContext';
import SupabaseAuthBridge from '@/components/SupabaseAuthBridge';
import UserPreferencesHydrator from '@/components/UserPreferencesHydrator';
import SpacesBackgroundVideo from '@/components/focus/SpacesBackgroundVideo';

export default function ProtectedLayout({ children }) {
  const pathname = usePathname();
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Listen for fullscreen changes (only on focus page)
  useEffect(() => {
    if (pathname !== '/focus') return;

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

  return (
    <>
      <ClerkLoading>
        <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </ClerkLoading>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        <SupabaseAuthBridge />
        <UserPreferencesHydrator />
        <FocusProvider>
          <SpacesBackgroundVideo />
          <div className={`relative z-10 flex min-h-screen ${pathname === '/focus' ? 'bg-transparent' : 'bg-linear-to-br from-slate-900 via-purple-900 to-slate-900'}`}>
            <MusicProvider>
              {!isFullscreen && <Sidebar />}
              <main className={`flex-1 ${!isFullscreen ? 'ml-24' : ''}`}>
                {children}
              </main>
            </MusicProvider>
          </div>
        </FocusProvider>
      </SignedIn>
    </>
  );
}

