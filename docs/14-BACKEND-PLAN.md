# ActOS — Backend Plan

> **Document role:** the concrete, week-by-week playbook for migrating from LocalStorage mocks to Supabase. The actionable companion to `13-ARCHITECTURE.md`.
> **Read alongside:** `12-TECH-STACK.md`, `13-ARCHITECTURE.md`, `FRONTEND-AUDIT.md`.
> **Audience:** Stas (PM) for visibility, Claude/Cursor agents for execution context.
> **Last updated:** 2026-05-11

---

## Goal of this plan

Get from **today's state** (Lovable export + Phase 1 hygiene, all backend is mocked in LocalStorage) to **beta-ready** (30 friends signing up at actos.io, authenticating against Supabase, syncing their data to a Postgres database, receiving verification codes via Resend).

**Timeline target:** 4-6 weeks of focused work. Realistic given the codebase quality and the mock-to-real swap pattern that's already in place.

**Out of scope of this plan** (deferred to v1.x or later per `06-ROADMAP.md`):
- Payments (all beta users get All-In automatically)
- Google/Apple OAuth (mock buttons stay; "coming soon" modal)
- Multi-device realtime sync (last-write-wins is fine for beta)
- Mobile native apps
- AI delegation pipeline

---

## Phase structure

We break this work into 5 sequenced phases. Each phase has a clear **exit criterion** — what works end-to-end when it's done.

**Phase 1 — Hygiene** ✅ COMPLETE (2026-05-11)
Code cleanup, dev environment, AI agent context files. Repository ready for backend work.
Exit: clean `git status`, `npm run dev` on 5174, AI agents read project context.

**Phase 2 — Supabase foundation** (target: 3-5 days)
Create Supabase project, define schema, RLS policies, generated TypeScript types, environment variables.
Exit: empty Supabase project exists with full schema, types are generated and committed, `.env.local` works locally.

**Phase 3 — Real authentication** (target: 4-7 days)
Replace mock auth with Supabase Auth. Wire Resend for verification emails. Update admin gate to use Supabase user record.
Exit: a user can sign up at localhost:5174, receive a real email with a code, verify, sign in, sign out. Mock auth removed.

**Phase 4 — Data migration** (target: 5-8 days)
Move user data (goals, projects, actions, etc.) from LocalStorage → Supabase. TanStack Query hooks replace direct Zustand reads/writes. Sample data seeding adapted.
Exit: a fresh user can create goals, projects, actions; data persists across browser sessions and devices; admin pages still work.

**Phase 5 — Deployment** (target: 2-4 days)
Wire Vercel for hosting. Connect actos.io DNS. Configure environment variables in Vercel. Set up Sentry, PostHog. Smoke-test full beta flow on production URL.
Exit: actos.io serves the app; a new user can sign up end-to-end on production; we send Stas a beta-invite-ready link.

**Total estimate: 14-24 working days.** Loose floor 3 weeks, comfortable ceiling 5 weeks. Buffer to 6 weeks accounts for unknowns.

---

## Phase 2 — Supabase foundation

### 2.1 Create Supabase project

**Manual setup (Stas):**

1. Sign in at https://supabase.com
2. Create new project:
   - Name: `actos`
   - Database password: generate strong, save in 1Password/equivalent
   - Region: `US East (Virginia)` or `US West (Oregon)` — pick whichever gives lowest latency to your location during signup
3. Wait 2-3 min for provisioning
4. Save the following from Project Settings → API:
   - **Project URL** (`https://xxx.supabase.co`)
   - **Anon/public key** (safe for client)
   - **Service role key** (server-side only, NEVER ship to client)

**Critical:** anon key goes in `.env.local` and Vercel. Service role key goes ONLY in Supabase Edge Function secrets and your local `.env` if you absolutely need it for local Edge Function testing.

### 2.2 Install Supabase CLI locally

```bash
brew install supabase/tap/supabase
supabase --version  # should print version
```

### 2.3 Initialize Supabase in the repo

```bash
cd ~/Documents/actos
supabase init
```

This creates `supabase/` directory with `config.toml` and migration scaffolding. Commit it.

### 2.4 Link to remote project

```bash
supabase link --project-ref <your-project-ref>
```

Project ref is in the URL on supabase.com (`https://supabase.com/dashboard/project/<ref>`).

