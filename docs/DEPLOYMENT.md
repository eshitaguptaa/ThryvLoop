# Deployment checklist

Use this when deploying ThryvLoop to Vercel (or similar).

## 1. Prerequisites

- Node.js **20+**
- Vercel project linked to this repo
- Production accounts: Clerk, Supabase, Google Cloud, Gemini API, Resend (if B2B waitlist)

## 2. Environment variables

Copy `.env.example` into Vercel → **Settings → Environment Variables**.

### Required (all deployments)

| Variable | Notes |
|----------|--------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Production: `pk_live_...` |
| `CLERK_SECRET_KEY` | Production: `sk_live_...` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/signin` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/signup` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/home` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | `/home` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only — never expose to client |
| `NEXT_PUBLIC_APP_URL` | Canonical URL, e.g. `https://app.thryvloop.com` |

### Required for AI (ThryvBot)

| Variable | Notes |
|----------|--------|
| `GEMINI_API_KEY` | Google AI Studio API key |

Optional tuning: `GEMINI_MODEL`, `GEMINI_REQUESTS_PER_MINUTE`, `GEMINI_REQUESTS_PER_DAY`, `GEMINI_API_CALLS_PER_MINUTE`.

### Required for Calendar / Gmail

| Variable | Notes |
|----------|--------|
| `GOOGLE_CLIENT_ID` | OAuth web client |
| `GOOGLE_CLIENT_SECRET` | OAuth secret |
| `WORKSPACE_TOKEN_ENCRYPTION_KEY` | Random string, 32+ characters |

See [WORKSPACE_INTEGRATIONS.md](./WORKSPACE_INTEGRATIONS.md) for Google Cloud Console steps.

### Recommended

| Variable | Notes |
|----------|--------|
| `CLERK_WEBHOOK_SIGNING_SECRET` | Org sync / B2B — webhook URL: `https://YOUR_DOMAIN/api/webhooks/clerk` |

### B2B only (`NEXT_PUBLIC_ENABLE_B2B_WORKSPACES=true`)

| Variable | Notes |
|----------|--------|
| `RESEND_API_KEY` | Email provider |
| `TEAMS_NOTIFY_TO` | Inbox for waitlist signups |
| `TEAMS_NOTIFY_FROM` | Verified sender domain |

## 3. Supabase migrations

Run every file in `supabase/migrations/` in order on your **production** Supabase project:

```bash
# With Supabase CLI (if linked)
supabase db push
```

Or paste each migration into the Supabase SQL editor.

## 4. Clerk production setup

1. Switch to **Production** instance in Clerk dashboard.
2. **JWT Templates** → create template named `supabase` (required for RLS client access).
3. **Webhooks** → endpoint `https://YOUR_DOMAIN/api/webhooks/clerk`, events: user/org as needed.
4. **Google SSO** — add Calendar/Gmail scopes per [WORKSPACE_INTEGRATIONS.md](./WORKSPACE_INTEGRATIONS.md).

## 5. Google OAuth

In Google Cloud Console → OAuth client → **Authorized redirect URIs**:

```
https://YOUR_DOMAIN/api/workspace/callback/google
```

For local dev:

```
http://localhost:3000/api/workspace/callback/google
```

## 6. Deploy on Vercel

1. Import repo → Framework preset: **Next.js**
2. Add all env vars (Production environment)
3. Deploy

`vercel.json` sets longer timeouts for sync and AI routes. Hobby plan may cap `maxDuration` at 10s — upgrade to Pro if sync times out.

## 7. Post-deploy verification

```bash
curl https://YOUR_DOMAIN/api/health
```

Expect:

```json
{
  "status": "ok",
  "env": { "configured": true, "missing": [], ... }
}
```

Manual smoke test:

- [ ] Sign up / sign in
- [ ] Tasks, calendar, focus timer load
- [ ] ThryvBot sends a message
- [ ] Google integration connect (if enabled)
- [ ] Dark/light theme persists

## 8. Preview deployments

Preview URLs use `VERCEL_URL` when `NEXT_PUBLIC_APP_URL` is unset. Google OAuth redirect URIs are domain-specific — use a separate OAuth client for previews or test OAuth on production/staging only.

## 9. Rate limiting note

API rate limits use in-memory counters (per serverless instance). For strict production limits, migrate to [Vercel KV](https://vercel.com/docs/storage/vercel-kv) or Upstash Redis.

## 10. Security

- Never commit `.env.local` or live keys.
- `SUPABASE_SERVICE_ROLE_KEY` and `CLERK_SECRET_KEY` are server-only.
- B2C launch: keep `NEXT_PUBLIC_ENABLE_B2B_WORKSPACES=false` until Teams is ready.
