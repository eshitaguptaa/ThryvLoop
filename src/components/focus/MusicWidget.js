'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useFocus } from '@/contexts/FocusContext';
import { removeUserStorageItem, setUserStorageJson } from '@/utils/userStorage';
import { getDefaultMusicWidgetPosition } from '@/lib/focusWidgetLayout';
import { useSoundscapePlayback } from '@/hooks/useSoundscapePlayback';

export default function MusicWidget() {
  const { setShowMusic } = useFocus();
  const { user } = useUser();
  const userId = user?.id || null;
  const pathname = usePathname();
  const { displaySounds, showAsPlaying, togglePlayPause, openComposer } =
    useSoundscapePlayback(userId);
  const [position, setPosition] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [currentSoundIndex, setCurrentSoundIndex] = useState(0);
  const widgetRef = useRef(null);
  const userPositionedRef = useRef(false);

  useEffect(() => {
    if (displaySounds.length <= 1) {
      setCurrentSoundIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setCurrentSoundIndex((prev) => (prev + 1) % displaySounds.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [displaySounds.length]);

  const applyDefaultLayout = () => {
    setPosition(getDefaultMusicWidgetPosition());
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updatePosition = () => {
      if (!userPositionedRef.current) {
        setPosition(getDefaultMusicWidgetPosition());
      }
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

  useEffect(() => {
    if (typeof window === 'undefined' || !position) return;
    setUserStorageJson(userId, 'focus-music-position', position);
  }, [position, userId]);

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      removeUserStorageItem(userId, 'focus-music-position');
    }
    userPositionedRef.current = false;
    applyDefaultLayout();
    setShowMusic(false);
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('button')) return;
    if (!position) return;

    userPositionedRef.current = true;
    setIsDragging(true);
    const rect = widgetRef.current?.getBoundingClientRect();
    if (rect) {
      setDragStart({
        x: e.clientX - rect.left - rect.width / 2,
        y: e.clientY - rect.top - rect.height / 2,
      });
    }
  };

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

  const handleSkipForward = () => {
    if (displaySounds.length > 1) {
      setCurrentSoundIndex((prev) => (prev + 1) % displaySounds.length);
    }
  };

  const isOnFocus = pathname?.startsWith('/focus');

  if (!position) return null;

  return (
    <div
      ref={widgetRef}
      className="fixed z-30 pointer-events-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -50%)',
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
        <button
          onClick={handleClose}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-neutral-800 text-white/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:text-white cursor-pointer"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="shrink-0 w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
          {showAsPlaying ? (
            <div className="flex items-end justify-center gap-[3px] h-5 mb-0.5">
              <div
                className="w-1 bg-[#a855f7] rounded-full"
                style={{
                  height: '40%',
                  animation: 'barDance 1s ease-in-out infinite',
                  animationDelay: '0s',
                }}
              />
              <div
                className="w-1 bg-[#a855f7] rounded-full"
                style={{
                  height: '80%',
                  animation: 'barDance 1.2s ease-in-out infinite',
                  animationDelay: '0.1s',
                }}
              />
              <div
                className="w-1 bg-[#a855f7] rounded-full"
                style={{
                  height: '60%',
                  animation: 'barDance 0.8s ease-in-out infinite',
                  animationDelay: '0.2s',
                }}
              />
              <div
                className="w-1 bg-[#a855f7] rounded-full"
                style={{
                  height: '90%',
                  animation: 'barDance 1.1s ease-in-out infinite',
                  animationDelay: '0.3s',
                }}
              />
            </div>
          ) : (
            <svg className="w-5 h-5 text-white/30" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col items-center justify-center px-4 overflow-hidden">
          <div className="relative w-full h-6 overflow-hidden">
            <div
              className="flex flex-col transition-transform duration-500 ease-in-out items-center"
              style={{
                transform: `translateY(-${currentSoundIndex * 24}px)`,
              }}
            >
              {displaySounds.length > 0 ? (
                displaySounds.map((sound, index) => (
                  <div
                    key={`${sound.id}-${index}`}
                    className="h-6 w-full text-white font-medium text-[15px] whitespace-nowrap text-center truncate tracking-wide"
                  >
                    {sound.name}
                  </div>
                ))
              ) : (
                <div className="h-6 text-white/50 font-medium text-[15px]">
                  {showAsPlaying ? 'Spaces' : 'Paused'}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center shrink-0 gap-3">
          <button
            onClick={handleSkipForward}
            className="flex items-center justify-center text-white/40 hover:text-white transition-colors cursor-pointer"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>

          <button
            onClick={togglePlayPause}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white shadow-[0_0_15px_rgba(139,92,246,0.5)] hover:shadow-[0_0_20px_rgba(139,92,246,0.7)] transition-all transform hover:scale-105 cursor-pointer"
          >
            {showAsPlaying ? (
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

          <button
            onClick={openComposer}
            className="flex flex-col items-center justify-center gap-[2px] text-white/40 hover:text-white transition-colors cursor-pointer"
            title="Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes barDance {
          0%,
          100% {
            transform: scaleY(0.4);
          }
          50% {
            transform: scaleY(1);
          }
        }
      `}</style>
    </div>
  );
}
