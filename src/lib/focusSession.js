/**
 * Soft Focus session — Active time is productivity; no integrity / monitoring dual paths.
 */

/** No pointer/keyboard activity this long while ThryvLoop is focused → auto Away. */
export const FOCUS_SESSION_IDLE_MS = 10 * 60 * 1000;

/**
 * Browsers without IdleDetector: max time Focusing may stay Active while the
 * tab/window is elsewhere (other app/tab). Stops AFK farming; still long enough
 * for real work outside ThryvLoop. Returning / check-in confirms reset the clock.
 */
export const FOCUS_SESSION_ELSEWHERE_MAX_MS = 60 * 60 * 1000;

/** Random “Still focusing?” check-in while elsewhere (Firefox/Safari fallback). */
export const FOCUS_SESSION_CHECKIN_MIN_MS = 12 * 60 * 1000;
export const FOCUS_SESSION_CHECKIN_MAX_MS = 22 * 60 * 1000;
/** How long the check-in toast waits for a response before auto-pausing. */
export const FOCUS_SESSION_CHECKIN_RESPONSE_MS = 2 * 60 * 1000;

/**
 * @param {() => number} [random] returns 0..1
 * @returns {number}
 */
export function nextFocusCheckInDelayMs(random = Math.random) {
  const span = FOCUS_SESSION_CHECKIN_MAX_MS - FOCUS_SESSION_CHECKIN_MIN_MS;
  const unit = Math.min(1, Math.max(0, Number(random()) || 0));
  const offset = unit >= 1 ? span : Math.floor(unit * (span + 1));
  return FOCUS_SESSION_CHECKIN_MIN_MS + Math.min(span, offset);
}

/** How often to checkpoint Active time into focus_sessions. */
export const FOCUS_SESSION_FLUSH_MS = 10_000;

/** Ownership heartbeat so only one tab writes focus_sessions. */
export const FOCUS_SESSION_OWNER_HEARTBEAT_MS = 5_000;

/** Owner lock is stale after this (tab crashed / closed without pagehide). */
export const FOCUS_SESSION_OWNER_STALE_MS = 20_000;

/** sessionStorage key — survives refresh in the same browser tab. */
export const FOCUS_SESSION_TAB_ID_KEY = 'thryvloop:focus-session-tab-id';

export const FOCUS_SESSION_ACTIVE_KEY = 'focus-session-active';
export const FOCUS_SESSION_MANUAL_OFF_KEY = 'focus-session-manual-off';
/** Survives refresh so activity can resume after a system idle pause. */
export const FOCUS_SESSION_IDLE_PAUSED_KEY = 'focus-session-idle-paused';
export const FOCUS_SESSION_OWNER_KEY = 'focus-session-owner';
/** User accepted Focusing consent modal (what logging + idle means). */
export const FOCUS_SESSION_CONSENT_KEY = 'focus-session-consent';

/** Soft-session rows use this mode in focus_sessions. */
export const FOCUS_SESSION_LOG_MODE = 'session';

function createFocusSessionTabId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Stable per browser-tab id (sessionStorage) so refresh keeps ownership.
 */
export function getOrCreateFocusSessionTabId() {
  if (typeof window === 'undefined') return createFocusSessionTabId();
  try {
    const existing = sessionStorage.getItem(FOCUS_SESSION_TAB_ID_KEY);
    if (existing) return existing;
    const id = createFocusSessionTabId();
    sessionStorage.setItem(FOCUS_SESSION_TAB_ID_KEY, id);
    return id;
  } catch {
    return createFocusSessionTabId();
  }
}

/**
 * @param {{ active: boolean, manual: boolean, idlePaused: boolean }} flags
 * @returns {'manual' | 'idle' | null}
 */
export function resolvePauseReason({ active, manual, idlePaused }) {
  if (active && !manual) return null;
  if (manual) return 'manual';
  if (idlePaused) return 'idle';
  return null;
}

/**
 * @param {{ sessionActive: boolean, pauseReason: string | null, manualOff: boolean }} state
 */
export function canSystemResume(state) {
  return !state.sessionActive && state.pauseReason === 'idle' && !state.manualOff;
}

/**
 * @param {{ owner: { tabId?: string, at?: number } | null, tabId: string }} args
 */
export function isFocusSessionOwner({ owner, tabId }) {
  return Boolean(owner?.tabId && tabId && owner.tabId === tabId);
}

/**
 * Whether this tab may claim ownership (no fresh foreign owner).
 * @param {{ owner: { tabId?: string, at?: number } | null, tabId: string, now?: number, staleMs?: number, force?: boolean }} args
 */
export function canClaimFocusSessionOwnership({
  owner,
  tabId,
  now = Date.now(),
  staleMs = FOCUS_SESSION_OWNER_STALE_MS,
  force = false,
}) {
  if (force) return true;
  if (!owner?.tabId) return true;
  if (owner.tabId === tabId) return true;
  const at = Number(owner.at) || 0;
  return now - at >= staleMs;
}

let logoutFlushHandler = null;

/** Register soft-session flush/pause before sign-out. */
export function registerFocusSessionLogoutFlush(handler) {
  logoutFlushHandler = handler;
  return () => {
    if (logoutFlushHandler === handler) logoutFlushHandler = null;
  };
}

/** Flush Active soft session before sign-out. */
export async function flushFocusSessionOnLogout() {
  if (logoutFlushHandler) {
    await logoutFlushHandler();
  }
}

/**
 * Whether page-only idle should pause the session (browsers without IdleDetector).
 * When OS idle detection is armed, page idle is ignored.
 *
 * - ThryvLoop focused + no interaction → pause after idleThresholdMs (10 min).
 * - Elsewhere (hidden tab or unfocused window) → keep Active up to elsewhereMaxMs
 *   (anti-cheat ceiling), then pause. Resume on return unless manual Away.
 */
export function shouldPauseFromPageIdle({
  sessionActive,
  systemIdleArmed,
  tabVisible,
  pageFocused = true,
  idleForMs,
  elsewhereForMs = 0,
  idleThresholdMs,
  elsewhereMaxMs,
}) {
  if (!sessionActive) return false;
  if (systemIdleArmed) return false;

  const elsewhere = !tabVisible || !pageFocused;
  if (elsewhere) {
    return elsewhereForMs >= elsewhereMaxMs;
  }
  return idleForMs >= idleThresholdMs;
}

/**
 * @param {{ tabVisible: boolean, pageFocused: boolean }} state
 */
export function isFocusSessionElsewhere({ tabVisible, pageFocused }) {
  return !tabVisible || !pageFocused;
}
