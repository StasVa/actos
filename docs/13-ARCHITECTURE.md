# ActOS — Architecture

> **Document role:** how the pieces of ActOS connect. Mental model for understanding data flow, authentication, and state.
> **Read alongside:** `12-TECH-STACK.md` (what we use), `14-BACKEND-PLAN.md` (when each piece arrives), `03-MODEL.md` (entity definitions).
> **Audience:** anyone who needs to understand how a user action becomes a database write.
> **Last updated:** 2026-05-13

---

## System overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          USER BROWSER                            │
│                                                                  │
│  React SPA (Vite-bundled)                                        │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Pages (routes)                                          │    │
│  │   └─→ Hooks (useAuth, useGoals*, useProjects*, ...)      │    │
│  │        └─→ Zustand store (UI state, persisted entities)  │    │
│  │        └─→ TanStack Query (server data) ────────────┐    │    │
│  │                                                     │    │    │
│  │  *strangler in progress (Phase 4 Session 2):        │    │    │
│  │   goals/projects/actions migrated, rest pending     │    │    │
│  └─────────────────────────────────────────────────────┼────┘    │
│                                                        │         │
│  Persistence (split, Phase 4 Session 2 pending):       │         │
│    LocalStorage  ←─ non-migrated entities + prefs      │         │
│    Supabase      ←─ migrated entities (Layer 3 detail) │         │
└────────────────────────────────────────────────────────┼─────────┘
                                                         │
                            HTTPS                        │
                            ────                         │
                                                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                          VERCEL (CDN)                            │
│                                                                  │
│  Serves: index.html, JS bundle, CSS, static assets               │
│  Domain: actos.io                                                │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                       SUPABASE (US-region)                       │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │
│  │ Auth        │  │ Postgres    │  │ Storage     │  │ Edge fns │ │
│  │ - signup    │  │ - users     │  │ - project   │  │ - stripe │ │
│  │ - signin    │  │ - goals     │  │   images    │  │   webhook│ │
│  │ - verify    │  │ - projects  │  │ - manifesto │  │ - email  │ │
│  │ - reset pwd │  │ - actions   │  │   media     │  │   trigger│ │
│  │             │  │ - rituals   │  │             │  │          │ │
│  │             │  │ - ideas     │  │             │  │          │ │
│  │             │  │ - day_entry │  │             │  │          │ │
│  │             │  │ - sessions  │  │             │  │          │ │
│  │             │  │ + RLS rules │  │             │  │          │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────────┘ │
│         │              │                                  │      │
└─────────┼──────────────┼──────────────────────────────────┼──────┘
          │              │                                  │
          ▼              ▼                                  ▼
   ┌──────────────────────────┐               ┌──────────────────┐
   │  RESEND                  │               │  STRIPE/PADDLE   │
   │  Transactional email     │               │  Payments        │
   │  - Verification codes    │               │  (post-beta)     │
   │  - Password resets       │               │                  │
   └──────────────────────────┘               └──────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                       OBSERVABILITY                              │
│  Sentry — runtime errors from browser                            │
│  PostHog — events, sessions, feature flags                       │
└──────────────────────────────────────────────────────────────────┘
```

---

## The three layers of state

ActOS has three distinct state categories. Confusing them is the #1 source of architectural mistakes.

### Layer 1 — UI state

**What:** open dialogs, hover states, selected tabs, "is this dropdown open", focus rings.
**Where lives:** React component local state (`useState`, `useReducer`).
**Persisted?** No. Reset on page reload.
**Example:** `const [confirmOpen, setConfirmOpen] = useState(false)`.

**Don't put this in Zustand or Supabase.** Pure local state.

### Layer 2 — Client-only preferences

**What:** theme (dark/light), current language, "I dismissed this banner", "I've seen this coachmark", recently-viewed items.
**Where lives:** LocalStorage, via small dedicated keys (`actos.theme`, `actos.i18n.language`, `actos.coachmark.X.dismissed`).
**Persisted?** Yes — in browser. Does NOT sync across devices. Intentionally.
**Example:** Setting theme to dark on desktop should not change it on mobile. Different device, different preference.

**Don't put this in Supabase.** It's intentionally local.

### Layer 3 — User data

**What:** goals, projects, actions, rituals, ideas, day entries, sessions, the user record itself.

**Where lives, today (split):** migrated entities (goals/projects/actions) → Supabase Postgres, fetched via TanStack Query, mirrored in browser by TanStack's cache (persisted to LocalStorage under `actos-query-cache`). Non-migrated entities (rituals/ideas/day entries/sessions) → Zustand store, persisted to LocalStorage under `actos-store` key.

**Persisted?** Yes. Migrated entities sync across devices. Non-migrated entities are still per-device until Session 2.

**This is what we've migrated and continue to migrate.** Phase 4 split into Session 1 (✅ done 2026-05-13: goals/projects/actions) and Session 2 (⏳ pending: rituals/ideas/day entries/sessions). Layers 1 and 2 don't change.

---

## Authentication flow

### Today (Supabase Auth)

```
[Signup form]
    ↓
