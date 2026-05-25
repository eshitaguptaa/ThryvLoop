'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import {
  getUserStorageItem,
  setUserStorageItem,
  setUserStorageJson,
  setSupabaseAuthToken,
  getFocusTimerStateFromSupabase,
  setFocusTimerStateToSupabase,
  logFocusSessionToSupabase,
} from '@/utils/userStorage';

export const TimerContext = createContext(null);

const DEFAULT_SESSION = 25;
const DEFAULT_SHORT_BREAK = 5;
const DEFAULT_LONG_BREAK = 15;
const DEFAULT_COUNTDOWN = 5;
const POMODOROS_BEFORE_LONG_BREAK = 4;

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

export function TimerProvider({ children }) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const userId = user?.id || null;
  const initialLoadDoneRef = useRef(false);

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
  /** Bumped after focus time is persisted so live unlogged seconds recalculate. */
  const [persistedFocusTick, setPersistedFocusTick] = useState(0);

  const [position, setPosition] = useState(null);
  const [size, setSize] = useState({ width: 450, height: 450 });

  const audioContextRef = useRef(null);
  /** Seconds already written to focus_sessions for the current stopwatch run. */
  const stopwatchLoggedRef = useRef(0);
  /** Seconds already logged for the current pomodoro/countdown focus phase. */
  const focusPhaseLoggedRef = useRef(0);
  const timeRef = useRef(time);
  timeRef.current = time;

  const logSession = useCallback(
    async (options) => {
      if (!userId) return;
      const token = await getToken({ template: 'supabase' }).catch(() => null);
      if (token) setSupabaseAuthToken(token);
      const err = await logFocusSessionToSupabase(userId, options, token);
      if (!err) {
        setPersistedFocusTick((t) => t + 1);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('focus-session-logged'));
        }
      }
    },
    [userId, getToken]
  );

  const logStopwatchElapsed = useCallback(
    async (totalSeconds) => {
      const elapsed = Math.floor(totalSeconds) - stopwatchLoggedRef.current;
      if (elapsed < 1) return;
      await logSession({ durationSeconds: elapsed, phase: 'session', mode: 'stopwatch' });
      stopwatchLoggedRef.current = Math.floor(totalSeconds);
    },
    [logSession]
  );

  const logFocusPhaseElapsed = useCallback(
    async (totalSeconds, elapsedSeconds, mode) => {
      const elapsed = Math.min(
        Math.floor(elapsedSeconds),
        Math.floor(totalSeconds) - focusPhaseLoggedRef.current
      );
      if (elapsed < 1) return;
      await logSession({ durationSeconds: elapsed, phase: 'session', mode });
      focusPhaseLoggedRef.current += elapsed;
    },
    [logSession]
  );

  /** Focus seconds not yet in focus_sessions — only while the timer is actively running. */
  const unloggedFocusSeconds = useMemo(() => {
    void persistedFocusTick;
    if (!isRunning) return 0;
    if (timerMode === 'stopwatch') {
      return Math.max(0, Math.floor(time) - stopwatchLoggedRef.current);
    }
    if (timerMode === 'pomodoro' && phase === 'session') {
      const total = sessionMinutes * 60;
      const elapsed = total - time;
      return Math.max(0, Math.floor(elapsed) - focusPhaseLoggedRef.current);
    }
    if (timerMode === 'countdown') {
      const total = countdownMinutes * 60;
      const elapsed = total - time;
      return Math.max(0, Math.floor(elapsed) - focusPhaseLoggedRef.current);
    }
    return 0;
  }, [isRunning, timerMode, phase, time, sessionMinutes, countdownMinutes, persistedFocusTick]);

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

  /** Pleasant ring marking the start of the next phase (break or session). */
  const playPhaseStartRing = useCallback(() => {
    if (typeof window === 'undefined' || alarmVolume === 0) return;
    try {
      const ctx = audioContextRef.current || new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = ctx;
      const gain = (alarmVolume / 100) * 0.22;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.03);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      g.connect(ctx.destination);
      const playTone = (freq, start, dur) => {
        const osc = ctx.createOscillator();
        osc.frequency.value = freq;
        osc.type = 'sine';
        osc.connect(g);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur);
      };
      playTone(523.25, 0, 0.18);
      playTone(659.25, 0.14, 0.2);
    } catch (_) {}
  }, [alarmVolume]);

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

  useEffect(() => {
    if (typeof window === 'undefined' || !userId) return;
    let cancelled = false;
    const load = async () => {
      try {
        const token = await getToken({ template: 'supabase' });
        if (token) setSupabaseAuthToken(token);
      } catch (_) {}
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
      initialLoadDoneRef.current = true;
    };
    load();
    return () => { cancelled = true; };
  }, [userId, getToken, loadSettingsFromStorage]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (e) => {
      const v = e?.detail?.tickSound;
      if (typeof v === 'boolean') setTickSound(v);
    };
    window.addEventListener('focus-settings-tick-sound-changed', handler);
    return () => window.removeEventListener('focus-settings-tick-sound-changed', handler);
  }, []);

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
        setTime(getDurationSeconds());
      }
      setIsRunning(false);
    };
    window.addEventListener('focus-settings-applied', handler);
    return () => window.removeEventListener('focus-settings-applied', handler);
  }, [loadSettingsFromStorage, getDurationSeconds]);

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
    if (typeof window === 'undefined' || !userId || !initialLoadDoneRef.current) return;
    setUserStorageItem(userId, 'focus-timer-time', time.toString());
    setUserStorageItem(userId, 'focus-timer-updated-at', Date.now().toString());
    setUserStorageItem(userId, 'focus-timer-running', isRunning ? 'true' : 'false');
    setUserStorageItem(userId, 'focus-timer-mode', timerMode);
    setUserStorageItem(userId, 'focus-timer-phase', phase);
  }, [isRunning, time, userId, timerMode, phase]);

  useEffect(() => {
    if (typeof window === 'undefined' || !userId || !initialLoadDoneRef.current) return;
    setUserStorageItem(userId, 'focus-timer-sessions-today', sessionsCompletedToday.toString());
    setUserStorageItem(userId, 'focus-timer-sessions-date', sessionsDate || new Date().toISOString().slice(0, 10));
  }, [sessionsCompletedToday, sessionsDate, userId]);

  useEffect(() => {
    if (typeof window === 'undefined' || !userId || !position || !initialLoadDoneRef.current) return;
    setUserStorageJson(userId, 'focus-timer-position', position);
  }, [position, userId]);

  useEffect(() => {
    if (typeof window === 'undefined' || !userId || !initialLoadDoneRef.current) return;
    if (size.width >= 350 && size.height >= 300) {
      setUserStorageJson(userId, 'focus-timer-size', size);
    }
  }, [size, userId]);

  const supabaseSaveTimeoutRef = useRef(null);
  useEffect(() => {
    if (typeof window === 'undefined' || !userId || !supabaseHydrated || !settingsAppliedRef.current) return;
    if (supabaseSaveTimeoutRef.current) clearTimeout(supabaseSaveTimeoutRef.current);
    supabaseSaveTimeoutRef.current = setTimeout(() => {
      supabaseSaveTimeoutRef.current = null;
      const state = {
        timer: { time, isRunning, updatedAt: new Date().toISOString(), mode: timerMode, phase },
        sessions: { today: sessionsCompletedToday, date: sessionsDate || new Date().toISOString().slice(0, 10) },
        settings: { timerMode, sessionMinutes, shortBreakMinutes, longBreakMinutes, countdownMinutes, autoStartBreaks, alarmVolume, tickSound },
        position: position && typeof position.x === 'number' ? position : undefined,
        size: size && size.width >= 350 && size.height >= 300 ? size : undefined,
      };
      setFocusTimerStateToSupabase(userId, state);
    }, 2500);
    return () => { if (supabaseSaveTimeoutRef.current) clearTimeout(supabaseSaveTimeoutRef.current); };
  }, [userId, time, isRunning, timerMode, phase, sessionMinutes, shortBreakMinutes, longBreakMinutes, countdownMinutes, autoStartBreaks, alarmVolume, tickSound, sessionsCompletedToday, sessionsDate, position, size, supabaseHydrated]);

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
            playPhaseStartRing();
            if (userId) {
              const total = countdownMinutes * 60;
              void logFocusPhaseElapsed(total, total - focusPhaseLoggedRef.current, 'countdown');
              focusPhaseLoggedRef.current = 0;
            }
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('celebration-trigger', { detail: { type: 'focus_session', sessionMinutes: countdownMinutes, mode: 'countdown' } }));
            }
            setIsRunning(false);
            return 0;
          }
          if (timerMode === 'pomodoro') {
            if (phase === 'session') {
              if (userId) {
                const total = sessionMinutes * 60;
                void logFocusPhaseElapsed(total, total - focusPhaseLoggedRef.current, 'pomodoro');
                focusPhaseLoggedRef.current = 0;
              }
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('celebration-trigger', { detail: { type: 'focus_session', sessionMinutes, mode: 'pomodoro' } }));
              }
              playPhaseStartRing();
              const nextSessions = sessionsCompletedToday + 1;
              setSessionsCompletedToday(nextSessions);
              setSessionsDate(new Date().toISOString().slice(0, 10));
              const doLongBreak = nextSessions > 0 && nextSessions % POMODOROS_BEFORE_LONG_BREAK === 0;
              setPhase(doLongBreak ? 'longBreak' : 'shortBreak');
              const breakMins = doLongBreak ? longBreakMinutes : shortBreakMinutes;
              const nextTime = breakMins * 60;
              if (autoStartBreaks) setTimeout(() => setIsRunning(true), 100);
              else setIsRunning(false);
              return nextTime;
            }
            if (phase === 'shortBreak' || phase === 'longBreak') {
              playPhaseStartRing();
              setPhase('session');
              const nextTime = sessionMinutes * 60;
              if (autoStartBreaks) setTimeout(() => setIsRunning(true), 100);
              else setIsRunning(false);
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
  }, [isRunning, timerMode, phase, sessionMinutes, shortBreakMinutes, longBreakMinutes, autoStartBreaks, sessionsCompletedToday, playAlarm, playPhaseStartRing, playTick, tickSound, longBreakMinutes, countdownMinutes, userId, logFocusPhaseElapsed]);

  /** Persist focus time in 1-minute chunks while the timer runs (all modes). */
  useEffect(() => {
    if (!isRunning || !userId) return;
    const checkpoint = () => {
      if (timerMode === 'stopwatch') {
        const unlogged = Math.floor(timeRef.current) - stopwatchLoggedRef.current;
        if (unlogged >= 60) void logStopwatchElapsed(timeRef.current);
        return;
      }
      if (timerMode === 'pomodoro' && phase === 'session') {
        const total = sessionMinutes * 60;
        const elapsed = total - timeRef.current;
        const unlogged = Math.floor(elapsed) - focusPhaseLoggedRef.current;
        if (unlogged >= 60) void logFocusPhaseElapsed(total, elapsed, 'pomodoro');
        return;
      }
      if (timerMode === 'countdown') {
        const total = countdownMinutes * 60;
        const elapsed = total - timeRef.current;
        const unlogged = Math.floor(elapsed) - focusPhaseLoggedRef.current;
        if (unlogged >= 60) void logFocusPhaseElapsed(total, elapsed, 'countdown');
      }
    };
    checkpoint();
    const id = setInterval(checkpoint, 10_000);
    return () => clearInterval(id);
  }, [
    isRunning,
    userId,
    timerMode,
    phase,
    sessionMinutes,
    countdownMinutes,
    logStopwatchElapsed,
    logFocusPhaseElapsed,
  ]);

  useEffect(() => {
    focusPhaseLoggedRef.current = 0;
    stopwatchLoggedRef.current = 0;
  }, [timerMode]);

  const handlePlayPause = useCallback(() => {
    if (isRunning && userId) {
      if (timerMode === 'stopwatch' && time > 0) {
        void logStopwatchElapsed(time);
      } else if (timerMode === 'pomodoro' && phase === 'session') {
        const total = sessionMinutes * 60;
        const elapsed = total - time;
        void logFocusPhaseElapsed(total, elapsed, 'pomodoro');
      } else if (timerMode === 'countdown') {
        const total = countdownMinutes * 60;
        const elapsed = total - time;
        void logFocusPhaseElapsed(total, elapsed, 'countdown');
      }
    }
    setIsRunning((r) => !r);
  }, [timerMode, isRunning, time, userId, phase, sessionMinutes, countdownMinutes, logStopwatchElapsed, logFocusPhaseElapsed]);

  const handleReset = useCallback(() => {
    if (isRunning && userId) {
      if (timerMode === 'stopwatch' && time > 0) {
        void logStopwatchElapsed(time);
      } else if (timerMode === 'pomodoro' && phase === 'session' && time > 0) {
        const total = sessionMinutes * 60;
        void logFocusPhaseElapsed(total, total - time, 'pomodoro');
      } else if (timerMode === 'countdown' && time > 0) {
        const total = countdownMinutes * 60;
        void logFocusPhaseElapsed(total, total - time, 'countdown');
      }
    }
    stopwatchLoggedRef.current = 0;
    focusPhaseLoggedRef.current = 0;
    setTime(timerMode === 'stopwatch' ? 0 : getDurationSeconds());
    setIsRunning(false);
  }, [timerMode, getDurationSeconds, time, isRunning, userId, phase, sessionMinutes, countdownMinutes, logStopwatchElapsed, logFocusPhaseElapsed]);

  const handleSwitchPomodoroPhase = useCallback((newPhase) => {
    if (timerMode !== 'pomodoro' || newPhase === phase) return;
    if (phase === 'session' && isRunning && time > 0 && userId) {
      const total = sessionMinutes * 60;
      void logFocusPhaseElapsed(total, total - time, 'pomodoro');
    }
    focusPhaseLoggedRef.current = 0;
    setPhase(newPhase);
    if (newPhase === 'session') setTime(sessionMinutes * 60);
    else if (newPhase === 'shortBreak') setTime(shortBreakMinutes * 60);
    else setTime(longBreakMinutes * 60);
    setIsRunning(false);
  }, [timerMode, phase, sessionMinutes, shortBreakMinutes, longBreakMinutes]);

  const handlePomodoroForward = useCallback(() => {
    if (timerMode !== 'pomodoro') return;
    const order = ['session', 'shortBreak', 'longBreak'];
    const idx = order.indexOf(phase);
    const nextPhase = order[(idx + 1) % order.length];
    if (phase === 'session' && isRunning && time > 0 && userId) {
      const total = sessionMinutes * 60;
      void logFocusPhaseElapsed(total, total - time, 'pomodoro');
    }
    focusPhaseLoggedRef.current = 0;
    setPhase(nextPhase);
    if (nextPhase === 'session') setTime(sessionMinutes * 60);
    else if (nextPhase === 'shortBreak') setTime(shortBreakMinutes * 60);
    else setTime(longBreakMinutes * 60);
    setIsRunning(false);
  }, [timerMode, phase, isRunning, time, userId, sessionMinutes, shortBreakMinutes, longBreakMinutes, logFocusPhaseElapsed]);

  const value = {
    timerMode,
    setTimerMode,
    phase,
    setPhase,
    sessionMinutes,
    shortBreakMinutes,
    longBreakMinutes,
    countdownMinutes,
    autoStartBreaks,
    alarmVolume,
    tickSound,
    time,
    setTime,
    isRunning,
    setIsRunning,
    sessionsCompletedToday,
    setSessionsCompletedToday,
    sessionsDate,
    setSessionsDate,
    position,
    setPosition,
    size,
    setSize,
    getDurationSeconds,
    getInitialTimeForCurrentState,
    loadSettingsFromStorage,
    handlePlayPause,
    handleReset,
    handleSwitchPomodoroPhase,
    handlePomodoroForward,
    playAlarm,
    playTick,
    unloggedFocusSeconds,
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimer must be used within TimerProvider');
  return ctx;
}
