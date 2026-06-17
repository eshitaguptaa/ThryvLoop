import { getEnvHealth } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET() {
  const env = getEnvHealth();

  return Response.json(
    {
      status: env.ok ? 'ok' : 'degraded',
      env: {
        configured: env.ok,
        missing: env.missing,
        recommendedUnset: env.recommended,
        appOrigin: env.appOrigin,
        b2bWorkspaces: env.b2bEnabled,
      },
      build: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || null,
    },
    { status: env.ok ? 200 : 503 }
  );
}
