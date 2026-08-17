-- Aggregate focus time by local calendar day so dashboards are not capped
-- by PostgREST's 1000-row default (Focus checkpoints every ~10s).

create or replace function public.focus_seconds_by_day(
  p_user_id text,
  p_start timestamptz,
  p_end timestamptz,
  p_timezone text default 'UTC'
)
returns table(day date, seconds bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    ((fs.completed_at at time zone p_timezone)::date) as day,
    coalesce(sum(fs.duration_seconds), 0)::bigint as seconds
  from public.focus_sessions fs
  where fs.user_id = p_user_id
    and (fs.phase is null or fs.phase = 'session')
    and fs.completed_at >= p_start
    and fs.completed_at < p_end
  group by 1
  order by 1;
$$;

revoke all on function public.focus_seconds_by_day(text, timestamptz, timestamptz, text) from public;
grant execute on function public.focus_seconds_by_day(text, timestamptz, timestamptz, text) to service_role;
