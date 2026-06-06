-- Teams "Notify Me" signups from the landing page
create table if not exists public.teams_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz not null default now(),
  constraint teams_waitlist_email_unique unique (email)
);

alter table public.teams_waitlist enable row level security;
