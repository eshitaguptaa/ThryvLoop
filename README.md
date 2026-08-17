# ThryvLoop

Productivity workspace with focus timer, tasks, calendar, analytics, and ThryvBot AI assistant.

## Stack

- **Next.js 16** (App Router)
- **Clerk** — authentication
- **Supabase** — database & user preferences
- **Google Gemini** — ThryvBot AI
- **Google Workspace OAuth** — Calendar & Gmail sync

## Local development

1. **Requirements:** Node.js 20+

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment**

   ```bash
   cp .env.example .env.local
   ```

   Fill in Clerk, Supabase, Gemini, and Google OAuth values. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full checklist.

4. **Database**

   Apply every SQL file in `supabase/migrations/` to your Supabase project (SQL editor or Supabase CLI).

5. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

6. **Validate env** (optional before deploy)

   ```bash
   npm run validate:env
   ```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run validate:env` | Check required env vars |

## Deployment

Deploy to [Vercel](https://vercel.com) (recommended) or any Node.js host that supports Next.js.

**Before going live:**

1. Copy all variables from `.env.example` into your host’s environment.
2. Use **production** Clerk keys (`pk_live_` / `sk_live_`).
3. Set `NEXT_PUBLIC_APP_URL` to your canonical domain (e.g. `https://app.thryvloop.com`).
4. Run Supabase migrations on your production database.
5. Configure Clerk JWT template `supabase` and webhook → `/api/webhooks/clerk`.
6. Add Google OAuth redirect URI: `https://YOUR_DOMAIN/api/workspace/callback/google`.

Full step-by-step guide: **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**

After deploy, verify: `GET /api/health` should return `{ "status": "ok" }`.

## Feature flags

| Variable | Default | Effect |
|----------|---------|--------|
| `NEXT_PUBLIC_ENABLE_B2B_WORKSPACES` | `true` | Set to `false` to hide Teams/workspaces routes |

## Docs

- [Deployment checklist](docs/DEPLOYMENT.md)
- [Google Workspace integration](docs/WORKSPACE_INTEGRATIONS.md)

## CI

GitHub Actions runs `lint` and `build` on push/PR to `main` (see `.github/workflows/ci.yml`).
