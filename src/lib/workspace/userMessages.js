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
    m.includes('sign in again')
  );
}

/** User-facing sync error; hides raw auth failures (handled via reconnect flow). */
export function formatWorkspaceSyncError(message) {
  if (!message || typeof message !== 'string') return null;
  if (isAuthWorkspaceError(message)) return null;
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
    return 'Google connection was cancelled. You can try again anytime.';
  }
  if (m === 'missing_code' || m === 'invalid_state') {
    return 'Connection session expired. Use Connect with Google again.';
  }
  if (m === 'connection_failed') {
    return 'Could not finish connecting Google. Please try again.';
  }
  return m;
}
