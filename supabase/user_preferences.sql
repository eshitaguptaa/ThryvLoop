-- User preferences table for Clerk-authenticated users
create table if not exists public.user_preferences (
  user_id text not null,
  key text not null,
  value jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.user_preferences enable row level security;

-- Users can only read/write their own preferences.
create policy "user_preferences_select_own"
  on public.user_preferences
  for select
  using ((auth.jwt() ->> 'sub') = user_id);

create policy "user_preferences_insert_own"
  on public.user_preferences
  for insert
  with check ((auth.jwt() ->> 'sub') = user_id);

create policy "user_preferences_update_own"
  on public.user_preferences
  for update
  using ((auth.jwt() ->> 'sub') = user_id)
  with check ((auth.jwt() ->> 'sub') = user_id);

create policy "user_preferences_delete_own"
  on public.user_preferences
  for delete
  using ((auth.jwt() ->> 'sub') = user_id);
