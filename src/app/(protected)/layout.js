'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { MusicProvider } from '@/contexts/MusicContext';

export default function ProtectedLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    // For now, we'll use localStorage to simulate auth state
    // In production, you'd check with your auth provider
    const checkAuth = () => {
      const authToken = localStorage.getItem('authToken');
      // Check if we're in development (localhost or dev environment)
      const isDevelopment = 
        typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         process.env.NODE_ENV === 'development');
      
      if (authToken) {
        setIsAuthenticated(true);
      } else if (isDevelopment) {
        // In development mode, automatically authenticate for frontend development
        localStorage.setItem('authToken', 'dev-mode');
        setIsAuthenticated(true);
        console.log('🔧 Dev Mode: Auto-authenticated for frontend development');
      } else {
        // Redirect to landing page if not authenticated (production only)
        router.push('/');
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <MusicProvider>
      <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {!isFullscreen && <Sidebar />}
        <main className={`flex-1 ${!isFullscreen ? 'ml-24' : ''}`}>
          {children}
        </main>
      </div>
    </MusicProvider>
  );
}

