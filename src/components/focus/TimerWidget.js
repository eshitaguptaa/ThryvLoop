'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { useFocus } from '@/contexts/FocusContext';
import { useTimer } from '@/contexts/TimerContext';
import { removeUserStorageItem } from '@/utils/userStorage';

// Theme colors by mode and phase (dot hex, progress gradient, glow, play button, border)
const WIDGET_THEMES = {
  pomodoro: {
    session: {
      dot: '#8b5cf6',
      gradient: 'linear-gradient(90deg, #a855f7 0%, #9333ea 50%, #7e22ce 100%)',
      glow: 'rgba(139, 92, 246, 0.6)',
      play: '#7c3aed',
    },
    shortBreak: {
      dot: '#10b981',
      gradient: 'linear-gradient(90deg, #10b981 0%, #059669 50%, #047857 100%)',
      glow: 'rgba(16, 185, 129, 0.6)',
      play: '#059669',
    },
    longBreak: {
      dot: '#0ea5e9',
      gradient: 'linear-gradient(90deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%)',
      glow: 'rgba(14, 165, 233, 0.6)',
      play: '#0284c7',
    },
  },
  stopwatch: {
    dot: '#6366f1',
    gradient: 'linear-gradient(90deg, #6366f1 0%, #4f46e5 50%, #4338ca 100%)',
    glow: 'rgba(99, 102, 241, 0.6)',
    play: '#4f46e5',
  },
  countdown: {
    dot: '#f59e0b',
    gradient: 'linear-gradient(90deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
    glow: 'rgba(245, 158, 11, 0.6)',
    play: '#d97706',
  },
};

function getWidgetTheme(timerMode, phase) {
  if (timerMode === 'pomodoro') {
    return WIDGET_THEMES.pomodoro[phase === 'shortBreak' ? 'shortBreak' : phase === 'longBreak' ? 'longBreak' : 'session'];
  }
  if (timerMode === 'stopwatch') return WIDGET_THEMES.stopwatch;
  return WIDGET_THEMES.countdown;
}

export default function TimerWidget() {
  const { setShowTimer } = useFocus();
  const { user } = useUser();
  const userId = user?.id || null;
  const {
    time,
    isRunning,
    phase,
    timerMode,
    sessionMinutes,
    shortBreakMinutes,
    longBreakMinutes,
    countdownMinutes,
    sessionsCompletedToday,
    position,
    setPosition,
    size,
    setSize,
    getDurationSeconds,
    handlePlayPause,
    handleReset,
    handlePomodoroForward,
  } = useTimer();

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, left: 0, top: 0 });
  const widgetRef = useRef(null);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOpenSettings = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-soundscape-composer'));
    }
  };

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      removeUserStorageItem(userId, 'focus-timer-position');
      removeUserStorageItem(userId, 'focus-timer-size');
    }
    setShowTimer(false);
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('.resize-handle')) return;
    if (!position) return;
    setIsDragging(true);
    const rect = widgetRef.current?.getBoundingClientRect();
    if (rect) {
      setDragStart({
        x: e.clientX - rect.left - rect.width / 2,
        y: e.clientY - rect.top - rect.height / 2,
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
        top: position.y,
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

  const scale = Math.min(size.width / 450, size.height / 450);
  const padding = Math.max(20, 36 * scale);
  const fontSize = Math.max(56, 120 * scale);
  const durationSec = getDurationSeconds();
  const progress = durationSec > 0 ? ((durationSec - time) / durationSec) * 100 : 0;
  const displayProgress = timerMode === 'stopwatch' ? 0 : Math.min(100, Math.max(0, progress));

  const phaseLabel = timerMode === 'pomodoro'
    ? phase === 'session'
      ? 'Focus'
      : phase === 'shortBreak'
        ? 'Short break'
        : 'Long break'
    : timerMode === 'stopwatch'
      ? 'Stopwatch'
      : 'Countdown';

  const theme = getWidgetTheme(timerMode, phase);

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
          relative flex flex-col justify-between overflow-hidden
          bg-black/40 backdrop-blur-2xl
          rounded-3xl border
          pointer-events-auto select-none transition-colors duration-300
          ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
        `}
        style={{
          width: `${size.width}px`,
          height: `${size.height}px`,
          padding: `${padding}px`,
          borderColor: `${theme.dot}35`,
          boxShadow: `0 32px 64px -16px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06), 0 0 40px -10px ${theme.glow}`,
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="resize-handle absolute top-0 left-0 w-8 h-8 cursor-nwse-resize z-20" onMouseDown={(e) => handleResizeStart(e, 'top-left')} />
        <div className="resize-handle absolute top-0 right-0 w-8 h-8 cursor-nesw-resize z-20" onMouseDown={(e) => handleResizeStart(e, 'top-right')} />
        <div className="resize-handle absolute bottom-0 left-0 w-8 h-8 cursor-nesw-resize z-20" onMouseDown={(e) => handleResizeStart(e, 'bottom-left')} />
        <div className="resize-handle absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize z-20" onMouseDown={(e) => handleResizeStart(e, 'bottom-right')} />

        <div className="flex items-center justify-between w-full relative z-10 mb-2">
          <div className="flex items-center gap-2.5">
            <div
              className="w-2 h-2 rounded-full transition-colors duration-300"
              style={{ backgroundColor: theme.dot, boxShadow: `0 0 10px ${theme.glow}` }}
            />
            <span className="text-xs font-semibold tracking-wide text-white/70">
              {phaseLabel}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {timerMode === 'pomodoro' && (
              <button
                onClick={handleOpenSettings}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                title="Settings"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
            <button onClick={handleClose} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center relative z-10 my-2">
          <h1 className="font-bold text-white tracking-tighter leading-none" style={{ fontSize: `${fontSize}px` }}>
            {formatTime(time)}
          </h1>
          {timerMode === 'pomodoro' && (
            <p className="text-white/50 text-xs mt-1.5">{sessionsCompletedToday} of 8 sessions today</p>
          )}
        </div>

        <div className="w-full flex flex-col gap-6 relative z-10">
          {timerMode !== 'stopwatch' && durationSec > 0 && (
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden relative">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-linear relative overflow-hidden"
                style={{
                  width: `${displayProgress}%`,
                  background: theme.gradient,
                  boxShadow: `0 0 20px ${theme.glow}, inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
                }}
              >
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%)',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-8">
            <button
              onClick={handleReset}
              className="group w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all"
            >
              <svg className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>

            <button onClick={handlePlayPause} className="relative group flex items-center justify-center">
              <div
                className="absolute w-20 h-20 rounded-full transition-colors duration-300"
                style={{ backgroundColor: `${theme.play}33`, boxShadow: `0 0 24px ${theme.dot}50` }}
              />
              <div className="relative w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform duration-200">
                {isRunning ? (
                  <svg className="w-6 h-6 fill-current ml-0" viewBox="0 0 24 24" style={{ color: theme.play }}>
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 fill-current ml-1" viewBox="0 0 24 24" style={{ color: theme.play }}>
                    <path d="M5 3l14 9-14 9V3z" />
                  </svg>
                )}
              </div>
            </button>

            {timerMode === 'pomodoro' ? (
              <button
                onClick={handlePomodoroForward}
                className="group w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all"
                title="Next: Focus / Short break / Long break"
              >
                <svg className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 19V5l7 7-7 7z" />
                  <path d="M5 19V5l7 7-7 7z" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleOpenSettings}
                className="group w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all"
                title="Settings"
              >
                <svg className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
