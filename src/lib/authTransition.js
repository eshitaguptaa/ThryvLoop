export const AUTH_TRANSITION_KEY = 'thryvloop-auth-transition';
export const AUTH_TRANSITION_EVENT = 'thryvloop-auth-transition';

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
  sessionStorage.setItem(AUTH_TRANSITION_KEY, 'login');
  dispatchAuthTransition();
}

/** Show the loader while signing out. */
export function markAuthLogoutTransition() {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(AUTH_TRANSITION_KEY, 'logout');
  dispatchAuthTransition();
}

export function clearAuthTransition() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(AUTH_TRANSITION_KEY);
  dispatchAuthTransition();
}

/** Routes that require an authenticated session shell. */
export function isProtectedAppRoute(pathname) {
  if (!pathname) return false;
  return (
    pathname.startsWith('/home') ||
    pathname.startsWith('/calendar') ||
    pathname.startsWith('/tasks') ||
    pathname.startsWith('/analysis') ||
    pathname.startsWith('/focus') ||
    pathname.startsWith('/meet') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/o/')
  );
}
