-- Archive completed work so Done boards stay current without deleting
-- completions that Insights / Analytics count via completed_at.

alter table public.organization_tasks
  add column if not exists archived_at timestamptz;

alter table public.tasks
  add column if not exists archived_at timestamptz;

create index if not exists organization_tasks_board_live_idx
  on public.organization_tasks (organization_id, column_key)
  where archived_at is null;

create index if not exists organization_tasks_archived_idx
  on public.organization_tasks (organization_id, archived_at desc)
  where archived_at is not null;

create index if not exists tasks_board_live_idx
  on public.tasks (user_id, column_key)
  where archived_at is null;

create index if not exists tasks_archived_idx
  on public.tasks (user_id, archived_at desc)
  where archived_at is not null;
