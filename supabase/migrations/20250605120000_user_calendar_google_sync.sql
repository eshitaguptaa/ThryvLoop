-- Link ThryvLoop calendar events to Google Calendar for two-way sync

alter table public.user_calendar_events
  add column if not exists google_event_id text;

create index if not exists user_calendar_events_google_event_id
  on public.user_calendar_events (user_id, google_event_id)
  where google_event_id is not null;
