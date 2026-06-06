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
import { localDateKey } from '@/lib/dateRanges';
import { fetchTodayAndYesterdayFocusSeconds } from '@/lib/focusSessions';

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

function hasCountableFocusProgress(timerMode, phase, timeVal, sessionMinutes, countdownMinutes) {
  if (timerMode === 'stopwatch') return timeVal > 0;
  if (timerMode === 'countdown') return timeVal < countdownMinutes * 60;
  if (timerMode === 'pomodoro' && phase === 'session') return timeVal < sessionMinutes * 60;
  return false;
}

function getFreshFocusTime(timerMode, phase, sessionMinutes, shortBreakMinutes, longBreakMinutes, countdownMinutes) {
  if (timerMode === 'stopwatch') return 0;
  if (timerMode === 'countdown') return countdownMinutes * 60;
  if (phase === 'shortBreak') return shortBreakMinutes * 60;
  if (phase === 'longBreak') return longBreakMinutes * 60;
  return sessionMinutes * 60;
}

function resolveFocusRunDate(savedRunDate, updatedAt) {
  if (savedRunDate) return savedRunDate;
  if (updatedAt) {
    const parsed = new Date(updatedAt);
    if (!Number.isNaN(parsed.getTime())) return localDateKey(parsed);
  }
  return null;
}

function discardStaleFocusProgress({
  timeVal,
  runDate,
  timerMode,
  phase,
  sessionMinutes,
  shortBreakMinutes,
  longBreakMinutes,
  countdownMinutes,
}) {
  const today = localDateKey();
  if (runDate === today) return { timeVal, focusRunDate: runDate };
  if (!hasCountableFocusProgress(timerMode, phase, timeVal, sessionMinutes, countdownMinutes)) {
    return { timeVal, focusRunDate: runDate };
  }
  return {
    timeVal: getFreshFocusTime(timerMode, phase, sessionMinutes, shortBreakMinutes, longBreakMinutes, countdownMinutes),
    focusRunDate: null,
  };
}

/** Whether this mode/phase should contribute to productive focus time. */
function isFocusSegmentMode(timerMode, phase) {
  if (timerMode === 'stopwatch') return true;
  if (timerMode === 'countdown') return true;
  return timerMode === 'pomodoro' && phase === 'session';
}

