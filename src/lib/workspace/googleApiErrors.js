const DEFAULT_PROJECT_NUMBER = '821180420723';

/** Project number (for API URLs). From env or OAuth client id prefix. */
export function getGoogleCloudProjectNumber(syncError) {
  const fromEnv = process.env.NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT_NUMBER?.trim();
  if (fromEnv) return fromEnv;
  if (syncError) {
    const fromError = parseGoogleCloudProjectNumber(syncError);
    if (fromError) return fromError;
  }
  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ||
    process.env.GOOGLE_CLIENT_ID?.trim();
  const fromClient = clientId?.match(/^(\d+)-/)?.[1];
  return fromClient || DEFAULT_PROJECT_NUMBER;
}

/** Display name in Google Cloud Console (e.g. Thryvloop). */
export function getGoogleCloudProjectName() {
  return process.env.NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT_NAME?.trim() || 'Thryvloop';
}

/** Label shown in UI. */
export function getGoogleCloudProjectLabel() {
  return getGoogleCloudProjectName();
}

/** @param {string | null | undefined} syncError */
export function parseGoogleCloudProjectNumber(syncError) {
  if (!syncError) return null;
  const m = syncError.match(/project[= ](\d+)/i);
  return m?.[1] || null;
}

/** @param {string | null | undefined} syncError */
export function parseEnableUrlsFromError(syncError) {
  if (!syncError) return [];
  const urls = syncError.match(/https:\/\/console\.developers\.google\.com\/[^\s)]+/g) || [];
  return [...new Set(urls)];
}

/** @param {string} projectNumber */
export function getGoogleApiEnableLinks(projectNumber) {
  const q = `?project=${projectNumber}`;
  return {
    calendar: `https://console.developers.google.com/apis/api/calendar-json.googleapis.com/overview${q}`,
    gmail: `https://console.developers.google.com/apis/api/gmail.googleapis.com/overview${q}`,
    consent: `https://console.cloud.google.com/apis/credentials/consent?project=${projectNumber}`,
  };
}

/** @param {unknown} body */
export function formatGoogleApiError(body, fallback) {
  if (!body || typeof body !== 'object') return fallback;
  const err = body.error;
  if (!err) return fallback;
  const reason = err.errors?.[0]?.reason;
  const message = err.message || fallback;
  if (reason === 'accessNotConfigured') {
    return (
      `${message} If you already enabled this API in project ${getGoogleCloudProjectName()}, wait 5–10 minutes and click Sync now. ` +
      'Also confirm OAuth consent screen has Gmail scopes and your Google account is a test user (for apps in Testing mode).'
    );
  }
  if (reason === 'insufficientPermissions' || err.status === 'PERMISSION_DENIED') {
    return `${message} Try Disconnect, then Connect again to refresh permissions.`;
  }
  return message;
}

/** @param {string | null | undefined} syncError */
export function getRequiredApiFixes(syncError) {
  if (!syncError) return [];
  const projectNumber = getGoogleCloudProjectNumber(syncError);
  const fromError = parseEnableUrlsFromError(syncError);
  const links = getGoogleApiEnableLinks(projectNumber);
  const fixes = [];

  if (syncError.includes('Calendar API')) {
    fixes.push({
      id: 'calendar',
      label: 'Enable Google Calendar API',
      href: fromError.find((u) => u.includes('calendar')) || links.calendar,
    });
  }
  if (syncError.includes('Gmail API') || syncError.toLowerCase().includes('gmail')) {
    fixes.push({
      id: 'gmail',
      label: 'Open Gmail API (confirm Enabled)',
      href: fromError.find((u) => u.includes('gmail')) || links.gmail,
    });
    fixes.push({
      id: 'consent',
      label: 'OAuth consent screen (add Gmail scope + test user)',
      href: links.consent,
    });
  }
  return fixes;
}
