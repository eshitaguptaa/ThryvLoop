import { createSupabaseAdmin } from '@/lib/supabaseAdmin';
import { toGoogleCalendarEventDateTime } from '@/lib/calendarDateUtils';
import { getValidAccessToken } from '@/lib/workspace/connections';
import { formatGoogleApiError } from '@/lib/workspace/googleApiErrors';
import {
  GOOGLE_CALENDAR_WRITE_REQUIRED_MESSAGE,
  hasGoogleCalendarWriteScope,
} from '@/lib/workspace/oauth';

const PRIMARY_EVENTS_URL =
  'https://www.googleapis.com/calendar/v3/calendars/primary/events';

const GOOGLE_TIMEZONE_URL =
  'https://www.googleapis.com/calendar/v3/users/me/settings/timezone';

/** @type {Map<string, { value: string, expiresAt: number }>} */
const googleTimeZoneCache = new Map();

/**
 * @param {string} userId
 * @returns {Promise<{ ok: true, token: string } | { ok: false, error: string }>}
 */
async function getGoogleWriteContext(userId) {
  const supabase = createSupabaseAdmin();
  const { data: row, error } = await supabase
    .from('workspace_connections')
    .select('scopes')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .maybeSingle();
  if (error) throw error;
  if (!row) return { ok: false, error: 'Google Calendar not connected' };
  if (!hasGoogleCalendarWriteScope(row.scopes)) {
    return { ok: false, error: GOOGLE_CALENDAR_WRITE_REQUIRED_MESSAGE };
  }
  const token = await getValidAccessToken(userId, 'google');
  if (!token) return { ok: false, error: 'Google Calendar not connected' };
  return { ok: true, token };
}

/** @param {string} token */
async function fetchGoogleCalendarTimeZone(token) {
  const cached = googleTimeZoneCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const res = await fetch(GOOGLE_TIMEZONE_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok || typeof json.value !== 'string' || !json.value.trim()) {
    return null;
  }

  const value = json.value.trim();
  googleTimeZoneCache.set(token, { value, expiresAt: Date.now() + 10 * 60 * 1000 });
  return value;
}

/**
 * @param {{
 *   startsAt: Date;
 *   endsAt: Date;
 *   startsAtLocal?: string | null;
 *   endsAtLocal?: string | null;
 *   timeZone?: string | null;
 * }} input
 * @param {string | null | undefined} fallbackTimeZone
 */
function buildGoogleEventDateTimes(input, fallbackTimeZone) {
  const timeZone =
    (typeof input.timeZone === 'string' && input.timeZone.trim() ? input.timeZone.trim() : null) ||
    (typeof fallbackTimeZone === 'string' && fallbackTimeZone.trim() ? fallbackTimeZone.trim() : null);

  if (!timeZone) {
    return {
      start: { dateTime: input.startsAt.toISOString() },
      end: { dateTime: input.endsAt.toISOString() },
    };
  }

  return {
    start: toGoogleCalendarEventDateTime(input.startsAt, timeZone, input.startsAtLocal),
    end: toGoogleCalendarEventDateTime(input.endsAt, timeZone, input.endsAtLocal),
  };
}

/**
 * @param {{
 *   title: string;
 *   startsAt: Date;
 *   endsAt: Date;
 *   description?: string | null;
 *   location?: string | null;
 *   showAs: string;
 *   remindBeforeMinutes?: number | null;
 *   timeZone?: string | null;
 *   startsAtLocal?: string | null;
 *   endsAtLocal?: string | null;
 * }} input
 * @param {string | null | undefined} fallbackTimeZone
 */
function buildGoogleEventBody(input, fallbackTimeZone) {
  const { start, end } = buildGoogleEventDateTimes(input, fallbackTimeZone);

  /** @type {Record<string, unknown>} */
  const body = {
    summary: input.title,
    start,
    end,
    transparency: input.showAs === 'free' ? 'transparent' : 'opaque',
  };
  if (input.description?.trim()) body.description = input.description.trim();
  if (input.location?.trim()) body.location = input.location.trim();
  if (input.remindBeforeMinutes != null && input.remindBeforeMinutes > 0) {
    body.reminders = {
      useDefault: false,
      overrides: [{ method: 'popup', minutes: input.remindBeforeMinutes }],
    };
  }
  return body;
}

/**
 * @param {string} userId
 * @param {{
 *   title: string;
 *   startsAt: Date;
 *   endsAt: Date;
 *   description?: string | null;
 *   location?: string | null;
 *   showAs: string;
 *   remindBeforeMinutes?: number | null;
 *   timeZone?: string | null;
 *   startsAtLocal?: string | null;
 *   endsAtLocal?: string | null;
 * }} input
 * @returns {Promise<{ ok: true, googleEventId: string } | { ok: false, error: string }>}
 */
export async function createGoogleCalendarEvent(userId, input) {
  const ctx = await getGoogleWriteContext(userId);
  if (!ctx.ok) {
    console.error('[google-calendar-push] create blocked:', userId, ctx.error);
    return ctx;
  }

  const googleTimeZone = input.timeZone ? null : await fetchGoogleCalendarTimeZone(ctx.token);
  const body = buildGoogleEventBody(input, googleTimeZone);

  const res = await fetch(PRIMARY_EVENTS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ctx.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    const error = formatGoogleApiError(json, 'Failed to create Google Calendar event');
    console.error('[google-calendar-push] create failed:', userId, res.status, error, body);
    return { ok: false, error };
  }
  if (!json.id) return { ok: false, error: 'Google Calendar did not return an event id' };
  return { ok: true, googleEventId: json.id };
}

/**
 * @param {string} userId
 * @param {string} googleEventId
 * @param {{
 *   title: string;
 *   startsAt: Date;
 *   endsAt: Date;
 *   description?: string | null;
 *   location?: string | null;
 *   showAs: string;
 *   remindBeforeMinutes?: number | null;
 *   timeZone?: string | null;
 *   startsAtLocal?: string | null;
 *   endsAtLocal?: string | null;
 * }} input
 * @returns {Promise<{ ok: true } | { ok: false, error: string }>}
 */
export async function updateGoogleCalendarEvent(userId, googleEventId, input) {
  const ctx = await getGoogleWriteContext(userId);
  if (!ctx.ok) return ctx;

  const googleTimeZone = input.timeZone ? null : await fetchGoogleCalendarTimeZone(ctx.token);
  const body = buildGoogleEventBody(input, googleTimeZone);

  const res = await fetch(`${PRIMARY_EVENTS_URL}/${encodeURIComponent(googleEventId)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${ctx.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    return {
      ok: false,
      error: formatGoogleApiError(json, 'Failed to update Google Calendar event'),
    };
  }
  return { ok: true };
}

/**
 * @param {string} userId
 * @param {string} googleEventId
 * @returns {Promise<{ ok: true } | { ok: false, error: string }>}
 */
export async function deleteGoogleCalendarEvent(userId, googleEventId) {
  const ctx = await getGoogleWriteContext(userId);
  if (!ctx.ok) return ctx;

  const res = await fetch(`${PRIMARY_EVENTS_URL}/${encodeURIComponent(googleEventId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${ctx.token}` },
  });
  if (res.ok || res.status === 404 || res.status === 410) return { ok: true };

  let json = null;
  try {
    json = await res.json();
  } catch {
    // DELETE may return empty body
  }
  return {
    ok: false,
    error: formatGoogleApiError(json, 'Failed to delete Google Calendar event'),
  };
}
