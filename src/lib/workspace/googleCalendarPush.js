import { createSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getValidAccessToken } from '@/lib/workspace/connections';
import { formatGoogleApiError } from '@/lib/workspace/googleApiErrors';
import {
  GOOGLE_CALENDAR_WRITE_REQUIRED_MESSAGE,
  hasGoogleCalendarWriteScope,
} from '@/lib/workspace/oauth';

const PRIMARY_EVENTS_URL =
  'https://www.googleapis.com/calendar/v3/calendars/primary/events';

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

/**
 * @param {{
 *   title: string;
 *   startsAt: Date;
 *   endsAt: Date;
 *   description?: string | null;
 *   location?: string | null;
 *   showAs: string;
 *   remindBeforeMinutes?: number | null;
 * }} input
 */
function buildGoogleEventBody(input) {
  /** @type {Record<string, unknown>} */
  const body = {
    summary: input.title,
    start: { dateTime: input.startsAt.toISOString(), timeZone: 'UTC' },
    end: { dateTime: input.endsAt.toISOString(), timeZone: 'UTC' },
    transparency: input.showAs === 'free' ? 'transparent' : 'opaque',
  };
  if (input.description) body.description = input.description;
  if (input.location) body.location = input.location;
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
 * }} input
 * @returns {Promise<{ ok: true, googleEventId: string } | { ok: false, error: string }>}
 */
export async function createGoogleCalendarEvent(userId, input) {
  const ctx = await getGoogleWriteContext(userId);
  if (!ctx.ok) {
    console.error('[google-calendar-push] create blocked:', userId, ctx.error);
    return ctx;
  }

  const res = await fetch(PRIMARY_EVENTS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ctx.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildGoogleEventBody(input)),
  });
  const json = await res.json();
  if (!res.ok) {
    const error = formatGoogleApiError(json, 'Failed to create Google Calendar event');
    console.error('[google-calendar-push] create failed:', userId, res.status, error);
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
 * }} input
 * @returns {Promise<{ ok: true } | { ok: false, error: string }>}
 */
export async function updateGoogleCalendarEvent(userId, googleEventId, input) {
  const ctx = await getGoogleWriteContext(userId);
  if (!ctx.ok) return ctx;

  const res = await fetch(`${PRIMARY_EVENTS_URL}/${encodeURIComponent(googleEventId)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${ctx.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildGoogleEventBody(input)),
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
