import { appendFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * DEV ONLY: collects sign-in breadcrumbs from AuthModal (navigator.sendBeacon) into
 * .next/auth-trail.log so OAuth problems can be diagnosed from any browser profile.
 * Returns 404 in production.
 */
export async function POST(req) {
  if (process.env.NODE_ENV === 'production') {
    return new Response('Not found', { status: 404 });
  }
  try {
    const text = (await req.text()).slice(0, 2000);
    const ua = (req.headers.get('user-agent') || '').slice(0, 160);
    const line = `${new Date().toISOString()} ${text} ua=${JSON.stringify(ua)}\n`;
    await appendFile(path.join(process.cwd(), '.next', 'auth-trail.log'), line);
  } catch {
    /* ignore */
  }
  return new Response(null, { status: 204 });
}
