-- Focus sessions log for analytics (sessions completed over time, peak hours, etc.)
create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  started_at timestamptz not null,
  completed_at timestamptz not null,
  duration_seconds integer not null,
  phase text not null default 'session',
  mode text not null default 'pomodoro',
  created_at timestamptz not null default now(),
  -- Productivity integrity (also in migrations/20260406120000_focus_session_integrity.sql)
  task_id uuid null,
  active_seconds integer null,
  is_credited boolean not null default false,
  integrity_flags jsonb not null default '{}'::jsonb
);

create index if not exists focus_sessions_user_completed on public.focus_sessions (user_id, completed_at desc);

alter table public.focus_sessions enable row level security;

create policy "focus_sessions_select_own"
  on public.focus_sessions for select
  using ((auth.jwt() ->> 'sub') = user_id);

create policy "focus_sessions_insert_own"
  on public.focus_sessions for insert
  with check ((auth.jwt() ->> 'sub') = user_id);

-- Optional: allow delete for GDPR / account cleanup
create policy "focus_sessions_delete_own"
  on public.focus_sessions for delete
  using ((auth.jwt() ->> 'sub') = user_id);
