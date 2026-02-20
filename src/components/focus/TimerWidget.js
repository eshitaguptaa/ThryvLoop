'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useFocus } from '@/contexts/FocusContext';
import {
  getUserStorageItem,
  removeUserStorageItem,
  setUserStorageItem,
  setUserStorageJson,
  getFocusTimerStateFromSupabase,
  setFocusTimerStateToSupabase,
} from '@/utils/userStorage';

const DEFAULT_SESSION = 25;
const DEFAULT_SHORT_BREAK = 5;
const DEFAULT_LONG_BREAK = 15;
const DEFAULT_COUNTDOWN = 5;
const POMODOROS_BEFORE_LONG_BREAK = 4;

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

function getStoredInt(userId, key, fallback) {
  if (typeof window === 'undefined') return fallback;
  const v = getUserStorageItem(userId, key, key);
  if (v == null || v === '') return fallback;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? fallback : Math.max(0, n);
}

function getStoredBool(userId, key, fallback) {
  if (typeof window === 'undefined') return fallback;
  const v = getUserStorageItem(userId, key, key);
  if (v == null || v === '') return fallback;
  return v === 'true';
}

export default function TimerWidget() {
  const { setShowTimer } = useFocus();
  const { user } = useUser();
  const userId = user?.id || null;

  // Focus Flow settings (from Settings modal)
  const [timerMode, setTimerMode] = useState('pomodoro');
  const [phase, setPhase] = useState('session');
  const [sessionMinutes, setSessionMinutes] = useState(DEFAULT_SESSION);
  const [shortBreakMinutes, setShortBreakMinutes] = useState(DEFAULT_SHORT_BREAK);
  const [longBreakMinutes, setLongBreakMinutes] = useState(DEFAULT_LONG_BREAK);
  const [countdownMinutes, setCountdownMinutes] = useState(DEFAULT_COUNTDOWN);
  const [autoStartBreaks, setAutoStartBreaks] = useState(true);
  const [alarmVolume, setAlarmVolume] = useState(60);
  const [tickSound, setTickSound] = useState(true);

  const [time, setTime] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompletedToday, setSessionsCompletedToday] = useState(0);
  const [sessionsDate, setSessionsDate] = useState(() => (typeof window !== 'undefined' ? new Date().toISOString().slice(0, 10) : ''));
  const settingsAppliedRef = useRef(false);
  const [supabaseHydrated, setSupabaseHydrated] = useState(false);

  // Widget state
  const [position, setPosition] = useState(null);
  const [size, setSize] = useState({ width: 450, height: 450 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, left: 0, top: 0 });
  const widgetRef = useRef(null);
  const audioContextRef = useRef(null);

  const getDurationSeconds = useCallback(() => {
    if (timerMode === 'countdown') return countdownMinutes * 60;
    if (timerMode === 'stopwatch') return 0;
    if (phase === 'session') return sessionMinutes * 60;
    if (phase === 'shortBreak') return shortBreakMinutes * 60;
    return longBreakMinutes * 60;
  }, [timerMode, phase, sessionMinutes, shortBreakMinutes, longBreakMinutes, countdownMinutes]);

  const loadSettingsFromStorage = useCallback(() => {
    if (typeof window === 'undefined' || !userId) return;
    const mode = getUserStorageItem(userId, 'focus-settings-timer-mode', 'focus-settings-timer-mode');
    if (mode === 'stopwatch' || mode === 'countdown') setTimerMode(mode);
    else setTimerMode('pomodoro');
    setSessionMinutes(getStoredInt(userId, 'focus-settings-session-minutes', DEFAULT_SESSION));
    setShortBreakMinutes(getStoredInt(userId, 'focus-settings-short-break-minutes', DEFAULT_SHORT_BREAK));
    setLongBreakMinutes(getStoredInt(userId, 'focus-settings-long-break-minutes', DEFAULT_LONG_BREAK));
    setCountdownMinutes(getStoredInt(userId, 'focus-settings-countdown-minutes', DEFAULT_COUNTDOWN));
    setAutoStartBreaks(getStoredBool(userId, 'focus-settings-auto-start-breaks', true));
    setAlarmVolume(Math.max(0, Math.min(100, getStoredInt(userId, 'focus-settings-alarm-volume', 60))));
    setTickSound(getStoredBool(userId, 'focus-settings-tick-sound', true));
  }, [userId]);

  const getInitialTimeForCurrentState = useCallback(() => {
    if (timerMode === 'stopwatch') return 0;
    return getDurationSeconds();
  }, [timerMode, getDurationSeconds]);

  // Load state: try Supabase first (continue where they left off), else localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || !userId) return;
    let cancelled = false;
    const load = async () => {
      const remote = await getFocusTimerStateFromSupabase(userId);
      if (cancelled) return;
      const today = new Date().toISOString().slice(0, 10);
      if (remote && typeof remote === 'object') {
        const timer = remote.timer || {};
        const sessions = remote.sessions || {};
        const settings = remote.settings || {};
        const mode = timer.mode ?? 'pomodoro';
        const ph = timer.phase ?? 'session';
        setTimerMode(mode);
        setPhase(ph);
        setSessionMinutes(settings.sessionMinutes ?? DEFAULT_SESSION);
        setShortBreakMinutes(settings.shortBreakMinutes ?? DEFAULT_SHORT_BREAK);
        setLongBreakMinutes(settings.longBreakMinutes ?? DEFAULT_LONG_BREAK);
        setCountdownMinutes(settings.countdownMinutes ?? DEFAULT_COUNTDOWN);
        setAutoStartBreaks(settings.autoStartBreaks !== false);
        setAlarmVolume(Math.max(0, Math.min(100, settings.alarmVolume ?? 60)));
        setTickSound(settings.tickSound !== false);
        setSessionsCompletedToday(Math.max(0, sessions.today ?? 0));
        setSessionsDate(sessions.date ?? today);
        let timeVal = typeof timer.time === 'number' ? timer.time : 25 * 60;
        if (timer.isRunning && timer.updatedAt) {
          const elapsed = Math.floor((Date.now() - new Date(timer.updatedAt).getTime()) / 1000);
          if (mode === 'stopwatch') timeVal = timeVal + elapsed;
          else timeVal = Math.max(0, timeVal - elapsed);
        }
        setTime(timeVal);
        setIsRunning(false);
        if (remote.position && typeof remote.position.x === 'number' && typeof remote.position.y === 'number') {
          setPosition(remote.position);
        }
        if (remote.size && typeof remote.size.width === 'number' && typeof remote.size.height === 'number') {
          setSize(remote.size);
        }
        setUserStorageItem(userId, 'focus-timer-time', String(timeVal));
        setUserStorageItem(userId, 'focus-timer-updated-at', Date.now().toString());
        setUserStorageItem(userId, 'focus-timer-running', 'false');
        setUserStorageItem(userId, 'focus-timer-mode', mode);
        setUserStorageItem(userId, 'focus-timer-phase', ph);
        setUserStorageItem(userId, 'focus-timer-sessions-today', String(sessions.today ?? 0));
        setUserStorageItem(userId, 'focus-timer-sessions-date', sessions.date ?? today);
        setUserStorageItem(userId, 'focus-settings-session-minutes', String(settings.sessionMinutes ?? DEFAULT_SESSION));
        setUserStorageItem(userId, 'focus-settings-short-break-minutes', String(settings.shortBreakMinutes ?? DEFAULT_SHORT_BREAK));
        setUserStorageItem(userId, 'focus-settings-long-break-minutes', String(settings.longBreakMinutes ?? DEFAULT_LONG_BREAK));
        setUserStorageItem(userId, 'focus-settings-countdown-minutes', String(settings.countdownMinutes ?? DEFAULT_COUNTDOWN));
        setUserStorageItem(userId, 'focus-settings-auto-start-breaks', settings.autoStartBreaks !== false ? 'true' : 'false');
        setUserStorageItem(userId, 'focus-settings-alarm-volume', String(settings.alarmVolume ?? 60));
        setUserStorageItem(userId, 'focus-settings-tick-sound', settings.tickSound !== false ? 'true' : 'false');
        setUserStorageItem(userId, 'focus-settings-timer-mode', mode);
        if (remote.position) setUserStorageJson(userId, 'focus-timer-position', remote.position);
        if (remote.size) setUserStorageJson(userId, 'focus-timer-size', remote.size);
        setSupabaseHydrated(true);
      } else {
        loadSettingsFromStorage();
        const savedDate = getUserStorageItem(userId, 'focus-timer-sessions-date', 'focus-timer-sessions-date');
        const savedSessions = getUserStorageItem(userId, 'focus-timer-sessions-today', 'focus-timer-sessions-today');
        if (savedDate === today && savedSessions != null) {
          const n = parseInt(savedSessions, 10);
          setSessionsCompletedToday(Number.isNaN(n) ? 0 : Math.max(0, n));
        } else {
          setSessionsCompletedToday(0);
          setSessionsDate(today);
          setUserStorageItem(userId, 'focus-timer-sessions-date', today);
          setUserStorageItem(userId, 'focus-timer-sessions-today', '0');
        }
        const savedMode = getUserStorageItem(userId, 'focus-timer-mode', 'focus-timer-mode');
        const savedPhase = getUserStorageItem(userId, 'focus-timer-phase', 'focus-timer-phase');
        if (savedMode === 'stopwatch' || savedMode === 'countdown') setTimerMode(savedMode);
        if (savedPhase === 'shortBreak' || savedPhase === 'longBreak') setPhase(savedPhase);
        const savedTime = getUserStorageItem(userId, 'focus-timer-time', 'focus-timer-time');
        const savedRunning = getUserStorageItem(userId, 'focus-timer-running', 'focus-timer-running');
        const savedUpdatedAt = getUserStorageItem(userId, 'focus-timer-updated-at', 'focus-timer-updated-at');
        const nextTime = savedTime ? parseInt(savedTime, 10) : null;
        if (nextTime != null && !Number.isNaN(nextTime) && nextTime >= 0) {
          let adjusted = nextTime;
          if (savedRunning === 'true' && savedUpdatedAt) {
            const elapsed = Math.floor((Date.now() - parseInt(savedUpdatedAt, 10)) / 1000);
            if (savedMode === 'stopwatch') adjusted = nextTime + elapsed;
            else adjusted = Math.max(0, nextTime - elapsed);
          }
          setTime(adjusted);
        } else {
          const sm = getStoredInt(userId, 'focus-settings-session-minutes', DEFAULT_SESSION);
          const sbm = getStoredInt(userId, 'focus-settings-short-break-minutes', DEFAULT_SHORT_BREAK);
          const lbm = getStoredInt(userId, 'focus-settings-long-break-minutes', DEFAULT_LONG_BREAK);
          const cm = getStoredInt(userId, 'focus-settings-countdown-minutes', DEFAULT_COUNTDOWN);
          if (savedMode === 'stopwatch') setTime(0);
          else if (savedMode === 'countdown') setTime(cm * 60);
          else if (savedPhase === 'shortBreak') setTime(sbm * 60);
          else if (savedPhase === 'longBreak') setTime(lbm * 60);
          else setTime(sm * 60);
        }
        setIsRunning(false);
        setSupabaseHydrated(true);
      }
      settingsAppliedRef.current = true;
    };
    load();
    return () => { cancelled = true; };
  }, [userId, loadSettingsFromStorage]);

  // Listen for tick sound toggle (takes effect immediately without Apply)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (e) => {
      const v = e?.detail?.tickSound;
      if (typeof v === 'boolean') setTickSound(v);
    };
    window.addEventListener('focus-settings-tick-sound-changed', handler);
    return () => window.removeEventListener('focus-settings-tick-sound-changed', handler);
  }, []);

  // Listen for Apply Settings from modal — apply detail and reset timer
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (e) => {
      const d = e?.detail;
      if (d) {
        if (d.timerMode === 'stopwatch' || d.timerMode === 'countdown') setTimerMode(d.timerMode);
        else setTimerMode('pomodoro');
        setPhase('session');
        setSessionMinutes(d.sessionMinutes ?? DEFAULT_SESSION);
        setShortBreakMinutes(d.shortBreakMinutes ?? DEFAULT_SHORT_BREAK);
        setLongBreakMinutes(d.longBreakMinutes ?? DEFAULT_LONG_BREAK);
        setCountdownMinutes(d.countdownMinutes ?? DEFAULT_COUNTDOWN);
        setAutoStartBreaks(d.autoStartBreaks !== false);
        setAlarmVolume(Math.max(0, Math.min(100, d.alarmVolume ?? 60)));
        setTickSound(d.tickSound !== false);
        if (d.timerMode === 'stopwatch') setTime(0);
        else if (d.timerMode === 'countdown') setTime((d.countdownMinutes ?? DEFAULT_COUNTDOWN) * 60);
        else setTime((d.sessionMinutes ?? DEFAULT_SESSION) * 60);
      } else {
        loadSettingsFromStorage();
        setTime(getInitialTimeForCurrentState());
      }
      setIsRunning(false);
    };
    window.addEventListener('focus-settings-applied', handler);
    return () => window.removeEventListener('focus-settings-applied', handler);
  }, [loadSettingsFromStorage, getInitialTimeForCurrentState]);

  // Position/size
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

  // Persist timer state
  useEffect(() => {
    if (typeof window === 'undefined' || !userId) return;
    const now = Date.now().toString();
    setUserStorageItem(userId, 'focus-timer-time', time.toString());
    setUserStorageItem(userId, 'focus-timer-updated-at', now);
    setUserStorageItem(userId, 'focus-timer-running', isRunning ? 'true' : 'false');
    setUserStorageItem(userId, 'focus-timer-mode', timerMode);
    setUserStorageItem(userId, 'focus-timer-phase', phase);
  }, [isRunning, time, userId, timerMode, phase]);

  useEffect(() => {
    if (typeof window === 'undefined' || !userId) return;
    setUserStorageItem(userId, 'focus-timer-sessions-today', sessionsCompletedToday.toString());
    setUserStorageItem(userId, 'focus-timer-sessions-date', sessionsDate || new Date().toISOString().slice(0, 10));
  }, [sessionsCompletedToday, sessionsDate, userId]);

  // Persist full state to Supabase (debounced) so user can continue after login
  const supabaseSaveTimeoutRef = useRef(null);
  useEffect(() => {
    if (typeof window === 'undefined' || !userId || !supabaseHydrated || !settingsAppliedRef.current) return;
    if (supabaseSaveTimeoutRef.current) clearTimeout(supabaseSaveTimeoutRef.current);
    supabaseSaveTimeoutRef.current = setTimeout(() => {
      supabaseSaveTimeoutRef.current = null;
      const state = {
        timer: {
          time,
          isRunning,
          updatedAt: new Date().toISOString(),
          mode: timerMode,
          phase,
        },
        sessions: { today: sessionsCompletedToday, date: sessionsDate || new Date().toISOString().slice(0, 10) },
        settings: {
          timerMode,
          sessionMinutes,
          shortBreakMinutes,
          longBreakMinutes,
          countdownMinutes,
          autoStartBreaks,
          alarmVolume,
          tickSound,
        },
        position: position && typeof position.x === 'number' ? position : undefined,
        size: size && size.width >= 350 && size.height >= 300 ? size : undefined,
      };
      setFocusTimerStateToSupabase(userId, state);
    }, 2500);
    return () => {
      if (supabaseSaveTimeoutRef.current) clearTimeout(supabaseSaveTimeoutRef.current);
    };
  }, [
    userId,
    time,
    isRunning,
    timerMode,
    phase,
    sessionMinutes,
    shortBreakMinutes,
    longBreakMinutes,
    countdownMinutes,
    autoStartBreaks,
    alarmVolume,
    tickSound,
    sessionsCompletedToday,
    sessionsDate,
    position,
    size,
    supabaseHydrated,
  ]);

  // Alarm beep (Web Audio)
  const playAlarm = useCallback(() => {
    if (typeof window === 'undefined' || alarmVolume === 0) return;
    try {
      const ctx = audioContextRef.current || new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = ctx;
      const gain = (alarmVolume / 100) * 0.3;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g);
      g.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.05);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch (_) {}
  }, [alarmVolume]);

  // Tick (optional soft click)
  const playTick = useCallback(() => {
    if (typeof window === 'undefined' || !tickSound || alarmVolume === 0) return;
    try {
      const ctx = audioContextRef.current || new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = ctx;
      const gain = (alarmVolume / 100) * 0.03;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g);
      g.connect(ctx.destination);
      osc.frequency.value = 1000;
      osc.type = 'sine';
      g.gain.setValueAtTime(gain, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.02);
    } catch (_) {}
  }, [tickSound, alarmVolume]);

  // Tick logic: count down (or up for stopwatch), handle phase end
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTime((prev) => {
        if (timerMode === 'stopwatch') {
          if (tickSound) playTick();
          return prev + 1;
        }
        if (prev <= 1) {
          clearInterval(interval);
          if (timerMode === 'countdown') {
            playAlarm();
            setIsRunning(false);
            return 0;
          }
          if (timerMode === 'pomodoro') {
            if (phase === 'session') {
              const nextSessions = sessionsCompletedToday + 1;
              setSessionsCompletedToday(nextSessions);
              setSessionsDate(new Date().toISOString().slice(0, 10));
              const doLongBreak = nextSessions > 0 && nextSessions % POMODOROS_BEFORE_LONG_BREAK === 0;
              setPhase(doLongBreak ? 'longBreak' : 'shortBreak');
              const breakMins = doLongBreak ? longBreakMinutes : shortBreakMinutes;
              const nextTime = breakMins * 60;
              if (autoStartBreaks) {
                setTimeout(() => setIsRunning(true), 100);
                return nextTime;
              }
              setIsRunning(false);
              return nextTime;
            }
            if (phase === 'shortBreak' || phase === 'longBreak') {
              playAlarm();
              setPhase('session');
              const nextTime = sessionMinutes * 60;
              if (autoStartBreaks) {
                setTimeout(() => setIsRunning(true), 100);
                return nextTime;
              }
              setIsRunning(false);
              return nextTime;
            }
          }
          return 0;
        }
        if (tickSound && timerMode !== 'stopwatch') playTick();
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, timerMode, phase, sessionMinutes, shortBreakMinutes, longBreakMinutes, autoStartBreaks, sessionsCompletedToday, playAlarm, playTick, tickSound, longBreakMinutes]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => setIsRunning(!isRunning);

  const handleReset = () => {
    setTime(getInitialTimeForCurrentState());
    setIsRunning(false);
  };

  const handleSwitchPomodoroPhase = (newPhase) => {
    if (timerMode !== 'pomodoro' || newPhase === phase) return;
    setPhase(newPhase);
    if (newPhase === 'session') setTime(sessionMinutes * 60);
    else if (newPhase === 'shortBreak') setTime(shortBreakMinutes * 60);
    else setTime(longBreakMinutes * 60);
    setIsRunning(false);
  };

  const handlePomodoroForward = () => {
    if (timerMode !== 'pomodoro') return;
    const order = ['session', 'shortBreak', 'longBreak'];
    const idx = order.indexOf(phase);
    const nextPhase = order[(idx + 1) % order.length];
    handleSwitchPomodoroPhase(nextPhase);
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
          bg-black/30 backdrop-blur-2xl
          rounded-[48px] shadow-2xl border
          pointer-events-auto select-none transition-colors duration-300
          ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
        `}
        style={{
          width: `${size.width}px`,
          height: `${size.height}px`,
          padding: `${padding}px`,
          borderColor: `${theme.dot}40`,
          boxShadow: `0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px ${theme.dot}30`,
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
              className="w-1.5 h-1.5 rounded-full transition-colors duration-300"
              style={{ backgroundColor: theme.dot, boxShadow: `0 0 8px ${theme.glow}` }}
            />
            <span className="text-[10px] font-bold tracking-[0.2em] text-white/60 uppercase">
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
            <p className="text-white/45 text-xs mt-1">{sessionsCompletedToday} / 8 sessions today</p>
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
