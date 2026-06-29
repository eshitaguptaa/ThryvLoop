import { createSupabaseAdmin } from '@/lib/supabaseAdmin';
import { parseCalendarDateTime, parseInstant, toIsoUtcString } from '@/lib/calendarDateUtils';
import {
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  updateGoogleCalendarEvent,
} from '@/lib/workspace/googleCalendarPush';

const EVENT_SELECT =
  'id, user_id, title, description, location, starts_at, ends_at, show_as, remind_before_minutes, google_event_id';

const EVENT_SELECT_BASE =
  'id, user_id, title, description, location, starts_at, ends_at, show_as, google_event_id';

const EVENT_SELECT_LEGACY =
  'id, user_id, title, description, location, starts_at, ends_at, show_as';

const EVENT_SELECT_LEGACY_REMINDER =
  'id, user_id, title, description, location, starts_at, ends_at, show_as, remind_before_minutes';

/** @param {{ code?: string, message?: string } | null | undefined} error */
function isMissingReminderColumnError(error) {
  return (
    error?.code === '42703' &&
    String(error?.message || '').includes('remind_before_minutes')
  );
}

/** @param {{ code?: string, message?: string } | null | undefined} error */
function isMissingGoogleEventIdColumnError(error) {
  return (
    error?.code === '42703' &&
    String(error?.message || '').includes('google_event_id')
  );
}

/** @param {{ code?: string, message?: string } | null | undefined} error */
function formatDbError(error, fallback) {
  if (!error) return fallback;
  if (isMissingReminderColumnError(error)) {
    return 'Calendar reminders need a database update. Run supabase/migrations/20250602120000_user_calendar_reminders.sql in Supabase, then try again.';
  }
  return error.message || fallback;
}

