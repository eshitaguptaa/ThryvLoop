'use client';

import { useState, useEffect, useRef } from 'react';
import { useFocus } from '@/contexts/FocusContext';

export default function FocusTaskBar({ task = "Drafting Q3 Report" }) {
  const { setShowTaskBar, setShowTask } = useFocus();
  const [position, setPosition] = useState(null);
  const [size, setSize] = useState({ width: 400, height: 56 });
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
      const baseWidth = 450;
      const baseHeight = 56;
      const minWidth = Math.min(300, vw * 0.7);
      const maxWidth = Math.min(550, vw * 0.85);
      const minHeight = Math.min(48, vh * 0.06);
      const maxHeight = Math.min(64, vh * 0.08);
      
      // Scale based on viewport
      const widthScale = Math.min(1, vw / 1440);
      const heightScale = Math.min(1, vh / 900);
      const scale = Math.min(widthScale, heightScale, 1.2);
      
      const responsiveWidth = Math.max(minWidth, Math.min(maxWidth, baseWidth * scale));
      const responsiveHeight = Math.max(minHeight, Math.min(maxHeight, baseHeight * scale));
      
      // Task bar: centered horizontally, positioned at the top
      const centerX = vw / 2;
      // Responsive top margin: use percentage of viewport height
      const topMargin = Math.max(30, Math.min(60, vh * 0.05));
      const topY = topMargin;
      
      setPosition({ x: centerX, y: topY });
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
    localStorage.setItem('focus-taskbar-position', JSON.stringify(position));
  }, [position]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (size.width >= 250 && size.height >= 48) {
      localStorage.setItem('focus-taskbar-size', JSON.stringify(size));
    }
  }, [size]);

  // Clear localStorage on unmount (when widget is toggled off)
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('focus-taskbar-position');
        localStorage.removeItem('focus-taskbar-size');
      }
    };
  }, []);

  const handleClose = () => {
    // Clear saved position and size when closing
    if (typeof window !== 'undefined') {
      localStorage.removeItem('focus-taskbar-position');
      localStorage.removeItem('focus-taskbar-size');
    }
    setShowTaskBar(false);
    setShowTask(false);
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
        newWidth = Math.max(250, resizeStart.width + deltaX);
      }
      if (resizeHandle.includes('left')) {
        newWidth = Math.max(250, resizeStart.width - deltaX);
        newX = resizeStart.left + deltaX;
      }
      if (resizeHandle.includes('bottom')) {
        newHeight = Math.max(48, resizeStart.height + deltaY);
      }
      if (resizeHandle.includes('top')) {
        newHeight = Math.max(48, resizeStart.height - deltaY);
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
  const scale = Math.min(size.width / 400, size.height / 56);
  const paddingX = Math.max(16, 24 * scale);
  const paddingY = Math.max(12, 14 * scale);
  const iconSize = Math.max(16, 20 * scale);
  const fontSize = Math.max(12, 14 * scale);

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
          gap: `${Math.max(8, 12 * scale)}px`
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

        {/* Checkmark icon */}
        <div className="rounded-full bg-purple-400/20 flex items-center justify-center flex-shrink-0" style={{ width: `${iconSize}px`, height: `${iconSize}px` }}>
          <svg className="text-purple-400" fill="currentColor" viewBox="0 0 24 24" style={{ width: `${iconSize * 0.6}px`, height: `${iconSize * 0.6}px` }}>
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        </div>
        
        {/* Task text */}
        <span className="text-white font-medium flex-1 truncate" style={{ fontSize: `${fontSize}px` }}>
          Focusing on: {task}
        </span>
        
        {/* Close button */}
        <button
          onClick={handleClose}
          className="ml-2 w-6 h-6 flex items-center justify-center text-white/70 hover:text-white transition-colors rounded hover:bg-white/10 flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
