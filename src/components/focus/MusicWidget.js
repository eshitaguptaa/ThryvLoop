'use client';

import { useState, useEffect, useRef } from 'react';
import { useFocus } from '@/contexts/FocusContext';
import { useMusic } from '@/contexts/MusicContext';

export default function MusicWidget() {
  const { setShowMusic } = useFocus();
  const { 
    isPlaying, 
    currentTime, 
    duration, 
    isMuted,
    togglePlayPause, 
    skipBackward, 
    skipForward,
    toggleMute
  } = useMusic();
  const [position, setPosition] = useState(null);
  const [size, setSize] = useState({ width: 500, height: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, left: 0, top: 0 });
  const widgetRef = useRef(null);

  // Initialize default position and size (always use defaults on mount)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updatePositionAndSize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      
      // Responsive sizing: clamp between min and max, scale with viewport
      const baseWidth = 500;
      const baseHeight = 100;
      const minWidth = Math.min(350, vw * 0.75);
      const maxWidth = Math.min(650, vw * 0.85);
      const minHeight = Math.min(80, vh * 0.08);
      const maxHeight = Math.min(120, vh * 0.12);
      
      // Scale based on viewport
      const widthScale = Math.min(1, vw / 1440);
      const heightScale = Math.min(1, vh / 900);
      const scale = Math.min(widthScale, heightScale, 1.2);
      
      const responsiveWidth = Math.max(minWidth, Math.min(maxWidth, baseWidth * scale));
      const responsiveHeight = Math.max(minHeight, Math.min(maxHeight, baseHeight * scale));
      
      // Music widget: centered horizontally, positioned further down
      const centerX = vw / 2;
      // Responsive bottom margin: use percentage of viewport height
      const bottomMargin = Math.max(50, Math.min(120, vh * 0.1));
      const musicCenterY = vh - bottomMargin;
      
      setPosition({ x: centerX, y: musicCenterY });
      setSize({ width: responsiveWidth, height: responsiveHeight });
    };
    
    updatePositionAndSize();
    
    // Listen for fullscreen changes to realign
    const handleFullscreenChange = () => {
      // Small delay to ensure window dimensions are updated
      setTimeout(updatePositionAndSize, 100);
    };
    
    window.addEventListener('focus-fullscreen-change', handleFullscreenChange);
    window.addEventListener('resize', updatePositionAndSize);
    
    return () => {
      window.removeEventListener('focus-fullscreen-change', handleFullscreenChange);
      window.removeEventListener('resize', updatePositionAndSize);
    };
  }, []);

  // Save position and size
  useEffect(() => {
    if (typeof window === 'undefined' || !position) return;
    localStorage.setItem('focus-music-position', JSON.stringify(position));
  }, [position]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (size.width >= 350 && size.height >= 80) {
      localStorage.setItem('focus-music-size', JSON.stringify(size));
    }
  }, [size]);

  // Clear localStorage on unmount (when widget is toggled off)
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('focus-music-position');
        localStorage.removeItem('focus-music-size');
      }
    };
  }, []);

  const handleClose = () => {
    // Clear saved position and size when closing
    if (typeof window !== 'undefined') {
      localStorage.removeItem('focus-music-position');
      localStorage.removeItem('focus-music-size');
    }
    setShowMusic(false);
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('.resize-handle')) return;
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

  const handleResizeStart = (e, handle) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    setResizeHandle(handle);
    const rect = widgetRef.current?.getBoundingClientRect();
    if (rect && position) {
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: rect.width,
        height: rect.height,
        left: position.x,
        top: position.y
      });
    }
  };

  // Drag effect
  useEffect(() => {
    if (!isDragging || !position) return;

    const handleMouseMove = (e) => {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      const halfWidth = size.width / 2;
      const halfHeight = size.height / 2;
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
  }, [isDragging, dragStart, size]);

  // Resize effect
  useEffect(() => {
    if (!isResizing || !resizeHandle || !position) return;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = resizeStart.left;
      let newY = resizeStart.top;

      if (resizeHandle.includes('right')) {
        newWidth = Math.max(350, resizeStart.width + deltaX);
      }
      if (resizeHandle.includes('left')) {
        newWidth = Math.max(350, resizeStart.width - deltaX);
        newX = resizeStart.left + deltaX;
      }
      if (resizeHandle.includes('bottom')) {
        newHeight = Math.max(80, resizeStart.height + deltaY);
      }
      if (resizeHandle.includes('top')) {
        newHeight = Math.max(80, resizeStart.height - deltaY);
        newY = resizeStart.top + deltaY;
      }

      const halfWidth = newWidth / 2;
      const halfHeight = newHeight / 2;
      const boundedX = Math.max(halfWidth, Math.min(newX, window.innerWidth - halfWidth));
      const boundedY = Math.max(halfHeight, Math.min(newY, window.innerHeight - halfHeight));

      setSize({ width: newWidth, height: newHeight });
      setPosition({ x: boundedX, y: boundedY });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeHandle(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeHandle, resizeStart, position]);

  if (!position) return null;

  // Calculate responsive sizes
  const scale = Math.min(size.width / 500, size.height / 100);
  const paddingX = Math.max(16, 24 * scale);
  const paddingY = Math.max(12, 16 * scale);
  const iconSize = Math.max(32, 48 * scale);
  const buttonSize = Math.max(24, 32 * scale);

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
          className={`bg-black/40 backdrop-blur-md rounded-2xl shadow-2xl border border-white/10 flex items-center pointer-events-auto relative ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${isResizing ? 'select-none' : ''}`}
          style={{ 
            width: `${size.width}px`, 
            height: `${size.height}px`,
            paddingLeft: `${paddingX}px`,
            paddingRight: `${paddingX}px`,
            paddingTop: `${paddingY}px`,
            paddingBottom: `${paddingY}px`,
            gap: `${Math.max(12, 24 * scale)}px`
          }}
          onMouseDown={handleMouseDown}
        >
        {/* Resize handles */}
        <div className="resize-handle absolute top-0 left-0 w-6 h-6 cursor-nwse-resize z-20" style={{ background: 'transparent' }} onMouseDown={(e) => handleResizeStart(e, 'top-left')} />
        <div className="resize-handle absolute top-0 right-0 w-6 h-6 cursor-nesw-resize z-20" style={{ background: 'transparent' }} onMouseDown={(e) => handleResizeStart(e, 'top-right')} />
        <div className="resize-handle absolute bottom-0 left-0 w-6 h-6 cursor-nesw-resize z-20" style={{ background: 'transparent' }} onMouseDown={(e) => handleResizeStart(e, 'bottom-left')} />
        <div className="resize-handle absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-20" style={{ background: 'transparent' }} onMouseDown={(e) => handleResizeStart(e, 'bottom-right')} />
        <div className="resize-handle absolute top-0 left-1/2 -translate-x-1/2 w-12 h-6 cursor-ns-resize z-20" style={{ background: 'transparent' }} onMouseDown={(e) => handleResizeStart(e, 'top')} />
        <div className="resize-handle absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-6 cursor-ns-resize z-20" style={{ background: 'transparent' }} onMouseDown={(e) => handleResizeStart(e, 'bottom')} />
        <div className="resize-handle absolute left-0 top-1/2 -translate-y-1/2 w-6 h-12 cursor-ew-resize z-20" style={{ background: 'transparent' }} onMouseDown={(e) => handleResizeStart(e, 'left')} />
        <div className="resize-handle absolute right-0 top-1/2 -translate-y-1/2 w-6 h-12 cursor-ew-resize z-20" style={{ background: 'transparent' }} onMouseDown={(e) => handleResizeStart(e, 'right')} />

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center text-white/70 hover:text-white transition-colors z-10"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Album Art/Icon */}
        <div className="rounded-full bg-gray-600/80 flex items-center justify-center flex-shrink-0" style={{ width: `${iconSize}px`, height: `${iconSize}px` }}>
          <svg className="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: `${iconSize * 0.5}px`, height: `${iconSize * 0.5}px` }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
        
        {/* Track Information */}
        <div className="flex-1 min-w-0">
          <div className="text-white font-medium truncate" style={{ fontSize: `${Math.max(12, 14 * scale)}px` }}>
            Rain Sounds
          </div>
          <div className="text-gray-400 truncate" style={{ fontSize: `${Math.max(10, 12 * scale)}px` }}>
            HIGH FIDELITY • AMBIENT
          </div>
        </div>
        
        {/* Music Controls */}
        <div className="flex items-center flex-shrink-0" style={{ gap: `${Math.max(8, 16 * scale)}px` }}>
          <button 
            onClick={skipBackward}
            className="flex items-center justify-center text-white hover:text-gray-300 transition-colors" 
            style={{ width: `${buttonSize}px`, height: `${buttonSize}px` }}
            title="Skip backward 10 seconds"
          >
            <svg className="fill-current" viewBox="0 0 24 24" style={{ width: `${buttonSize * 0.6}px`, height: `${buttonSize * 0.6}px` }}>
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>
          
          <button
            onClick={togglePlayPause}
            className="flex items-center justify-center text-white hover:text-gray-300 transition-colors"
            style={{ width: `${buttonSize}px`, height: `${buttonSize}px` }}
          >
            {isPlaying ? (
              <svg className="fill-current" viewBox="0 0 24 24" style={{ width: `${buttonSize * 0.6}px`, height: `${buttonSize * 0.6}px` }}>
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="fill-current" viewBox="0 0 24 24" style={{ width: `${buttonSize * 0.6}px`, height: `${buttonSize * 0.6}px` }}>
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          
          <button 
            onClick={skipForward}
            className="flex items-center justify-center text-white hover:text-gray-300 transition-colors" 
            style={{ width: `${buttonSize}px`, height: `${buttonSize}px` }}
            title="Skip forward 10 seconds"
          >
            <svg className="fill-current" viewBox="0 0 24 24" style={{ width: `${buttonSize * 0.6}px`, height: `${buttonSize * 0.6}px` }}>
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
          
          <button 
            onClick={toggleMute}
            className="flex items-center justify-center text-white hover:text-gray-300 transition-colors" 
            style={{ width: `${buttonSize}px`, height: `${buttonSize}px` }}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <svg className="fill-current" viewBox="0 0 24 24" style={{ width: `${buttonSize * 0.6}px`, height: `${buttonSize * 0.6}px` }}>
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              </svg>
            ) : (
              <svg className="fill-current" viewBox="0 0 24 24" style={{ width: `${buttonSize * 0.6}px`, height: `${buttonSize * 0.6}px` }}>
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            )}
          </button>
        </div>
        </div>
      </div>
  );
}