useAuth().signUp({name, email, password})
    ↓
src/lib/useAuth.tsx → calls @supabase/supabase-js auth.signUp()
    ↓
Supabase creates user, triggers email via Resend (Edge Function)
    ↓
Redirect to /auth/verify
    ↓
User opens email, gets 6-digit code, enters it in browser
    ↓
auth.verifyOtp() → Supabase verifies → returns session JWT
    ↓
Session stored in Supabase client (httpOnly cookie + localStorage)
    ↓
Redirect to /setup → /today
```

**Crucially:** the React layer above `useAuth()` doesn't know which backend is behind it. That's the swap pattern.

### Auth guards

`RequireAuth`, `RedirectIfAuthed`, `RequireAdmin` (in `src/components/AuthRoute.tsx`) wrap routes. They read `useAuth()`. They don't change with the backend migration.

`RequireAdmin` checks the `is_admin` flag on the Supabase `users` row.

---

## Data flow — example: user marks an action as Done

### Today — actions (migrated, on TanStack + Supabase)

```
1. User clicks checkbox on ActionRow
2. onClick handler calls completeActionMutation.mutate(id)
3. TanStack Query mutation runs:
   - Optimistic update: cache updated immediately (UI reflects done state)
   - Sends PATCH to Supabase via Supabase JS client
   - Supabase validates via RLS: this user owns this action? yes → proceeds
   - Database trigger appends to action_timeline table
   - On success: TanStack invalidates affected queries (action list refetches)
   - On error: rolls back optimistic update + shows toast
4. UI never blocks on network — optimistic update handles it
```

**Note:** rituals, ideas, day entries, and sessions still follow the older Zustand+LocalStorage pattern until Phase 4 Session 2. Components call `useStore.getState().X(...)` for those entities; switch to verb-specific mutation hooks after Session 2.

---

## Database schema

Full DDL lives in `14-BACKEND-PLAN.md`. Quick reference of tables and their relationships:

```
users
  ├── id (uuid, PK, = auth.users.id)
  ├── email, display_name, avatar_seed
  ├── subscription_tier, subscription_started_at, billing_cycle, ...
  ├── is_admin (boolean)
  ├── created_at, updated_at
  │
  ├──< goals (user_id FK)
  │       └──< projects (goal_id FK)
  │              └──< actions (project_id FK, goal_id FK)
  │                      └──< action_timeline (action_id FK)
  │
  ├──< rituals (user_id FK, goal_id FK, project_id FK nullable)
  │       └──< ritual_completions (ritual_id FK)
  │
  ├──< ideas (user_id FK, goal_id FK)
  ├──< day_entries (user_id FK)
  ├──< sessions (user_id FK)
  └──< project_references (project_id FK)
```

All user-data tables have:
- `user_id` (FK to `users.id`)
- RLS policy: `user_id = auth.uid()`
- Timestamps: `created_at`, `updated_at` (auto-updated via trigger)

---

## Row Level Security (RLS) — the security model

Every user-data table has RLS enabled. The basic policy:

```sql
-- Example for `goals` table
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own goals"
  ON goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals"
  ON goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
  ON goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
  ON goals FOR DELETE
  USING (auth.uid() = user_id);
```

**Effect:** even if our client code is buggy or compromised, a user cannot see or modify another user's data — Postgres refuses the operation at the database level.

**Admin operations** (e.g., admin dashboard) use a separate service-role key (server-side only, never shipped to the browser) that bypasses RLS. This will live in Edge Functions.

---

## File storage flow

### Project description images (TipTap-embedded)

```
User drops image into TipTap editor (in project description)
    ↓
React handler reads File object
    ↓
Converts to base64 data URL, stores inline in description JSON
    ↓
Description JSON saved to Supabase as projects.description JSONB
    ↓
On render: <img src="data:image/...;base64,..." />
```

**Supabase Storage migration deferred to v1.x.** Confirmed at Phase 4 Session 1 start: minimal user impact at beta scale (modest image use, 30 users); avoids a bucket-policy migration that doesn't unblock launch. When revisited: bucket `project-media`, path `{user_id}/{uuid}.{ext}`, public reads + RLS uploads constrained to caller's `user_id` prefix.

---

## Email flow

```
[Trigger event — e.g. signup verification]
    ↓
Frontend calls Supabase auth.signUp()
    ↓
Supabase generates code, stores in auth.flow_state
    ↓
Database webhook triggers Edge Function `send-verification-email`
    ↓
Edge Function calls Resend API with template
    ↓
Resend delivers email to user
    ↓
User receives email with 6-digit code
    ↓
User enters code in /auth/verify
    ↓
Frontend calls auth.verifyOtp()
    ↓