/** Seconds elapsed since the current play segment started (only meaningful while running). */
function getRunSegmentElapsed(timerMode, phase, currentTime, runStartTime) {
  if (runStartTime == null) return 0;
  if (timerMode === 'stopwatch') {
    return Math.max(0, Math.floor(currentTime) - Math.floor(runStartTime));
  }
  if (isFocusSegmentMode(timerMode, phase)) {
    return Math.max(0, Math.floor(runStartTime) - Math.floor(currentTime));
  }
  return 0;
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
  const [sessionsDate, setSessionsDate] = useState(() => (typeof window !== 'undefined' ? localDateKey() : ''));
  /** Calendar day (local) for the in-progress focus run; productive time only counts when this is today. */
  const [focusRunDate, setFocusRunDate] = useState(null);
  const settingsAppliedRef = useRef(false);
  const [supabaseHydrated, setSupabaseHydrated] = useState(false);
  /** Bumped after focus time is persisted so live unlogged seconds recalculate. */
  const [persistedFocusTick, setPersistedFocusTick] = useState(0);
  const [todayLoggedFocusSeconds, setTodayLoggedFocusSeconds] = useState(0);
  const [yesterdayLoggedFocusSeconds, setYesterdayLoggedFocusSeconds] = useState(0);
  const loggedDayRef = useRef(localDateKey());

  const [position, setPosition] = useState(null);
  const [size, setSize] = useState({ width: 450, height: 450 });

  const audioContextRef = useRef(null);
  /** `time` value when the current play segment started. */
  const runStartTimeRef = useRef(null);
  /** Seconds from the current play segment already written to focus_sessions. */
  const segmentLoggedRef = useRef(0);
  const timeRef = useRef(time);
  const timerModeRef = useRef(timerMode);
  const phaseRef = useRef(phase);
  timeRef.current = time;
  timerModeRef.current = timerMode;
  phaseRef.current = phase;

  const refreshLoggedFocusTotals = useCallback(async () => {
    if (!userId) {
      setTodayLoggedFocusSeconds(0);
      setYesterdayLoggedFocusSeconds(0);
      return;
    }
    const totals = await fetchTodayAndYesterdayFocusSeconds(userId, getToken);
    setTodayLoggedFocusSeconds(totals.today);
    setYesterdayLoggedFocusSeconds(totals.yesterday);
    loggedDayRef.current = localDateKey();
  }, [userId, getToken]);

  const logSession = useCallback(
    async (options) => {
      if (!userId) return;
      const token = await getToken({ template: 'supabase' }).catch(() => null);
      if (token) setSupabaseAuthToken(token);
      const err = await logFocusSessionToSupabase(userId, options, token);
      if (!err) {
        setPersistedFocusTick((t) => t + 1);
        void refreshLoggedFocusTotals();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('focus-session-logged'));
        }
      }
    },
    [userId, getToken, refreshLoggedFocusTotals]
  );

  const logRunSegment = useCallback(
    async (modeOverride) => {
      const mode = timerModeRef.current;
      const phaseVal = phaseRef.current;
      if (!isFocusSegmentMode(mode, phaseVal)) return;
      const segmentElapsed = getRunSegmentElapsed(mode, phaseVal, timeRef.current, runStartTimeRef.current);
      const toLog = segmentElapsed - segmentLoggedRef.current;
      if (toLog < 1) return;
      segmentLoggedRef.current += toLog;
      const logMode =
        modeOverride ||
        (mode === 'stopwatch' ? 'stopwatch' : mode === 'countdown' ? 'countdown' : 'pomodoro');
      await logSession({ durationSeconds: toLog, phase: 'session', mode: logMode });
    },
    [logSession]
  );

  /** Focus seconds not yet in focus_sessions — only while the timer is actively running today. */
  const unloggedFocusSeconds = useMemo(() => {
    void persistedFocusTick;
    if (!isRunning || focusRunDate !== localDateKey()) return 0;
    if (!isFocusSegmentMode(timerMode, phase)) return 0;
    const segmentElapsed = getRunSegmentElapsed(timerMode, phase, time, runStartTimeRef.current);
    return Math.max(0, segmentElapsed - segmentLoggedRef.current);
  }, [isRunning, focusRunDate, timerMode, phase, time, persistedFocusTick]);

  const isFocusTimerRunningToday = isRunning && focusRunDate === localDateKey();

  const todayFocusSeconds = useMemo(
    () => todayLoggedFocusSeconds + unloggedFocusSeconds,
    [todayLoggedFocusSeconds, unloggedFocusSeconds]
  );

  useEffect(() => {
    void refreshLoggedFocusTotals();
  }, [userId, refreshLoggedFocusTotals]);

  useEffect(() => {
    if (!userId) return;
    const id = setInterval(() => {
      const today = localDateKey();
      if (loggedDayRef.current !== today) {
        void refreshLoggedFocusTotals();
      }
    }, 60_000);
    return () => clearInterval(id);
  }, [userId, refreshLoggedFocusTotals]);

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
      const today = localDateKey();
      if (remote && typeof remote === 'object') {
        const timer = remote.timer || {};
        const sessions = remote.sessions || {};
        const settings = remote.settings || {};
        const mode = timer.mode ?? 'pomodoro';
        const ph = timer.phase ?? 'session';
        const sm = settings.sessionMinutes ?? DEFAULT_SESSION;
        const sbm = settings.shortBreakMinutes ?? DEFAULT_SHORT_BREAK;
        const lbm = settings.longBreakMinutes ?? DEFAULT_LONG_BREAK;
        const cm = settings.countdownMinutes ?? DEFAULT_COUNTDOWN;
        setTimerMode(mode);
        setPhase(ph);
        setSessionMinutes(sm);
        setShortBreakMinutes(sbm);
        setLongBreakMinutes(lbm);
        setCountdownMinutes(cm);
        setAutoStartBreaks(settings.autoStartBreaks !== false);
        setAlarmVolume(Math.max(0, Math.min(100, settings.alarmVolume ?? 60)));
        setTickSound(settings.tickSound !== false);
        const sessionsToday = (sessions.date ?? today) === today ? Math.max(0, sessions.today ?? 0) : 0;
        const sessionsDateVal = (sessions.date ?? today) === today ? (sessions.date ?? today) : today;
        setSessionsCompletedToday(sessionsToday);
        setSessionsDate(sessionsDateVal);
        let timeVal = typeof timer.time === 'number' ? timer.time : sm * 60;
        const runDate = resolveFocusRunDate(timer.focusRunDate, timer.updatedAt);
        const discarded = discardStaleFocusProgress({
          timeVal,
          runDate,
          timerMode: mode,
          phase: ph,
          sessionMinutes: sm,
          shortBreakMinutes: sbm,
          longBreakMinutes: lbm,
          countdownMinutes: cm,
        });
        timeVal = discarded.timeVal;
        runStartTimeRef.current = null;
        segmentLoggedRef.current = 0;
        setFocusRunDate(discarded.focusRunDate);
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
        setUserStorageItem(userId, 'focus-timer-sessions-today', String(sessionsToday));
        setUserStorageItem(userId, 'focus-timer-sessions-date', sessionsDateVal);
        setUserStorageItem(userId, 'focus-timer-run-date', discarded.focusRunDate || '');
        setSupabaseHydrated(true);
      } else {
        loadSettingsFromStorage();
        const sm = getStoredInt(userId, 'focus-settings-session-minutes', DEFAULT_SESSION);
        const sbm = getStoredInt(userId, 'focus-settings-short-break-minutes', DEFAULT_SHORT_BREAK);
        const lbm = getStoredInt(userId, 'focus-settings-long-break-minutes', DEFAULT_LONG_BREAK);
        const cm = getStoredInt(userId, 'focus-settings-countdown-minutes', DEFAULT_COUNTDOWN);
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
        const mode = savedMode === 'stopwatch' || savedMode === 'countdown' ? savedMode : 'pomodoro';
        const ph = savedPhase === 'shortBreak' || savedPhase === 'longBreak' ? savedPhase : 'session';
        if (savedMode === 'stopwatch' || savedMode === 'countdown') setTimerMode(savedMode);
        if (savedPhase === 'shortBreak' || savedPhase === 'longBreak') setPhase(savedPhase);
        const savedTime = getUserStorageItem(userId, 'focus-timer-time', 'focus-timer-time');
        const savedRunning = getUserStorageItem(userId, 'focus-timer-running', 'focus-timer-running');
        const savedUpdatedAt = getUserStorageItem(userId, 'focus-timer-updated-at', 'focus-timer-updated-at');
        const savedRunDate = getUserStorageItem(userId, 'focus-timer-run-date', 'focus-timer-run-date');
        const nextTime = savedTime ? parseInt(savedTime, 10) : null;
        let timeVal;
        if (nextTime != null && !Number.isNaN(nextTime) && nextTime >= 0) {
          timeVal = nextTime;
        } else if (mode === 'stopwatch') {
          timeVal = 0;
        } else if (mode === 'countdown') {
          timeVal = cm * 60;
        } else if (ph === 'shortBreak') {
          timeVal = sbm * 60;
        } else if (ph === 'longBreak') {
          timeVal = lbm * 60;
        } else {
          timeVal = sm * 60;
        }
        const runDate = resolveFocusRunDate(
          savedRunDate || null,
          savedUpdatedAt ? new Date(parseInt(savedUpdatedAt, 10)).toISOString() : null
        );
        const discarded = discardStaleFocusProgress({
          timeVal,
          runDate,
          timerMode: mode,
          phase: ph,
          sessionMinutes: sm,
          shortBreakMinutes: sbm,
          longBreakMinutes: lbm,
          countdownMinutes: cm,
        });
        runStartTimeRef.current = null;
        segmentLoggedRef.current = 0;
        setFocusRunDate(discarded.focusRunDate);
        setTime(discarded.timeVal);
        setUserStorageItem(userId, 'focus-timer-time', String(discarded.timeVal));
        setUserStorageItem(userId, 'focus-timer-run-date', discarded.focusRunDate || '');
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
      setFocusRunDate(null);
      runStartTimeRef.current = null;
      segmentLoggedRef.current = 0;
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
    setUserStorageItem(userId, 'focus-timer-run-date', focusRunDate || '');
  }, [isRunning, time, userId, timerMode, phase, focusRunDate]);

  useEffect(() => {
    if (typeof window === 'undefined' || !userId || !initialLoadDoneRef.current) return;
    setUserStorageItem(userId, 'focus-timer-sessions-today', sessionsCompletedToday.toString());
    setUserStorageItem(userId, 'focus-timer-sessions-date', sessionsDate || localDateKey());
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
        timer: { time, isRunning, updatedAt: new Date().toISOString(), mode: timerMode, phase, focusRunDate },
        sessions: { today: sessionsCompletedToday, date: sessionsDate || localDateKey() },
        settings: { timerMode, sessionMinutes, shortBreakMinutes, longBreakMinutes, countdownMinutes, autoStartBreaks, alarmVolume, tickSound },
        position: position && typeof position.x === 'number' ? position : undefined,
        size: size && size.width >= 350 && size.height >= 300 ? size : undefined,
      };
      setFocusTimerStateToSupabase(userId, state);
    }, 2500);
    return () => { if (supabaseSaveTimeoutRef.current) clearTimeout(supabaseSaveTimeoutRef.current); };
  }, [userId, time, isRunning, timerMode, phase, focusRunDate, sessionMinutes, shortBreakMinutes, longBreakMinutes, countdownMinutes, autoStartBreaks, alarmVolume, tickSound, sessionsCompletedToday, sessionsDate, position, size, supabaseHydrated]);

  useEffect(() => {
    if (!isRunning) return;
    const today = localDateKey();
    if (focusRunDate === today) return;
    if (hasCountableFocusProgress(timerMode, phase, time, sessionMinutes, countdownMinutes)) {
      const fresh = getFreshFocusTime(timerMode, phase, sessionMinutes, shortBreakMinutes, longBreakMinutes, countdownMinutes);
      setTime(fresh);
      runStartTimeRef.current = null;
      segmentLoggedRef.current = 0;
    }
    setFocusRunDate(today);
  }, [isRunning, focusRunDate, timerMode, phase, time, sessionMinutes, shortBreakMinutes, longBreakMinutes, countdownMinutes]);

  /** Start a new play segment whenever the timer begins running. */
  const wasRunningRef = useRef(false);
  useEffect(() => {
    if (isRunning && !wasRunningRef.current) {
      runStartTimeRef.current = timeRef.current;
      segmentLoggedRef.current = 0;
    }
    wasRunningRef.current = isRunning;
  }, [isRunning]);

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
            if (userId) void logRunSegment('countdown');
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('celebration-trigger', { detail: { type: 'focus_session', sessionMinutes: countdownMinutes, mode: 'countdown' } }));
            }
            setIsRunning(false);
            return 0;
          }
          if (timerMode === 'pomodoro') {
            if (phase === 'session') {
              if (userId) void logRunSegment('pomodoro');
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('celebration-trigger', { detail: { type: 'focus_session', sessionMinutes, mode: 'pomodoro' } }));
              }
              playPhaseStartRing();
              const nextSessions = sessionsCompletedToday + 1;
              setSessionsCompletedToday(nextSessions);
              setSessionsDate(localDateKey());
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
  }, [isRunning, timerMode, phase, sessionMinutes, shortBreakMinutes, longBreakMinutes, autoStartBreaks, sessionsCompletedToday, playAlarm, playPhaseStartRing, playTick, tickSound, longBreakMinutes, countdownMinutes, userId, logRunSegment]);

  /** Persist focus time in 1-minute chunks while the timer runs (all modes). */
  useEffect(() => {
    if (!isRunning || !userId || focusRunDate !== localDateKey()) return;
    const checkpoint = () => {
      if (!isFocusSegmentMode(timerModeRef.current, phaseRef.current)) return;
      const segmentElapsed = getRunSegmentElapsed(
        timerModeRef.current,
        phaseRef.current,
        timeRef.current,
        runStartTimeRef.current
      );
      if (segmentElapsed - segmentLoggedRef.current >= 60) {
        void logRunSegment();
      }
    };
    checkpoint();
    const id = setInterval(checkpoint, 10_000);
    return () => clearInterval(id);
  }, [isRunning, userId, timerMode, phase, logRunSegment, focusRunDate]);

  useEffect(() => {
    runStartTimeRef.current = null;
    segmentLoggedRef.current = 0;
  }, [timerMode]);

  const handlePlayPause = useCallback(() => {
    if (isRunning) {
      if (userId && focusRunDate === localDateKey()) {
        void logRunSegment();
      }
      setIsRunning(false);
      return;
    }
    const today = localDateKey();
    if (focusRunDate !== today && hasCountableFocusProgress(timerMode, phase, time, sessionMinutes, countdownMinutes)) {
      const fresh = getFreshFocusTime(timerMode, phase, sessionMinutes, shortBreakMinutes, longBreakMinutes, countdownMinutes);
      setTime(fresh);
      runStartTimeRef.current = null;
      segmentLoggedRef.current = 0;
    }
    setFocusRunDate(today);
    setIsRunning(true);
  }, [timerMode, isRunning, time, userId, phase, sessionMinutes, shortBreakMinutes, longBreakMinutes, countdownMinutes, focusRunDate, logRunSegment]);

  const handleReset = useCallback(() => {
    if (isRunning && userId && focusRunDate === localDateKey()) {
      void logRunSegment();
    }
    runStartTimeRef.current = null;
    segmentLoggedRef.current = 0;
    setFocusRunDate(null);
    setTime(timerMode === 'stopwatch' ? 0 : getDurationSeconds());
    setIsRunning(false);
  }, [timerMode, getDurationSeconds, isRunning, userId, focusRunDate, logRunSegment]);

  const handleSwitchPomodoroPhase = useCallback((newPhase) => {
    if (timerMode !== 'pomodoro' || newPhase === phase) return;
    if (phase === 'session' && isRunning && userId && focusRunDate === localDateKey()) {
      void logRunSegment('pomodoro');
    }
    runStartTimeRef.current = null;
    segmentLoggedRef.current = 0;
    setPhase(newPhase);
    if (newPhase === 'session') setTime(sessionMinutes * 60);
    else if (newPhase === 'shortBreak') setTime(shortBreakMinutes * 60);
    else setTime(longBreakMinutes * 60);
    setIsRunning(false);
  }, [timerMode, phase, isRunning, userId, sessionMinutes, shortBreakMinutes, longBreakMinutes, focusRunDate, logRunSegment]);

  const handlePomodoroForward = useCallback(() => {
    if (timerMode !== 'pomodoro') return;
    const order = ['session', 'shortBreak', 'longBreak'];
    const idx = order.indexOf(phase);
    const nextPhase = order[(idx + 1) % order.length];
    if (phase === 'session' && isRunning && userId && focusRunDate === localDateKey()) {
      void logRunSegment('pomodoro');
    }
    runStartTimeRef.current = null;
    segmentLoggedRef.current = 0;
    setPhase(nextPhase);
    if (nextPhase === 'session') setTime(sessionMinutes * 60);
    else if (nextPhase === 'shortBreak') setTime(shortBreakMinutes * 60);
    else setTime(longBreakMinutes * 60);
    setIsRunning(false);
  }, [timerMode, phase, isRunning, userId, sessionMinutes, shortBreakMinutes, longBreakMinutes, focusRunDate, logRunSegment]);

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
    todayLoggedFocusSeconds,
    yesterdayLoggedFocusSeconds,
    todayFocusSeconds,
    isFocusTimerRunningToday,
    refreshLoggedFocusTotals,
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimer must be used within TimerProvider');
  return ctx;
}
