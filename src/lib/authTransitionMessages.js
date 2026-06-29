export const AUTH_LOGIN_MESSAGE = 'Preparing your workspace';
export const AUTH_LOGOUT_MESSAGE = 'Signing you out';
export const AUTH_CLERK_LOADING_MESSAGE = 'Loading workspace';

/** @param {'login' | 'logout' | null | undefined} mode */
export function authTransitionMessage(mode) {
  return mode === 'logout' ? AUTH_LOGOUT_MESSAGE : AUTH_LOGIN_MESSAGE;
}
