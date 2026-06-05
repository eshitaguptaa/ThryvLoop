# Google Workspace integration

ThryvLoop connects to Google accounts to:

- Sync **Google Calendar** events (meetings, busy/free) and **push ThryvLoop calendar events** to Google
- Detect **in-meeting** status in real time
- Pull **unread Gmail** into the dashboard notifications panel
- Include **meeting minutes** in productive time (focus timer + meetings)

## Database

Run the migration in Supabase SQL editor or CLI:

`supabase/migrations/20250520100000_workspace_integrations.sql`

## Auto-sync when signing in with Google (Clerk)

If users sign in with **Continue with Google** on Clerk, ThryvLoop can link Calendar and Gmail automatically **when Clerk’s Google connection includes the same scopes** as workspace sync.

1. In [Clerk Dashboard](https://dashboard.clerk.com) → **Configure** → **SSO connections** → **Google** → enable **Use custom credentials** (same OAuth client as below is recommended).
2. Under **Scopes**, add:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/userinfo.email`
3. Save. Users who already signed in with Google must **sign out and sign in with Google again** (or revoke the app in Google Account → Security) so Google re-prompts for the new scopes.

If scopes are missing, the app falls back to **Integrations → Connect with Google** (separate consent with refresh token).

On each protected-page load after Google sign-in, the app calls `POST /api/workspace/link-clerk-google` once per browser session.

## OAuth app (Google Cloud Console)

Use one Google Cloud project (e.g. display name **Thryvloop**). The **project number** (e.g. `821180420723`) appears in API error URLs and in your OAuth client id (`{number}-....apps.googleusercontent.com`). Optional env for the UI:

```env
NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT_NAME=Thryvloop
NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT_NUMBER=821180420723
```

1. Create an OAuth 2.0 **Web client** in that project.
2. Authorized redirect URI: `https://YOUR_DOMAIN/api/workspace/callback/google` (and `http://localhost:3000/...` for local dev).
3. Enable APIs in **APIs & Services → Library** (same project as the OAuth client):
   - [Google Calendar API](https://console.cloud.google.com/apis/library/calendar-json.googleapis.com)
   - [Gmail API](https://console.cloud.google.com/apis/library/gmail.googleapis.com)
4. After enabling, wait 1–2 minutes, then use **Sync now** on the Integrations page.
5. Scopes used: `calendar` (read/write), `gmail.readonly`, `userinfo.email`.

## Environment variables

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

WORKSPACE_TOKEN_ENCRYPTION_KEY=

SUPABASE_SERVICE_ROLE_KEY=
```

## User flow

1. User opens **Integrations** (`/settings/integrations`).
2. Clicks **Connect** for Google.
3. After consent, tokens are stored encrypted; an initial sync runs.
4. Home dashboard shows meeting badge, upcoming events, Gmail notifications, and **productive time** (focus + meetings).
5. **Join Google Meet** from the dashboard (`/meet/{eventId}`) for synced events that include a Meet link (re-sync calendar after enabling Meet on events).

Run `supabase/migrations/20250520110000_workspace_calendar_meet_url.sql` after the base workspace migration.

Run `supabase/migrations/20250605120000_user_calendar_google_sync.sql` to link ThryvLoop calendar events with Google Calendar.

**Note:** Existing Google connections only had calendar read access. Users must **disconnect and reconnect** Google (or sign in with Google again via Clerk) to grant write access for pushing events.

## API routes

| Route | Purpose |
|-------|---------|
| `GET /api/workspace/connect/google` | Start Google OAuth |
| `GET /api/workspace/callback/google` | OAuth callback |
| `POST /api/workspace/sync` | Refresh calendar + mail |
| `GET /api/workspace/status` | Meeting state + notifications |
| `GET /api/workspace/meet/[id]` | Join session for a synced calendar event |
| `GET /api/workspace/calendar?start=&end=` | Calendar events for a date range |
| `POST /api/workspace/link-clerk-google` | Link + sync from Clerk Google OAuth (if scopes allow) |
| `POST /api/workspace/disconnect` | Remove connection (`provider: "google"`) |
