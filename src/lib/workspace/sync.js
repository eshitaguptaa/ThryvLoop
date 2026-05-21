import { createSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getValidAccessToken, markSynced, setSyncError } from '@/lib/workspace/connections';
import { formatGoogleApiError } from '@/lib/workspace/googleApiErrors';
import { extractGoogleMeetUrl } from '@/lib/workspace/meetUrl';

const GMAIL_RETRY_MS = 2500;
const GMAIL_RETRY_ATTEMPTS = 3;

function rangeForSync() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 14);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setDate(end.getDate() + 42);
  end.setHours(23, 59, 59, 999);
  return { start, end, now };
}

/** @param {string} userId */
export async function syncUserWorkspaces(userId) {
  const supabase = createSupabaseAdmin();
  const { data: connections } = await supabase
    .from('workspace_connections')
    .select('provider')
    .eq('user_id', userId);
  const results = [];
  for (const { provider } of connections || []) {
    try {
      if (provider !== 'google') continue;
      const outcome = await syncGoogle(userId);
      if (outcome.errors.length) {
        await setSyncError(userId, provider, outcome.errors.join(' '));
        results.push({
          provider,
          ok: false,
          error: outcome.errors.join(' '),
          calendarOk: outcome.calendarOk,
          gmailOk: outcome.gmailOk,
        });
      } else {
        await markSynced(userId, provider);
        results.push({ provider, ok: true, calendarOk: true, gmailOk: true });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sync failed';
      await setSyncError(userId, provider, msg);
      results.push({ provider, ok: false, error: msg });
    }
  }
  return results;
}

/** @param {string} userId @param {string} token */
async function syncGoogleCalendar(userId, token) {
  const { start, end } = rangeForSync();
  const supabase = createSupabaseAdmin();
  const calParams = new URLSearchParams({
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
    conferenceDataVersion: '1',
  });
  const calRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${calParams}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const calJson = await calRes.json();
  if (!calRes.ok) {
    throw new Error(formatGoogleApiError(calJson, 'Google Calendar fetch failed'));
  }

  const blocks = (calJson.items || [])
    .filter((ev) => ev.start?.dateTime && ev.end?.dateTime)
    .map((ev) => {
      const meetUrl = extractGoogleMeetUrl(ev);
      return {
        user_id: userId,
        provider: 'google',
        external_id: ev.id,
        title: ev.summary || '(No title)',
        starts_at: ev.start.dateTime,
        ends_at: ev.end.dateTime,
        is_online_meeting: Boolean(meetUrl || ev.hangoutLink || ev.conferenceData),
        meet_url: meetUrl,
        show_as: ev.transparency === 'transparent' ? 'free' : 'busy',
        synced_at: new Date().toISOString(),
      };
    });

  if (blocks.length) {
    await supabase.from('workspace_calendar_blocks').upsert(blocks, {
      onConflict: 'user_id,provider,external_id',
    });
  }
}

async function fetchGmailList(token) {
  const gmailRes = await fetch(
    'https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=15&q=is:unread newer_than:7d',
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const gmailList = await gmailRes.json();
  return { ok: gmailRes.ok, body: gmailList };
}

/** @param {string} userId @param {string} token */
async function syncGoogleGmail(userId, token) {
  const supabase = createSupabaseAdmin();
  let lastBody = null;
  for (let attempt = 0; attempt < GMAIL_RETRY_ATTEMPTS; attempt++) {
    const { ok, body } = await fetchGmailList(token);
    lastBody = body;
    if (ok) {
      await upsertGmailNotifications(userId, token, body, supabase);
      return;
    }
    const retryable =
      body?.error?.errors?.[0]?.reason === 'accessNotConfigured' ||
      (body?.error?.message || '').includes('has not been used');
    if (!retryable || attempt === GMAIL_RETRY_ATTEMPTS - 1) {
      throw new Error(formatGoogleApiError(body, 'Gmail fetch failed'));
    }
    await new Promise((r) => setTimeout(r, GMAIL_RETRY_MS));
  }
  throw new Error(formatGoogleApiError(lastBody, 'Gmail fetch failed'));
}

async function upsertGmailNotifications(userId, token, gmailList, supabase) {

  const notifications = [];
  for (const item of (gmailList?.messages || []).slice(0, 10)) {
    const msgRes = await fetch(
      `https://www.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const msg = await msgRes.json();
    if (!msgRes.ok) continue;
    const headers = msg.payload?.headers || [];
    const subject = headers.find((h) => h.name === 'Subject')?.value || '(No subject)';
    const from = headers.find((h) => h.name === 'From')?.value || '';
    const received = msg.internalDate
      ? new Date(parseInt(msg.internalDate, 10)).toISOString()
      : new Date().toISOString();
    notifications.push({
      user_id: userId,
      provider: 'google',
      source: 'gmail',
      external_id: item.id,
      subject,
      preview: from.slice(0, 200),
      received_at: received,
      is_read: false,
      link_url: `https://mail.google.com/mail/u/0/#inbox/${item.id}`,
      synced_at: new Date().toISOString(),
    });
  }
  if (notifications.length) {
    await supabase.from('workspace_notifications').upsert(notifications, {
      onConflict: 'user_id,provider,external_id',
    });
  }
}

/** @param {string} userId */
async function syncGoogle(userId) {
  const token = await getValidAccessToken(userId, 'google');
  if (!token) return { calendarOk: false, gmailOk: false, errors: ['No Google token'] };

  const errors = [];
  let calendarOk = false;
  let gmailOk = false;
  try {
    await syncGoogleCalendar(userId, token);
    calendarOk = true;
  } catch (err) {
    errors.push(err instanceof Error ? err.message : 'Calendar sync failed');
  }
  try {
    await syncGoogleGmail(userId, token);
    gmailOk = true;
  } catch (err) {
    errors.push(err instanceof Error ? err.message : 'Gmail sync failed');
  }
  return { calendarOk, gmailOk, errors };
}
