'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import {
  getUserStorageItem,
  getUserStorageJson,
  setUserStorageItem,
  setUserStorageJson,
  setSupabaseAuthToken,
  getFocusTimerStateFromSupabase,
  setFocusTimerStateToSupabase,
  logFocusSessionToSupabase,
} from '@/utils/userStorage';
import { localDateKey } from '@/lib/dateRanges';
import { fetchTodayAndYesterdayFocusSeconds } from '@/lib/focusSessions';
import { getClerkSupabaseToken } from '@/lib/clerkSupabaseToken';
import { getFocusContentCenter } from '@/lib/focusWidgetLayout';
import {
  buildFocusTimerPersistPayload,
  persistFocusTimerState,
  registerFocusTimerLogoutPauseFlush,
  registerFocusTimerUrgentFlush,
  sendFocusTimerStateKeepalive,
} from '@/lib/focusTimerPersist';

export const TimerContext = createContext(null);

const DEFAULT_SESSION = 25;
const DEFAULT_SHORT_BREAK = 5;
const DEFAULT_LONG_BREAK = 15;
const DEFAULT_COUNTDOWN = 5;
const POMODOROS_BEFORE_LONG_BREAK = 2;
/** Max single stopwatch stretch we restore (12h). */
const MAX_STOPWATCH_SECONDS = 12 * 60 * 60;
/** Reject values that look like ms timestamps or corrupt data. */
const MAX_TIMER_SECONDS = 24 * 60 * 60;
/** Do not add more than this much away-time when resuming a running timer. */
const MAX_ELAPSED_AWAY_SECONDS = 12 * 60 * 60;

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