### 2.5 Add environment variables

Create `.env.local` in repo root (gitignored):

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Create `.env.example` (committed) with placeholder values:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2.6 Install Supabase client

```bash
npm install @supabase/supabase-js
```

### 2.7 Create Supabase client singleton

New file `src/lib/supabase.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. " +
    "Copy .env.example to .env.local and fill in values from supabase.com."
  );
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
```

### 2.8 Define database schema

This is the meat of Phase 2. Create migration:

```bash
supabase migration new initial_schema
```

This creates `supabase/migrations/YYYYMMDDHHMMSS_initial_schema.sql`. Fill it with the schema.

**Schema overview** (full DDL in section 2.9):

- `users` (mirrors `auth.users`, holds app-specific fields)
- `goals`
- `projects`
- `actions`
- `action_timeline`
- `rituals`
- `ritual_completions`
- `ideas`
- `idea_references`
- `idea_image_attachments`
- `project_references`
- `day_entries`
- `sessions`
- All with RLS

### 2.9 Full schema DDL

This is the canonical schema for ActOS v1. Save as `supabase/migrations/<timestamp>_initial_schema.sql`.

```sql
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
```

### 2.10 Apply migration

```bash
supabase db push
```

This applies the migration to the linked remote project. Confirm in Supabase dashboard → Table Editor.

### 2.11 Generate TypeScript types

```bash
supabase gen types typescript --linked > src/lib/supabase.types.ts
```

This produces a fully-typed schema for use with the Supabase client. Commit `supabase.types.ts`.

### 2.12 Update the Supabase client to use types

Edit `src/lib/supabase.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./supabase.types";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(/* ... */);
}

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
```

### 2.13 Configure Resend in Supabase

In Supabase dashboard:
1. Authentication → Email Templates → enable custom SMTP
2. Add Resend SMTP credentials:
   - Host: `smtp.resend.com`
   - Port: `465` (SSL) or `587` (TLS)
   - Username: `resend`
   - Password: your Resend API key
3. Set sender email to `noreply@actos.io` (after Resend domain verification, see below)
4. Customize email templates with ActOS branding

**Resend domain verification:**
1. Sign up at https://resend.com
2. Add domain `actos.io` → Resend gives DNS records
3. Add DNS records in Cloudflare (TXT, MX, DKIM)
4. Wait for verification (usually 5-30 min)

### Phase 2 exit criteria

- Supabase project exists in US-region
- All tables created via migration; visible in Supabase Table Editor
- RLS enabled on all user-data tables, policies in place
- `supabase.types.ts` generated and committed
- `src/lib/supabase.ts` exports typed client
- `.env.local` works locally; `.env.example` committed
- Resend domain verified; Supabase Auth uses Resend SMTP
- `npm run dev` still works (no consumer code uses Supabase yet — just plumbing)
- Phase 2 work merged to `main` with passing build

---

## Phase 3 — Real authentication

**Goal:** replace mock auth in `src/lib/useAuth.tsx` and `src/lib/mockAuth.ts` with real Supabase Auth.

### 3.1 Rewrite useAuth.tsx

Replace LocalStorage-based logic with Supabase Auth calls. Key changes:

- `signUp({name, email, password})` → `supabase.auth.signUp(...)` with `options.data.display_name`
- `signIn({email, password})` → `supabase.auth.signInWithPassword(...)`
- `signOut()` → `supabase.auth.signOut()`
- `markEmailVerified()` removed (Supabase handles verification state)
- `setAdmin(next)` → `supabase.from('users').update({ is_admin: next }).eq('id', user.id)`
- Session state pulled from `supabase.auth.onAuthStateChange()` listener
- The `AuthUser` interface gets an `id` from Supabase, no longer client-generated

### 3.2 Add /auth/verify handling

Two paths to implement:

- **Email OTP code flow** (Supabase supports 6-digit codes natively via `signInWithOtp`)
- Or **email magic link** (default Supabase signup flow uses a link)

We prefer **6-digit codes** to match our existing UI. Configure Supabase Auth to use OTP codes instead of magic links (Auth → Providers → Email → "Confirm email" → enable OTP).

### 3.3 Delete mockAuth.ts

