export const AUTH_TRANSITION_KEY = 'thryvloop-auth-transition';
export const AUTH_TRANSITION_EVENT = 'thryvloop-auth-transition';
/** Fired when the post-login destination page has finished its first data load. */
export const AUTH_DESTINATION_READY_EVENT = 'thryvloop-auth-destination-ready';

/** Survives a race where the destination reports ready before AuthTransitionHost mounts. */
let authDestinationReadyFlag = false;

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

/** Show the loader after sign-in begins. */
export function markAuthLoginTransition() {
  if (typeof window === 'undefined') return;
  authDestinationReadyFlag = false;
  sessionStorage.setItem(AUTH_TRANSITION_KEY, 'login');
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
    pathname.startsWith('/o/')
  );
}
