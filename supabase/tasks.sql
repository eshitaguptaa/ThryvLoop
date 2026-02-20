-- Tasks table for user task management
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title text not null,
  category text,
  column_key text not null default 'backlog',
  assigned_users jsonb,
  due_date timestamptz,
  priority jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

-- Users can only read/write their own tasks.
create policy "tasks_select_own"
  on public.tasks
  for select
  using ((auth.jwt() ->> 'sub') = user_id);

create policy "tasks_insert_own"
  on public.tasks
  for insert
  with check ((auth.jwt() ->> 'sub') = user_id);

create policy "tasks_update_own"
  on public.tasks
  for update
  using ((auth.jwt() ->> 'sub') = user_id)
  with check ((auth.jwt() ->> 'sub') = user_id);

create policy "tasks_delete_own"
  on public.tasks
  for delete
  using ((auth.jwt() ->> 'sub') = user_id);
