'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { usePathname } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { localDateKey } from '@/lib/dateRanges';
import { fetchTodayAndYesterdayFocusSeconds, loadStreakCelebrationPayload } from '@/lib/focusSessions';
import {
  FOCUS_STREAK_CELEBRATED_KEY,
  shouldCelebrateFocusStreak,
} from '@/lib/focusStreak';
import { getClerkSupabaseToken } from '@/lib/clerkSupabaseToken';
import {
  canClaimFocusSessionOwnership,
  canSystemResume,
  FOCUS_SESSION_ACTIVE_KEY,
  FOCUS_SESSION_ELSEWHERE_MAX_MS,
  FOCUS_SESSION_FLUSH_MS,
  FOCUS_SESSION_IDLE_MS,
  FOCUS_SESSION_IDLE_PAUSED_KEY,
  FOCUS_SESSION_LOG_MODE,
  FOCUS_SESSION_MANUAL_OFF_KEY,
  FOCUS_SESSION_OWNER_HEARTBEAT_MS,
  FOCUS_SESSION_OWNER_KEY,
  getOrCreateFocusSessionTabId,
  isFocusSessionElsewhere,
  isFocusSessionOwner,
  registerFocusSessionLogoutFlush,
  resolvePauseReason,
  shouldPauseFromPageIdle,
} from '@/lib/focusSession';
import { useCelebration } from '@/contexts/CelebrationContext';
import {
  getIdleDetectionPermissionState,
  isSystemIdleDetectionSupported,
  requestIdleDetectionPermission,
  startSystemIdleMonitor,
} from '@/lib/systemActivity';
import { playFocusPausedSound, playFocusResumeSound } from '@/utils/celebrationSound';
import {
  getUserStorageItem,
  getUserStorageJson,
  logFocusSessionToSupabase,
  removeUserStorageItem,
  setSupabaseAuthToken,
  setUserStorageItem,
  setUserStorageJson,
} from '@/utils/userStorage';

export const FocusSessionContext = createContext(null);

function storageKeyForUser(userId, key) {
  return `thryvloop:user:${userId}:${key}`;
}

/**
 * @param {'user' | 'system_idle' | 'system_resume'} source
 */
function isManualOffSource(source) {
  return source === 'user';
}

