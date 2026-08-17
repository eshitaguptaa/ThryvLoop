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
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/?auth=signin` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/?auth=signup` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | `/home` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | `/home` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only — never expose to client |
| `NEXT_PUBLIC_APP_URL` | Canonical URL, e.g. `https://www.thryvloop.com` |

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
| `RESEND_API_KEY` | Sends branded workspace invite emails (and waitlist) |
| `INVITE_EMAIL_FROM` | Verified sender, e.g. `ThryvLoop <invites@thryvloop.com>` |
| `TEAMS_NOTIFY_TO` | Inbox for waitlist signups |
| `TEAMS_NOTIFY_FROM` | Verified sender for waitlist (fallback invite from-address) |

## 3. Supabase migrations

Run every file in `supabase/migrations/` in order on your **production** Supabase project:

```bash
# With Supabase CLI (if linked)
supabase db push
```

Or paste each migration into the Supabase SQL editor.

## 4. Clerk production setup

1. In Clerk dashboard header, click **Development** → **Go to prod** → create Production instance.
2. Enter domain **`thryvloop.com`** (Clerk accepts apex; `www` works as a subdomain).
3. Add Clerk’s DNS records at your domain registrar (Hostinger etc.) → wait until **Developers → Domains** shows verified.
4. Switch to **Production** instance, then **Developers → API keys** → copy `pk_live_...` and `sk_live_...` into Vercel (Production env only).
5. **JWT Templates** → create template named `supabase` (required for RLS client access).
6. **Developers → Webhooks** → endpoint `https://www.thryvloop.com/api/webhooks/clerk`, events:
   - `organization.created`, `organization.updated`, `organization.deleted`
   - `organizationMembership.created`, `organizationMembership.updated`, `organizationMembership.deleted`
7. **Organizations → Settings** → Organizations **enabled**.
8. **Developers → Paths** (Production instance):
   - Fallback development host: `http://localhost:3000` (for local dev against prod keys if needed)
   - Home URL: `/home`
   - Sign-in (development host): `/?auth=signin`
   - Sign-up (development host): `/?auth=signup`
9. **User & authentication → SSO connections → Google** — profile/email only. Calendar/Gmail are in-app; see [WORKSPACE_INTEGRATIONS.md](./WORKSPACE_INTEGRATIONS.md).
10. **Re-create workspaces and re-invite members** after switching to Production — Development orgs/users do not carry over.

> Clerk no longer shows “Allowed redirect URLs” on Paths. Workspace invites pass `redirectUrl` from the app (`/o/[slug]?from_invite=1`). Production keys require your verified domain; Development keys + `thryvloop.com` redirects will drop users on the landing page without joining.

### thryvloop.com go-live (ordered)

1. Run Supabase migrations on production project.
2. Create Clerk **Production** instance + verify domain DNS.
3. Set Vercel **Production** env vars (see §2) — especially `pk_live_`, `sk_live_`, `NEXT_PUBLIC_APP_URL=https://www.thryvloop.com`, `NEXT_PUBLIC_ENABLE_B2B_WORKSPACES=true`.
4. Push to `master` (GitHub → Vercel auto-deploy) or run `vercel --prod` after `vercel login`.
5. Add Google OAuth redirect: `https://www.thryvloop.com/api/workspace/callback/google`.
6. Create a **new** workspace in Production, **Resend** invites (old Development invites are invalid).
7. Smoke test: invite → email link → `/o/...` join → member appears under People.

## 5. Google OAuth

In Google Cloud Console → OAuth client → **Authorized redirect URIs** (exact, no trailing slash):

```
http://localhost:3000/api/workspace/callback/google
https://YOUR_DOMAIN/api/workspace/callback/google
```

If Clerk Google SSO uses **custom credentials**, also add the URI shown in Clerk → SSO connections → Google (typically `https://<instance>.clerk.accounts.dev/v1/oauth_callback`). Development Clerk instances should use Clerk’s shared credentials instead.

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
- [ ] B2B: send workspace invite → invitee joins via email link

## 8. Preview deployments

Preview URLs use `VERCEL_URL` when `NEXT_PUBLIC_APP_URL` is unset. Google OAuth redirect URIs are domain-specific — use a separate OAuth client for previews or test OAuth on production/staging only.

## 9. Rate limiting note

API rate limits use in-memory counters (per serverless instance). For strict production limits, migrate to [Vercel KV](https://vercel.com/docs/storage/vercel-kv) or Upstash Redis.

## 10. Security

- Never commit `.env.local` or live keys.
- `SUPABASE_SERVICE_ROLE_KEY` and `CLERK_SECRET_KEY` are server-only.
- Team workspaces are on unless `NEXT_PUBLIC_ENABLE_B2B_WORKSPACES=false` (rebuild after changing it).