Once useAuth.tsx is real, `src/lib/mockAuth.ts` is dead. Delete it.

### 3.4 Update admin gate

Replace hardcoded `CURRENT_USER_EMAIL` in `src/admin/adminMock.ts` with `useAuth().user.email`.
Wrap `AdminLayout` in `RequireAdmin` in `App.tsx`.

### 3.5 Test full auth flow

- Sign up at localhost:5174 with a real email
- Receive a real verification email from Resend
- Enter code → verify → land in setup wizard
- Sign out
- Sign in with same email + password
- Land in /today

### Phase 3 exit criteria

- Mock auth code deleted
- Real Supabase Auth working end-to-end on localhost
- Resend delivers verification emails to real inboxes
- Admin gate uses Supabase user record, not mock constant

---

## Phase 4 — Data migration

This is the largest phase. We move every entity (goals, projects, actions, rituals, ideas, day entries, sessions) from Zustand-LocalStorage to TanStack-Supabase.

### 4.1 Migration strategy — strangler pattern

Don't rewrite the whole store at once. Migrate one entity at a time. Order:

1. **Goals** (root of the hierarchy)
2. **Projects** (depend on goals)
3. **Actions** (depend on projects)
4. **Rituals** (depend on goals)
5. **Ideas** (depend on goals)
6. **Day entries** (mostly independent)
7. **Sessions** (mostly independent)

For each entity, the work is:

- Create TanStack Query hooks: `useGoalsQuery()`, `useCreateGoalMutation()`, `useUpdateGoalMutation()`, `useDeleteGoalMutation()`
- Hooks read/write Supabase via the typed client
- Replace Zustand store reads/writes with these hooks
- Update consumers (pages, components)
- Remove the entity from the Zustand store and `partialize` config

### 4.2 Sample data adaptation

The current Setup Wizard "Show me how it works" path seeds local Zustand state. After migration, it should insert sample records into Supabase via the same API path as user-created records (with `is_sample = true`).

The `getSampleData(locale)` function in `src/lib/sampleSeed.ts` already returns plain objects — we just need to push them to Supabase via mutations instead of into Zustand directly.

### 4.3 Optimistic updates

Every mutation hook should use TanStack's `onMutate` for optimistic UI:

```typescript
const completeAction = useMutation({
  mutationFn: (id: string) => supabase
    .from('actions')
    .update({ status: 'done', completed_at: new Date().toISOString() })
    .eq('id', id),
  onMutate: async (id) => {
    await queryClient.cancelQueries({ queryKey: ['actions'] });
    const prev = queryClient.getQueryData(['actions']);
    queryClient.setQueryData(['actions'], (old: Action[]) =>
      old.map(a => a.id === id ? { ...a, status: 'done' } : a)
    );
    return { prev };
  },
  onError: (err, id, ctx) => {
    if (ctx?.prev) queryClient.setQueryData(['actions'], ctx.prev);
    toast.error("Couldn't mark done");
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['actions'] }),
});
```

### 4.4 Handle existing LocalStorage data

For Stas's own beta-testing account: existing LocalStorage data won't auto-migrate to Supabase. Two options:

