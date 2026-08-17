export const DEFAULT_CALENDAR_REMIND_MINUTES = 5;

/** @param {{ source?: string, id?: string }} event */
export function calendarEventReminderKey(event) {
  return `${event.source || 'app'}-${event.id}`;
}

/** @param {string | null | undefined} userId */
function storageKey(userId) {
  return userId ? `calendar-reminder-prefs-${userId}` : 'calendar-reminder-prefs';
}

/** @param {string | null | undefined} userId */
function firedStorageKey(userId) {
  return userId ? `calendar-reminder-fired-${userId}` : 'calendar-reminder-fired';
}

/** @param {string | null | undefined} userId */
export function readCalendarReminderPrefs(userId) {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * @param {string | null | undefined} userId
 * @param {string} eventKey
 * @param {number | null} minutes — null clears the preference
 */
export function setCalendarReminderPref(userId, eventKey, minutes) {
  if (typeof window === 'undefined') return;
  const prefs = readCalendarReminderPrefs(userId);
  if (minutes == null || minutes <= 0) {
    delete prefs[eventKey];
  } else {
    prefs[eventKey] = minutes;
  }
  localStorage.setItem(storageKey(userId), JSON.stringify(prefs));
}

/** @param {string | null | undefined} userId @param {string} eventKey */
export function getCalendarReminderPref(userId, eventKey) {
  const prefs = readCalendarReminderPrefs(userId);
  const value = prefs[eventKey];
  return typeof value === 'number' && value > 0 ? value : null;
}

/** @param {{ source?: string, id?: string, remindBeforeMinutes?: number | null }} event @param {string | null | undefined} userId */
export function getEffectiveRemindMinutes(event, userId) {
  if (event.source === 'app' && event.remindBeforeMinutes) {
    return event.remindBeforeMinutes;
  }
  if (!event.id) return null;
  return getCalendarReminderPref(userId, calendarEventReminderKey(event));
}

/** @param {string | null | undefined} userId */
function readFiredReminders(userId) {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(firedStorageKey(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** @param {string | null | undefined} userId @param {string} firedKey */
export function markReminderFired(userId, firedKey) {
  if (typeof window === 'undefined') return;
  const fired = readFiredReminders(userId);
  fired[firedKey] = Date.now();
  sessionStorage.setItem(firedStorageKey(userId), JSON.stringify(fired));
}

/** @param {string | null | undefined} userId @param {string} firedKey */
export function wasReminderFired(userId, firedKey) {
  return Boolean(readFiredReminders(userId)[firedKey]);
}

/** @param {string} eventKey @param {string} startsAt */
export function reminderFiredKey(eventKey, startsAt) {
  return `${eventKey}@${startsAt}`;
}

/**
 * @param {Array<{ id: string, source?: string, title?: string, startsAt: string, remindBeforeMinutes?: number | null }>} events
 * @param {string | null | undefined} userId
 * @param {{ onReminder: (payload: { title: string, startsAt: string, minutes: number, eventKey: string }) => void }} handlers
 */
export function checkCalendarReminders(events, userId, { onReminder }) {
  const now = Date.now();

  for (const event of events) {
    const minutes = getEffectiveRemindMinutes(event, userId);
    if (!minutes) continue;

    const startMs = new Date(event.startsAt).getTime();
    if (Number.isNaN(startMs) || startMs <= now) continue;

    const remindAt = startMs - minutes * 60_000;
    if (now < remindAt || now > startMs) continue;

    const eventKey = calendarEventReminderKey(event);
    const firedKey = reminderFiredKey(eventKey, event.startsAt);
    if (wasReminderFired(userId, firedKey)) continue;

    markReminderFired(userId, firedKey);
    onReminder({
      title: event.title || 'Upcoming event',
      startsAt: event.startsAt,
      minutes,
      eventKey,
    });
  }
}
