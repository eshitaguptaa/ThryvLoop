# Google Workspace integration

ThryvLoop connects to Google accounts to:

- Sync **Google Calendar** events (meetings, busy/free) and **push ThryvLoop calendar events** to Google
- Detect **in-meeting** status in real time
- Pull **unread Gmail** into the dashboard notifications panel
- Include **meeting minutes** in productive time (focus timer + meetings)

## Database

Run the migration in Supabase SQL editor or CLI:

`supabase/migrations/20250520100000_workspace_integrations.sql`

## Sign-in vs in-app Calendar / Gmail

**Continue with Google** is for authentication only (name + email). Do **not** request Calendar or Gmail during sign-in or sign-up — that consent screen scares people off.

1. In [Clerk Dashboard](https://dashboard.clerk.com) → **Configure** → **SSO connections** → **Google**.
2. **Development instance:** leave **Use custom credentials** off. Clerk’s shared Google client already has the correct redirect URI.
3. **Production (or custom credentials):** copy Clerk’s **Authorized redirect URI** (`https://<instance>.clerk.accounts.dev/v1/oauth_callback` or `https://accounts.<your-domain>/v1/oauth_callback`) and add it to the Google OAuth client below. Missing this URI is `Error 400: redirect_uri_mismatch` on **Sign in with Google**.
4. Under **Scopes**, keep Clerk defaults only (`email`, `profile`, `openid`). **Remove**:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/gmail.readonly`
5. Save.

New users land with Calendar and Gmail **disconnected**. They connect later from **Settings → Integrations → Connect with Google**, which runs the workspace OAuth flow below and is the only time Google asks for those permissions.

## OAuth app (Google Cloud Console)

Use one Google Cloud project (e.g. display name **Thryvloop**). The **project number** (e.g. `821180420723`) appears in API error URLs and in your OAuth client id (`{number}-....apps.googleusercontent.com`). Optional env for the UI:

```env
NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT_NAME=Thryvloop
NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT_NUMBER=821180420723
```

1. Create an OAuth 2.0 **Web client** in that project.
2. **Authorized JavaScript origins:** `http://localhost:3000` and `https://YOUR_DOMAIN`.
3. **Authorized redirect URIs** (exact match, no trailing slash):
   - `http://localhost:3000/api/workspace/callback/google` (local Calendar/Gmail connect)
   - `https://YOUR_DOMAIN/api/workspace/callback/google` (production Calendar/Gmail connect)
   - Clerk’s SSO callback from step 3 above, if you use custom Google credentials
4. Local `NEXT_PUBLIC_APP_URL` may be your production domain; Connect with Google still uses the localhost callback when you are on localhost. That localhost URI must be listed here.
5. Enable APIs in **APIs & Services → Library** (same project as the OAuth client):
   - [Google Calendar API](https://console.cloud.google.com/apis/library/calendar-json.googleapis.com)
   - [Gmail API](https://console.cloud.google.com/apis/library/gmail.googleapis.com)
6. After enabling, wait 1–2 minutes, then use **Sync now** on the Integrations page.
7. Scopes used: `calendar` (read/write), `gmail.readonly`, `userinfo.email`.

## Environment variables

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

WORKSPACE_TOKEN_ENCRYPTION_KEY=

SUPABASE_SERVICE_ROLE_KEY=
```

## User flow

1. User signs up / signs in (Google or email). Calendar and Gmail stay **disconnected**.
2. Later they open **Integrations** (`/settings/integrations`) and click **Connect with Google**.
3. Google then asks for Calendar and Gmail access. After consent, tokens are stored encrypted; an initial sync runs.
4. Home dashboard shows meeting badge, upcoming events, Gmail notifications, and **productive time** (focus + meetings).
5. **Join Google Meet** from the dashboard (`/meet/{eventId}`) for synced events that include a Meet link (re-sync calendar after enabling Meet on events).

Run `supabase/migrations/20250520110000_workspace_calendar_meet_url.sql` after the base workspace migration.

Run `supabase/migrations/20250605120000_user_calendar_google_sync.sql` to link ThryvLoop calendar events with Google Calendar.

**Note:** Existing Google connections only had calendar read access. Users must **disconnect and reconnect** Google from Integrations to grant write access for pushing events.

## API routes

| Route | Purpose |
|-------|---------|
| `GET /api/workspace/connect/google` | Start Google OAuth |
| `GET /api/workspace/callback/google` | OAuth callback |
| `POST /api/workspace/sync` | Refresh calendar + mail |
| `GET /api/workspace/status` | Meeting state + notifications |
| `GET /api/workspace/meet/[id]` | Join session for a synced calendar event |
| `GET /api/workspace/calendar?start=&end=` | Calendar events for a date range |
| `POST /api/workspace/disconnect` | Remove connection (`provider: "google"`) |
