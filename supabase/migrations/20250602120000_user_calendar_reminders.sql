-- Optional reminder offset (minutes before start) for ThryvLoop calendar events

alter table public.user_calendar_events
  add column if not exists remind_before_minutes integer
  check (remind_before_minutes is null or (remind_before_minutes >= 1 and remind_before_minutes <= 120));
