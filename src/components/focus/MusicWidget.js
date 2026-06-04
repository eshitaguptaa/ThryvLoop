'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useFocus } from '@/contexts/FocusContext';
import { getUserStorageItem, removeUserStorageItem, setUserStorageItem, setUserStorageJson } from '@/utils/userStorage';

export default function MusicWidget() {
  const { setShowMusic } = useFocus();
  const { user } = useUser();
  const userId = user?.id || null;
  const pathname = usePathname();
  const [activeSounds, setActiveSounds] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [currentSoundIndex, setCurrentSoundIndex] = useState(0);
  const widgetRef = useRef(null);
  const globalVolumeRef = useRef(75);

  // Helper to check if Spaces is actually playing
  const checkSpacesPlaying = () => {
    if (typeof window === 'undefined') return false;
    const videoId = getUserStorageItem(userId, 'focus-background-video-id', 'focus-background-video-id');
    const volume = getUserStorageItem(userId, 'focus-video-volume', 'focus-video-volume');
    return !!(videoId && volume && parseInt(volume) > 0);
  };

  const getSessionActive = () => {
    if (typeof window === 'undefined') return false;
    const saved = getUserStorageItem(userId, 'soundscape-session-active', 'soundscape-session-active');
    return saved === 'true';
  };

  const setSessionActive = (value) => {
    if (typeof window === 'undefined') return;
    setUserStorageItem(userId, 'soundscape-session-active', value ? 'true' : 'false');
  };

  // Get active sounds from localStorage (synced with SoundscapeComposer)
  useEffect(() => {
    const loadActiveSounds = () => {
      if (typeof window === 'undefined') return;
      
      try {
        const saved = getUserStorageItem(userId, 'soundscape-active-sounds', 'soundscape-active-sounds');
        let filteredSounds = [];
        if (saved) {
          const sounds = JSON.parse(saved);
          filteredSounds = sounds.filter(sound => {
            if (sound.id === 'spaces') {
              return checkSpacesPlaying();
            }
            return true;
          });
        }
        
        const spacesPlaying = checkSpacesPlaying();
        const hasSpaces = filteredSounds.some(s => s.id === 'spaces');
        if (spacesPlaying && !hasSpaces) {
          const spacesVolume = getUserStorageItem(userId, 'focus-video-volume', 'focus-video-volume');
          filteredSounds.push({
            id: 'spaces',
            name: 'Spaces',
            volume: spacesVolume ? parseInt(spacesVolume) : 50,
            category: 'Atmosphere'
          });
        }
        
        setActiveSounds(filteredSounds);
        
        const savedVolume = getUserStorageItem(userId, 'soundscape-global-volume', 'soundscape-global-volume');
        if (savedVolume) {
          globalVolumeRef.current = parseInt(savedVolume) || 75;
        }
        
        const hasActiveSounds = filteredSounds.length > 0;
        if (pathname === '/focus') {
          setSessionActive(true);
        }
        const sessionActive = getSessionActive();
        if (!sessionActive) {
          setIsPlaying(false);
        } else {
          const savedPlaying = getUserStorageItem(userId, 'soundscape-is-playing', 'soundscape-is-playing');
          setIsPlaying(savedPlaying === 'true');
        }
      } catch (e) {
        console.error('Error loading active sounds:', e);
      }
    };

    loadActiveSounds();

    const handlePlayPauseChange = (e) => {
      if (e.detail?.isPlaying !== undefined) {
        setIsPlaying(e.detail.isPlaying);
      }
    };
    
    const handleSpacesVolumeChange = (e) => {
      if (e.detail?.playbackOnly) return;
      loadActiveSounds();
    };
    
    const handleStopAll = () => {
      setIsPlaying(false);
      setActiveSounds([]);
    };
    
    window.addEventListener('soundscape-play-pause-changed', handlePlayPauseChange);
    window.addEventListener('focus-volume-changed', handleSpacesVolumeChange);
    window.addEventListener('soundscape-stop-all', handleStopAll);

    const interval = setInterval(loadActiveSounds, 500);

    return () => {
      window.removeEventListener('soundscape-play-pause-changed', handlePlayPauseChange);
      window.removeEventListener('focus-volume-changed', handleSpacesVolumeChange);
      window.removeEventListener('soundscape-stop-all', handleStopAll);
      clearInterval(interval);
    };
  }, [userId, pathname]);


  // Cycle through sounds
  useEffect(() => {
    if (activeSounds.length <= 1) {
      setCurrentSoundIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setCurrentSoundIndex((prev) => (prev + 1) % activeSounds.length);
    }, 3000); 
    return () => clearInterval(interval);
  }, [activeSounds.length]);

  // Play/pause is dispatched from the widget toggle and SoundscapeComposer — not on every state sync.

  // Initialize position
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updatePosition = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      
      const centerX = vw / 2;
      const bottomMargin = Math.max(50, Math.min(120, vh * 0.1));
      const musicCenterY = vh - bottomMargin;
      
      setPosition({ x: centerX, y: musicCenterY });
    };
    
    updatePosition();
    
    const handleFullscreenChange = () => {
      setTimeout(updatePosition, 100);
    };
    
    window.addEventListener('focus-fullscreen-change', handleFullscreenChange);
    window.addEventListener('resize', updatePosition);
    
    return () => {
      window.removeEventListener('focus-fullscreen-change', handleFullscreenChange);
      window.removeEventListener('resize', updatePosition);
    };
  }, []);

  // Save position
  useEffect(() => {
    if (typeof window === 'undefined' || !position) return;
    setUserStorageJson(userId, 'focus-music-position', position);
  }, [position, userId]);

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      removeUserStorageItem(userId, 'focus-music-position');
    }
    setShowMusic(false);
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('button')) return;
    if (!position) return;
    
    setIsDragging(true);
    const rect = widgetRef.current?.getBoundingClientRect();
    if (rect) {
      setDragStart({
        x: e.clientX - rect.left - (rect.width / 2),
        y: e.clientY - rect.top - (rect.height / 2)
      });
    }
  };

  // Drag effect
  useEffect(() => {
    if (!isDragging || !position) return;

    const handleMouseMove = (e) => {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      const widgetWidth = 420; 
      const widgetHeight = 64; 
      const halfWidth = widgetWidth / 2;
      const halfHeight = widgetHeight / 2;
      const boundedX = Math.max(halfWidth, Math.min(newX, window.innerWidth - halfWidth));
      const boundedY = Math.max(halfHeight, Math.min(newY, window.innerHeight - halfHeight));
      
      setPosition({ x: boundedX, y: boundedY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, position]);

  const togglePlayPause = () => {
    const newPlayingState = !isPlaying;
    setIsPlaying(newPlayingState);
    if (typeof window !== 'undefined') {
      if (newPlayingState) {
        setSessionActive(true);
      }
      setUserStorageItem(userId, 'soundscape-is-playing', newPlayingState.toString());
      window.dispatchEvent(new CustomEvent('soundscape-play-pause-changed', {
        detail: { isPlaying: newPlayingState }
      }));
    }
  };

  const handleSkipForward = () => {
    if (activeSounds.length > 1) {
      setCurrentSoundIndex((prev) => (prev + 1) % activeSounds.length);
    }
  };

  const handleSoundscapeClick = () => {
    window.dispatchEvent(new CustomEvent('open-soundscape-composer'));
  };

  const currentSound = activeSounds.length > 0 
    ? activeSounds[currentSoundIndex] 
    : null;

  if (!position) return null;

  return (
    <div 
      ref={widgetRef}
      className="fixed z-30 pointer-events-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <div 
        className={`
          group
          bg-neutral-900/60 backdrop-blur-2xl 
          rounded-full shadow-2xl border border-white/5 
          flex items-center justify-between
          pointer-events-auto relative 
          transition-transform duration-200
          ${isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab'}
        `}
        style={{ 
          width: '420px',
          height: '68px',
          padding: '8px 16px',
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Hidden Close button (appears on hover) */}
        <button
          onClick={handleClose}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-neutral-800 text-white/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:text-white"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* LEFT: Visualizer Icon */}
        <div className="shrink-0 w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
          {isPlaying && activeSounds.length > 0 ? (
            <div className="flex items-end justify-center gap-[3px] h-5 mb-0.5">
              <div 
                className="w-1 bg-[#a855f7] rounded-full"
                style={{
                  height: '40%',
                  animation: 'barDance 1s ease-in-out infinite',
                  animationDelay: '0s'
                }}
              />
              <div 
                className="w-1 bg-[#a855f7] rounded-full"
                style={{
                  height: '80%',
                  animation: 'barDance 1.2s ease-in-out infinite',
                  animationDelay: '0.1s'
                }}
              />
              <div 
                className="w-1 bg-[#a855f7] rounded-full"
                style={{
                  height: '60%',
                  animation: 'barDance 0.8s ease-in-out infinite',
                  animationDelay: '0.2s'
                }}
              />
              <div 
                className="w-1 bg-[#a855f7] rounded-full"
                style={{
                  height: '90%',
                  animation: 'barDance 1.1s ease-in-out infinite',
                  animationDelay: '0.3s'
                }}
              />
            </div>
          ) : (
             <svg className="w-5 h-5 text-white/30" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
             </svg>
          )}
        </div>

        {/* CENTER: Text Info */}
        <div className="flex-1 min-w-0 flex flex-col items-center justify-center px-4 overflow-hidden">
          <div className="relative w-full h-6 overflow-hidden">
            <div 
              className="flex flex-col transition-transform duration-500 ease-in-out items-center"
              style={{
                transform: `translateY(-${currentSoundIndex * 24}px)`
              }}
            >
              {activeSounds.length > 0 ? (
                activeSounds.map((sound, index) => (
                  <div
                    key={`${sound.id}-${index}`}
                    className="h-6 w-full text-white font-medium text-[15px] whitespace-nowrap text-center truncate tracking-wide"
                  >
                    {sound.name}
                  </div>
                ))
              ) : (
                <div className="h-6 text-white/50 font-medium text-[15px]">Paused</div>
              )}
            </div>
          </div>
          {/* Optional Subtext if needed, for now hidden to match clean look */}
        </div>

        {/* RIGHT: Controls */}
        <div className="flex items-center shrink-0 gap-3">
          {/* Skip / Next */}
          <button 
            onClick={handleSkipForward}
            className="flex items-center justify-center text-white/40 hover:text-white transition-colors"
          >
             <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
               <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
             </svg>
          </button>

          {/* Play/Pause Main Button */}
          <button
            onClick={togglePlayPause}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white shadow-[0_0_15px_rgba(139,92,246,0.5)] hover:shadow-[0_0_20px_rgba(139,92,246,0.7)] transition-all transform hover:scale-105"
          >
            {isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Settings - opens same modal as sidebar Settings */}
          <button 
            onClick={handleSoundscapeClick}
            className="flex flex-col items-center justify-center gap-[2px] text-white/40 hover:text-white transition-colors"
            title="Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes barDance {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}