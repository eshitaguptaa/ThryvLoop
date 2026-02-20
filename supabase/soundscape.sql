-- Soundscape state (current mix)
create table if not exists public.soundscape_state (
  user_id text primary key,
  active_sounds jsonb,
  master_volume integer not null default 75,
  spaces_volume integer not null default 50,
  updated_at timestamptz not null default now()
);

alter table public.soundscape_state enable row level security;

create policy "soundscape_state_select_own"
  on public.soundscape_state
  for select
  using ((auth.jwt() ->> 'sub') = user_id);

create policy "soundscape_state_insert_own"
  on public.soundscape_state
  for insert
  with check ((auth.jwt() ->> 'sub') = user_id);

create policy "soundscape_state_update_own"
  on public.soundscape_state
  for update
  using ((auth.jwt() ->> 'sub') = user_id)
  with check ((auth.jwt() ->> 'sub') = user_id);

create policy "soundscape_state_delete_own"
  on public.soundscape_state
  for delete
  using ((auth.jwt() ->> 'sub') = user_id);

-- Saved focus recipes
create table if not exists public.soundscape_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  icon text,
  sounds jsonb not null,
  global_volume integer not null default 75,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.soundscape_recipes enable row level security;

create policy "soundscape_recipes_select_own"
  on public.soundscape_recipes
  for select
  using ((auth.jwt() ->> 'sub') = user_id);

create policy "soundscape_recipes_insert_own"
  on public.soundscape_recipes
  for insert
  with check ((auth.jwt() ->> 'sub') = user_id);

create policy "soundscape_recipes_update_own"
  on public.soundscape_recipes
  for update
  using ((auth.jwt() ->> 'sub') = user_id)
  with check ((auth.jwt() ->> 'sub') = user_id);

create policy "soundscape_recipes_delete_own"
  on public.soundscape_recipes
  for delete
  using ((auth.jwt() ->> 'sub') = user_id);
