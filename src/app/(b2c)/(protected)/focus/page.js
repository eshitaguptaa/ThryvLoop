'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useFocus } from '@/contexts/FocusContext';
import TimerWidget from '@/components/focus/TimerWidget';
import MusicWidget from '@/components/focus/MusicWidget';
import FocusTaskBar from '@/components/focus/FocusTaskBar';

export default function FocusPage() {
  const pathname = usePathname();
  const router = useRouter();
  const { showTimer, showMusic, showTask, showTaskBar, setShowTimer, setShowMusic, setShowTask, setShowTaskBar, toggleTimer, toggleMusic } = useFocus();
  const prevPathnameRef = useRef(pathname);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handle URL-based widget toggling (for initial load or direct navigation)
  useEffect(() => {
    if (pathname === '/focus/timer') {
      setShowTimer(true);
      setShowTaskBar(true);
      router.replace('/focus');
    } else if (pathname === '/focus/music') {
      setShowMusic(true);
      router.replace('/focus');
    }
  }, [pathname, router, setShowTimer, setShowMusic, setShowTaskBar]);
  
  // Listen for widget toggle events from sidebar
  useEffect(() => {
    const handleWidgetToggle = (e) => {
      const { widget, state } = e.detail;
      if (widget === 'timer') {
        if (state) {
          setShowTimer(true);
          setShowTaskBar(true);
        } else {
          setShowTimer(false);
        }
      } else if (widget === 'music') {
        setShowMusic(state);
      } else if (widget === 'task') {
        setShowTask(state);
        setShowTaskBar(state);
      }
    };
    
    window.addEventListener('focus-widget-toggle', handleWidgetToggle);
    
    return () => {
      window.removeEventListener('focus-widget-toggle', handleWidgetToggle);
    };
  }, [setShowTimer, setShowMusic, setShowTask, setShowTaskBar]);
  
  // Listen for state requests from Sidebar
  useEffect(() => {
    const handleStateRequest = () => {
      window.dispatchEvent(new CustomEvent('focus-widget-state', {
        detail: { widget: 'timer', state: showTimer }
      }));
      window.dispatchEvent(new CustomEvent('focus-widget-state', {
        detail: { widget: 'music', state: showMusic }
      }));
      window.dispatchEvent(new CustomEvent('focus-widget-state', {
        detail: { widget: 'task', state: showTask }
      }));
    };
    
    window.addEventListener('focus-request-state', handleStateRequest);
    return () => {
      window.removeEventListener('focus-request-state', handleStateRequest);
    };
  }, [showTimer, showMusic, showTask]);

  // Broadcast widget state changes
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('focus-widget-state', {
      detail: { widget: 'timer', state: showTimer }
    }));
  }, [showTimer]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('focus-widget-state', {
      detail: { widget: 'music', state: showMusic }
    }));
  }, [showMusic]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('focus-widget-state', {
      detail: { widget: 'task', state: showTask }
    }));
  }, [showTask]);

  // Scroll to top when navigating away from focus page
  useEffect(() => {
    if (prevPathnameRef.current === '/focus' && pathname !== '/focus') {
      // We're navigating away from focus - scroll to top
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
    
    prevPathnameRef.current = pathname;
  }, [pathname]);

  // Debug: Log widget states in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Focus Widget States:', { showTimer, showMusic, showTask, showTaskBar });
    }
  }, [showTimer, showMusic, showTask, showTaskBar]);

  // Fullscreen functionality
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreenNow = !!document.fullscreenElement;
      setIsFullscreen(isFullscreenNow);
      
      // Broadcast fullscreen state change to widgets
      window.dispatchEvent(new CustomEvent('focus-fullscreen-change', {
        detail: { isFullscreen: isFullscreenNow }
      }));
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
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  return (
    <div className="relative min-h-screen bg-transparent">
      {/* Landscape background is provided by layout */}
      {showTask && <FocusTaskBar />}
      {showTimer && <TimerWidget />}
      {showMusic && <MusicWidget />}
      
      {/* Fullscreen button */}
      <button
        onClick={toggleFullscreen}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-30 w-12 h-12 rounded-2xl bg-black/40 hover:bg-black/60 backdrop-blur-xl border border-white/[0.08] hover:border-white/20 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      >
        {isFullscreen ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
          </svg>
        )}
      </button>
    </div>
  );
}

