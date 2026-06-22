import { createSupabaseAdmin } from '@/lib/supabaseAdmin';
import { checkRateLimit } from '@/lib/security/rateLimit';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function sendNotifyEmail(subscriberEmail) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, reason: 'missing_api_key' };
  }

  const to = process.env.TEAMS_NOTIFY_TO?.trim();
  if (!to) {
    return { ok: false, reason: 'missing_notify_to' };
  }

  const from = process.env.TEAMS_NOTIFY_FROM || 'ThryvLoop <onboarding@resend.dev>';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: subscriberEmail,
      subject: 'ThryvLoop Company Hubs waitlist signup',
      html: `
        <p>Someone signed up for Company Hubs early access on the ThryvLoop landing page.</p>
        <p><strong>Email:</strong> ${subscriberEmail}</p>
        <p><em>${new Date().toISOString()}</em></p>
      `,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error('[teams-notify] Resend failed:', detail);
    return { ok: false, reason: 'send_failed' };
  }

  return { ok: true };
}

async function saveToWaitlist(email) {
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from('teams_waitlist').upsert(
    { email },
    { onConflict: 'email' }
  );
  if (error) {
    console.error('[teams-notify] Supabase insert failed:', error);
    return false;
  }
  return true;
}

export async function POST(request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const rate = checkRateLimit(`teams-notify:${ip}`, { limit: 5, windowMs: 3_600_000 });
  if (!rate.allowed) {
    return Response.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const email = String(body.email || '').trim().toLowerCase();
  if (!isValidEmail(email)) {
    return Response.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  const saved = await saveToWaitlist(email);
  const sent = await sendNotifyEmail(email);

  if (sent.ok) {
    return Response.json({
      ok: true,
      message: "You're on the list! We'll notify you when Company Hubs launch.",
    });
  }

  if (sent.reason === 'missing_api_key' && saved) {
    return Response.json({
      ok: true,
      message: "You're on the list! We'll notify you when Company Hubs launch.",
    });
  }

  if (saved) {
    return Response.json({
      ok: true,
      message: "You're on the list! We'll notify you when Company Hubs launch.",
    });
  }

  return Response.json(
    { error: 'Something went wrong. Please try again.' },
    { status: 502 }
  );
}
