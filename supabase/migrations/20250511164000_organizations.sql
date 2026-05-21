-- B2B tenant foundation: organizations + members (mirrored from Clerk via webhook).
-- RLS: members read their orgs and fellow members; writes use service role (webhooks).

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  clerk_organization_id text not null unique,
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organizations_clerk_id_idx on public.organizations (clerk_organization_id);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id text not null,
  role text not null default 'org:member',
  status text not null default 'active' check (status in ('active', 'inactive', 'pending')),
  clerk_organization_membership_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index if not exists organization_members_org_idx on public.organization_members (organization_id);
create index if not exists organization_members_user_idx on public.organization_members (user_id);

-- Bypasses RLS so policies can reference membership without recursion.
create or replace function public.user_is_active_org_member (p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_organization_id
      and m.user_id = (select auth.jwt() ->> 'sub')
      and m.status = 'active'
  );
$$;

create or replace function public.user_is_org_admin (p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_organization_id
      and m.user_id = (select auth.jwt() ->> 'sub')
      and m.status = 'active'
      and m.role = 'org:admin'
  );
$$;

revoke all on function public.user_is_active_org_member (uuid) from public;
revoke all on function public.user_is_org_admin (uuid) from public;
grant execute on function public.user_is_active_org_member (uuid) to authenticated, service_role;
grant execute on function public.user_is_org_admin (uuid) to authenticated, service_role;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

-- Policies (drop first so this script is safe to re-run)
drop policy if exists "organizations_select_member" on public.organizations;
drop policy if exists "organizations_update_admin" on public.organizations;
drop policy if exists "organization_members_select_same_org" on public.organization_members;

-- Authenticated users: read orgs they belong to.
create policy "organizations_select_member"
  on public.organizations
  for select
  to authenticated
  using (public.user_is_active_org_member (id));

-- Org admins may update display fields (optional client path); webhooks still use service role.
create policy "organizations_update_admin"
  on public.organizations
  for update
  to authenticated
  using (public.user_is_org_admin (id))
  with check (public.user_is_org_admin (id));

-- Members see other members in the same org (for directory / future B2B UI).
create policy "organization_members_select_same_org"
  on public.organization_members
  for select
  to authenticated
  using (public.user_is_active_org_member (organization_id));

-- No insert/update/delete for authenticated on members — sync via Clerk webhooks (service role).

grant select on public.organizations to authenticated;
grant select on public.organization_members to authenticated;
grant update (name, slug, updated_at) on public.organizations to authenticated;
