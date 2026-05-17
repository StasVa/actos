-- Track whether user has completed the initial setup wizard.
-- Replaces the localStorage actos.setup.completed flag which was unreliable
-- (cleared on signOut sweep, leaked between accounts on shared devices, and
-- caused the wizard to re-trigger on login).
alter table public.users
  add column if not exists has_completed_initial_setup boolean not null default false;

-- Backfill: all users that exist at migration time are assumed to have
-- completed setup. Only fresh signups going forward default to false.
update public.users
set has_completed_initial_setup = true
where created_at < now();
