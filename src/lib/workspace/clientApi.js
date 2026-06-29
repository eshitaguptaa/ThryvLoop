/**
 * Authenticated fetch for workspace API routes (Clerk session cookie + Bearer token).
 * @param {string} path
 * @param {RequestInit} [options]
 * @param {() => Promise<string | null>} [getToken] from useAuth().getToken
 */
export async function workspaceApiFetch(path, options = {}, getToken) {
  const headers = new Headers(options.headers);
  if (typeof window !== 'undefined') {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) headers.set('X-User-Timezone', tz);
    } catch {
      // ignore
    }
  }
  if (getToken) {
    try {
      const token = await getToken();
      if (token) headers.set('Authorization', `Bearer ${token}`);
    } catch {
      // fall back to session cookie only
    }
  }
  return fetch(path, {
    ...options,
    credentials: 'include',
    headers,
  });
}
