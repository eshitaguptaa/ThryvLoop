import { createHmac, randomBytes } from 'crypto';

export const GOOGLE_CALENDAR_WRITE_SCOPE = 'https://www.googleapis.com/auth/calendar';
export const GOOGLE_CALENDAR_EVENTS_WRITE_SCOPE =
  'https://www.googleapis.com/auth/calendar.events';
export const GOOGLE_GMAIL_READONLY_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';

export const GOOGLE_SCOPES = [
  GOOGLE_CALENDAR_WRITE_SCOPE,
  GOOGLE_GMAIL_READONLY_SCOPE,
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

const CALENDAR_WRITE_SCOPES = new Set([
  GOOGLE_CALENDAR_WRITE_SCOPE,
  GOOGLE_CALENDAR_EVENTS_WRITE_SCOPE,
]);

const CALENDAR_ACCESS_SCOPES = new Set([
  GOOGLE_CALENDAR_WRITE_SCOPE,
  GOOGLE_CALENDAR_EVENTS_WRITE_SCOPE,
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events.readonly',
]);

/** @param {string[] | null | undefined} scopes */
export function hasGoogleCalendarAccessScope(scopes) {
  return (scopes || []).some((scope) => CALENDAR_ACCESS_SCOPES.has(scope));
}

/** @param {string[] | null | undefined} scopes */
export function hasGoogleGmailScope(scopes) {
  return (scopes || []).some(
    (scope) =>
      scope === GOOGLE_GMAIL_READONLY_SCOPE ||
      scope === 'https://mail.google.com/' ||
      (typeof scope === 'string' && scope.includes('gmail'))
  );
}

/** @param {string[] | null | undefined} scopes */
export function hasGoogleCalendarWriteScope(scopes) {
  return (scopes || []).some((scope) => CALENDAR_WRITE_SCOPES.has(scope));
}

export const GOOGLE_CALENDAR_WRITE_REQUIRED_MESSAGE =
  'To sync events to Google Calendar, resync your Google account and allow calendar access.';

export function getOAuthSecret() {
  const raw =
    process.env.WORKSPACE_OAUTH_STATE_SECRET || process.env.WORKSPACE_TOKEN_ENCRYPTION_KEY || '';
  return raw.trim();
}

function getAppOrigin() {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

export function getGoogleRedirectUri() {
  return process.env.GOOGLE_REDIRECT_URI || `${getAppOrigin()}/api/workspace/callback/google`;
}

function signState(payload) {
  const secret = getOAuthSecret();
  if (!secret) throw new Error('WORKSPACE_TOKEN_ENCRYPTION_KEY is not set');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

/**
 * @param {string | null | undefined} state
 * @returns {{ userId: string, provider: string, nonce?: string, exp?: number } | null}
 */
export function verifyState(state) {
  const secret = getOAuthSecret();
  const normalized = typeof state === 'string' ? state.trim() : '';
  if (!secret || !normalized) return null;
  const dot = normalized.lastIndexOf('.');
  if (dot <= 0) return null;
  const body = normalized.slice(0, dot);
  const sig = normalized.slice(dot + 1);
  if (!body || !sig) return null;
  const expected = createHmac('sha256', secret).update(body).digest('base64url');
  if (sig !== expected) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (parsed.exp && Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** @returns {'missing_encryption_key'|'missing_state'|'state_invalid'|'state_expired'|null} */
export function getStateErrorReason(state) {
  if (!getOAuthSecret()) return 'missing_encryption_key';
  const normalized = typeof state === 'string' ? state.trim() : '';
  if (!normalized) return 'missing_state';
  const parsed = verifyState(normalized);
  if (!parsed) return 'state_invalid';
  if (parsed.exp && Date.now() > parsed.exp) return 'state_expired';
  return null;
}

export const WORKSPACE_OAUTH_COOKIE = 'workspace_oauth_state';

export function createOAuthState(userId, provider = 'google') {
  return signState({
    userId,
    provider,
    nonce: randomBytes(16).toString('hex'),
    exp: Date.now() + 10 * 60 * 1000,
  });
}

export function buildGoogleAuthUrl(state) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('GOOGLE_CLIENT_ID is not configured');
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGoogleRedirectUri(),
    response_type: 'code',
    scope: GOOGLE_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeGoogleCode(code) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Google OAuth credentials missing');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getGoogleRedirectUri(),
      grant_type: 'authorization_code',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.error || 'Google token exchange failed');
  return data;
}

export async function refreshGoogleToken(refreshToken) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.error || 'Google refresh failed');
  return data;
}