export function FocusSessionProvider({ children }) {
  const { user } = useUser();
  const { isSignedIn, getToken } = useAuth();
  const pathname = usePathname();
  const { showToast, triggerEvent } = useCelebration();
  const userId = user?.id ?? null;

  const [sessionActive, setSessionActiveState] = useState(false);
  const [manualOff, setManualOffState] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [todayLoggedFocusSeconds, setTodayLoggedFocusSeconds] = useState(0);
  const [yesterdayFocusSeconds, setYesterdayFocusSeconds] = useState(0);
  /** True after the first today/yesterday totals fetch attempt completes. */
  const [loggedFocusTotalsReady, setLoggedFocusTotalsReady] = useState(false);
  const [liveTick, setLiveTick] = useState(0);

  const sessionActiveRef = useRef(false);
  const manualOffRef = useRef(false);
  const pauseReasonRef = useRef(/** @type {'manual' | 'idle' | null} */ (null));
  const segmentStartedAtRef = useRef(/** @type {number | null} */ (null));
  const segmentLoggedMsRef = useRef(0);
  const lastActivityAtRef = useRef(Date.now());
  /** When ThryvLoop lost focus/visibility (fallback anti-AFK). Null while in front. */
  const elsewhereSinceRef = useRef(/** @type {number | null} */ (null));
  const loggedDayRef = useRef(localDateKey());
  const userIdRef = useRef(userId);
  const isSignedInRef = useRef(isSignedIn);
  const showToastRef = useRef(showToast);
  const triggerEventRef = useRef(triggerEvent);
  const transitioningRef = useRef(false);
  const flushInFlightRef = useRef(false);
  const tabIdRef = useRef(getOrCreateFocusSessionTabId());
  const isOwnerRef = useRef(false);
  const loggedFocusTotalsReadyRef = useRef(false);
  const todayLoggedFocusSecondsRef = useRef(0);
  const yesterdayFocusSecondsRef = useRef(0);
  const pendingStreakCelebrateRef = useRef(false);
  const celebratingStreakRef = useRef(false);
  /** True while IdleDetector is running (OS-wide activity). */
  const systemIdleArmedRef = useRef(false);
  const [systemActivityMode, setSystemActivityMode] = useState(
    /** @type {'system' | 'page' | 'unsupported'} */ ('page')
  );
  /** 'prompt' means we should show an Allow button (IdleDetector needs a click). */
  const [idlePermissionState, setIdlePermissionState] = useState(
    /** @type {'unknown' | 'granted' | 'denied' | 'prompt' | 'unsupported'} */ ('unknown')
  );
  /** Bumps when idle-detection permission becomes granted so the monitor effect restarts. */
  const [idlePermissionNonce, setIdlePermissionNonce] = useState(0);

  sessionActiveRef.current = sessionActive;
  manualOffRef.current = manualOff;
  userIdRef.current = userId;
  isSignedInRef.current = isSignedIn;
  showToastRef.current = showToast;
  triggerEventRef.current = triggerEvent;
  loggedFocusTotalsReadyRef.current = loggedFocusTotalsReady;
  todayLoggedFocusSecondsRef.current = todayLoggedFocusSeconds;
  yesterdayFocusSecondsRef.current = yesterdayFocusSeconds;

  const getSupabaseToken = useCallback(async () => {
    try {
      return await getClerkSupabaseToken(getToken, isSignedInRef.current);
    } catch {
      return null;
    }
  }, [getToken]);

  const readOwner = useCallback(() => {
    const uid = userIdRef.current;
    if (!uid) return null;
    return getUserStorageJson(uid, FOCUS_SESSION_OWNER_KEY, FOCUS_SESSION_OWNER_KEY);
  }, []);

  const claimOwnership = useCallback((opts = {}) => {
    const force = Boolean(opts.force);
    const uid = userIdRef.current;
    if (!uid) return false;
    const owner = readOwner();
    if (
      !canClaimFocusSessionOwnership({
        owner,
        tabId: tabIdRef.current,
        force,
      })
    ) {
      isOwnerRef.current = isFocusSessionOwner({ owner, tabId: tabIdRef.current });
      return isOwnerRef.current;
    }
    const next = { tabId: tabIdRef.current, at: Date.now() };
    setUserStorageJson(uid, FOCUS_SESSION_OWNER_KEY, next);
    isOwnerRef.current = true;
    return true;
  }, [readOwner]);

  const releaseOwnership = useCallback(() => {
    const uid = userIdRef.current;
    if (!uid) return;
    const owner = readOwner();
    if (!isFocusSessionOwner({ owner, tabId: tabIdRef.current })) return;
    removeUserStorageItem(uid, FOCUS_SESSION_OWNER_KEY);
    isOwnerRef.current = false;
  }, [readOwner]);

  const refreshOwnerFlag = useCallback(() => {
    const owner = readOwner();
    isOwnerRef.current = isFocusSessionOwner({
      owner,
      tabId: tabIdRef.current,
    });
    return isOwnerRef.current;
  }, [readOwner]);

  const refreshLoggedFocusTotals = useCallback(async () => {
    if (!userId || !isSignedIn) {
      setTodayLoggedFocusSeconds(0);
      setYesterdayFocusSeconds(0);
      // Stay not-ready until we have a user — avoids login overlay dismissing on zeros.
      setLoggedFocusTotalsReady(false);
      return;
    }
    try {
      const { today, yesterday, ok } = await fetchTodayAndYesterdayFocusSeconds(
        userId,
        getToken,
        getSupabaseToken
      );
      if (ok) {
        loggedDayRef.current = localDateKey();
        setTodayLoggedFocusSeconds(today);
        setYesterdayFocusSeconds(yesterday);
      }
    } finally {
      setLoggedFocusTotalsReady(true);
    }
  }, [userId, isSignedIn, getToken, getSupabaseToken]);

  /** Apply totals from another trusted source (e.g. home focus-trend) without waiting on a second fetch. */
  const hydrateLoggedFocusTotals = useCallback((todaySec, yesterdaySec) => {
    const today = Math.max(0, Math.floor(Number(todaySec) || 0));
    const yesterday = Math.max(0, Math.floor(Number(yesterdaySec) || 0));
    loggedDayRef.current = localDateKey();
    setTodayLoggedFocusSeconds((prev) => Math.max(prev, today));
    setYesterdayFocusSeconds((prev) => Math.max(prev, yesterday));
    setLoggedFocusTotalsReady(true);
  }, []);

  const flushSoftSegment = useCallback(async ({ force = false } = {}) => {
    const uid = userIdRef.current;
    if (!uid) return 0;
    // Allow forced flush during logout even if isSignedIn flipped.
    if (!force && !isSignedInRef.current) return 0;
    if (!force && !refreshOwnerFlag()) return 0;
    if (flushInFlightRef.current) return 0;

    const started = segmentStartedAtRef.current;
    if (started == null) return 0;

    const elapsedMs = Date.now() - started;
    const toLogMs = elapsedMs - segmentLoggedMsRef.current;
    const toLogSec = Math.floor(toLogMs / 1000);
    if (toLogSec < 1) return 0;

    flushInFlightRef.current = true;
    // Reserve the chunk before await so concurrent flushes don't double-count.
    segmentLoggedMsRef.current += toLogSec * 1000;
    setTodayLoggedFocusSeconds((prev) => prev + toLogSec);

    try {
      const token = await getSupabaseToken();
      if (token) setSupabaseAuthToken(token);
      const err = await logFocusSessionToSupabase(
        uid,
        {
          durationSeconds: toLogSec,
          phase: 'session',
          mode: FOCUS_SESSION_LOG_MODE,
        },
        token
      );
      if (err) {
        segmentLoggedMsRef.current = Math.max(0, segmentLoggedMsRef.current - toLogSec * 1000);
        setTodayLoggedFocusSeconds((prev) => Math.max(0, prev - toLogSec));
        console.warn('[focus-session] log failed:', err);
        return 0;
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('focus-session-logged'));
      }
      return toLogSec;
    } finally {
      flushInFlightRef.current = false;
    }
  }, [getSupabaseToken, refreshOwnerFlag]);

  const beginSegment = useCallback(() => {
    segmentStartedAtRef.current = Date.now();
    segmentLoggedMsRef.current = 0;
    lastActivityAtRef.current = Date.now();
  }, []);

  const endSegment = useCallback(async ({ force = false } = {}) => {
    await flushSoftSegment({ force });
    segmentStartedAtRef.current = null;
    segmentLoggedMsRef.current = 0;
  }, [flushSoftSegment]);

  const persistFlags = useCallback(
    (active, manual, idlePaused = false) => {
      if (!userIdRef.current) return;
      const uid = userIdRef.current;
      setUserStorageItem(uid, FOCUS_SESSION_ACTIVE_KEY, active ? 'true' : 'false');
      setUserStorageItem(uid, FOCUS_SESSION_MANUAL_OFF_KEY, manual ? 'true' : 'false');
      setUserStorageItem(uid, FOCUS_SESSION_IDLE_PAUSED_KEY, idlePaused ? 'true' : 'false');
    },
    []
  );

  const triggerStreakCelebration = useCallback(async () => {
    const uid = userIdRef.current;
    if (!uid || celebratingStreakRef.current) return;
    const todayKey = localDateKey();
    if (
      !shouldCelebrateFocusStreak({
        source: 'user',
        totalsReady: loggedFocusTotalsReadyRef.current,
        todayLoggedSeconds: todayLoggedFocusSecondsRef.current,
        celebratedDateKey: getUserStorageItem(uid, FOCUS_STREAK_CELEBRATED_KEY),
        todayKey,
      })
    ) {
      return;
    }
    celebratingStreakRef.current = true;
    setUserStorageItem(uid, FOCUS_STREAK_CELEBRATED_KEY, todayKey);
    try {
      const [payload] = await Promise.all([
        loadStreakCelebrationPayload(getToken, {
          yesterdaySeconds: yesterdayFocusSecondsRef.current,
        }),
        new Promise((resolve) => setTimeout(resolve, 420)),
      ]);
      triggerEventRef.current?.({ type: 'streak', ...payload });
    } catch (err) {
      console.warn('[streak-celebration] failed:', err);
    } finally {
      celebratingStreakRef.current = false;
    }
  }, [getToken]);

  const offerStreakCelebration = useCallback(() => {
    if (loggedFocusTotalsReadyRef.current) {
      void triggerStreakCelebration();
      return;
    }
    pendingStreakCelebrateRef.current = true;
  }, [triggerStreakCelebration]);

  /**
   * @param {boolean} nextActive
   * @param {{ source?: 'user' | 'system_idle' | 'system_resume', idleKind?: 'focused' | 'elsewhere' }} [opts]
   */
  const setFocusSessionActive = useCallback(
    async (nextActive, opts = {}) => {
      if (transitioningRef.current) return;
      const source = opts.source || 'user';
      const currently = sessionActiveRef.current;
      const currentlyManual = manualOffRef.current;

      if (nextActive) {
        if (currentlyManual && source !== 'user') {
          return;
        }
        // Manual Focusing always takes the writer lock so refresh / stale
        // foreign owners cannot leave the productivity timer frozen.
        const claimOpts = source === 'user' ? { force: true } : {};
        if (currently) {
          if (currentlyManual && source === 'user') {
            setManualOffState(false);
            manualOffRef.current = false;
            pauseReasonRef.current = null;
            persistFlags(true, false, false);
          }
          if (claimOwnership(claimOpts) && segmentStartedAtRef.current == null) {
            beginSegment();
          }
          return;
        }

        transitioningRef.current = true;
        try {
          const owned = claimOwnership(claimOpts);
          setSessionActiveState(true);
          sessionActiveRef.current = true;
          setManualOffState(false);
          manualOffRef.current = false;
          pauseReasonRef.current = null;
          persistFlags(true, false, false);
          if (owned) beginSegment();
          else {
            segmentStartedAtRef.current = null;
            segmentLoggedMsRef.current = 0;
          }

          if (source === 'system_resume') {
            playFocusResumeSound();
            showToastRef.current?.(
              'Welcome back',
              'Focus session is live again'
            );
          } else if (source === 'user') {
            offerStreakCelebration();
          }
        } finally {
          transitioningRef.current = false;
        }
        return;
      }

      // → Inactive
      if (!currently && source === 'user') {
        setManualOffState(true);
        manualOffRef.current = true;
        pauseReasonRef.current = 'manual';
        persistFlags(false, true, false);
        releaseOwnership();
        return;
      }
      if (!currently) return;

      transitioningRef.current = true;
      try {
        await endSegment({ force: source === 'user' });
        setSessionActiveState(false);
        sessionActiveRef.current = false;
        releaseOwnership();

        if (isManualOffSource(source)) {
          setManualOffState(true);
          manualOffRef.current = true;
          pauseReasonRef.current = 'manual';
          persistFlags(false, true, false);
        } else {
          pauseReasonRef.current = 'idle';
          persistFlags(false, false, true);
          elsewhereSinceRef.current = null;
          playFocusPausedSound();
          showToastRef.current?.(
            'Focus session paused',
            opts.idleKind === 'elsewhere'
              ? 'You’ve been away from ThryvLoop for about an hour'
              : systemIdleArmedRef.current
                ? 'No computer activity for more than 10 minutes'
                : 'Inactive for more than 10 minutes'
          );
        }
      } finally {
        transitioningRef.current = false;
      }
    },
    [beginSegment, claimOwnership, endSegment, offerStreakCelebration, persistFlags, releaseOwnership]
  );

  const ensureSystemActivityPermission = useCallback(async () => {
    if (!isSystemIdleDetectionSupported()) {
      setSystemActivityMode('unsupported');
      setIdlePermissionState('unsupported');
      return 'unsupported';
    }
    // Call requestPermission immediately from the click. Do not await
    // permissions.query first — that can clear transient activation so Chrome
    // never shows the dialog.
    const next = await requestIdleDetectionPermission();
    if (next === 'granted') {
      setSystemActivityMode('system');
      setIdlePermissionState('granted');
      if (!systemIdleArmedRef.current) {
        setIdlePermissionNonce((n) => n + 1);
      }
      return 'granted';
    }
    if (next === 'unsupported') {
      setSystemActivityMode('unsupported');
      setIdlePermissionState('unsupported');
      return 'unsupported';
    }
    if (next === 'no_gesture') {
      setSystemActivityMode('page');
      setIdlePermissionState('prompt');
      return 'no_gesture';
    }
    setSystemActivityMode('page');
    setIdlePermissionState('denied');
    return 'denied';
  }, []);

  const refreshIdlePermissionState = useCallback(async () => {
    if (!isSystemIdleDetectionSupported()) {
      setSystemActivityMode('unsupported');
      setIdlePermissionState('unsupported');
      return 'unsupported';
    }
    const existing = await getIdleDetectionPermissionState();
    setIdlePermissionState(existing);
    if (existing === 'granted') {
      setSystemActivityMode('system');
      if (!systemIdleArmedRef.current) {
        setIdlePermissionNonce((n) => n + 1);
      }
    } else if (existing === 'unsupported') {
      setSystemActivityMode('unsupported');
    } else {
      setSystemActivityMode('page');
    }
    return existing;
  }, []);

  const toggleFocusSession = useCallback(async () => {
    const next = !sessionActiveRef.current;
    // Permission prompt requires a user gesture — toggle click qualifies.
    if (next) {
      await ensureSystemActivityPermission();
    }
    await setFocusSessionActive(next, { source: 'user' });
  }, [ensureSystemActivityPermission, setFocusSessionActive]);

  // Resolve IdleDetector support / existing permission (no prompt).
  useEffect(() => {
    if (!userId) return;
    void refreshIdlePermissionState();
  }, [userId, refreshIdlePermissionState]);

  // Hydrate from storage (and reset cleanly on user switch)
  useEffect(() => {
    if (!userId) {
      setHydrated(false);
      setLoggedFocusTotalsReady(false);
      setSessionActiveState(false);
      setManualOffState(false);
      sessionActiveRef.current = false;
      manualOffRef.current = false;
      pauseReasonRef.current = null;
      segmentStartedAtRef.current = null;
      segmentLoggedMsRef.current = 0;
      isOwnerRef.current = false;
      pendingStreakCelebrateRef.current = false;
      celebratingStreakRef.current = false;
      return undefined;
    }

    setLoggedFocusTotalsReady(false);
    pendingStreakCelebrateRef.current = false;
    celebratingStreakRef.current = false;
    const active =
      getUserStorageItem(userId, FOCUS_SESSION_ACTIVE_KEY, FOCUS_SESSION_ACTIVE_KEY) === 'true';
    const manual =
      getUserStorageItem(userId, FOCUS_SESSION_MANUAL_OFF_KEY, FOCUS_SESSION_MANUAL_OFF_KEY) ===
      'true';
    const idlePaused =
      getUserStorageItem(userId, FOCUS_SESSION_IDLE_PAUSED_KEY, FOCUS_SESSION_IDLE_PAUSED_KEY) ===
      'true';

    setManualOffState(manual);
    manualOffRef.current = manual;
    pauseReasonRef.current = resolvePauseReason({ active, manual, idlePaused });

    if (active && !manual) {
      setSessionActiveState(true);
      sessionActiveRef.current = true;
      if (claimOwnership()) {
        beginSegment();
      } else {
        segmentStartedAtRef.current = null;
        segmentLoggedMsRef.current = 0;
      }
    } else {
      setSessionActiveState(false);
      sessionActiveRef.current = false;
      segmentStartedAtRef.current = null;
      segmentLoggedMsRef.current = 0;
      isOwnerRef.current = false;
    }
    setHydrated(true);
    return undefined;
  }, [userId, beginSegment, claimOwnership]);

  useEffect(() => {
    void refreshLoggedFocusTotals();
  }, [refreshLoggedFocusTotals]);

  useEffect(() => {
    if (!loggedFocusTotalsReady) return;
    if (!pendingStreakCelebrateRef.current) return;
    pendingStreakCelebrateRef.current = false;
    if (!sessionActiveRef.current) return;
    void triggerStreakCelebration();
  }, [loggedFocusTotalsReady, triggerStreakCelebration]);

  // Midnight / day rollover while Active
  useEffect(() => {
    if (!userId) return undefined;
    const id = setInterval(() => {
      const today = localDateKey();
      if (loggedDayRef.current === today) return;
      void (async () => {
        if (sessionActiveRef.current) {
          await endSegment();
          beginSegment();
        }
        await refreshLoggedFocusTotals();
      })();
    }, 30_000);
    return () => clearInterval(id);
  }, [userId, beginSegment, endSegment, refreshLoggedFocusTotals]);

  // Live UI tick + owned flush + ownership heartbeat
  useEffect(() => {
    if (!sessionActive || !userId) return undefined;

    if (claimOwnership() && segmentStartedAtRef.current == null) {
      beginSegment();
    }

    const ui = setInterval(() => {
      setLiveTick((n) => n + 1);
    }, 1000);

    const flush = setInterval(() => {
      void flushSoftSegment();
    }, FOCUS_SESSION_FLUSH_MS);

    const heartbeat = setInterval(() => {
      if (!sessionActiveRef.current) return;
      const owned = claimOwnership();
      if (owned) {
        if (segmentStartedAtRef.current == null) beginSegment();
      } else {
        segmentStartedAtRef.current = null;
        segmentLoggedMsRef.current = 0;
      }
    }, FOCUS_SESSION_OWNER_HEARTBEAT_MS);

    void flushSoftSegment();

    return () => {
      clearInterval(ui);
      clearInterval(flush);
      clearInterval(heartbeat);
    };
  }, [sessionActive, userId, flushSoftSegment, claimOwnership, beginSegment]);

  // OS-wide idle (Idle Detection API) while session is Active — works in other apps.
  useEffect(() => {
    if (!sessionActive || !userId) {
      systemIdleArmedRef.current = false;
      return undefined;
    }
    if (!isSystemIdleDetectionSupported()) {
      systemIdleArmedRef.current = false;
      setSystemActivityMode('unsupported');
      return undefined;
    }

    const ac = new AbortController();
    let stopFn = /** @type {null | (() => void)} */ (null);
    let cancelled = false;

    void (async () => {
      const permission = await getIdleDetectionPermissionState();
      if (cancelled) return;
      if (permission !== 'granted') {
        systemIdleArmedRef.current = false;
        setSystemActivityMode(permission === 'unsupported' ? 'unsupported' : 'page');
        return;
      }

      const monitor = await startSystemIdleMonitor({
        thresholdMs: FOCUS_SESSION_IDLE_MS,
        signal: ac.signal,
        onChange: ({ idle }) => {
          if (idle) {
            if (sessionActiveRef.current) {
              void setFocusSessionActive(false, { source: 'system_idle' });
            }
            return;
          }
          lastActivityAtRef.current = Date.now();
          if (
            canSystemResume({
              sessionActive: sessionActiveRef.current,
              pauseReason: pauseReasonRef.current,
              manualOff: manualOffRef.current,
            })
          ) {
            void setFocusSessionActive(true, { source: 'system_resume' });
          }
        },
      });

      if (cancelled) {
        monitor?.stop();
        return;
      }
      if (monitor) {
        systemIdleArmedRef.current = true;
        setSystemActivityMode('system');
        stopFn = monitor.stop;
      } else {
        systemIdleArmedRef.current = false;
        setSystemActivityMode('page');
      }
    })();

    return () => {
      cancelled = true;
      ac.abort();
      stopFn?.();
      systemIdleArmedRef.current = false;
    };
  }, [sessionActive, userId, setFocusSessionActive, idlePermissionNonce]);

  // Visibility / pagehide flush; reclaim ownership when visible
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        if (sessionActiveRef.current) void flushSoftSegment();
        return;
      }
      lastActivityAtRef.current = Date.now();
      if (sessionActiveRef.current) {
        if (claimOwnership() && segmentStartedAtRef.current == null) {
          beginSegment();
        }
      } else if (
        canSystemResume({
          sessionActive: sessionActiveRef.current,
          pauseReason: pauseReasonRef.current,
          manualOff: manualOffRef.current,
        })
      ) {
        void setFocusSessionActive(true, { source: 'system_resume' });
      }
    };

    const onPageHide = () => {
      if (sessionActiveRef.current) void flushSoftSegment({ force: true });
      // Free the writer lock so a refresh / new tab is not blocked for 20s.
      releaseOwnership();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [beginSegment, claimOwnership, flushSoftSegment, releaseOwnership, setFocusSessionActive]);

  // In-page activity + fallback idle (only when IdleDetector is not armed)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return undefined;

    const syncElsewhereClock = () => {
      const elsewhere = isFocusSessionElsewhere({
        tabVisible: document.visibilityState !== 'hidden',
        pageFocused: typeof document.hasFocus === 'function' ? document.hasFocus() : true,
      });
      if (elsewhere) {
        if (elsewhereSinceRef.current == null) {
          elsewhereSinceRef.current = Date.now();
        }
      } else {
        elsewhereSinceRef.current = null;
      }
    };

    const bump = () => {
      lastActivityAtRef.current = Date.now();
      elsewhereSinceRef.current = null;
      if (
        canSystemResume({
          sessionActive: sessionActiveRef.current,
          pauseReason: pauseReasonRef.current,
          manualOff: manualOffRef.current,
        })
      ) {
        void setFocusSessionActive(true, { source: 'system_resume' });
      }
    };

    const events = ['pointerdown', 'keydown', 'mousemove', 'scroll', 'touchstart', 'wheel'];
    events.forEach((ev) => document.addEventListener(ev, bump, { passive: true, capture: true }));

    const onWindowFocus = () => {
      elsewhereSinceRef.current = null;
      bump();
    };
    const onWindowBlur = () => {
      lastActivityAtRef.current = Date.now();
      syncElsewhereClock();
    };
    const onVisibilityForElsewhere = () => {
      syncElsewhereClock();
      if (document.visibilityState !== 'hidden') {
        lastActivityAtRef.current = Date.now();
      }
    };

    window.addEventListener('focus', onWindowFocus);
    window.addEventListener('blur', onWindowBlur);
    document.addEventListener('visibilitychange', onVisibilityForElsewhere);
    syncElsewhereClock();

    const idleWatch = setInterval(() => {
      if (systemIdleArmedRef.current) return;

      const pageFocused =
        typeof document.hasFocus === 'function' ? document.hasFocus() : true;
      const tabVisible = document.visibilityState !== 'hidden';
      const elsewhere = isFocusSessionElsewhere({ tabVisible, pageFocused });
      if (elsewhere) {
        if (elsewhereSinceRef.current == null) {
          elsewhereSinceRef.current = Date.now();
        }
      } else {
        elsewhereSinceRef.current = null;
      }

      const elsewhereForMs =
        elsewhereSinceRef.current == null ? 0 : Date.now() - elsewhereSinceRef.current;

      if (
        !shouldPauseFromPageIdle({
          sessionActive: sessionActiveRef.current,
          systemIdleArmed: systemIdleArmedRef.current,
          tabVisible,
          pageFocused,
          idleForMs: Date.now() - lastActivityAtRef.current,
          elsewhereForMs,
          idleThresholdMs: FOCUS_SESSION_IDLE_MS,
          elsewhereMaxMs: FOCUS_SESSION_ELSEWHERE_MAX_MS,
        })
      ) {
        return;
      }
      void setFocusSessionActive(false, {
        source: 'system_idle',
        idleKind: elsewhere ? 'elsewhere' : 'focused',
      });
    }, 15_000);

    return () => {
      events.forEach((ev) => document.removeEventListener(ev, bump, { capture: true }));
      window.removeEventListener('focus', onWindowFocus);
      window.removeEventListener('blur', onWindowBlur);
      document.removeEventListener('visibilitychange', onVisibilityForElsewhere);
      clearInterval(idleWatch);
    };
  }, [setFocusSessionActive]);

  // Navigation counts as activity
  useEffect(() => {
    if (!pathname) return;
    lastActivityAtRef.current = Date.now();
    if (
      canSystemResume({
        sessionActive: sessionActiveRef.current,
        pauseReason: pauseReasonRef.current,
        manualOff: manualOffRef.current,
      })
    ) {
      void setFocusSessionActive(true, { source: 'system_resume' });
    }
  }, [pathname, setFocusSessionActive]);

  // Cross-tab sync via storage events
  useEffect(() => {
    if (typeof window === 'undefined' || !userId) return undefined;

    const onStorage = (event) => {
      if (!event.key) return;
      const activeKey = storageKeyForUser(userId, FOCUS_SESSION_ACTIVE_KEY);
      const manualKey = storageKeyForUser(userId, FOCUS_SESSION_MANUAL_OFF_KEY);
      const idleKey = storageKeyForUser(userId, FOCUS_SESSION_IDLE_PAUSED_KEY);
      const ownerKey = storageKeyForUser(userId, FOCUS_SESSION_OWNER_KEY);

      if (event.key === ownerKey) {
        refreshOwnerFlag();
        return;
      }

      if (![activeKey, manualKey, idleKey].includes(event.key)) return;

      const active =
        getUserStorageItem(userId, FOCUS_SESSION_ACTIVE_KEY, FOCUS_SESSION_ACTIVE_KEY) === 'true';
      const manual =
        getUserStorageItem(userId, FOCUS_SESSION_MANUAL_OFF_KEY, FOCUS_SESSION_MANUAL_OFF_KEY) ===
        'true';
      const idlePaused =
        getUserStorageItem(userId, FOCUS_SESSION_IDLE_PAUSED_KEY, FOCUS_SESSION_IDLE_PAUSED_KEY) ===
        'true';

      setManualOffState(manual);
      manualOffRef.current = manual;
      pauseReasonRef.current = resolvePauseReason({ active, manual, idlePaused });

      if (active && !manual) {
        if (!sessionActiveRef.current) {
          setSessionActiveState(true);
          sessionActiveRef.current = true;
        }
        if (claimOwnership()) {
          if (segmentStartedAtRef.current == null) beginSegment();
        } else {
          segmentStartedAtRef.current = null;
          segmentLoggedMsRef.current = 0;
        }
      } else if (sessionActiveRef.current) {
        // Another tab paused/stopped — stop local logging without toast spam.
        void (async () => {
          await endSegment();
          setSessionActiveState(false);
          sessionActiveRef.current = false;
          isOwnerRef.current = false;
        })();
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [userId, beginSegment, claimOwnership, endSegment]);

  // Logout flush
  useEffect(() => {
    return registerFocusSessionLogoutFlush(async () => {
      if (!sessionActiveRef.current) {
        releaseOwnership();
        return;
      }
      claimOwnership({ force: true });
      await endSegment({ force: true });
      setSessionActiveState(false);
      sessionActiveRef.current = false;
      releaseOwnership();
      // Keep flags: if they were Active, leave idle-paused false / active false so next login is clean
      persistFlags(false, manualOffRef.current, false);
    });
  }, [claimOwnership, endSegment, persistFlags, releaseOwnership]);

  const unloggedFocusSeconds = useMemo(() => {
    void liveTick;
    if (!sessionActive || segmentStartedAtRef.current == null) return 0;
    if (!isOwnerRef.current) return 0;
    const elapsedMs = Date.now() - segmentStartedAtRef.current;
    return Math.max(0, Math.floor((elapsedMs - segmentLoggedMsRef.current) / 1000));
  }, [sessionActive, liveTick]);

  const todayFocusSeconds = useMemo(
    () => todayLoggedFocusSeconds + unloggedFocusSeconds,
    [todayLoggedFocusSeconds, unloggedFocusSeconds]
  );

  const isFocusSessionActiveToday = sessionActive;

  const value = useMemo(
    () => ({
      sessionActive,
      manualOff,
      hydrated,
      loggedFocusTotalsReady,
      systemActivityMode,
      idlePermissionState,
      setFocusSessionActive,
      toggleFocusSession,
      ensureSystemActivityPermission,
      unloggedFocusSeconds,
      todayLoggedFocusSeconds,
      yesterdayFocusSeconds,
      todayFocusSeconds,
      isFocusSessionActiveToday,
      refreshLoggedFocusTotals,
      hydrateLoggedFocusTotals,
    }),
    [
      sessionActive,
      manualOff,
      hydrated,
      loggedFocusTotalsReady,
      systemActivityMode,
      idlePermissionState,
      setFocusSessionActive,
      toggleFocusSession,
      ensureSystemActivityPermission,
      unloggedFocusSeconds,
      todayLoggedFocusSeconds,
      yesterdayFocusSeconds,
      todayFocusSeconds,
      isFocusSessionActiveToday,
      refreshLoggedFocusTotals,
      hydrateLoggedFocusTotals,
    ]
  );

  return (
    <FocusSessionContext.Provider value={value}>{children}</FocusSessionContext.Provider>
  );
}

export function useFocusSession() {
  const ctx = useContext(FocusSessionContext);
  if (!ctx) {
    throw new Error('useFocusSession must be used within FocusSessionProvider');
  }
  return ctx;
}
