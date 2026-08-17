-- Focus session productivity integrity: task-linked credit + active time.
-- Safe to re-run.

alter table public.focus_sessions
  add column if not exists task_id uuid null,
  add column if not exists active_seconds integer null,
  add column if not exists is_credited boolean not null default false,
  add column if not exists integrity_flags jsonb not null default '{}'::jsonb;

comment on column public.focus_sessions.task_id is
  'Personal task pinned during this focus chunk; required for credited productivity.';
comment on column public.focus_sessions.active_seconds is
  'Attentive seconds (excludes idle/tab-hidden); defaults to duration_seconds when null.';
comment on column public.focus_sessions.is_credited is
  'True when chunk counts toward verified productivity (task linked + min active time).';
comment on column public.focus_sessions.integrity_flags is
  'e.g. { "no_task": true, "tab_hidden_pause": true, "idle_prompt": true }';

create index if not exists focus_sessions_user_credited
  on public.focus_sessions (user_id, completed_at desc)
  where (is_credited = true);

create index if not exists focus_sessions_user_task
  on public.focus_sessions (user_id, task_id)
  where (task_id is not null);
