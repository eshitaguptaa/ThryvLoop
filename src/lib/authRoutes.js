export const AUTH_MODAL_SIGN_IN = 'signin';
export const AUTH_MODAL_SIGN_UP = 'signup';

/** Landing-page URL that opens the custom AuthModal. */
export function authModalUrl(mode = AUTH_MODAL_SIGN_IN, redirectUrl) {
  const params = new URLSearchParams({ auth: mode });
  if (redirectUrl) params.set('redirect_url', redirectUrl);
  return `/?${params.toString()}`;
}
