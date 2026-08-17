import { PRESENCE_STALE_MS } from '@/lib/orgPulse';

/** @typedef {'focusing' | 'available' | 'away' | 'offline'} OrgPresenceStatus */

/**
 * Effective presence for one row (offline if heartbeat is stale).
 * @param {{ status?: string, last_seen_at?: string | null } | null | undefined} row
 * @param {Date} [now]
 * @returns {OrgPresenceStatus}
 */
export function resolvePresenceStatus(row, now = new Date()) {
  if (!row) return 'offline';
  const seen = row.last_seen_at ? new Date(row.last_seen_at).getTime() : 0;
  if (!seen || Number.isNaN(seen) || now.getTime() - seen > PRESENCE_STALE_MS) {
    return 'offline';
  }
  if (row.status === 'focusing') return 'focusing';
  if (row.status === 'away') return 'away';
  return 'available';
}

/**
 * Full team roster for Teams-style UI: every member gets a status.
 *
 * @param {Array<{
 *   userId: string,
 *   label: string,
 *   email?: string | null,
 *   imageUrl?: string | null,
 *   roleLabel?: string
 * }>} members
 * @param {Array<{ user_id: string, status?: string, last_seen_at?: string | null, note?: string | null }>} rows
 * @param {Date} [now]
 */
export function buildOrgPresenceRoster(members, rows, now = new Date()) {
  const byUser = new Map();
  for (const row of rows || []) {
    if (row?.user_id) byUser.set(row.user_id, row);
  }

  /** @type {Array<{
   *   userId: string,
   *   label: string,
   *   email: string | null,
   *   imageUrl: string | null,
   *   roleLabel: string,
   *   status: OrgPresenceStatus,
   *   lastSeenAt: string | null,
   *   note: string | null,
   * }>} */
  const people = [];

  for (const m of members || []) {
    if (!m?.userId) continue;
    const row = byUser.get(m.userId);
    byUser.delete(m.userId);
    people.push({
      userId: m.userId,
      label: m.label || m.email || m.userId,
      email: m.email ?? null,
      imageUrl: m.imageUrl ?? null,
      roleLabel: m.roleLabel || 'Team member',
      status: resolvePresenceStatus(row, now),
      lastSeenAt: row?.last_seen_at ?? null,
      note: row?.note ?? null,
    });
  }

  // Presence without a Clerk membership (edge case)
  for (const [userId, row] of byUser) {
    people.push({
      userId,
      label: userId.slice(0, 12),
      email: null,
      imageUrl: null,
      roleLabel: 'Team member',
      status: resolvePresenceStatus(row, now),
      lastSeenAt: row?.last_seen_at ?? null,
      note: row?.note ?? null,
    });
  }

  const sortPeople = (a, b) =>
    String(a.label).localeCompare(String(b.label), undefined, { sensitivity: 'base' });

  /** @type {Record<OrgPresenceStatus, typeof people>} */
  const groups = {
    focusing: [],
    available: [],
    away: [],
    offline: [],
  };
  for (const p of people) {
    groups[p.status].push(p);
  }
  for (const key of Object.keys(groups)) {
    groups[/** @type {OrgPresenceStatus} */ (key)].sort(sortPeople);
  }

  return { people, groups };
}

/**
 * Session preference for manual status inside a workspace (survives navigation).
 * @param {string} organizationId
 * @param {string} userId
 */
export function presencePrefKey(organizationId, userId) {
  return `org-presence-pref:${organizationId}:${userId}`;
}

/**
 * @param {string} organizationId
 * @param {string} userId
 * @returns {'focusing' | 'available' | 'away' | null}
 */
export function readPresencePref(organizationId, userId) {
  if (typeof window === 'undefined' || !organizationId || !userId) return null;
  try {
    const v = sessionStorage.getItem(presencePrefKey(organizationId, userId));
    if (v === 'focusing' || v === 'available' || v === 'away') return v;
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * @param {string} organizationId
 * @param {string} userId
 * @param {'focusing' | 'available' | 'away'} status
 */
export function writePresencePref(organizationId, userId, status) {
  if (typeof window === 'undefined' || !organizationId || !userId) return;
  try {
    sessionStorage.setItem(presencePrefKey(organizationId, userId), status);
  } catch {
    /* ignore */
  }
}

/**
 * Auto status: focus timer wins; otherwise keep session preference.
 * @param {boolean} timerRunning
 * @param {'focusing' | 'available' | 'away' | null} pref
 */
export function computeAutoPresenceStatus(timerRunning, pref) {
  if (timerRunning) return 'focusing';
  if (pref === 'away' || pref === 'available' || pref === 'focusing') return pref;
  return 'available';
}

export const PRESENCE_STATUS_META = {
  focusing: {
    label: 'Focusing',
    short: 'Focusing',
    dot: 'bg-emerald-500',
    ring: 'ring-emerald-500',
    badge: 'text-emerald-700 dark:text-emerald-300',
  },
  available: {
    label: 'Available',
    short: 'Online',
    dot: 'bg-sky-500',
    ring: 'ring-sky-500',
    badge: 'text-sky-700 dark:text-sky-300',
  },
  away: {
    label: 'Away',
    short: 'Away',
    dot: 'bg-amber-400',
    ring: 'ring-amber-400',
    badge: 'text-amber-800 dark:text-amber-200',
  },
  offline: {
    label: 'Offline',
    short: 'Offline',
    dot: 'bg-muted-foreground/45',
    ring: 'ring-muted-foreground/40',
    badge: 'text-muted-foreground',
  },
};
