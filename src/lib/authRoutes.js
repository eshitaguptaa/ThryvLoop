export const AUTH_MODAL_SIGN_IN = 'signin';
export const AUTH_MODAL_SIGN_UP = 'signup';

export const SSO_CALLBACK_PATH = '/auth/sso-callback';
export const AFTER_AUTH_PATH = '/home';
export const POST_AUTH_REDIRECT_COOKIE = 'thryv_post_auth_redirect';

function isSafeAppPath(path) {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//');
}

/** Landing-page URL that opens the custom AuthModal. */
export function authModalUrl(mode = AUTH_MODAL_SIGN_IN, redirectUrl) {
  const params = new URLSearchParams({ auth: mode });
  if (isSafeAppPath(redirectUrl)) params.set('redirect_url', redirectUrl);
  return `/?${params.toString()}`;
}

export function setPostAuthRedirect(path) {
  if (typeof document === 'undefined' || !isSafeAppPath(path)) return;
  document.cookie = `${POST_AUTH_REDIRECT_COOKIE}=${encodeURIComponent(path)}; Path=/; Max-Age=600; SameSite=Lax`;
}

export function consumePostAuthRedirect() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${POST_AUTH_REDIRECT_COOKIE}=([^;]*)`));
  document.cookie = `${POST_AUTH_REDIRECT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  if (!match) return null;
  try {
    const value = decodeURIComponent(match[1]);
    return isSafeAppPath(value) ? value : null;
  } catch {
    return null;
  }
}

/** Absolute OAuth return URLs so Clerk cannot fall back to its hosted Account Portal. */
export function getOauthRedirectUrls(afterAuthPath) {
  const origin = window.location.origin;
  const completePath = isSafeAppPath(afterAuthPath) ? afterAuthPath : AFTER_AUTH_PATH;
  return {
    redirectUrl: `${origin}${SSO_CALLBACK_PATH}`,
    redirectUrlComplete: `${origin}${completePath}`,
  };
}
