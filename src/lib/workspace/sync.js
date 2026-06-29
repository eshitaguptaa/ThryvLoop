import { createSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getValidAccessToken, markSynced, setSyncError } from '@/lib/workspace/connections';
import {
  formatGoogleApiError,
  isGoogleScopeDeniedBody,
  isGoogleScopeDeniedMessage,
} from '@/lib/workspace/googleApiErrors';
import {
  hasGoogleCalendarAccessScope,
  hasGoogleGmailScope,
} from '@/lib/workspace/oauth';
import { isAuthWorkspaceError } from '@/lib/workspace/userMessages';
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

function isHardSyncError(message) {
  if (!message) return false;
  if (isGoogleScopeDeniedMessage(message)) return false;
  if (isAuthWorkspaceError(message)) return false;
  if (message === 'No Google token') return false;
  return true;
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
      const hardErrors = outcome.errors.filter(isHardSyncError);

      if (hardErrors.length) {
        await setSyncError(userId, provider, hardErrors.join(' '));
        results.push({
          provider,
          ok: false,
          error: hardErrors.join(' '),
          calendarOk: outcome.calendarOk,
          gmailOk: outcome.gmailOk,
          calendarGranted: outcome.calendarGranted,
          gmailGranted: outcome.gmailGranted,
        });
      } else {
        await markSynced(userId, provider);
        results.push({
          provider,
          ok: true,
          calendarOk: outcome.calendarOk,
          gmailOk: outcome.gmailOk,
          calendarGranted: outcome.calendarGranted,
          gmailGranted: outcome.gmailGranted,
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sync failed';
      if (isHardSyncError(msg)) {
        await setSyncError(userId, provider, msg);
        results.push({ provider, ok: false, error: msg });
      } else {
        await markSynced(userId, provider);
        results.push({ provider, ok: true, calendarOk: false, gmailOk: false });
      }
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
    if (isGoogleScopeDeniedBody(calJson)) {
      return { ok: false, scopeDenied: true };
    }
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

  const fetchedIds = new Set(blocks.map((b) => b.external_id));

  const { data: cachedInRange, error: cachedError } = await supabase
    .from('workspace_calendar_blocks')
    .select('external_id')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .gt('ends_at', start.toISOString())
    .lt('starts_at', end.toISOString());

  if (!cachedError && cachedInRange?.length) {
    const staleIds = cachedInRange
      .map((row) => row.external_id)
      .filter((id) => id && !fetchedIds.has(id));
    if (staleIds.length) {
      await supabase
        .from('workspace_calendar_blocks')
        .delete()
        .eq('user_id', userId)
        .eq('provider', 'google')
        .in('external_id', staleIds);
    }
  }

  if (blocks.length) {
    await supabase.from('workspace_calendar_blocks').upsert(blocks, {
      onConflict: 'user_id,provider,external_id',
    });
  }

  return { ok: true, scopeDenied: false };
}

async function fetchGmailList(token) {
  const gmailRes = await fetch(
    'https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=15&q=is:unread+is:important+newer_than:7d',
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const gmailList = await gmailRes.json();
  return { ok: gmailRes.ok, body: gmailList, status: gmailRes.status };
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
      return { ok: true, scopeDenied: false };
    }
    if (isGoogleScopeDeniedBody(body)) {
      return { ok: false, scopeDenied: true };
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
  const messageItems = (gmailList?.messages || []).slice(0, 15);
  const nowIso = new Date().toISOString();

  if (!messageItems.length) {
    await supabase
      .from('workspace_notifications')
      .update({ is_read: true, synced_at: nowIso })
      .eq('user_id', userId)
      .eq('source', 'gmail')
      .eq('is_read', false);
    return;
  }

  const fetched = await Promise.all(
    messageItems.map(async (item) => {
      const msgRes = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const msg = await msgRes.json();
      if (!msgRes.ok) return null;

      const headers = msg.payload?.headers || [];
      const subject = headers.find((h) => h.name === 'Subject')?.value || '(No subject)';
      const from = headers.find((h) => h.name === 'From')?.value || '';
      const internalDateMs = msg.internalDate ? parseInt(msg.internalDate, 10) : Date.now();
      const received = new Date(internalDateMs).toISOString();
      const isUnread = Array.isArray(msg.labelIds) ? msg.labelIds.includes('UNREAD') : true;
      const isImportant = Array.isArray(msg.labelIds) ? msg.labelIds.includes('IMPORTANT') : false;
      if (!isUnread || !isImportant) return null;

      return {
        user_id: userId,
        provider: 'google',
        source: 'gmail',
        external_id: item.id,
        subject,
        preview: from.slice(0, 200),
        received_at: received,
        is_read: !isUnread,
        link_url: `https://mail.google.com/mail/u/0/#inbox/${item.id}`,
        synced_at: nowIso,
        internalDateMs,
      };
    })
  );

  const sorted = fetched
    .filter(Boolean)
    .sort((a, b) => b.internalDateMs - a.internalDateMs)
    .slice(0, 10);

  const notifications = sorted.map(({ internalDateMs, ...row }) => row);
  const syncedIds = notifications.map((n) => n.external_id);

  if (notifications.length) {
    await supabase.from('workspace_notifications').upsert(notifications, {
      onConflict: 'user_id,provider,external_id',
    });
  }

  let markReadQuery = supabase
    .from('workspace_notifications')
    .update({ is_read: true, synced_at: nowIso })
    .eq('user_id', userId)
    .eq('source', 'gmail')
    .eq('is_read', false);

  if (syncedIds.length > 0) {
    markReadQuery = markReadQuery.not('external_id', 'in', `(${syncedIds.join(',')})`);
  }

  await markReadQuery;

  const staleBefore = new Date();
  staleBefore.setDate(staleBefore.getDate() - 14);
  await supabase
    .from('workspace_notifications')
    .delete()
    .eq('user_id', userId)
    .eq('source', 'gmail')
    .eq('is_read', true)
    .lt('received_at', staleBefore.toISOString());
}

/** @param {string} userId */
async function syncGoogle(userId) {
  const supabase = createSupabaseAdmin();
  const { data: conn } = await supabase
    .from('workspace_connections')
    .select('scopes')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .maybeSingle();

  const scopes = conn?.scopes || [];
  let calendarGranted = hasGoogleCalendarAccessScope(scopes);
  let gmailGranted = hasGoogleGmailScope(scopes);

  const token = await getValidAccessToken(userId, 'google');
  if (!token) {
    return {
      calendarOk: false,
      gmailOk: false,
      calendarGranted,
      gmailGranted,
      errors: ['No Google token'],
    };
  }

  const errors = [];
  let calendarOk = false;
  let gmailOk = false;

  if (calendarGranted) {
    try {
      const result = await syncGoogleCalendar(userId, token);
      if (result.scopeDenied) {
        calendarGranted = false;
      } else {
        calendarOk = true;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Calendar sync failed';
      if (isHardSyncError(msg)) errors.push(msg);
    }
  }

  if (gmailGranted) {
    try {
      const result = await syncGoogleGmail(userId, token);
      if (result.scopeDenied) {
        gmailGranted = false;
      } else {
        gmailOk = true;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gmail sync failed';
      if (isHardSyncError(msg)) errors.push(msg);
    }
  }

  return {
    calendarOk,
    gmailOk,
    calendarGranted,
    gmailGranted,
    errors,
  };
}