/** @param {unknown} value @param {string} fieldName */
function parseIso(value, fieldName) {
  const d = parseCalendarDateTime(value);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid ${fieldName}`);
  }
  return d;
}

/** @param {{ title?: string, startsAt?: string, endsAt?: string, description?: string | null, location?: string | null, showAs?: string, timeZone?: string | null, startsAtLocal?: string | null, endsAtLocal?: string | null }} body @param {{ requestTimeZone?: string | null }} [options] */
export function validateCalendarEventInput(body, options = {}) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) throw new Error('Title is required');
  if (title.length > 500) throw new Error('Title is too long');

  const startsAt = parseIso(body.startsAt, 'start time');
  const endsAt = parseIso(body.endsAt, 'end time');
  if (endsAt.getTime() <= startsAt.getTime()) {
    throw new Error('End time must be after start time');
  }
  const maxSpanMs = 14 * 24 * 60 * 60 * 1000;
  if (endsAt.getTime() - startsAt.getTime() > maxSpanMs) {
    throw new Error('Event cannot be longer than 14 days');
  }

  const showAs = body.showAs === 'free' ? 'free' : 'busy';
  const description =
    body.description == null || body.description === ''
      ? null
      : String(body.description).trim().slice(0, 5000);
  const location =
    body.location == null || body.location === ''
      ? null
      : String(body.location).trim().slice(0, 500);

  let remindBeforeMinutes = null;
  if (body.remindBeforeMinutes === 5 || body.remindBeforeMinutes === true || body.remindMe === true) {
    remindBeforeMinutes = 5;
  } else if (
    typeof body.remindBeforeMinutes === 'number' &&
    body.remindBeforeMinutes >= 1 &&
    body.remindBeforeMinutes <= 120
  ) {
    remindBeforeMinutes = Math.round(body.remindBeforeMinutes);
  }

  const timeZone =
    (typeof body.timeZone === 'string' && body.timeZone.trim() ? body.timeZone.trim() : null) ||
    (typeof options.requestTimeZone === 'string' && options.requestTimeZone.trim()
      ? options.requestTimeZone.trim()
      : null);

  const startsAtLocal =
    typeof body.startsAtLocal === 'string' && body.startsAtLocal.trim()
      ? body.startsAtLocal.trim()
      : null;
  const endsAtLocal =
    typeof body.endsAtLocal === 'string' && body.endsAtLocal.trim() ? body.endsAtLocal.trim() : null;

  return {
    title,
    startsAt,
    endsAt,
    description,
    location,
    showAs,
    remindBeforeMinutes,
    timeZone,
    startsAtLocal,
    endsAtLocal,
  };
}

/** @param {{ id: string, user_id: string, title: string, description?: string | null, location?: string | null, starts_at: string, ends_at: string, show_as: string, google_event_id?: string | null }} row */
export function mapUserCalendarEventForClient(row) {
  const startsAt = toIsoUtcString(row.starts_at);
  const endsAt = toIsoUtcString(row.ends_at);
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    location: row.location ?? null,
    startsAt,
    endsAt,
    meetUrl: null,
    isOnlineMeeting: false,
    canJoin: false,
    showAs: row.show_as === 'free' ? 'free' : 'busy',
    remindBeforeMinutes: row.remind_before_minutes ?? null,
    syncedToGoogle: Boolean(row.google_event_id),
    source: 'app',
    editable: true,
  };
}

/** @param {unknown} error */
function selectFieldsForDbError(error) {
  if (isMissingGoogleEventIdColumnError(error)) return EVENT_SELECT_LEGACY_REMINDER;
  if (isMissingReminderColumnError(error)) return EVENT_SELECT_BASE;
  return null;
}

/**
 * @param {string} userId
 * @param {string} eventId
 * @param {string | null} googleEventId
 */
async function storeGoogleEventId(userId, eventId, googleEventId) {
  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from('user_calendar_events')
    .update({ google_event_id: googleEventId, updated_at: new Date().toISOString() })
    .eq('id', eventId)
    .eq('user_id', userId);
  if (error && !isMissingGoogleEventIdColumnError(error)) throw error;
}

/**
 * @param {string} userId
 * @param {string} eventId
 * @param {string | null} googleEventId
 * @param {{
 *   title: string;
 *   startsAt: Date;
 *   endsAt: Date;
 *   description: string | null;
 *   location: string | null;
 *   showAs: string;
 *   remindBeforeMinutes?: number | null;
 * }} input
 */
async function syncEventToGoogle(userId, eventId, googleEventId, input) {
  if (googleEventId) {
    const result = await updateGoogleCalendarEvent(userId, googleEventId, input);
    return result.ok ? { googleEventId, error: null } : { googleEventId, error: result.error };
  }

  const created = await createGoogleCalendarEvent(userId, input);
  if (!created.ok) return { googleEventId: null, error: created.error };

  await storeGoogleEventId(userId, eventId, created.googleEventId);
  return { googleEventId: created.googleEventId, error: null };
}

/**
 * @param {string} userId
 * @param {Date} rangeStart
 * @param {Date} rangeEnd
 */
export async function getUserCalendarEventsInRange(userId, rangeStart, rangeEnd) {
  const supabase = createSupabaseAdmin();
  let { data, error } = await supabase
    .from('user_calendar_events')
    .select(EVENT_SELECT)
    .eq('user_id', userId)
    .gt('ends_at', rangeStart.toISOString())
    .lt('starts_at', rangeEnd.toISOString())
    .order('starts_at', { ascending: true });

  if (error) {
    for (const fallbackSelect of [EVENT_SELECT_LEGACY_REMINDER, EVENT_SELECT_LEGACY]) {
      ({ data, error } = await supabase
        .from('user_calendar_events')
        .select(fallbackSelect)
        .eq('user_id', userId)
        .gt('ends_at', rangeStart.toISOString())
        .lt('starts_at', rangeEnd.toISOString())
        .order('starts_at', { ascending: true }));
      if (!error) break;
      if (error.code !== '42703') break;
    }
  }

  if (error) throw error;
  return (data || []).map(mapUserCalendarEventForClient);
}

/**
 * Push ThryvLoop events that were created before Google write access was granted.
 * @param {string} userId
 * @param {number} [limit]
 */
export async function backfillUnsyncedCalendarEvents(userId, limit = 20) {
  const supabase = createSupabaseAdmin();
  let { data, error } = await supabase
    .from('user_calendar_events')
    .select(
      'id, title, description, location, starts_at, ends_at, show_as, remind_before_minutes, google_event_id'
    )
    .eq('user_id', userId)
    .is('google_event_id', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingGoogleEventIdColumnError(error)) return { synced: 0, errors: [] };
    throw error;
  }

  let synced = 0;
  const errors = [];
  for (const row of data || []) {
    const input = {
      title: row.title,
      description: row.description ?? null,
      location: row.location ?? null,
      startsAt: parseInstant(row.starts_at),
      endsAt: parseInstant(row.ends_at),
      showAs: row.show_as === 'free' ? 'free' : 'busy',
      remindBeforeMinutes: row.remind_before_minutes ?? null,
    };
    const result = await syncEventToGoogle(userId, row.id, null, input);
    if (result.googleEventId && !result.error) {
      synced += 1;
    } else if (result.error) {
      errors.push(result.error);
      break;
    }
  }

  return { synced, errors: [...new Set(errors)] };
}

/**
 * @param {string} userId
 * @param {{ title: string, startsAt: Date, endsAt: Date, description: string | null, location: string | null, showAs: string }} input
 */
export async function createUserCalendarEvent(userId, input) {
  const supabase = createSupabaseAdmin();
  const now = new Date().toISOString();
  const row = {
    user_id: userId,
    title: input.title,
    description: input.description,
    location: input.location,
    starts_at: input.startsAt.toISOString(),
    ends_at: input.endsAt.toISOString(),
    show_as: input.showAs,
    updated_at: now,
  };

  let selectFields = EVENT_SELECT_BASE;
  let insertRow = row;

  if (input.remindBeforeMinutes != null) {
    insertRow = { ...row, remind_before_minutes: input.remindBeforeMinutes };
    selectFields = EVENT_SELECT;
  }

  let { data, error } = await supabase
    .from('user_calendar_events')
    .insert(insertRow)
    .select(selectFields)
    .single();

  if (error) {
    const fallbackSelect = selectFieldsForDbError(error);
    if (fallbackSelect) {
      const fallbackRow =
        fallbackSelect === EVENT_SELECT_LEGACY || fallbackSelect === EVENT_SELECT_LEGACY_REMINDER
          ? row
          : input.remindBeforeMinutes != null && fallbackSelect === EVENT_SELECT_BASE
            ? row
            : insertRow;
      ({ data, error } = await supabase
        .from('user_calendar_events')
        .insert(fallbackRow)
        .select(fallbackSelect)
        .single());
    }
  }

  if (error) throw new Error(formatDbError(error, 'Failed to create event'));

  const googleSync = await syncEventToGoogle(userId, data.id, null, input);
  if (googleSync.googleEventId) {
    data = { ...data, google_event_id: googleSync.googleEventId };
  }

  return {
    event: mapUserCalendarEventForClient(data),
    googleSyncError: googleSync.error,
  };
}

/**
 * @param {string} userId
 * @param {string} eventId
 * @param {{ title: string, startsAt: Date, endsAt: Date, description: string | null, location: string | null, showAs: string }} input
 */
export async function updateUserCalendarEvent(userId, eventId, input) {
  const supabase = createSupabaseAdmin();
  const row = {
    title: input.title,
    description: input.description,
    location: input.location,
    starts_at: input.startsAt.toISOString(),
    ends_at: input.endsAt.toISOString(),
    show_as: input.showAs,
    updated_at: new Date().toISOString(),
  };

  let selectFields = EVENT_SELECT_BASE;
  let updateRow = row;

  if (input.remindBeforeMinutes !== undefined) {
    updateRow = { ...row, remind_before_minutes: input.remindBeforeMinutes };
    selectFields = EVENT_SELECT;
  }

  let { data, error } = await supabase
    .from('user_calendar_events')
    .update(updateRow)
    .eq('id', eventId)
    .eq('user_id', userId)
    .select(selectFields)
    .single();

  if (error) {
    const fallbackSelect = selectFieldsForDbError(error);
    if (fallbackSelect) {
      ({ data, error } = await supabase
        .from('user_calendar_events')
        .update(row)
        .eq('id', eventId)
        .eq('user_id', userId)
        .select(fallbackSelect)
        .single());
    }
  }

  if (error) throw new Error(formatDbError(error, 'Failed to update event'));
  if (!data) throw new Error('Event not found');

  const googleSync = await syncEventToGoogle(
    userId,
    eventId,
    data.google_event_id ?? null,
    input
  );
  if (googleSync.googleEventId) {
    data = { ...data, google_event_id: googleSync.googleEventId };
  }

  return {
    event: mapUserCalendarEventForClient(data),
    googleSyncError: googleSync.error,
  };
}

/** @param {string} userId @param {string} eventId */
export async function deleteUserCalendarEvent(userId, eventId) {
  const supabase = createSupabaseAdmin();

  let googleEventId = null;
  const { data: existing, error: fetchError } = await supabase
    .from('user_calendar_events')
    .select('id, google_event_id')
    .eq('id', eventId)
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError && !isMissingGoogleEventIdColumnError(fetchError)) throw fetchError;
  if (!existing) throw new Error('Event not found');
  googleEventId = existing.google_event_id ?? null;

  const { data, error } = await supabase
    .from('user_calendar_events')
    .delete()
    .eq('id', eventId)
    .eq('user_id', userId)
    .select('id');

  if (error) throw error;
  if (!data?.length) throw new Error('Event not found');

  let googleSyncError = null;
  if (googleEventId) {
    const removed = await deleteGoogleCalendarEvent(userId, googleEventId);
    if (!removed.ok) googleSyncError = removed.error;

    // Drop cached Google block — otherwise it reappears as a separate event after the app row is gone.
    const { error: blockDeleteError } = await supabase
      .from('workspace_calendar_blocks')
      .delete()
      .eq('user_id', userId)
      .eq('provider', 'google')
      .eq('external_id', googleEventId);
    if (blockDeleteError) {
      console.error('[calendar] failed to clear synced Google block:', blockDeleteError);
    }
  }

  return { googleSyncError };
}
