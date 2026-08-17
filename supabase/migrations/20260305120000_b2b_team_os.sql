-- Team OS foundation: projects, activity, presence, comments, settings, transparency policy.

-- ---------------------------------------------------------------------------
-- Organizations: insights policy + Team Focus Hours
-- ---------------------------------------------------------------------------
alter table public.organizations
  add column if not exists insights_policy text not null default 'team_only'
    check (insights_policy in ('team_only', 'full_individual'));

alter table public.organizations
  add column if not exists focus_hours jsonb not null default jsonb_build_object(
    'enabled', false,
    'timezone', 'UTC',
    'windows', '[]'::jsonb
  );

-- Allow admins to update new settings columns
grant update (name, slug, updated_at, insights_policy, focus_hours) on public.organizations to authenticated;

-- ---------------------------------------------------------------------------
-- Projects (lightweight initiatives)
-- ---------------------------------------------------------------------------
create table if not exists public.organization_projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  description text,
  owner_user_id text,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_by_user_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organization_projects_org_idx
  on public.organization_projects (organization_id);

alter table public.organization_projects enable row level security;

drop policy if exists "organization_projects_select_member" on public.organization_projects;
drop policy if exists "organization_projects_insert_admin" on public.organization_projects;
drop policy if exists "organization_projects_update_admin" on public.organization_projects;
drop policy if exists "organization_projects_delete_admin" on public.organization_projects;

create policy "organization_projects_select_member"
  on public.organization_projects for select to authenticated
  using (public.user_is_active_org_member (organization_id));

create policy "organization_projects_insert_admin"
  on public.organization_projects for insert to authenticated
  with check (
    public.user_is_org_admin (organization_id)
    and created_by_user_id = (select auth.jwt() ->> 'sub')
  );

create policy "organization_projects_update_admin"
  on public.organization_projects for update to authenticated
  using (public.user_is_org_admin (organization_id))
  with check (public.user_is_org_admin (organization_id));

create policy "organization_projects_delete_admin"
  on public.organization_projects for delete to authenticated
  using (public.user_is_org_admin (organization_id));

grant select, insert, update, delete on public.organization_projects to authenticated;

-- ---------------------------------------------------------------------------
-- Tasks: optional project link
-- ---------------------------------------------------------------------------
alter table public.organization_tasks
  add column if not exists project_id uuid references public.organization_projects (id) on delete set null;

create index if not exists organization_tasks_project_idx
  on public.organization_tasks (project_id);

-- ---------------------------------------------------------------------------
-- Task comments
-- ---------------------------------------------------------------------------
create table if not exists public.organization_task_comments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  task_id uuid not null references public.organization_tasks (id) on delete cascade,
  author_user_id text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists organization_task_comments_task_idx
  on public.organization_task_comments (task_id);

alter table public.organization_task_comments enable row level security;

drop policy if exists "organization_task_comments_select" on public.organization_task_comments;
drop policy if exists "organization_task_comments_insert" on public.organization_task_comments;
drop policy if exists "organization_task_comments_delete_own" on public.organization_task_comments;

create policy "organization_task_comments_select"
  on public.organization_task_comments for select to authenticated
  using (public.user_is_active_org_member (organization_id));

create policy "organization_task_comments_insert"
  on public.organization_task_comments for insert to authenticated
  with check (
    public.user_is_active_org_member (organization_id)
    and author_user_id = (select auth.jwt() ->> 'sub')
  );

create policy "organization_task_comments_delete_own"
  on public.organization_task_comments for delete to authenticated
  using (
    public.user_is_active_org_member (organization_id)
    and (
      author_user_id = (select auth.jwt() ->> 'sub')
      or public.user_is_org_admin (organization_id)
    )
  );

grant select, insert, delete on public.organization_task_comments to authenticated;

-- ---------------------------------------------------------------------------
-- Real activity feed
-- ---------------------------------------------------------------------------
create table if not exists public.organization_activity (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  actor_user_id text not null,
  event_type text not null,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists organization_activity_org_created_idx
  on public.organization_activity (organization_id, created_at desc);

alter table public.organization_activity enable row level security;

drop policy if exists "organization_activity_select" on public.organization_activity;
drop policy if exists "organization_activity_insert" on public.organization_activity;

create policy "organization_activity_select"
  on public.organization_activity for select to authenticated
  using (public.user_is_active_org_member (organization_id));

create policy "organization_activity_insert"
  on public.organization_activity for insert to authenticated
  with check (
    public.user_is_active_org_member (organization_id)
    and actor_user_id = (select auth.jwt() ->> 'sub')
  );

grant select, insert on public.organization_activity to authenticated;

-- ---------------------------------------------------------------------------
-- Presence / currently focusing
-- ---------------------------------------------------------------------------
create table if not exists public.organization_presence (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id text not null,
  status text not null default 'available'
    check (status in ('focusing', 'available', 'away')),
  note text,
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

alter table public.organization_presence enable row level security;

drop policy if exists "organization_presence_select" on public.organization_presence;
drop policy if exists "organization_presence_upsert_self" on public.organization_presence;
drop policy if exists "organization_presence_update_self" on public.organization_presence;

create policy "organization_presence_select"
  on public.organization_presence for select to authenticated
  using (public.user_is_active_org_member (organization_id));

create policy "organization_presence_upsert_self"
  on public.organization_presence for insert to authenticated
  with check (
    public.user_is_active_org_member (organization_id)
    and user_id = (select auth.jwt() ->> 'sub')
  );

create policy "organization_presence_update_self"
  on public.organization_presence for update to authenticated
  using (
    public.user_is_active_org_member (organization_id)
    and user_id = (select auth.jwt() ->> 'sub')
  )
  with check (
    public.user_is_active_org_member (organization_id)
    and user_id = (select auth.jwt() ->> 'sub')
  );

grant select, insert, update on public.organization_presence to authenticated;

-- ---------------------------------------------------------------------------
-- Analytics access audit (when full individual transparency is on)
-- ---------------------------------------------------------------------------
create table if not exists public.organization_analytics_views (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  viewer_user_id text not null,
  subject_user_id text not null,
  created_at timestamptz not null default now()
);

create index if not exists organization_analytics_views_org_idx
  on public.organization_analytics_views (organization_id, created_at desc);

alter table public.organization_analytics_views enable row level security;

drop policy if exists "organization_analytics_views_select_admin" on public.organization_analytics_views;
drop policy if exists "organization_analytics_views_insert_admin" on public.organization_analytics_views;

create policy "organization_analytics_views_select_admin"
  on public.organization_analytics_views for select to authenticated
  using (public.user_is_org_admin (organization_id));

create policy "organization_analytics_views_insert_admin"
  on public.organization_analytics_views for insert to authenticated
  with check (
    public.user_is_org_admin (organization_id)
    and viewer_user_id = (select auth.jwt() ->> 'sub')
  );

grant select, insert on public.organization_analytics_views to authenticated;

-- Enable realtime for multiplayer board (no-op if publication missing)
do $$
begin
  alter publication supabase_realtime add table public.organization_tasks;
exception
  when duplicate_object then null;
  when undefined_object then null;
  when others then null;
end $$;
