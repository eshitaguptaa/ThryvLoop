-- Admin opt-in: focus activity monitoring for non-admin members only
-- (idle/tab-away toasts, productive-seconds credit, not applied to org admins of that team).

alter table public.organizations
  add column if not exists member_activity_monitoring boolean not null default false;

comment on column public.organizations.member_activity_monitoring is
  'When true, non-admin members of this org get focus integrity checks (idle toast, active_seconds). Admins of this org are not subject to it from this org alone.';

grant update (name, slug, updated_at, insights_policy, focus_hours, member_activity_monitoring)
  on public.organizations to authenticated;
