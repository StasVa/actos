-- ─────────────────────────────────────────────────────────────────
-- ActOS v1 initial schema
-- All user-data tables have RLS enabled; policies enforce
-- user_id = auth.uid() across SELECT/INSERT/UPDATE/DELETE.
-- ─────────────────────────────────────────────────────────────────

-- Enable pgcrypto for gen_random_uuid()
create extension if not exists "pgcrypto";

-- Updated-at trigger function (reused across all tables)
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ─────────────────────────────────────────────────────────────────
-- USERS — app-level user record, mirrors auth.users
-- ─────────────────────────────────────────────────────────────────
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text,
  avatar_seed text,
  subscription_tier text not null default 'free' check (subscription_tier in ('free', 'all-in')),
  subscription_started_at timestamptz,
  billing_cycle text check (billing_cycle in ('monthly', 'annual', 'lifetime')),
  price_locked_at numeric,
  subscription_ends_at timestamptz,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can read own user row" on public.users
  for select using (auth.uid() = id);
create policy "Users can update own user row" on public.users
  for update using (auth.uid() = id);

create trigger users_updated_at before update on public.users
  for each row execute function set_updated_at();

-- Trigger: when auth.users gets a new row, create matching public.users
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, display_name, subscription_tier)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'display_name',
    'all-in'  -- BETA: all new users get all-in by default; change post-launch
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─────────────────────────────────────────────────────────────────
-- GOALS
-- ─────────────────────────────────────────────────────────────────
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  type text not null check (type in ('short-term', 'mid-term')),
  status text not null default 'active' check (status in ('active', 'completed', 'dropped')),
  description text,
  target_date date,
  color text not null check (color in ('goal-1', 'goal-2', 'goal-3')),
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  dropped_at timestamptz
);

create index goals_user_id_idx on public.goals(user_id);
create index goals_user_status_idx on public.goals(user_id, status);

alter table public.goals enable row level security;
create policy "Users CRUD own goals" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger goals_updated_at before update on public.goals
  for each row execute function set_updated_at();

