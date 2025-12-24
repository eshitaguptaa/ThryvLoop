'use client';

import { useState, useEffect, useRef } from 'react';
import { useFocus } from '@/contexts/FocusContext';

export default function TimerWidget() {
  const { setShowTimer } = useFocus();
  const [time, setTime] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('DEEP WORK');
  const [position, setPosition] = useState(null);
  const [size, setSize] = useState({ width: 450, height: 400 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, left: 0, top: 0 });
  const widgetRef = useRef(null);

  // Initialize default position and size (always use defaults on mount)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updatePosition = () => {
      // Timer widget: centered horizontally, positioned slightly above center
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2 - 50; // Slightly above center
      setPosition({ x: centerX, y: centerY });
    };
    
    updatePosition();
    setSize({ width: 450, height: 400 });
    
    // Listen for fullscreen changes to realign
    const handleFullscreenChange = () => {
      // Small delay to ensure window dimensions are updated
      setTimeout(updatePosition, 100);
    };
    
    window.addEventListener('focus-fullscreen-change', handleFullscreenChange);
    window.addEventListener('resize', updatePosition);
    
    return () => {
      window.removeEventListener('focus-fullscreen-change', handleFullscreenChange);
      window.removeEventListener('resize', updatePosition);
    };
  }, []);

  // Save position and size to localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || !position) return;
    localStorage.setItem('focus-timer-position', JSON.stringify(position));
  }, [position]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (size.width >= 350 && size.height >= 300) {
      localStorage.setItem('focus-timer-size', JSON.stringify(size));
    }
  }, [size]);

  // Clear localStorage on unmount (when widget is toggled off)
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('focus-timer-position');
        localStorage.removeItem('focus-timer-size');
      }
    };
  }, []);

  // Timer logic
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
    return () => clearInterval(interval);
  }, [isRunning, time]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setTime(25 * 60);
    setIsRunning(false);
  };

  const handleClose = () => {
    // Clear saved position and size when closing
    if (typeof window !== 'undefined') {
      localStorage.removeItem('focus-timer-position');
      localStorage.removeItem('focus-timer-size');
    }
    setShowTimer(false);
  };

  // Drag handlers
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

  // Resize handlers
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
      
      // Keep widget within viewport bounds
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

      // Handle horizontal resizing
      if (resizeHandle.includes('right')) {
        newWidth = Math.max(350, resizeStart.width + deltaX);
      }
      if (resizeHandle.includes('left')) {
        newWidth = Math.max(350, resizeStart.width - deltaX);
        newX = resizeStart.left + deltaX;
      }

      // Handle vertical resizing
      if (resizeHandle.includes('bottom')) {
        newHeight = Math.max(300, resizeStart.height + deltaY);
      }
      if (resizeHandle.includes('top')) {
        newHeight = Math.max(300, resizeStart.height - deltaY);
        newY = resizeStart.top + deltaY;
      }

      // Keep widget within viewport
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
  const scale = Math.min(size.width / 450, size.height / 400);
  const padding = Math.max(24, 48 * scale);
  const fontSize = Math.max(32, 96 * scale);
  const buttonSize = Math.max(40, 56 * scale);
  const playButtonSize = Math.max(60, 80 * scale);

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
        className={`bg-black/40 backdrop-blur-md rounded-3xl shadow-2xl border border-white/10 pointer-events-auto relative flex flex-col ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${isResizing ? 'select-none' : ''}`}
        style={{ 
          width: `${size.width}px`, 
          height: `${size.height}px`,
          paddingTop: `${padding}px`,
          paddingBottom: `${padding}px`,
          paddingLeft: `${padding}px`,
          paddingRight: `${padding}px`
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
          className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center text-white/70 hover:text-white transition-colors z-10"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Mode indicator */}
        <div className="flex items-center gap-2 flex-shrink-0" style={{ marginBottom: `${padding * 0.5}px` }}>
          <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
          <span className="text-white text-sm font-medium">• {mode}</span>
        </div>
        
        {/* Timer display */}
        <div className="text-center flex-1 flex items-center justify-center">
          <div className="font-bold text-white tracking-tight" style={{ fontSize: `${fontSize}px` }}>
            {formatTime(time)}
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex items-center justify-center gap-4 flex-shrink-0" style={{ marginTop: `${padding * 0.5}px` }}>
          <button
            onClick={handleReset}
            className="rounded-full bg-gray-800/80 hover:bg-gray-700/80 flex items-center justify-center transition-all duration-200 border border-white/10"
            style={{ width: `${buttonSize}px`, height: `${buttonSize}px` }}
          >
            <svg className="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: `${buttonSize * 0.4}px`, height: `${buttonSize * 0.4}px` }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          
          <button
            onClick={handlePlayPause}
            className="rounded-full bg-yellow-400 hover:bg-yellow-500 flex items-center justify-center transition-all duration-200 shadow-lg shadow-yellow-400/30"
            style={{ width: `${playButtonSize}px`, height: `${playButtonSize}px` }}
          >
            {isRunning ? (
              <svg className="text-white ml-1" fill="currentColor" viewBox="0 0 24 24" style={{ width: `${playButtonSize * 0.4}px`, height: `${playButtonSize * 0.4}px` }}>
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="text-white ml-1" fill="currentColor" viewBox="0 0 24 24" style={{ width: `${playButtonSize * 0.4}px`, height: `${playButtonSize * 0.4}px` }}>
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          
          <button
            className="rounded-full bg-gray-800/80 hover:bg-gray-700/80 flex items-center justify-center transition-all duration-200 border border-white/10"
            style={{ width: `${buttonSize}px`, height: `${buttonSize}px` }}
          >
            <svg className="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: `${buttonSize * 0.4}px`, height: `${buttonSize * 0.4}px` }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
