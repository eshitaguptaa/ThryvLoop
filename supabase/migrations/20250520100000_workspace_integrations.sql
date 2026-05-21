-- Google Workspace integration (calendar, mail, meeting presence)

create table if not exists public.workspace_connections (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  provider text not null check (provider in ('google')),
  account_email text,
  access_token_encrypted text not null,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  scopes text[] not null default '{}',
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz,
  sync_error text,
  unique (user_id, provider)
);

create index if not exists workspace_connections_user on public.workspace_connections (user_id);

create table if not exists public.workspace_calendar_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  provider text not null check (provider in ('google')),
  external_id text not null,
  title text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_online_meeting boolean not null default false,
  show_as text,
  synced_at timestamptz not null default now(),
  unique (user_id, provider, external_id)
);

create index if not exists workspace_calendar_blocks_user_range
  on public.workspace_calendar_blocks (user_id, starts_at, ends_at);

create table if not exists public.workspace_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  provider text not null check (provider in ('google')),
  source text not null check (source in ('gmail')),
  external_id text not null,
  subject text,
  preview text,
  received_at timestamptz not null,
  is_read boolean not null default false,
  link_url text,
  synced_at timestamptz not null default now(),
  unique (user_id, provider, external_id)
);

create index if not exists workspace_notifications_user_received
  on public.workspace_notifications (user_id, received_at desc);

alter table public.workspace_connections enable row level security;
alter table public.workspace_calendar_blocks enable row level security;
alter table public.workspace_notifications enable row level security;

-- Tokens are server-only; clients see connection metadata via a view or limited select
create policy "workspace_connections_select_own"
  on public.workspace_connections for select
  using ((auth.jwt() ->> 'sub') = user_id);

create policy "workspace_calendar_blocks_select_own"
  on public.workspace_calendar_blocks for select
  using ((auth.jwt() ->> 'sub') = user_id);

create policy "workspace_notifications_select_own"
  on public.workspace_notifications for select
  using ((auth.jwt() ->> 'sub') = user_id);

create policy "workspace_notifications_update_own"
  on public.workspace_notifications for update
  using ((auth.jwt() ->> 'sub') = user_id);

-- Safe metadata view (no tokens) for client queries
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
from public.workspace_connections;

grant select on public.workspace_connections_public to authenticated;