- **Option A:** Add a one-time migration UI in Settings → "Import local data to cloud". Reads LocalStorage, posts everything to Supabase.
- **Option B:** Wipe and restart (acceptable since beta users won't have meaningful data yet).

For beta launch we recommend **Option B**. Migration tool can ship in v1.x if anyone asks.

### 4.5 File storage — TipTap embedded images

Today: base64 data URLs in description JSON.
After: upload to Supabase Storage bucket `project-media`, store URL.

Implement upload handler in `RichTextEditor.tsx` (or wherever TipTap image insertion happens). Upload to `{user_id}/{uuid}.{ext}`.

Configure bucket policy in Supabase dashboard:
- Bucket: `project-media`
- Public: yes (paths are unguessable UUIDs)
- RLS: users can upload to paths starting with their `user_id`

### Phase 4 exit criteria

- All 7 entities live in Supabase
- Zustand store reduced to UI-only state (active panel, etc.)
- LocalStorage no longer holds user data (still holds preferences: theme, language, dismissed coachmarks)
- Sample data path works against Supabase
- Project images upload to Supabase Storage
- A fresh user signing up gets a clean Supabase row, can create goals/projects/actions, data persists across devices

---

## Phase 5 — Deployment

### 5.1 Vercel project setup

1. Sign in to vercel.com with the same GitHub account that owns the repo
2. Import `StasVa/actos` repository
3. Framework preset: Vite (auto-detected)
4. Build command: `npm run build`
5. Output directory: `dist`
6. Environment variables (Settings → Environment Variables):
   - `VITE_SUPABASE_URL` (Production + Preview)
   - `VITE_SUPABASE_ANON_KEY` (Production + Preview)
7. Deploy

### 5.2 Custom domain

1. In Vercel → Domains → add `actos.io` and `www.actos.io`
2. Vercel gives DNS records to add
3. In Cloudflare DNS:
   - `A` record: `@` → Vercel IP
   - `CNAME` record: `www` → `cname.vercel-dns.com`
4. SSL auto-provisions via Let's Encrypt
5. Test: `https://actos.io` loads ActOS landing

### 5.3 Sentry setup

1. Sign up at sentry.io, create project (Vite/React)
2. Get DSN
3. Install: `npm install @sentry/react`
4. Initialize in `src/main.tsx`:

```typescript
import * as Sentry from "@sentry/react";

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_VERCEL_ENV ?? "development",
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
  });
}
```

5. Add `VITE_SENTRY_DSN` to Vercel env vars
6. Wrap App in error boundary for graceful crash UI

### 5.4 PostHog setup

1. Sign up at posthog.com (US Cloud)
2. Get project API key
3. Install: `npm install posthog-js`
4. Initialize in `src/main.tsx` (after consent if applicable)
5. Add `VITE_POSTHOG_KEY` and `VITE_POSTHOG_HOST` to Vercel env vars

### 5.5 Production smoke test

Full beta-user simulation on https://actos.io:

1. Land on `/` — should see landing page
2. Click signup CTA → `/auth#signup`
3. Sign up with a fresh email
4. Receive verification email (check Resend deliverability)
5. Enter code → verify
6. Complete setup wizard
7. Create a goal, project, action
8. Sign out, sign in, see data persists
9. Open on a different browser/device, sign in — data syncs

If all pass: **beta is launched.** Send Stas the invite link.

### Phase 5 exit criteria

- `actos.io` resolves to Vercel deployment
- HTTPS works
- All env vars set in Vercel
- Sentry catches errors in production
- PostHog tracks events
- A fresh signup completes end-to-end on production
- Stas has a shareable URL to send to friends

---

## Risk register

Things that can blow up the timeline. Tracked here, mitigated as they appear.

1. **Resend domain verification delays** — usually 30 min, occasionally hours. Mitigation: start Phase 2 with domain verification first.
2. **Supabase Auth quirks** — OTP vs magic link config; password reset templating. Mitigation: budget a day in Phase 3 for auth polish.
3. **TanStack Query learning curve** — mutations + optimistic updates take a few iterations to get right. Mitigation: do Goals migration first as the proof; the others follow the pattern.
4. **Sample data complexity** — 68 actions across 60 days with timestamps. Pushing all of this through `supabase.from('actions').insert()` in one batch may hit rate limits or transaction size. Mitigation: chunk inserts.
5. **TipTap image upload race conditions** — user pastes 5 images at once. Mitigation: serialize uploads, show progress, defensive UI.

---

## Out of scope (explicitly deferred)

To avoid scope creep, these are NOT in this plan. They're tracked in `06-ROADMAP.md` for v1.x and beyond.

- Real Stripe/Paddle integration
- Google/Apple OAuth (mock buttons stay)
- Realtime cross-device sync
- Data export (JSON)
- Data import / restore
- Native mobile apps
- AI delegation execution pipeline
- Audit logging to server

---

## Decision log

### 2026-05-11 — Plan committed

Plan structure agreed in Slack-style chat session between Stas (PM) and Claude. Phases sequenced for low coupling: Phase 2 plumbing first, Phase 3 swap auth, Phase 4 swap data, Phase 5 ship. Timeline 4-6 weeks pessimistic.

Sample data: client-side seeding via Supabase mutations (not server-side seed function). Lower complexity, fits existing `sampleSeed.ts` design.

Beta payments: skip entirely. All users get All-In by default via `handle_new_user()` trigger in initial migration.
