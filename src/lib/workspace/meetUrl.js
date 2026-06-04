/** @param {string} url */
export function isGoogleMeetUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const u = new URL(url);
    return u.hostname === 'meet.google.com';
  } catch {
    return false;
  }
}

/** @param {string} url */
export function normalizeGoogleMeetUrl(url) {
  const u = new URL(url);
  u.hash = '';
  return u.toString();
}

/**
 * @param {{ hangoutLink?: string, conferenceData?: { entryPoints?: Array<{ entryPointType?: string, uri?: string }> } }} event
 * @returns {string | null}
 */
export function extractGoogleMeetUrl(event) {
  const candidates = [];
  if (event.hangoutLink) candidates.push(event.hangoutLink);
  for (const ep of event.conferenceData?.entryPoints || []) {
    if (ep.entryPointType === 'video' && ep.uri) candidates.push(ep.uri);
  }
  for (const raw of candidates) {
    if (isGoogleMeetUrl(raw)) return normalizeGoogleMeetUrl(raw);
  }
  return null;
}

/**
 * @param {{ startsAt: string, endsAt: string, meetUrl?: string | null }} meeting
 * @param {Date} [now]
 */
export function canJoinCalendarMeeting(meeting, now = new Date()) {
  if (!meeting.meetUrl || !isGoogleMeetUrl(meeting.meetUrl)) return false;
  return now.getTime() < new Date(meeting.endsAt).getTime();
}

/** @param {{ title?: string | null, starts_at: string, ends_at: string, meet_url?: string | null }} block */
export function mapCalendarBlockForClient(block) {
  const meetUrl = block.meet_url && isGoogleMeetUrl(block.meet_url) ? block.meet_url : null;
  const startsAt = block.starts_at;
  const endsAt = block.ends_at;
  return {
    id: block.id,
    title: block.title,
    startsAt,
    endsAt,
    meetUrl,
    isOnlineMeeting: Boolean(block.is_online_meeting || meetUrl),
    canJoin: canJoinCalendarMeeting({ startsAt, endsAt, meetUrl }),
    showAs: block.show_as === 'free' ? 'free' : 'busy',
    source: 'google',
    editable: false,
    description: null,
    location: null,
  };
}
