-- Google Meet join links for synced calendar events

alter table public.workspace_calendar_blocks
  add column if not exists meet_url text;

create index if not exists workspace_calendar_blocks_meet_url
  on public.workspace_calendar_blocks (user_id)
  where meet_url is not null;
