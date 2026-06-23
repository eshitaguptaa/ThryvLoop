-- In-app notifications shown in the product UI (not Gmail/workspace mail).

create table if not exists public.app_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title text not null,
  body text,
  link_url text,
  link_label text,
  created_at timestamptz not null default now(),
  is_read boolean not null default false
);

create index if not exists app_notifications_user_created
  on public.app_notifications (user_id, created_at desc);

create index if not exists app_notifications_user_unread
  on public.app_notifications (user_id)
  where (is_read = false);

alter table public.app_notifications enable row level security;

create policy "app_notifications_select_own"
  on public.app_notifications for select
  using ((auth.jwt() ->> 'sub') = user_id);

create policy "app_notifications_update_own"
  on public.app_notifications for update
  using ((auth.jwt() ->> 'sub') = user_id);
