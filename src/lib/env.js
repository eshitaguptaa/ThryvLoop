/**
 * Production environment checks. Used by /api/health — does not expose secret values.
 */

const REQUIRED_ALWAYS = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

const RECOMMENDED = [
  'GEMINI_API_KEY',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'WORKSPACE_TOKEN_ENCRYPTION_KEY',
  'CLERK_WEBHOOK_SIGNING_SECRET',
];

function isSet(name) {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0;
}

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function hasAppOrigin() {
  return isSet('NEXT_PUBLIC_APP_URL') || isSet('VERCEL_URL');
}

/**
 * @returns {{ ok: boolean, missing: string[], recommended: string[], appOrigin: boolean }}
 */
export function getEnvHealth() {
  const missing = REQUIRED_ALWAYS.filter((name) => !isSet(name));

  if (isProduction()) {
    if (!hasAppOrigin()) {
      missing.push('NEXT_PUBLIC_APP_URL');
    }
  }

  const recommended = RECOMMENDED.filter((name) => !isSet(name));

  return {
    ok: missing.length === 0,
    missing,
    recommended,
    appOrigin: hasAppOrigin(),
    b2bEnabled: true,
  };
}
