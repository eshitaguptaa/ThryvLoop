import { localDateKey } from '@/lib/dateRanges';
import { FOCUS_TIMER_STATE_KEY, setFocusTimerStateToSupabase } from '@/utils/userStorage';

/** Build the JSON blob stored in user_preferences for the focus timer. */
export function buildFocusTimerPersistPayload(s) {
  return {
    timer: {
      time: s.time,
      isRunning: s.isRunning,
      updatedAt: new Date().toISOString(),
      mode: s.timerMode,
      phase: s.phase,
      focusRunDate: s.focusRunDate,
    },
    sessions: {
      today: s.sessionsCompletedToday,
      date: s.sessionsDate || localDateKey(),
      cycle: s.pomodorosInCycle,
    },
    settings: {
      timerMode: s.timerMode,
      sessionMinutes: s.sessionMinutes,
      shortBreakMinutes: s.shortBreakMinutes,
      longBreakMinutes: s.longBreakMinutes,
      countdownMinutes: s.countdownMinutes,
      autoStartBreaks: s.autoStartBreaks,
      alarmVolume: s.alarmVolume,
      tickSound: s.tickSound,
    },
    position: s.position && typeof s.position.x === 'number' ? s.position : undefined,
    size: s.size && s.size.width >= 350 && s.size.height >= 300 ? s.size : undefined,
  };
}

/**
 * Fire-and-forget Supabase upsert that survives tab close (fetch keepalive).
 * Returns false when the browser cannot send the request.
 */
export function sendFocusTimerStateKeepalive(userId, state, accessToken) {
  if (typeof window === 'undefined' || !userId || !accessToken) return false;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return false;

  try {
    fetch(`${url}/rest/v1/user_preferences?on_conflict=user_id,key`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        user_id: userId,
        key: FOCUS_TIMER_STATE_KEY,
        value: state,
        updated_at: new Date().toISOString(),
      }),
      keepalive: true,
    });
    return true;
  } catch {
    return false;
  }
}

let urgentFlushHandler = null;
let logoutPauseFlushHandler = null;

/** Register a handler that persists the latest timer state (tab close, etc.). */
export function registerFocusTimerUrgentFlush(handler) {
  urgentFlushHandler = handler;
  return () => {
    if (urgentFlushHandler === handler) urgentFlushHandler = null;
  };
}

/** Register handler that pauses the timer and persists before sign-out. */
export function registerFocusTimerLogoutPauseFlush(handler) {
  logoutPauseFlushHandler = handler;
  return () => {
    if (logoutPauseFlushHandler === handler) logoutPauseFlushHandler = null;
  };
}

/** Await a full timer persist (Supabase + keepalive). Used on tab hide. */
export async function urgentFlushFocusTimerState() {
  if (!urgentFlushHandler) return;
  await urgentFlushHandler();
}

/** Pause at the current time and persist before sign-out. */
export async function pauseAndFlushFocusTimerOnLogout() {
  if (logoutPauseFlushHandler) {
    await logoutPauseFlushHandler();
    return;
  }
  if (urgentFlushHandler) {
    await urgentFlushHandler({ isRunning: false });
  }
}

/**
 * Persist timer state to Supabase with optional keepalive for tab close.
 * @param {object} opts
 * @param {string} opts.userId
 * @param {object} opts.state
 * @param {string|null} opts.accessToken
 * @param {boolean} [opts.keepalive]
 */
export async function persistFocusTimerState({ userId, state, accessToken, keepalive = false }) {
  if (!userId) return;
  if (keepalive && accessToken) {
    sendFocusTimerStateKeepalive(userId, state, accessToken);
  }
  if (accessToken) {
    await setFocusTimerStateToSupabase(userId, state);
  }
}
