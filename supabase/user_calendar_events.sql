-- Run in Supabase SQL editor (also in migrations/20250530120000_user_calendar_events.sql)

create table if not exists public.user_calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title text not null,
  description text,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  show_as text not null default 'busy' check (show_as in ('busy', 'free')),
  google_event_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index if not exists user_calendar_events_user_range
  on public.user_calendar_events (user_id, starts_at, ends_at);

alter table public.user_calendar_events enable row level security;

create policy "user_calendar_events_select_own"
  on public.user_calendar_events for select
  using ((auth.jwt() ->> 'sub') = user_id);

create policy "user_calendar_events_insert_own"
  on public.user_calendar_events for insert
  with check ((auth.jwt() ->> 'sub') = user_id);

create policy "user_calendar_events_update_own"
  on public.user_calendar_events for update
  using ((auth.jwt() ->> 'sub') = user_id);

create policy "user_calendar_events_delete_own"
  on public.user_calendar_events for delete
  using ((auth.jwt() ->> 'sub') = user_id);
