import { createSupabaseAdmin } from '@/lib/supabaseAdmin';
import { parseCalendarDateTime, toIsoUtcString } from '@/lib/calendarDateUtils';

const EVENT_SELECT =
  'id, user_id, title, description, location, starts_at, ends_at, show_as, remind_before_minutes';

const EVENT_SELECT_BASE =
  'id, user_id, title, description, location, starts_at, ends_at, show_as';

/** @param {{ code?: string, message?: string } | null | undefined} error */
function isMissingReminderColumnError(error) {
  return (
    error?.code === '42703' &&
    String(error?.message || '').includes('remind_before_minutes')
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

/** @param {{ title?: string, startsAt?: string, endsAt?: string, description?: string | null, location?: string | null, showAs?: string }} body */
export function validateCalendarEventInput(body) {
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

  return { title, startsAt, endsAt, description, location, showAs, remindBeforeMinutes };
}

/** @param {{ id: string, user_id: string, title: string, description?: string | null, location?: string | null, starts_at: string, ends_at: string, show_as: string }} row */
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
    source: 'app',
    editable: true,
  };
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

  if (error && isMissingReminderColumnError(error)) {
    ({ data, error } = await supabase
      .from('user_calendar_events')
      .select(EVENT_SELECT_BASE)
      .eq('user_id', userId)
      .gt('ends_at', rangeStart.toISOString())
      .lt('starts_at', rangeEnd.toISOString())
      .order('starts_at', { ascending: true }));
  }

  if (error) throw error;
  return (data || []).map(mapUserCalendarEventForClient);
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

  if (error && isMissingReminderColumnError(error) && input.remindBeforeMinutes != null) {
    ({ data, error } = await supabase
      .from('user_calendar_events')
      .insert(row)
      .select(EVENT_SELECT_BASE)
      .single());
  }

  if (error) throw new Error(formatDbError(error, 'Failed to create event'));
  return mapUserCalendarEventForClient(data);
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

  if (error && isMissingReminderColumnError(error) && input.remindBeforeMinutes !== undefined) {
    ({ data, error } = await supabase
      .from('user_calendar_events')
      .update(row)
      .eq('id', eventId)
      .eq('user_id', userId)
      .select(EVENT_SELECT_BASE)
      .single());
  }

  if (error) throw new Error(formatDbError(error, 'Failed to update event'));
  if (!data) throw new Error('Event not found');
  return mapUserCalendarEventForClient(data);
}

/** @param {string} userId @param {string} eventId */
export async function deleteUserCalendarEvent(userId, eventId) {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('user_calendar_events')
    .delete()
    .eq('id', eventId)
    .eq('user_id', userId)
    .select('id');

  if (error) throw error;
  if (!data?.length) throw new Error('Event not found');
}
