/** Canonical site URL for SEO, sitemap, and Open Graph. */
export function getSiteUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'https://thryvloop.com';
}

export const SITE_NAME = 'ThryvLoop';

export const SITE_TAGLINE = 'The unified digital workspace for people and companies';

export const DEFAULT_DESCRIPTION =
  'ThryvLoop transforms digital workspaces for companies and individuals—one hub for focus, tasks, calendar, analytics, and ambience. No app-hopping. Measurable productivity gains.';

export const SEO_KEYWORDS = [
  'digital workspace',
  'productivity platform',
  'unified workspace',
  'focus app',
  'deep work',
  'pomodoro timer',
  'task management',
  'workspace analytics',
  'company productivity',
  'single productivity hub',
  'context switching',
  'ambient focus',
  'ThryvLoop',
];
