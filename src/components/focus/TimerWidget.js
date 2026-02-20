'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { useFocus } from '@/contexts/FocusContext';
import { getUserStorageItem, removeUserStorageItem, setUserStorageItem, setUserStorageJson } from '@/utils/userStorage';

export default function TimerWidget() {
  const { setShowTimer } = useFocus();
  const { user } = useUser();
  const userId = user?.id || null;
  // Default to 25 minutes
  const INITIAL_TIME = 25 * 60;
  const [time, setTime] = useState(INITIAL_TIME);
  const [isRunning, setIsRunning] = useState(false);
  
  // Widget State
  const [position, setPosition] = useState(null);
  const [size, setSize] = useState({ width: 450, height: 450 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, left: 0, top: 0 });
  const widgetRef = useRef(null);

  // --- LOGIC SECTION ---

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updatePositionAndSize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      
      const baseWidth = 450;
      const baseHeight = 450; 
      const minWidth = Math.min(350, vw * 0.8);
      const maxWidth = Math.min(550, vw * 0.9);
      const minHeight = Math.min(350, vh * 0.4);
      const maxHeight = Math.min(550, vh * 0.6);
      
      const widthScale = Math.min(1, vw / 1440);
      const heightScale = Math.min(1, vh / 900);
      const scale = Math.min(widthScale, heightScale, 1.2);
      
      const responsiveWidth = Math.max(minWidth, Math.min(maxWidth, baseWidth * scale));
      const responsiveHeight = Math.max(minHeight, Math.min(maxHeight, baseHeight * scale));
      
      const centerX = vw / 2;
      const centerY = vh / 2 - Math.max(30, vh * 0.05);
      
      setPosition({ x: centerX, y: centerY });
      setSize({ width: responsiveWidth, height: responsiveHeight });
    };
    
    updatePositionAndSize();
    const handleFullscreenChange = () => setTimeout(updatePositionAndSize, 100);
    window.addEventListener('focus-fullscreen-change', handleFullscreenChange);
    window.addEventListener('resize', updatePositionAndSize);
    return () => {
      window.removeEventListener('focus-fullscreen-change', handleFullscreenChange);
      window.removeEventListener('resize', updatePositionAndSize);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedTime = getUserStorageItem(userId, 'focus-timer-time', 'focus-timer-time');
    const savedRunning = getUserStorageItem(userId, 'focus-timer-running', 'focus-timer-running');
    const savedUpdatedAt = getUserStorageItem(userId, 'focus-timer-updated-at', 'focus-timer-updated-at');

    if (savedTime) {
      let nextTime = parseInt(savedTime, 10);
      if (savedRunning === 'true' && savedUpdatedAt) {
        const elapsed = Math.floor((Date.now() - parseInt(savedUpdatedAt, 10)) / 1000);
        nextTime = Math.max(0, nextTime - elapsed);
      }
      setTime(Number.isNaN(nextTime) ? INITIAL_TIME : nextTime);
      setIsRunning(false);
    } else {
      setTime(INITIAL_TIME);
      setIsRunning(false);
    }
  }, [userId]);

  useEffect(() => {
    if (typeof window === 'undefined' || !position) return;
    setUserStorageJson(userId, 'focus-timer-position', position);
  }, [position, userId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (size.width >= 350 && size.height >= 300) {
      setUserStorageJson(userId, 'focus-timer-size', size);
    }
  }, [size, userId]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        removeUserStorageItem(userId, 'focus-timer-position');
        removeUserStorageItem(userId, 'focus-timer-size');
      }
    };
  }, [userId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const now = Date.now().toString();
    if (isRunning) {
      setUserStorageItem(userId, 'focus-timer-time', time.toString());
      setUserStorageItem(userId, 'focus-timer-updated-at', now);
      setUserStorageItem(userId, 'focus-timer-running', 'true');
    } else {
      setUserStorageItem(userId, 'focus-timer-time', time.toString());
      setUserStorageItem(userId, 'focus-timer-updated-at', now);
      setUserStorageItem(userId, 'focus-timer-running', 'false');
    }
  }, [isRunning, time, userId]);

  useEffect(() => {
    let interval = null;
    if (isRunning && time > 0) {
      interval = setInterval(() => {
        setTime((prevTime) => {
          if (prevTime <= 1) {
            setIsRunning(false);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => {
        if(interval) clearInterval(interval)
    };
  }, [isRunning, time]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => setIsRunning(!isRunning);
  
  const handleReset = () => {
    setTime(INITIAL_TIME);
    setIsRunning(false);
  };

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      removeUserStorageItem(userId, 'focus-timer-position');
      removeUserStorageItem(userId, 'focus-timer-size');
    }
    setShowTimer(false);
  };

  // Drag Handlers
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
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, size, position]);

  useEffect(() => {
    if (!isResizing || !resizeHandle || !position) return;
    const handleMouseMove = (e) => {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = resizeStart.left;
      let newY = resizeStart.top;

      if (resizeHandle.includes('right')) newWidth = Math.max(350, resizeStart.width + deltaX);
      if (resizeHandle.includes('left')) {
        newWidth = Math.max(350, resizeStart.width - deltaX);
        newX = resizeStart.left + deltaX;
      }
      if (resizeHandle.includes('bottom')) newHeight = Math.max(300, resizeStart.height + deltaY);
      if (resizeHandle.includes('top')) {
        newHeight = Math.max(300, resizeStart.height - deltaY);
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

  // --- VISUALIZATION CONSTANTS ---
  const scale = Math.min(size.width / 450, size.height / 450);
  const padding = Math.max(20, 36 * scale);
  const fontSize = Math.max(56, 120 * scale);
  const progress = (time / INITIAL_TIME) * 100;

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
        /* Main Container:
          - Dark Glass effect (backdrop-blur)
          - No warm gradient
        */
        className={`
          relative flex flex-col justify-between overflow-hidden
          bg-black/30 backdrop-blur-2xl
          rounded-[48px] shadow-2xl border border-white/10 
          pointer-events-auto select-none
          ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} 
        `}
        style={{ 
          width: `${size.width}px`, 
          height: `${size.height}px`,
          padding: `${padding}px`,
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Invisible Resize Handles */}
        <div className="resize-handle absolute top-0 left-0 w-8 h-8 cursor-nwse-resize z-20" onMouseDown={(e) => handleResizeStart(e, 'top-left')} />
        <div className="resize-handle absolute top-0 right-0 w-8 h-8 cursor-nesw-resize z-20" onMouseDown={(e) => handleResizeStart(e, 'top-right')} />
        <div className="resize-handle absolute bottom-0 left-0 w-8 h-8 cursor-nesw-resize z-20" onMouseDown={(e) => handleResizeStart(e, 'bottom-left')} />
        <div className="resize-handle absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize z-20" onMouseDown={(e) => handleResizeStart(e, 'bottom-right')} />

        {/* --- HEADER --- */}
        <div className="flex items-center justify-between w-full relative z-10 mb-2">
          <div className="flex items-center gap-2.5">
             {/* Small Purple Dot */}
             <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]"></div>
             {/* Title Text */}
             <span className="text-[10px] font-bold tracking-[0.2em] text-white/60 uppercase">
               ThryvLoop Session
             </span>
          </div>
          
          {/* Top Right Close Icon */}
          <button onClick={handleClose} className="text-white/40 hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* --- TIMER DISPLAY --- */}
        <div className="flex-1 flex items-center justify-center relative z-10 my-2">
          <h1 
            className="font-bold text-white tracking-tighter leading-none" 
            style={{ fontSize: `${fontSize}px` }}
          >
            {formatTime(time)}
          </h1>
        </div>

        {/* --- CONTROLS AREA --- */}
        <div className="w-full flex flex-col gap-6 relative z-10">
          
          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden relative">
             <div 
                className="h-full rounded-full transition-all duration-1000 ease-linear relative overflow-hidden"
                style={{ 
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #a855f7 0%, #9333ea 50%, #7e22ce 100%)',
                  boxShadow: '0 0 20px rgba(168, 85, 247, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                }}
             >
               {/* Shine effect overlay */}
               <div 
                 className="absolute inset-0 rounded-full"
                 style={{
                   background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%)',
                   pointerEvents: 'none'
                 }}
               />
             </div>
          </div>

          {/* Buttons Row */}
          <div className="flex items-center justify-center gap-8">
            
            {/* 1. Reset Button (Left) */}
            <button 
              onClick={handleReset}
              className="group w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all"
            >
               <svg className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                 <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                 <path d="M3 3v5h5" />
               </svg>
            </button>

            {/* 2. Play/Pause Button (Center - Prominent) */}
            <button 
              onClick={handlePlayPause}
              className="relative group flex items-center justify-center"
            >
                {/* Outer Glow Ring */}
                <div className="absolute w-20 h-20 rounded-full bg-purple-500/20 group-hover:bg-purple-500/30 transition-all duration-300"></div>
                
                {/* Inner White Button */}
                <div className="relative w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform duration-200">
                    {isRunning ? (
                         <svg className="w-6 h-6 text-purple-600 fill-current" viewBox="0 0 24 24">
                           <rect x="6" y="4" width="4" height="16" rx="1" />
                           <rect x="14" y="4" width="4" height="16" rx="1" />
                         </svg>
                    ) : (
                        <svg className="w-6 h-6 text-purple-600 fill-current ml-1" viewBox="0 0 24 24">
                           <path d="M5 3l14 9-14 9V3z" />
                        </svg>
                    )}
                </div>
            </button>

            {/* 3. Settings Button (Right) */}
            <button className="group w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all">
               <svg className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                 <line x1="4" x2="20" y1="21" y2="21" />
                 <line x1="4" x2="20" y1="14" y2="14" />
                 <line x1="4" x2="20" y1="7" y2="7" />
                 <circle cx="12" cy="14" r="2" fill="currentColor" className="text-white/10" />
                 <circle cx="8" cy="7" r="2" fill="currentColor" className="text-white/10" />
                 <circle cx="16" cy="21" r="2" fill="currentColor" className="text-white/10" />
               </svg>
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}