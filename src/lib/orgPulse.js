/**
 * Pulse dashboard stats from open tasks, activity, presence, focus hours.
 */

/**
 * @param {Array<Record<string, unknown>>} tasks
 * @param {string} [viewerUserId]
 * @param {boolean} [isAdmin]
 */
export function computePulseStats(tasks, viewerUserId, isAdmin = true) {
  const now = new Date();
  const rows = Array.isArray(tasks) ? tasks : [];
  const scoped = isAdmin ? rows : rows.filter((t) => t.assignee_user_id === viewerUserId);

  const open = scoped.filter((t) => t.column_key !== 'done');
  const overdue = open.filter((t) => t.due_date && new Date(t.due_date) < now);
  const unassigned = isAdmin
    ? rows.filter((t) => t.column_key !== 'done' && !t.assignee_user_id)
    : [];
  const dueToday = open.filter((t) => {
    if (!t.due_date) return false;
    const d = new Date(t.due_date);
    return (
      d.getFullYear() === now.getFullYear()
      && d.getMonth() === now.getMonth()
      && d.getDate() === now.getDate()
    );
  });
  const inProgress = open.filter((t) => t.column_key === 'in_progress');
  const todo = open.filter((t) => t.column_key === 'todo');

  /** @type {Record<string, number>} */
  const openByAssignee = {};
  open.forEach((t) => {
    const id = t.assignee_user_id || '_none';
    openByAssignee[id] = (openByAssignee[id] || 0) + 1;
  });

  const overloaded = Object.entries(openByAssignee)
    .filter(([id, count]) => id !== '_none' && count >= 5)
    .map(([userId, count]) => ({ userId, count }))
    .sort((a, b) => b.count - a.count);

  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const doneThisWeek = scoped.filter((t) => {
    if (t.column_key !== 'done' || !t.completed_at) return false;
    return new Date(t.completed_at) >= weekStart;
  });

  return {
    openCount: open.length,
    overdueCount: overdue.length,
    unassignedCount: unassigned.length,
    dueTodayCount: dueToday.length,
    inProgressCount: inProgress.length,
    todoCount: todo.length,
    doneThisWeekCount: doneThisWeek.length,
    overloaded,
    overdueTasks: overdue.slice(0, 8),
    dueTodayTasks: dueToday.slice(0, 8),
  };
}

export const FOCUS_DAY_OPTIONS = [
  { value: 1, label: 'Mon', short: 'M' },
  { value: 2, label: 'Tue', short: 'T' },
  { value: 3, label: 'Wed', short: 'W' },
  { value: 4, label: 'Thu', short: 'T' },
  { value: 5, label: 'Fri', short: 'F' },
  { value: 6, label: 'Sat', short: 'S' },
  { value: 0, label: 'Sun', short: 'S' },
];

export const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
];

function normalizeDay(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 1;
  const d = Math.trunc(n);
  if (d < 0 || d > 6) return 1;
  return d;
}

function normalizeTime(raw, fallback) {
  const s = String(raw || fallback || '09:00').trim();
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return fallback || '09:00';
  const h = Math.min(23, Math.max(0, Number(m[1])));
  const min = Math.min(59, Math.max(0, Number(m[2])));
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

/**
 * @param {unknown} focusHours
 */
export function parseFocusHours(focusHours) {
  const fallback = { enabled: false, timezone: 'UTC', windows: [] };
  if (!focusHours || typeof focusHours !== 'object') return fallback;
  const raw = /** @type {Record<string, unknown>} */ (focusHours);
  const windows = Array.isArray(raw.windows)
    ? raw.windows
      .filter((w) => w && typeof w === 'object')
      .map((w) => {
        const win = /** @type {Record<string, unknown>} */ (w);
        return {
          day: normalizeDay(win.day),
          start: normalizeTime(win.start, '09:00'),
          end: normalizeTime(win.end, '12:00'),
        };
      })
    : [];
  const tz =
    typeof raw.timezone === 'string' && raw.timezone.trim()
      ? raw.timezone.trim()
      : 'UTC';
  return {
    enabled: Boolean(raw.enabled),
    timezone: tz,
    windows,
  };
}

export const DEFAULT_FOCUS_WINDOWS = [
  { day: 1, start: '09:00', end: '12:00' },
  { day: 2, start: '09:00', end: '12:00' },
  { day: 3, start: '09:00', end: '12:00' },
  { day: 4, start: '09:00', end: '12:00' },
  { day: 5, start: '09:00', end: '12:00' },
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Local day + minute-of-day in a named IANA timezone.
 * @param {Date} now
 * @param {string} timeZone
 */
export function getZonedDayAndMinutes(now, timeZone) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone || 'UTC',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now);
    const weekday = parts.find((p) => p.type === 'weekday')?.value;
    const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
    const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
    const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const day = map[weekday] ?? now.getDay();
    return { day, mins: hour * 60 + minute };
  } catch {
    return {
      day: now.getDay(),
      mins: now.getHours() * 60 + now.getMinutes(),
    };
  }
}

/**
 * @param {ReturnType<typeof parseFocusHours>} focusHours
 * @param {Date} [now]
 */
export function isWithinFocusHours(focusHours, now = new Date()) {
  if (!focusHours?.enabled || !focusHours.windows?.length) return false;
  const { day, mins } = getZonedDayAndMinutes(now, focusHours.timezone || 'UTC');
  return focusHours.windows.some((w) => {
    if (normalizeDay(w.day) !== day) return false;
    const [sh, sm] = String(w.start).split(':').map(Number);
    const [eh, em] = String(w.end).split(':').map(Number);
    const start = (sh || 0) * 60 + (sm || 0);
    const end = (eh || 0) * 60 + (em || 0);
    if (end <= start) return mins >= start || mins < end;
    return mins >= start && mins < end;
  });
}

export function formatFocusWindowLabel(window) {
  if (!window) return '';
  const day = DAY_NAMES[normalizeDay(window.day)] ?? 'Day';
  return `${day} ${window.start}–${window.end}`;
}

/**
 * Presence older than this is treated as offline.
 */
export const PRESENCE_STALE_MS = 5 * 60 * 1000;

/**
 * @param {Array<{ user_id: string, status: string, last_seen_at: string, note?: string | null }>} rows
 * @param {Date} [now]
 */
export function groupPresence(rows, now = new Date()) {
  const focusing = [];
  const available = [];
  const away = [];
  const offline = [];

  (rows || []).forEach((row) => {
    const seen = row.last_seen_at ? new Date(row.last_seen_at).getTime() : 0;
    const stale = !seen || now.getTime() - seen > PRESENCE_STALE_MS;
    if (stale) {
      offline.push(row);
      return;
    }
    if (row.status === 'focusing') focusing.push(row);
    else if (row.status === 'away') away.push(row);
    else available.push(row);
  });

  return { focusing, available, away, offline };
}