-- Success criteria as a related table (0-5 per goal)
create table public.goal_success_criteria (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  text text not null,
  done boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index gsc_goal_id_idx on public.goal_success_criteria(goal_id);

alter table public.goal_success_criteria enable row level security;
create policy "Users CRUD own goal criteria" on public.goal_success_criteria
  for all using (
    exists (select 1 from public.goals g where g.id = goal_id and g.user_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────────
-- PROJECTS
-- ─────────────────────────────────────────────────────────────────
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  title text not null,
  status text not null default 'active' check (status in ('active', 'completed', 'dropped')),
  description jsonb,  -- TipTap JSON
  is_draft boolean not null default false,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  dropped_at timestamptz
);

create index projects_user_id_idx on public.projects(user_id);
create index projects_goal_id_idx on public.projects(goal_id);

alter table public.projects enable row level security;
create policy "Users CRUD own projects" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger projects_updated_at before update on public.projects
  for each row execute function set_updated_at();

create table public.project_references (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  url text not null,
  title text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index pr_project_id_idx on public.project_references(project_id);

alter table public.project_references enable row level security;
create policy "Users CRUD own project refs" on public.project_references
  for all using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────────
-- ACTIONS
-- ─────────────────────────────────────────────────────────────────
create table public.actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,  -- null = goal-level backlog
  title text not null,
  status text not null default 'backlog' check (status in ('backlog', 'planned', 'done', 'delegated', 'dropped', 'cancelled')),
  scheduled_date date,
  notes text,
  impact int not null check (impact between 1 and 10),
  time_estimate_minutes int,
  delegate_name text,
  delegate_note text,
  expected_return_date date,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  planned_at timestamptz,
  completed_at timestamptz,
  delegated_at timestamptz,
  dropped_at timestamptz,
  cancelled_at timestamptz
);

create index actions_user_id_idx on public.actions(user_id);
create index actions_goal_id_idx on public.actions(goal_id);
create index actions_project_id_idx on public.actions(project_id);
create index actions_user_status_idx on public.actions(user_id, status);
create index actions_user_scheduled_idx on public.actions(user_id, scheduled_date) where scheduled_date is not null;

alter table public.actions enable row level security;
create policy "Users CRUD own actions" on public.actions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger actions_updated_at before update on public.actions
  for each row execute function set_updated_at();

create table public.action_timeline (
  id uuid primary key default gen_random_uuid(),
  action_id uuid not null references public.actions(id) on delete cascade,
  at timestamptz not null default now(),
  text text not null
);

create index at_action_id_idx on public.action_timeline(action_id);

alter table public.action_timeline enable row level security;
create policy "Users read own action timelines" on public.action_timeline
  for select using (
    exists (select 1 from public.actions a where a.id = action_id and a.user_id = auth.uid())
  );
create policy "Users insert own action timelines" on public.action_timeline
  for insert with check (
    exists (select 1 from public.actions a where a.id = action_id and a.user_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────────
-- RITUALS
-- ─────────────────────────────────────────────────────────────────
create table public.rituals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  schedule text not null check (schedule in ('daily', 'weekdays', 'weekly', 'monthly', 'custom')),
  schedule_config jsonb,
  base_impact int not null check (base_impact between 1 and 10),
  notes text,
  time_estimate_minutes int,
  total_completions int not null default 0,
  status text not null default 'active' check (status in ('active', 'archived')),
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

create index rituals_user_id_idx on public.rituals(user_id);
create index rituals_goal_id_idx on public.rituals(goal_id);

alter table public.rituals enable row level security;
create policy "Users CRUD own rituals" on public.rituals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.ritual_completions (
  id uuid primary key default gen_random_uuid(),
  ritual_id uuid not null references public.rituals(id) on delete cascade,
  date date not null,
  at timestamptz not null default now(),
  status text not null default 'done' check (status in ('done', 'skipped', 'missed', 'pending')),
  unique (ritual_id, date)
);

create index rc_ritual_id_idx on public.ritual_completions(ritual_id);

alter table public.ritual_completions enable row level security;
create policy "Users CRUD own ritual completions" on public.ritual_completions
  for all using (
    exists (select 1 from public.rituals r where r.id = ritual_id and r.user_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────────
-- IDEAS
-- ─────────────────────────────────────────────────────────────────
create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  title text not null,
  note text,
  status text not null default 'captured' check (status in ('captured', 'converted_to_action', 'converted_to_project', 'discarded')),
  converted_to_id uuid,
  is_sample boolean not null default false,
  captured_at timestamptz not null default now(),
  discarded_at timestamptz
);

create index ideas_user_id_idx on public.ideas(user_id);
create index ideas_goal_id_idx on public.ideas(goal_id);

alter table public.ideas enable row level security;
create policy "Users CRUD own ideas" on public.ideas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Idea attachments and refs in separate tables (same pattern as projects)
create table public.idea_references (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  url text not null,
  title text,
  created_at timestamptz not null default now()
);

alter table public.idea_references enable row level security;
create policy "Users CRUD own idea refs" on public.idea_references
  for all using (
    exists (select 1 from public.ideas i where i.id = idea_id and i.user_id = auth.uid())
  );

create table public.idea_image_attachments (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  storage_path text not null,  -- path in Supabase Storage bucket
  caption text,
  created_at timestamptz not null default now()
);

alter table public.idea_image_attachments enable row level security;
create policy "Users CRUD own idea images" on public.idea_image_attachments
  for all using (
    exists (select 1 from public.ideas i where i.id = idea_id and i.user_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────────
-- DAY ENTRIES
-- ─────────────────────────────────────────────────────────────────
create table public.day_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  date date not null,
  day_type text check (day_type in ('execution', 'recovery', 'day-off', 'sick')),
  main_task_action_id uuid references public.actions(id) on delete set null,
  planned_action_ids uuid[] default '{}',
  planned_ritual_ids uuid[] default '{}',
  skipped_ritual_ids uuid[] default '{}',
  is_planned boolean not null default false,
  is_closed boolean not null default false,
  is_sample boolean not null default false,
  started_at timestamptz,
  closed_at timestamptz,
  unique (user_id, date)
);

create index de_user_id_idx on public.day_entries(user_id);
create index de_user_date_idx on public.day_entries(user_id, date);

alter table public.day_entries enable row level security;
create policy "Users CRUD own day entries" on public.day_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────
-- SESSIONS (focus timer)
-- ─────────────────────────────────────────────────────────────────
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null check (status in ('in_progress', 'completed', 'aborted')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  mode text not null check (mode in ('pomodoro', 'continuous', 'custom')),
  work_duration int not null,
  break_duration int not null default 0,
  cycles_planned int not null default 1,
  planned_action_ids uuid[] default '{}',
  completed_action_ids uuid[] default '{}',
  dropped_action_ids uuid[] default '{}',
  cycles_completed int not null default 0,
  reflection text,
  is_sample boolean not null default false
);

create index sessions_user_id_idx on public.sessions(user_id);
create index sessions_user_started_idx on public.sessions(user_id, started_at);

alter table public.sessions enable row level security;
create policy "Users CRUD own sessions" on public.sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
