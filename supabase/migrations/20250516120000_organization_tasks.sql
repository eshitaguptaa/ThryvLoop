-- Workspace tasks: admins assign to members; members update status; org-scoped RLS.

create table if not exists public.organization_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  title text not null,
  description text,
  category text not null default 'General',
  column_key text not null default 'todo' check (column_key in ('todo', 'in_progress', 'done')),
  assignee_user_id text not null,
  created_by_user_id text not null,
  due_date timestamptz,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organization_tasks_org_idx on public.organization_tasks (organization_id);
create index if not exists organization_tasks_assignee_idx on public.organization_tasks (assignee_user_id);
create index if not exists organization_tasks_column_idx on public.organization_tasks (organization_id, column_key);

alter table public.organization_tasks enable row level security;

drop policy if exists "organization_tasks_select_member" on public.organization_tasks;
drop policy if exists "organization_tasks_insert_admin" on public.organization_tasks;
drop policy if exists "organization_tasks_update_admin" on public.organization_tasks;
drop policy if exists "organization_tasks_update_assignee" on public.organization_tasks;
drop policy if exists "organization_tasks_delete_admin" on public.organization_tasks;

-- All active org members can view workspace tasks
create policy "organization_tasks_select_member"
  on public.organization_tasks
  for select
  to authenticated
  using (public.user_is_active_org_member (organization_id));

-- Admins create assignments
create policy "organization_tasks_insert_admin"
  on public.organization_tasks
  for insert
  to authenticated
  with check (
    public.user_is_org_admin (organization_id)
    and created_by_user_id = (select auth.jwt() ->> 'sub')
  );

-- Admins manage any task in the org
create policy "organization_tasks_update_admin"
  on public.organization_tasks
  for update
  to authenticated
  using (public.user_is_org_admin (organization_id))
  with check (public.user_is_org_admin (organization_id));

-- Assignees can update their own tasks (status, completion, etc.)
create policy "organization_tasks_update_assignee"
  on public.organization_tasks
  for update
  to authenticated
  using (
    public.user_is_active_org_member (organization_id)
    and assignee_user_id = (select auth.jwt() ->> 'sub')
  )
  with check (
    public.user_is_active_org_member (organization_id)
    and assignee_user_id = (select auth.jwt() ->> 'sub')
  );

-- Admins delete tasks
create policy "organization_tasks_delete_admin"
  on public.organization_tasks
  for delete
  to authenticated
  using (public.user_is_org_admin (organization_id));

grant select, insert, update, delete on public.organization_tasks to authenticated;
