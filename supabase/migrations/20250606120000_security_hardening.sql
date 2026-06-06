-- Security hardening: hide OAuth tokens from client queries, tighten org task visibility

-- 1) workspace_connections: clients use workspace_connections_public view only
drop policy if exists "workspace_connections_select_own" on public.workspace_connections;

revoke all on table public.workspace_connections from authenticated;

create or replace view public.workspace_connections_public as
select
  id,
  user_id,
  provider,
  account_email,
  connected_at,
  last_synced_at,
  sync_error,
  scopes
from public.workspace_connections
where user_id = (auth.jwt() ->> 'sub');

grant select on public.workspace_connections_public to authenticated;

-- 2) organization_tasks: admins see all; members see only tasks assigned to them
drop policy if exists "organization_tasks_select_member" on public.organization_tasks;

create policy "organization_tasks_select_admin"
  on public.organization_tasks
  for select
  to authenticated
  using (public.user_is_org_admin (organization_id));

create policy "organization_tasks_select_assignee"
  on public.organization_tasks
  for select
  to authenticated
  using (
    public.user_is_active_org_member (organization_id)
    and assignee_user_id = (select auth.jwt() ->> 'sub')
  );
