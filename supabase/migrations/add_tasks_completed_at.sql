-- Add completed_at to tasks for completion analytics
alter table public.tasks add column if not exists completed_at timestamptz;