function parseUpdatedAtMs(value) {
  if (value == null || value === '') return 0;
  if (typeof value === 'number' && !Number.isNaN(value)) {
    // Millisecond epoch timestamps only (13-digit-ish); ignore small numbers.
    return value > 1e11 ? value : 0;
  }
  const asNum = parseInt(String(value), 10);
  if (!Number.isNaN(asNum) && asNum > 1e11) return asNum;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function isPlausibleTimerSeconds(
  timeVal,
  timerMode,
  phase,
  sessionMinutes,
  shortBreakMinutes,
  longBreakMinutes,
  countdownMinutes
) {
  if (!Number.isFinite(timeVal) || timeVal < 0 || timeVal > MAX_TIMER_SECONDS) return false;
  if (timerMode === 'stopwatch') return timeVal <= MAX_STOPWATCH_SECONDS;
  if (timerMode === 'countdown') return timeVal <= (countdownMinutes || DEFAULT_COUNTDOWN) * 60 + 5;
  const cap =
    (phase === 'shortBreak'
      ? shortBreakMinutes
      : phase === 'longBreak'
        ? longBreakMinutes
        : sessionMinutes) *
      60 +
    5;
  return timeVal <= cap;
}

function sanitizeTimerSeconds(
  timeVal,
  timerMode,
  phase,
  sessionMinutes,
  shortBreakMinutes,
  longBreakMinutes,
  countdownMinutes
) {
  if (
    isPlausibleTimerSeconds(
      timeVal,
      timerMode,
      phase,
      sessionMinutes,
      shortBreakMinutes,
      longBreakMinutes,
      countdownMinutes
    )
  ) {
    return timeVal;
  }
  return getFreshFocusTime(timerMode, phase, sessionMinutes, shortBreakMinutes, longBreakMinutes, countdownMinutes);
}

/** Prefer local tick data when remote has a fresh timestamp but stale/corrupt time. */
function pickTimerSnapshot(local, remote) {
  const remoteMs = getRemoteUpdatedAtMs(remote);
  const localMs = local?.updatedAtMs ?? 0;

  if (!local) {
    return remote && typeof remote === 'object' ? { ...remote, updatedAtMs: remoteMs } : null;
  }
  if (!remote || typeof remote !== 'object') return local;

  const remoteTime = remote.timer?.time;
  const localTime = local.timer?.time;
  const mode =
    local.timer?.mode === 'stopwatch' || local.timer?.mode === 'countdown'
      ? local.timer.mode
      : remote.timer?.mode;
  const phase = local.timer?.phase ?? remote.timer?.phase ?? 'session';
  const settings = local.settings || remote.settings || {};
  const sm = settings.sessionMinutes ?? DEFAULT_SESSION;
  const sbm = settings.shortBreakMinutes ?? DEFAULT_SHORT_BREAK;
  const lbm = settings.longBreakMinutes ?? DEFAULT_LONG_BREAK;
  const cm = settings.countdownMinutes ?? DEFAULT_COUNTDOWN;

  const remoteTimeBad =
    typeof remoteTime === 'number' &&
    !isPlausibleTimerSeconds(remoteTime, mode, phase, sm, sbm, lbm, cm);
  const localTimeOk =
    typeof localTime === 'number' &&
    isPlausibleTimerSeconds(localTime, mode, phase, sm, sbm, lbm, cm);

  if (localMs >= remoteMs || (remoteTimeBad && localTimeOk)) {
    return local;
  }

  return { ...remote, updatedAtMs: remoteMs };
}

/** Account for time that passed while the page was closed with the timer running. */
function adjustTimerForElapsedAway({
  timeVal,
  wasRunning,
  updatedAtMs,
  timerMode,
  phase,
  sessionMinutes,
  shortBreakMinutes,
  longBreakMinutes,
  countdownMinutes,
}) {
  const saneTime = sanitizeTimerSeconds(
    timeVal,
    timerMode,
    phase,
    sessionMinutes,
    shortBreakMinutes,
    longBreakMinutes,
    countdownMinutes
  );

  if (!wasRunning || updatedAtMs <= 0) {
    return { timeVal: saneTime, isRunning: false };
  }

  const elapsedSec = Math.min(
    MAX_ELAPSED_AWAY_SECONDS,
    Math.max(0, Math.floor((Date.now() - updatedAtMs) / 1000))
  );
  if (elapsedSec === 0) {
    return { timeVal: saneTime, isRunning: true };
  }

  if (timerMode === 'stopwatch') {
    return { timeVal: saneTime + elapsedSec, isRunning: true };
  }

  const remaining = saneTime - elapsedSec;
  if (remaining > 0) {
    return { timeVal: remaining, isRunning: true };
  }

  return { timeVal: 0, isRunning: false };
}

function readLocalTimerSnapshot(userId) {
  if (typeof window === 'undefined' || !userId) return null;

  const updatedAtMs = parseUpdatedAtMs(
    getUserStorageItem(userId, 'focus-timer-updated-at', 'focus-timer-updated-at')
  );
  const timeRaw = getUserStorageItem(userId, 'focus-timer-time', 'focus-timer-time');
  if (timeRaw == null || timeRaw === '') return null;
  const time = parseInt(timeRaw, 10);
  if (Number.isNaN(time) || time < 0) return null;

  const modeRaw = getUserStorageItem(userId, 'focus-timer-mode', 'focus-timer-mode');
  const phaseRaw = getUserStorageItem(userId, 'focus-timer-phase', 'focus-timer-phase');
  const mode = modeRaw === 'stopwatch' || modeRaw === 'countdown' ? modeRaw : 'pomodoro';
  const phase = phaseRaw === 'shortBreak' || phaseRaw === 'longBreak' ? phaseRaw : 'session';
  const runDateRaw = getUserStorageItem(userId, 'focus-timer-run-date', 'focus-timer-run-date');

  return {
    updatedAtMs,
    timer: {
      time,
      isRunning: getUserStorageItem(userId, 'focus-timer-running', 'focus-timer-running') === 'true',
      mode,
      phase,
      focusRunDate: runDateRaw || null,
      updatedAt: updatedAtMs > 0 ? new Date(updatedAtMs).toISOString() : null,
    },
    sessions: {
      today: getStoredInt(userId, 'focus-timer-sessions-today', 0),
      date: getUserStorageItem(userId, 'focus-timer-sessions-date', 'focus-timer-sessions-date') || localDateKey(),
      cycle: getStoredInt(userId, 'focus-timer-pomodoros-in-cycle', 0),
    },
    settings: {
      timerMode: getUserStorageItem(userId, 'focus-settings-timer-mode', 'focus-settings-timer-mode'),
      sessionMinutes: getStoredInt(userId, 'focus-settings-session-minutes', DEFAULT_SESSION),
      shortBreakMinutes: getStoredInt(userId, 'focus-settings-short-break-minutes', DEFAULT_SHORT_BREAK),
      longBreakMinutes: getStoredInt(userId, 'focus-settings-long-break-minutes', DEFAULT_LONG_BREAK),
      countdownMinutes: getStoredInt(userId, 'focus-settings-countdown-minutes', DEFAULT_COUNTDOWN),
      autoStartBreaks: getStoredBool(userId, 'focus-settings-auto-start-breaks', true),
      alarmVolume: getStoredInt(userId, 'focus-settings-alarm-volume', 60),
      tickSound: getStoredBool(userId, 'focus-settings-tick-sound', true),
    },
    position: getUserStorageJson(userId, 'focus-timer-position', 'focus-timer-position'),
    size: getUserStorageJson(userId, 'focus-timer-size', 'focus-timer-size'),
  };
}

function getRemoteUpdatedAtMs(remote) {
  if (!remote?.timer) return 0;
  return parseUpdatedAtMs(remote.timer.updatedAt);
}

function applyTimerSnapshotFields(snapshot, today) {
  const timer = snapshot.timer || {};
  const sessions = snapshot.sessions || {};
  const settings = snapshot.settings || {};
  const mode =
    timer.mode === 'stopwatch' || timer.mode === 'countdown'
      ? timer.mode
      : settings.timerMode === 'stopwatch' || settings.timerMode === 'countdown'
        ? settings.timerMode
        : 'pomodoro';
  const ph = timer.phase === 'shortBreak' || timer.phase === 'longBreak' ? timer.phase : 'session';
  const sm = settings.sessionMinutes ?? DEFAULT_SESSION;
  const sbm = settings.shortBreakMinutes ?? DEFAULT_SHORT_BREAK;
  const lbm = settings.longBreakMinutes ?? DEFAULT_LONG_BREAK;
  const cm = settings.countdownMinutes ?? DEFAULT_COUNTDOWN;

  let timeVal = typeof timer.time === 'number' ? timer.time : sm * 60;
  timeVal = sanitizeTimerSeconds(timeVal, mode, ph, sm, sbm, lbm, cm);
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

  const updatedAtMs = parseUpdatedAtMs(timer.updatedAt) || snapshot.updatedAtMs || 0;
  const adjusted = adjustTimerForElapsedAway({
    timeVal,
    wasRunning: Boolean(timer.isRunning),
    updatedAtMs,
    timerMode: mode,
    phase: ph,
    sessionMinutes: sm,
    shortBreakMinutes: sbm,
    longBreakMinutes: lbm,
    countdownMinutes: cm,
  });

  const sessionsToday = (sessions.date ?? today) === today ? Math.max(0, sessions.today ?? 0) : 0;
  const sessionsDateVal = (sessions.date ?? today) === today ? (sessions.date ?? today) : today;
  const cycleCount = Math.max(
    0,
    Math.min(POMODOROS_BEFORE_LONG_BREAK, sessions.cycle ?? sessions.pomodorosInCycle ?? 0)
  );

  return {
    mode,
    ph,
    sm,
    sbm,
    lbm,
    cm,
    timeVal: adjusted.timeVal,
    isRunning: adjusted.isRunning,
    focusRunDate: discarded.focusRunDate,
    sessionsToday,
    sessionsDateVal,
    cycleCount,
    autoStartBreaks: settings.autoStartBreaks !== false,
    alarmVolume: Math.max(0, Math.min(100, settings.alarmVolume ?? 60)),
    tickSound: settings.tickSound !== false,
    position: snapshot.position,
    size: snapshot.size,
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

function readSegmentTracking(userId) {
  if (!userId || typeof window === 'undefined') return { start: null, logged: 0 };
  const startRaw = getUserStorageItem(userId, 'focus-timer-segment-start', 'focus-timer-segment-start');
  const loggedRaw = getUserStorageItem(userId, 'focus-timer-segment-logged', 'focus-timer-segment-logged');
  const startParsed = startRaw != null && startRaw !== '' ? parseInt(startRaw, 10) : null;
  const loggedParsed = loggedRaw != null && loggedRaw !== '' ? parseInt(loggedRaw, 10) : 0;
  return {
    start: startParsed != null && !Number.isNaN(startParsed) && startParsed >= 0 ? startParsed : null,
    logged: Number.isNaN(loggedParsed) ? 0 : Math.max(0, loggedParsed),
  };
}

function writeSegmentTracking(userId, runStart, segmentLogged) {
  if (typeof window === 'undefined' || !userId) return;
  setUserStorageItem(userId, 'focus-timer-segment-start', runStart != null ? String(runStart) : '');
  setUserStorageItem(userId, 'focus-timer-segment-logged', String(Math.max(0, segmentLogged)));
}

/** Restore play-segment refs so productivity time stays in sync after refresh. */
function restoreSegmentTracking({ userId, timerMode, phase, timeVal, isRunning, focusRunDate, today }) {
  if (!isRunning || !isFocusSegmentMode(timerMode, phase) || focusRunDate !== today) {
    return { runStart: null, segmentLogged: 0 };
  }
  const saved = readSegmentTracking(userId);
  if (saved.start != null) {
    const elapsed = getRunSegmentElapsed(timerMode, phase, timeVal, saved.start);
    if (elapsed >= saved.logged) {
      return { runStart: saved.start, segmentLogged: saved.logged };
    }
  }
  return { runStart: timeVal, segmentLogged: 0 };
}

function computeResponsiveTimerSize() {
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
  return {
    width: Math.max(minWidth, Math.min(maxWidth, baseWidth * scale)),
    height: Math.max(minHeight, Math.min(maxHeight, baseHeight * scale)),
  };
}

export function TimerProvider({ children }) {
  const { user } = useUser();
  const { getToken, isSignedIn } = useAuth();
  const userId = user?.id || null;
  const initialLoadDoneRef = useRef(false);

  const getSupabaseToken = useCallback(
    () => getClerkSupabaseToken(getToken, isSignedIn),
    [getToken, isSignedIn]
  );

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
  /** Completed focus sessions in the current short/long break cycle (resets after long break). */
  const [pomodorosInCycle, setPomodorosInCycle] = useState(0);
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
  const userPositionedRef = useRef(false);

  const userIdRef = useRef(userId);
  const supabaseTokenRef = useRef(null);
  userIdRef.current = userId;
  /** `time` value when the current play segment started. */
  const runStartTimeRef = useRef(null);
  /** Seconds from the current play segment already written to focus_sessions. */
  const segmentLoggedRef = useRef(0);
  /** Shared Web Audio context for alarm/ring/tick sounds. */
  const audioContextRef = useRef(null);
  const wasRunningRef = useRef(false);
  const prevTimerModeRef = useRef(null);
  const prevPhaseRef = useRef(phase);
  const timeRef = useRef(time);
  const timerModeRef = useRef(timerMode);
  const pomodorosInCycleRef = useRef(pomodorosInCycle);
  const phaseRef = useRef(phase);
  const focusRunDateRef = useRef(focusRunDate);
  timeRef.current = time;
  timerModeRef.current = timerMode;
  phaseRef.current = phase;
  pomodorosInCycleRef.current = pomodorosInCycle;
  focusRunDateRef.current = focusRunDate;

  const refreshLoggedFocusTotals = useCallback(async () => {
    if (!userId || !isSignedIn) {
      setTodayLoggedFocusSeconds(0);
      setYesterdayLoggedFocusSeconds(0);
      return;
    }
    const totals = await fetchTodayAndYesterdayFocusSeconds(userId, getSupabaseToken);
    setTodayLoggedFocusSeconds(totals.today);
    setYesterdayLoggedFocusSeconds(totals.yesterday);
    loggedDayRef.current = localDateKey();
  }, [userId, isSignedIn, getSupabaseToken]);

  const logSession = useCallback(
    async (options) => {
      if (!userId || !isSignedIn) return;
      const token = await getSupabaseToken();
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
    [userId, isSignedIn, getSupabaseToken, refreshLoggedFocusTotals]
  );

  /**
   * Persist elapsed focus time for the current run segment.
   * Captures elapsed synchronously so callers can clear refs immediately after invoking.
   */
  const flushRunSegment = useCallback(
    async (modeOverride, { mode: modeSnap, phase: phaseSnap, focusDate: focusDateSnap } = {}) => {
      if (!userIdRef.current) return 0;

      const mode = modeSnap ?? timerModeRef.current;
      const phaseVal = phaseSnap ?? phaseRef.current;
      const runDate = focusDateSnap ?? focusRunDateRef.current;
      if (!isFocusSegmentMode(mode, phaseVal)) return 0;
      if (runDate !== localDateKey()) return 0;

      const runStart = runStartTimeRef.current;
      const currentTime = timeRef.current;
      const alreadyLogged = segmentLoggedRef.current;
      const segmentElapsed = getRunSegmentElapsed(mode, phaseVal, currentTime, runStart);
      const toLog = segmentElapsed - alreadyLogged;
      if (toLog < 1) return 0;

      segmentLoggedRef.current = alreadyLogged + toLog;
      if (userIdRef.current) {
        writeSegmentTracking(userIdRef.current, runStart, segmentLoggedRef.current);
      }
      setTodayLoggedFocusSeconds((prev) => prev + toLog);
      const logMode =
        modeOverride ||
        (mode === 'stopwatch' ? 'stopwatch' : mode === 'countdown' ? 'countdown' : 'pomodoro');
      await logSession({ durationSeconds: toLog, phase: 'session', mode: logMode });
      return toLog;
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

  const ensureAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;
    try {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return null;
      const ctx = audioContextRef.current || new AudioCtor();
      audioContextRef.current = ctx;
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }
      return ctx;
    } catch (_) {
      return null;
    }
  }, []);

  const playAlarm = useCallback(() => {
    if (typeof window === 'undefined' || alarmVolume === 0) return;
    try {
      const ctx = ensureAudioContext();
      if (!ctx) return;
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
  }, [alarmVolume, ensureAudioContext]);

  /** Pleasant ring marking the start of the next phase (break or session). */
  const playPhaseStartRing = useCallback(() => {
    if (typeof window === 'undefined' || alarmVolume === 0) return;
    try {
      const ctx = ensureAudioContext();
      if (!ctx) return;
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
  }, [alarmVolume, ensureAudioContext]);

  const playTick = useCallback(() => {
    if (typeof window === 'undefined' || !tickSound || alarmVolume === 0) return;
    try {
      const ctx = ensureAudioContext();
      if (!ctx) return;
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
  }, [tickSound, alarmVolume, ensureAudioContext]);

  useEffect(() => {
    if (typeof window === 'undefined' || !userId || !isSignedIn) return;
    let cancelled = false;
    const load = async () => {
      const local = readLocalTimerSnapshot(userId);
      const token = await getSupabaseToken();
      if (token) setSupabaseAuthToken(token);
      const remote = await getFocusTimerStateFromSupabase(userId);
      if (cancelled) return;

      const today = localDateKey();
      const snapshot = pickTimerSnapshot(local, remote);

      if (!snapshot) {
        loadSettingsFromStorage();
        const sm = getStoredInt(userId, 'focus-settings-session-minutes', DEFAULT_SESSION);
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
        const savedCycle = getUserStorageItem(userId, 'focus-timer-pomodoros-in-cycle', 'focus-timer-pomodoros-in-cycle');
        const cycleCount =
          savedCycle != null && savedCycle !== ''
            ? Math.max(0, Math.min(POMODOROS_BEFORE_LONG_BREAK, parseInt(savedCycle, 10) || 0))
            : 0;
        setPomodorosInCycle(cycleCount);
        pomodorosInCycleRef.current = cycleCount;
        setSupabaseHydrated(true);
        settingsAppliedRef.current = true;
        initialLoadDoneRef.current = true;
        return;
      }

      const fields = applyTimerSnapshotFields(snapshot, today);

      const resolvedRunDate =
        fields.isRunning && isFocusSegmentMode(fields.mode, fields.ph)
          ? fields.focusRunDate || today
          : fields.focusRunDate;

      const segment = restoreSegmentTracking({
        userId,
        timerMode: fields.mode,
        phase: fields.ph,
        timeVal: fields.timeVal,
        isRunning: fields.isRunning,
        focusRunDate: resolvedRunDate,
        today,
      });
      runStartTimeRef.current = segment.runStart;
      segmentLoggedRef.current = segment.segmentLogged;
      wasRunningRef.current = fields.isRunning;
      prevTimerModeRef.current = fields.mode;
      prevPhaseRef.current = fields.ph;
      writeSegmentTracking(userId, segment.runStart, segment.segmentLogged);

      setTimerMode(fields.mode);
      setPhase(fields.ph);
      setSessionMinutes(fields.sm);
      setShortBreakMinutes(fields.sbm);
      setLongBreakMinutes(fields.lbm);
      setCountdownMinutes(fields.cm);
      setAutoStartBreaks(fields.autoStartBreaks);
      setAlarmVolume(fields.alarmVolume);
      setTickSound(fields.tickSound);
      setSessionsCompletedToday(fields.sessionsToday);
      setSessionsDate(fields.sessionsDateVal);
      setPomodorosInCycle(fields.cycleCount);
      pomodorosInCycleRef.current = fields.cycleCount;

      setFocusRunDate(resolvedRunDate);
      setTime(fields.timeVal);
      setIsRunning(fields.isRunning);

      if (fields.size && typeof fields.size.width === 'number' && typeof fields.size.height === 'number') {
        setSize(fields.size);
      }

      setUserStorageItem(userId, 'focus-timer-time', String(fields.timeVal));
      setUserStorageItem(userId, 'focus-timer-updated-at', Date.now().toString());
      setUserStorageItem(userId, 'focus-timer-running', fields.isRunning ? 'true' : 'false');
      setUserStorageItem(userId, 'focus-timer-mode', fields.mode);
      setUserStorageItem(userId, 'focus-timer-phase', fields.ph);
      setUserStorageItem(userId, 'focus-timer-sessions-today', String(fields.sessionsToday));
      setUserStorageItem(userId, 'focus-timer-sessions-date', fields.sessionsDateVal);
      setUserStorageItem(userId, 'focus-timer-pomodoros-in-cycle', String(fields.cycleCount));
      setUserStorageItem(userId, 'focus-timer-run-date', resolvedRunDate || '');

      setSupabaseHydrated(true);
      settingsAppliedRef.current = true;
      initialLoadDoneRef.current = true;
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [userId, isSignedIn, getSupabaseToken, loadSettingsFromStorage]);

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
      if (!d) return;
      if (typeof d.autoStartBreaks === 'boolean') setAutoStartBreaks(d.autoStartBreaks);
      if (typeof d.alarmVolume === 'number' && !Number.isNaN(d.alarmVolume)) {
        setAlarmVolume(Math.max(0, Math.min(100, d.alarmVolume)));
      }
    };
    window.addEventListener('focus-settings-behavior-changed', handler);
    return () => window.removeEventListener('focus-settings-behavior-changed', handler);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = async (e) => {
      const modeSnap = timerModeRef.current;
      const phaseSnap = phaseRef.current;
      const focusDateSnap = focusRunDateRef.current;
      await flushRunSegment(undefined, { mode: modeSnap, phase: phaseSnap, focusDate: focusDateSnap });

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
  }, [loadSettingsFromStorage, getDurationSeconds, flushRunSegment]);

  const applyDefaultTimerLayout = useCallback(() => {
    setSize(computeResponsiveTimerSize());
    setPosition(getFocusContentCenter());
  }, []);

  const markTimerPositionCustomized = useCallback(() => {
    userPositionedRef.current = true;
  }, []);

  const resetTimerWidgetLayout = useCallback(() => {
    userPositionedRef.current = false;
    applyDefaultTimerLayout();
  }, [applyDefaultTimerLayout]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updatePositionAndSize = () => {
      setSize(computeResponsiveTimerSize());
      if (!userPositionedRef.current) {
        setPosition(getFocusContentCenter());
      }
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
    if (isRunning && isFocusSegmentMode(timerMode, phase)) {
      writeSegmentTracking(userId, runStartTimeRef.current, segmentLoggedRef.current);
    } else {
      writeSegmentTracking(userId, null, 0);
    }
  }, [isRunning, time, userId, timerMode, phase, focusRunDate]);

  useEffect(() => {
    if (typeof window === 'undefined' || !userId || !initialLoadDoneRef.current) return;
    setUserStorageItem(userId, 'focus-timer-sessions-today', sessionsCompletedToday.toString());
    setUserStorageItem(userId, 'focus-timer-sessions-date', sessionsDate || localDateKey());
    setUserStorageItem(userId, 'focus-timer-pomodoros-in-cycle', pomodorosInCycle.toString());
  }, [sessionsCompletedToday, sessionsDate, pomodorosInCycle, userId]);

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
  const timerPersistStateRef = useRef({});

  timerPersistStateRef.current = {
    time,
    isRunning,
    timerMode,
    phase,
    focusRunDate,
    sessionMinutes,
    shortBreakMinutes,
    longBreakMinutes,
    countdownMinutes,
    autoStartBreaks,
    alarmVolume,
    tickSound,
    sessionsCompletedToday,
    sessionsDate,
    pomodorosInCycle,
    position,
    size,
  };

  const persistTimerToSupabase = useCallback(
    async ({ keepalive = false } = {}) => {
      if (typeof window === 'undefined' || !userId || !supabaseHydrated || !settingsAppliedRef.current) return;

      const s = { ...timerPersistStateRef.current, time: timeRef.current };
      const state = buildFocusTimerPersistPayload(s);
      const token = (await getSupabaseToken()) || supabaseTokenRef.current;
      if (token) {
        supabaseTokenRef.current = token;
        setSupabaseAuthToken(token);
      }

      await persistFocusTimerState({
        userId,
        state,
        accessToken: token,
        keepalive,
      });
    },
    [userId, supabaseHydrated, getSupabaseToken]
  );

  const urgentFlushTimerPersist = useCallback(async (overrides = {}) => {
    const activeUserId = userIdRef.current;
    if (!activeUserId || !initialLoadDoneRef.current) return;

    const s = { ...timerPersistStateRef.current, time: timeRef.current, ...overrides };
    const state = buildFocusTimerPersistPayload(s);
    const token = (await getSupabaseToken()) || supabaseTokenRef.current;

    setUserStorageItem(activeUserId, 'focus-timer-time', String(s.time));
    setUserStorageItem(activeUserId, 'focus-timer-updated-at', Date.now().toString());
    setUserStorageItem(activeUserId, 'focus-timer-running', s.isRunning ? 'true' : 'false');
    setUserStorageItem(activeUserId, 'focus-timer-mode', s.timerMode);
    setUserStorageItem(activeUserId, 'focus-timer-phase', s.phase);
    setUserStorageItem(activeUserId, 'focus-timer-run-date', s.focusRunDate || '');

    if (token) {
      supabaseTokenRef.current = token;
      setSupabaseAuthToken(token);
      sendFocusTimerStateKeepalive(activeUserId, state, token);
      await setFocusTimerStateToSupabase(activeUserId, state);
    }
  }, [getSupabaseToken]);

  useEffect(() => {
    if (typeof window === 'undefined' || !userId || !supabaseHydrated || !settingsAppliedRef.current) return;
    if (isRunning) return;
    if (supabaseSaveTimeoutRef.current) clearTimeout(supabaseSaveTimeoutRef.current);
    supabaseSaveTimeoutRef.current = setTimeout(() => {
      supabaseSaveTimeoutRef.current = null;
      void persistTimerToSupabase();
    }, 800);
    return () => {
      if (supabaseSaveTimeoutRef.current) clearTimeout(supabaseSaveTimeoutRef.current);
    };
  }, [
    userId,
    isRunning,
    time,
    timerMode,
    phase,
    focusRunDate,
    sessionMinutes,
    shortBreakMinutes,
    longBreakMinutes,
    countdownMinutes,
    autoStartBreaks,
    alarmVolume,
    tickSound,
    sessionsCompletedToday,
    sessionsDate,
    pomodorosInCycle,
    position,
    size,
    supabaseHydrated,
    persistTimerToSupabase,
  ]);

  useEffect(() => {
    if (!isRunning || !userId || !supabaseHydrated || !settingsAppliedRef.current) return;
    void persistTimerToSupabase();
    const id = setInterval(() => {
      void persistTimerToSupabase();
    }, 10_000);
    return () => clearInterval(id);
  }, [isRunning, userId, supabaseHydrated, persistTimerToSupabase]);

  useEffect(() => {
    if (!userId || !supabaseHydrated || !initialLoadDoneRef.current) return;
    void persistTimerToSupabase();
  }, [isRunning, userId, supabaseHydrated, persistTimerToSupabase]);

  const pauseTimerForLogout = useCallback(async () => {
    const activeUserId = userIdRef.current;
    if (!activeUserId || !initialLoadDoneRef.current) return;

    const s = { ...timerPersistStateRef.current, time: timeRef.current };
    if (s.isRunning && s.focusRunDate === localDateKey() && isFocusSegmentMode(s.timerMode, s.phase)) {
      await flushRunSegment(undefined, {
        mode: s.timerMode,
        phase: s.phase,
        focusDate: s.focusRunDate,
      });
    }

    setIsRunning(false);
    await urgentFlushTimerPersist({ isRunning: false });
  }, [flushRunSegment, urgentFlushTimerPersist]);

  useEffect(() => {
    return registerFocusTimerUrgentFlush(urgentFlushTimerPersist);
  }, [urgentFlushTimerPersist]);

  useEffect(() => {
    return registerFocusTimerLogoutPauseFlush(pauseTimerForLogout);
  }, [pauseTimerForLogout]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const flushOnHide = () => {
      if (document.visibilityState !== 'hidden') return;
      void (async () => {
        await flushRunSegment();
        await urgentFlushTimerPersist();
      })();
    };

    const flushOnPageHide = () => {
      void (async () => {
        await flushRunSegment();
        await urgentFlushTimerPersist();
      })();
    };

    document.addEventListener('visibilitychange', flushOnHide);
    window.addEventListener('pagehide', flushOnPageHide);
    return () => {
      document.removeEventListener('visibilitychange', flushOnHide);
      window.removeEventListener('pagehide', flushOnPageHide);
    };
  }, [urgentFlushTimerPersist, flushRunSegment]);

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

  /** Reset segment tracking when pomodoro phase changes while the timer keeps running. */
  useEffect(() => {
    if (prevPhaseRef.current === phase) return;
    const wasFocus = isFocusSegmentMode(timerMode, prevPhaseRef.current);
    const isFocus = isFocusSegmentMode(timerMode, phase);
    if (wasFocus && !isFocus) {
      segmentLoggedRef.current = 0;
      runStartTimeRef.current = null;
    } else if (!wasFocus && isFocus && isRunning) {
      runStartTimeRef.current = timeRef.current;
      segmentLoggedRef.current = 0;
    }
    prevPhaseRef.current = phase;
  }, [phase, timerMode, isRunning]);

  /** Start a new play segment whenever the timer begins running. */
  useEffect(() => {
    if (isRunning && !wasRunningRef.current) {
      if (runStartTimeRef.current == null) {
        runStartTimeRef.current = timeRef.current;
        segmentLoggedRef.current = 0;
      }
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
            if (userId) void flushRunSegment('countdown');
            runStartTimeRef.current = null;
            segmentLoggedRef.current = 0;
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('celebration-trigger', { detail: { type: 'focus_session', sessionMinutes: countdownMinutes, mode: 'countdown' } }));
            }
            setIsRunning(false);
            return 0;
          }
          if (timerMode === 'pomodoro') {
            if (phase === 'session') {
              if (userId) void flushRunSegment('pomodoro');
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('celebration-trigger', { detail: { type: 'focus_session', sessionMinutes, mode: 'pomodoro' } }));
              }
              playPhaseStartRing();
              const nextInCycle = pomodorosInCycleRef.current + 1;
              pomodorosInCycleRef.current = nextInCycle;
              setPomodorosInCycle(nextInCycle);
              setSessionsCompletedToday((n) => n + 1);
              setSessionsDate(localDateKey());
              const doLongBreak = nextInCycle >= POMODOROS_BEFORE_LONG_BREAK;
              setPhase(doLongBreak ? 'longBreak' : 'shortBreak');
              const breakMins = doLongBreak ? longBreakMinutes : shortBreakMinutes;
              const nextTime = breakMins * 60;
              segmentLoggedRef.current = 0;
              runStartTimeRef.current = autoStartBreaks ? nextTime : null;
              if (autoStartBreaks) setTimeout(() => setIsRunning(true), 100);
              else setIsRunning(false);
              return nextTime;
            }
            if (phase === 'shortBreak') {
              playPhaseStartRing();
              setPhase('session');
              const nextTime = sessionMinutes * 60;
              segmentLoggedRef.current = 0;
              runStartTimeRef.current = autoStartBreaks ? nextTime : null;
              if (autoStartBreaks) setTimeout(() => setIsRunning(true), 100);
              else setIsRunning(false);
              return nextTime;
            }
            if (phase === 'longBreak') {
              playPhaseStartRing();
              pomodorosInCycleRef.current = 0;
              setPomodorosInCycle(0);
              setPhase('session');
              const nextTime = sessionMinutes * 60;
              segmentLoggedRef.current = 0;
              runStartTimeRef.current = autoStartBreaks ? nextTime : null;
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
  }, [isRunning, timerMode, phase, sessionMinutes, shortBreakMinutes, longBreakMinutes, autoStartBreaks, playAlarm, playPhaseStartRing, playTick, tickSound, longBreakMinutes, countdownMinutes, userId, flushRunSegment]);

  /** Persist focus time in chunks while the timer runs (all modes). */
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
      if (segmentElapsed - segmentLoggedRef.current >= 1) {
        void flushRunSegment();
      }
    };
    checkpoint();
    const id = setInterval(checkpoint, 10_000);
    return () => clearInterval(id);
  }, [isRunning, userId, timerMode, phase, flushRunSegment, focusRunDate]);

  useEffect(() => {
    if (!initialLoadDoneRef.current) return;
    if (prevTimerModeRef.current === null) {
      prevTimerModeRef.current = timerMode;
      return;
    }
    if (prevTimerModeRef.current === timerMode) return;
    const prevMode = prevTimerModeRef.current;
    void (async () => {
      await flushRunSegment(undefined, {
        mode: prevMode,
        phase: phaseRef.current,
        focusDate: focusRunDateRef.current,
      });
      runStartTimeRef.current = null;
      segmentLoggedRef.current = 0;
      if (userIdRef.current) writeSegmentTracking(userIdRef.current, null, 0);
    })();
    prevTimerModeRef.current = timerMode;
  }, [timerMode, flushRunSegment]);

  const handlePlayPause = useCallback(() => {
    if (isRunning) {
      void (async () => {
        await flushRunSegment();
        setIsRunning(false);
        await urgentFlushTimerPersist({ isRunning: false });
      })();
      return;
    }
    const today = localDateKey();
    // Unlock Web Audio during a direct user gesture so ticking can start reliably.
    ensureAudioContext();
    if (focusRunDate !== today && hasCountableFocusProgress(timerMode, phase, time, sessionMinutes, countdownMinutes)) {
      const fresh = getFreshFocusTime(timerMode, phase, sessionMinutes, shortBreakMinutes, longBreakMinutes, countdownMinutes);
      setTime(fresh);
      runStartTimeRef.current = null;
      segmentLoggedRef.current = 0;
    }
    setFocusRunDate(today);
    setIsRunning(true);
  }, [timerMode, isRunning, time, userId, phase, sessionMinutes, shortBreakMinutes, longBreakMinutes, countdownMinutes, focusRunDate, flushRunSegment, urgentFlushTimerPersist, ensureAudioContext]);

  const handleReset = useCallback(() => {
    void (async () => {
      await flushRunSegment();
      runStartTimeRef.current = null;
      segmentLoggedRef.current = 0;
      setFocusRunDate(null);
      setTime(timerMode === 'stopwatch' ? 0 : getDurationSeconds());
      setIsRunning(false);
    })();
  }, [timerMode, getDurationSeconds, flushRunSegment]);

  const handleSwitchPomodoroPhase = useCallback((newPhase) => {
    if (timerMode !== 'pomodoro' || newPhase === phase) return;
    void (async () => {
      if (phase === 'session') {
        await flushRunSegment('pomodoro');
      }
      runStartTimeRef.current = null;
      segmentLoggedRef.current = 0;
      setPhase(newPhase);
      if (newPhase === 'session') setTime(sessionMinutes * 60);
      else if (newPhase === 'shortBreak') setTime(shortBreakMinutes * 60);
      else setTime(longBreakMinutes * 60);
      setIsRunning(false);
    })();
  }, [timerMode, phase, sessionMinutes, shortBreakMinutes, longBreakMinutes, flushRunSegment]);

  const handlePomodoroForward = useCallback(() => {
    if (timerMode !== 'pomodoro') return;
    void (async () => {
      if (phase === 'session') {
        await flushRunSegment('pomodoro');
      }
      runStartTimeRef.current = null;
      segmentLoggedRef.current = 0;

      if (phase === 'session') {
        // Skip to break without counting an incomplete session toward today's total.
        setPhase('shortBreak');
        setTime(shortBreakMinutes * 60);
      } else if (phase === 'shortBreak') {
        setPhase('session');
        setTime(sessionMinutes * 60);
      } else {
        pomodorosInCycleRef.current = 0;
        setPomodorosInCycle(0);
        setPhase('session');
        setTime(sessionMinutes * 60);
      }
      setIsRunning(false);
    })();
  }, [timerMode, phase, sessionMinutes, shortBreakMinutes, longBreakMinutes, flushRunSegment]);

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
    markTimerPositionCustomized,
    resetTimerWidgetLayout,
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
