export const INVITE_JOIN_STORAGE_KEY = 'thryvloop-invite-join';
export const INVITE_JOINED_STORAGE_KEY = 'thryvloop-invite-joined';

export function buildInviteJoinPath(slug, email) {
  const params = new URLSearchParams({ from_invite: '1' });
  if (email) params.set('invite_email', String(email).trim().toLowerCase());
  return `/o/${encodeURIComponent(slug)}?${params.toString()}`;
}

export function rememberInviteJoin({ slug, email, name, resume = false }) {
  if (typeof window === 'undefined' || !slug) return;
  const normalizedEmail = String(email || '').trim().toLowerCase();
  sessionStorage.setItem(
    INVITE_JOIN_STORAGE_KEY,
    JSON.stringify({
      slug,
      email: normalizedEmail,
      name: name || '',
      path: buildInviteJoinPath(slug, normalizedEmail),
      resume: Boolean(resume),
    }),
  );
}

export function markInviteJoinResume() {
  const current = peekInviteJoin();
  if (!current?.slug) return;
  rememberInviteJoin({ ...current, resume: true });
}

export function peekInviteJoinPath() {
  const value = peekInviteJoin();
  if (!value?.resume || !value.path) return null;
  return value.path;
}

export function peekInviteJoin() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(INVITE_JOIN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function markInviteJustJoined({ slug, name }) {
  if (typeof window === 'undefined' || !slug) return;
  sessionStorage.setItem(
    INVITE_JOINED_STORAGE_KEY,
    JSON.stringify({ slug, name: name || '' }),
  );
}

export function peekInviteJustJoined() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(INVITE_JOINED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearInviteJustJoined() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(INVITE_JOINED_STORAGE_KEY);
}

export function markInviteWrongEmail() {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem('thryvloop-invite-wrong-email', '1');
}

export function consumeInviteWrongEmail() {
  if (typeof window === 'undefined') return false;
  const value = sessionStorage.getItem('thryvloop-invite-wrong-email') === '1';
  sessionStorage.removeItem('thryvloop-invite-wrong-email');
  return value;
}

export function clearInviteJoin() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(INVITE_JOIN_STORAGE_KEY);
}

export function invitedEmailFromPath(path) {
  if (!path || typeof path !== 'string') return '';
  try {
    const url = new URL(path, 'https://www.thryvloop.com');
    return String(url.searchParams.get('invite_email') || '').trim().toLowerCase();
  } catch {
    return '';
  }
}

export function userHasInviteEmail(user, email) {
  const wanted = String(email || '').trim().toLowerCase();
  if (!wanted || !user) return false;
  const addresses = user.emailAddresses || [];
  return addresses.some(
    (entry) => String(entry.emailAddress || '').toLowerCase() === wanted,
  );
}
