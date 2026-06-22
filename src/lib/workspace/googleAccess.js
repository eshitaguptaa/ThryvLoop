import {
  GOOGLE_CALENDAR_WRITE_SCOPE,
  GOOGLE_GMAIL_READONLY_SCOPE,
  hasGoogleCalendarAccessScope,
  hasGoogleGmailScope,
} from '@/lib/workspace/oauth';

/** @typedef {{ connected: boolean, calendarGranted: boolean, gmailGranted: boolean, accountEmail: string | null }} GoogleConnectionAccess */

/**
 * @param {{ scopes?: string[] | null, account_email?: string | null } | null | undefined} connection
 * @returns {GoogleConnectionAccess}
 */
export function getGoogleConnectionAccess(connection) {
  const scopes = connection?.scopes || [];
  return {
    connected: Boolean(connection),
    calendarGranted: hasGoogleCalendarAccessScope(scopes),
    gmailGranted: hasGoogleGmailScope(scopes),
    accountEmail: connection?.account_email ?? null,
  };
}

/** @param {GoogleConnectionAccess | null | undefined} access */
export function needsGoogleResync(access) {
  if (!access?.connected) return false;
  return !access.calendarGranted || !access.gmailGranted;
}

/** @param {GoogleConnectionAccess | null | undefined} access */
export function getMissingGoogleServices(access) {
  if (!access?.connected) return [];
  const missing = [];
  if (!access.calendarGranted) missing.push('Calendar');
  if (!access.gmailGranted) missing.push('Gmail');
  return missing;
}

/** @param {GoogleConnectionAccess | null | undefined} access */
export function getGoogleResyncMessage(access) {
  const missing = getMissingGoogleServices(access);
  if (missing.length === 0) return null;
  if (missing.length === 2) {
    return 'Resync your Google account to enable Calendar and Gmail.';
  }
  return `Resync your Google account to enable ${missing[0]}.`;
}

/**
 * Infer stored scopes after a live API probe (e.g. Clerk token without scope list).
 * @param {{ calendarGranted: boolean, gmailGranted: boolean }} access
 */
export function buildScopesFromProbe(access) {
  const scopes = ['https://www.googleapis.com/auth/userinfo.email'];
  if (access.calendarGranted) scopes.push(GOOGLE_CALENDAR_WRITE_SCOPE);
  if (access.gmailGranted) scopes.push(GOOGLE_GMAIL_READONLY_SCOPE);
  return scopes;
}
