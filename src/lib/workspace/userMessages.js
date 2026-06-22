import { isGoogleScopeDeniedMessage } from '@/lib/workspace/googleApiErrors';

/** @param {string | null | undefined} message */
export function isAuthWorkspaceError(message) {
  if (!message || typeof message !== 'string') return false;
  const m = message.trim().toLowerCase();
  return (
    m === 'unauthorized' ||
    m.includes('invalid_grant') ||
    m.includes('token has been expired') ||
    m.includes('token has been revoked') ||
    m.includes('invalid credentials') ||
    m.includes('sign in again') ||
    m.includes('google session needs a quick resync') ||
    m.includes('google connection expired')
  );
}

/** User-facing sync error; hides auth failures and optional scope denials. */
export function formatWorkspaceSyncError(message) {
  if (!message || typeof message !== 'string') return null;
  if (isAuthWorkspaceError(message)) return null;
  if (isGoogleScopeDeniedMessage(message)) return null;
  return message.trim();
}

/** @param {string | null | undefined} raw Query param or API error */
export function formatIntegrationsQueryError(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }
  const m = decoded.trim();
  if (!m) return null;
  if (isAuthWorkspaceError(m)) {
    return 'Google connection could not be verified. Sign in, then use Connect with Google again.';
  }
  if (m === 'access_denied') {
    return null;
  }
  if (m === 'missing_code' || m === 'invalid_state' || m === 'missing_state') {
    return 'Connection session expired. Use Connect with Google again.';
  }
  if (m === 'session_mismatch') {
    return 'Google connection was started under a different account. Sign in with the same account and try again.';
  }
  if (m === 'connection_failed') {
    return 'Could not finish connecting Google. Please try again.';
  }
  return m;
}
