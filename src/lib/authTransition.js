export const AUTH_TRANSITION_KEY = 'thryvloop-auth-transition';
export const AUTH_TRANSITION_EVENT = 'thryvloop-auth-transition';
export const AUTH_LOGIN_PROGRESS_KEY = 'thryvloop-auth-login-progress';
export const AUTH_LOGIN_PROGRESS_EVENT = 'thryvloop-auth-login-progress';
/** Fired when the post-login destination page has finished its first data load. */
export const AUTH_DESTINATION_READY_EVENT = 'thryvloop-auth-destination-ready';

/** Survives a race where the destination reports ready before AuthTransitionHost mounts. */
let authDestinationReadyFlag = false;

/** @type {{ percent: number, message: string }} */
let loginProgressState = { percent: 8, message: 'Signing you in' };

/** @returns {'login' | 'logout' | null} */
export function getAuthTransitionMode() {
  if (typeof window === 'undefined') return null;
  const value = sessionStorage.getItem(AUTH_TRANSITION_KEY);
  if (value === 'login' || value === 'logout') return value;
  return null;
}

export function isAuthTransitionActive() {
  return getAuthTransitionMode() !== null;
}

function dispatchAuthTransition() {
  window.dispatchEvent(new CustomEvent(AUTH_TRANSITION_EVENT));
}

function readStoredLoginProgress() {
  if (typeof window === 'undefined') return loginProgressState;
  try {
    const raw = sessionStorage.getItem(AUTH_LOGIN_PROGRESS_KEY);
    if (!raw) return loginProgressState;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.percent === 'number' && typeof parsed?.message === 'string') {
      loginProgressState = {
        percent: Math.min(99, Math.max(0, parsed.percent)),
        message: parsed.message,
      };
    }
  } catch {
    /* ignore */
  }
  return loginProgressState;
}

export function getAuthLoginProgress() {
  return readStoredLoginProgress();
}

/**
 * Real login progress. Percent never moves backwards during one login.
 * @param {{ percent: number, message: string }} next
 */
export function setAuthLoginProgress(next) {
  if (typeof window === 'undefined') return;
  const current = readStoredLoginProgress();
  const percent = Math.min(99, Math.max(current.percent, next.percent));
  const advanced = next.percent >= current.percent;
  loginProgressState = {
    percent,
    message: advanced && next.message ? next.message : current.message,
  };
  sessionStorage.setItem(AUTH_LOGIN_PROGRESS_KEY, JSON.stringify(loginProgressState));
  window.dispatchEvent(new CustomEvent(AUTH_LOGIN_PROGRESS_EVENT));
}

function resetLoginProgress(message) {
  loginProgressState = { percent: 10, message };
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(AUTH_LOGIN_PROGRESS_KEY, JSON.stringify(loginProgressState));
  window.dispatchEvent(new CustomEvent(AUTH_LOGIN_PROGRESS_EVENT));
}

/** Show the loader after sign-in begins. */
export function markAuthLoginTransition(message = 'Signing you in') {
  if (typeof window === 'undefined') return;
  authDestinationReadyFlag = false;
  sessionStorage.setItem(AUTH_TRANSITION_KEY, 'login');
  resetLoginProgress(message);
  dispatchAuthTransition();
}

/** Keep the login overlay without resetting progress (OAuth return). */
export function ensureAuthLoginTransition() {
  if (typeof window === 'undefined') return;
  if (getAuthTransitionMode() === 'login') return;
  authDestinationReadyFlag = false;
  sessionStorage.setItem(AUTH_TRANSITION_KEY, 'login');
  if (!sessionStorage.getItem(AUTH_LOGIN_PROGRESS_KEY)) {
    resetLoginProgress('Signing you in');
  }
  dispatchAuthTransition();
}

/** Show the loader while signing out. */
export function markAuthLogoutTransition() {
  if (typeof window === 'undefined') return;
  authDestinationReadyFlag = false;
  sessionStorage.setItem(AUTH_TRANSITION_KEY, 'logout');
  dispatchAuthTransition();
}

export function clearAuthTransition() {
  if (typeof window === 'undefined') return;
  authDestinationReadyFlag = false;
  sessionStorage.removeItem(AUTH_TRANSITION_KEY);
  sessionStorage.removeItem(AUTH_LOGIN_PROGRESS_KEY);
  loginProgressState = { percent: 8, message: 'Signing you in' };
  dispatchAuthTransition();
}

export function isAuthDestinationReady() {
  return authDestinationReadyFlag;
}

/**
 * Call from the post-login destination once primary UI data is ready.
 * AuthTransitionHost keeps the full-screen loader up until this fires (login only).
 */
export function markAuthDestinationReady() {
  if (typeof window === 'undefined') return;
  if (getAuthTransitionMode() !== 'login') return;
  authDestinationReadyFlag = true;
  setAuthLoginProgress({ percent: 96, message: 'Opening your workspace' });
  window.dispatchEvent(new CustomEvent(AUTH_DESTINATION_READY_EVENT));
}

/** Routes that require an authenticated session shell. */
export function isProtectedAppRoute(pathname) {
  if (!pathname) return false;
  return (
    pathname.startsWith('/home') ||
    pathname.startsWith('/calendar') ||
    pathname.startsWith('/tasks') ||
    pathname.startsWith('/analytics') ||
    pathname.startsWith('/analysis') ||
    pathname.startsWith('/focus') ||
    pathname.startsWith('/meet') ||
    pathname.startsWith('/settings') ||
    pathname === '/o' ||
    pathname.startsWith('/o/')
  );
}
