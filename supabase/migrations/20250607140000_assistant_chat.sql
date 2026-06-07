-- ThryvBot assistant conversation persistence
create table if not exists public.assistant_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assistant_conversations_user_id_updated_at_idx
  on public.assistant_conversations (user_id, updated_at desc);

create table if not exists public.assistant_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.assistant_conversations(id) on delete cascade,
  user_id text not null,
  role text not null check (role in ('user', 'assistant', 'tool')),
  content text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists assistant_messages_conversation_id_created_at_idx
  on public.assistant_messages (conversation_id, created_at asc);

alter table public.assistant_conversations enable row level security;
alter table public.assistant_messages enable row level security;

create policy "assistant_conversations_select_own"
  on public.assistant_conversations
  for select
  using ((auth.jwt() ->> 'sub') = user_id);

create policy "assistant_conversations_insert_own"
  on public.assistant_conversations
  for insert
  with check ((auth.jwt() ->> 'sub') = user_id);

create policy "assistant_conversations_update_own"
  on public.assistant_conversations
  for update
  using ((auth.jwt() ->> 'sub') = user_id)
  with check ((auth.jwt() ->> 'sub') = user_id);

create policy "assistant_conversations_delete_own"
  on public.assistant_conversations
  for delete
  using ((auth.jwt() ->> 'sub') = user_id);

create policy "assistant_messages_select_own"
  on public.assistant_messages
  for select
  using ((auth.jwt() ->> 'sub') = user_id);

create policy "assistant_messages_insert_own"
  on public.assistant_messages
  for insert
  with check ((auth.jwt() ->> 'sub') = user_id);

create policy "assistant_messages_update_own"
  on public.assistant_messages
  for update
  using ((auth.jwt() ->> 'sub') = user_id)
  with check ((auth.jwt() ->> 'sub') = user_id);

create policy "assistant_messages_delete_own"
  on public.assistant_messages
  for delete
  using ((auth.jwt() ->> 'sub') = user_id);