Supabase validates → returns session
```

**Resend domain configuration:**
- Sending domain: `mail.actos.io` (subdomain) or apex `actos.io`
- DKIM/SPF/DMARC records added in Cloudflare DNS
- Resend API key stored as Supabase Edge Function secret (never client-side)

---

## Hosting and request paths

### A user visits actos.io

```
Browser → DNS (Cloudflare) → Vercel CDN
    ↓
Vercel serves cached index.html + JS bundle
    ↓
React app boots in browser
    ↓
useAuth() checks session
    ↓
If authed → redirect to /today, hydrate from TanStack cache + LocalStorage, refetch migrated entities from Supabase
If not authed → show landing page (purely client-rendered)
```

### A user takes an action requiring server data

```
React component calls hook (e.g. useGoalsQuery())
    ↓
TanStack Query → Supabase JS client → HTTPS to Supabase API
    ↓
Supabase API checks JWT → applies RLS → returns rows
    ↓
TanStack Query caches result, component renders
```

### Static assets (images, fonts)

Served from Vercel's edge CDN. No round-trip to origin. Cache headers set by Vite build.

---

## TanStack Query cache persistence

### What's persisted

The TanStack Query cache is persisted to `window.localStorage` via `createSyncStoragePersister`. Storage key: `actos-query-cache`. Setup in `src/lib/queryClient.ts`; consumed by `App.tsx` via `PersistQueryClientProvider`.

### Why persist

Cache survives full page reload — users see migrated entities (goals, projects, actions) instantly on revisit instead of waiting for the network. The cache then hydrates against Supabase in the background; stale data is updated if it diverges.

### signOut cleanup gotcha

`persister.persistClient` is throttled (1000ms default) — calling `persister.removeClient()` once during sign-out is not enough: a queued write can land *after* the remove and re-populate localStorage with the previous user's data. The fix in `src/lib/useAuth.tsx`:

```typescript
await persister.removeClient();
setTimeout(() => { void persister.removeClient(); }, 1100);
```

The 1100ms exceeds the 1000ms throttle window, so any trailing write is no-op'd by the second remove. Don't drop the second `removeClient` — silently leaks cache across user sessions on shared devices.

---

## Why this architecture (not something else)

### Why not a separate Node.js backend?

We considered it. Three reasons we didn't:

1. **Auth + RLS in Supabase is too good to pass up.** Building equivalent in raw Node would take weeks.
2. **Single developer.** Every server we run is something to monitor, patch, scale.
3. **Edge Functions cover what we need.** Webhooks (Stripe), email triggers, occasional server-side validation — all fit in Edge Functions without a full Node server.

### Why not Firebase?

- Firestore is not SQL. Our data model is highly relational (Goal → Project → Action chains). Modeling it in NoSQL would require denormalization that hurts in a single-user app.
- Firebase Auth is fine but doesn't give us RLS-equivalent at the database level.
- Vendor lock-in to Firebase is worse than Supabase (Supabase = Postgres which is portable).

### Why not Next.js?

- We don't need SSR (every meaningful route is authed).
- Marketing pages (landing, manifesto, pricing) are simple enough that client-side rendering + Vercel CDN serves them in under 1s — good enough for SEO.
- Migration from Vite → Next would be 2-4 weeks of work for no user-visible benefit.

We'll reconsider Next.js if/when:
- We need ISR for blog content (post-beta)
- We need server-side rendering for SEO of dynamic content (n/a now)
- We add server-rendered admin tools

### Why one big Zustand store, not many slices?

After Phase 4 Session 1: one store (`src/store/useStore.ts`, 693 lines, down from 1,171 pre-migration — −478 lines net). Goals/projects/actions migrated to TanStack Query. Remaining in store: UI state, rituals, ideas, day entries, sessions — all targeted for Session 2. Re-evaluate splitting if it grows past 1,500 lines or causes performance issues.

---

## Open architectural questions

These are real questions we haven't resolved. Each should resolve in upcoming phases.

1. **Realtime sync** — do we enable Supabase Realtime for cross-device updates in v1, or defer to v1.x? Defer is currently planned (per `06-ROADMAP.md`), but the data shape supports it from day one.

2. **Optimistic update conflict resolution** — if user edits same goal on two devices, who wins? Default: last-write-wins (overwrites). Good enough for single-user product. Revisit if/when conflicts become user-visible.

3. **Sample data seeding** — confirmed in this session: stay client-side. Setup Wizard "Show me how it works" path seeds locally. After login, it then syncs to Supabase like any other user data. Server-side seeding rejected (more complexity, no benefit).

4. **Service-role key for admin tools** — `/admin/components`, `/admin/manifesto` — do they call Supabase with service-role (bypassing RLS) or use regular user session? For beta: regular session is fine, RLS allows admins via `is_admin` flag check in policies. Post-beta, may need service-role for cross-user analytics.

5. **Audit logging** — admin actions (impersonation, edits) currently log to in-memory + LocalStorage. After Phase 2 these need to log to a server table for compliance. Schema TBD.

---

This document evolves with the system. Update it when the architecture changes, not when individual features change.
