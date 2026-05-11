# ActOS — Frontend Code Audit

> **Document role:** baseline assessment of the Lovable-exported codebase. Identifies what works, what needs refactoring, and what blocks the backend migration.
> **Date:** 2026-05-11
> **Codebase state:** post-Lovable export, pre-Cursor work.

---

## TL;DR

The codebase is in **considerably better shape than a typical Lovable export**. Lovable was clearly used as a sophisticated UI prototyper with a disciplined PM driving the structure — not as "make me an app and pray." The mock-to-real swap pattern is real, types align with `03-MODEL.md`, and i18n is genuinely 4-locale, not stubs.

**Bottom line for the beta in 4-6 weeks:**
- **No P0 blockers.** The architecture supports backend migration without rewrites.
- **Two P1 items** must be fixed before real Supabase Auth lands.
- **Refactoring work is moderate** — several oversized files, some `any` types, minor duplication.

We can start backend work in parallel with refactoring. Beta in 4-6 weeks is realistic.

---

## Scale

| Metric | Value |
|---|---|
| TypeScript/TSX files (src/) | 172 |
| Total lines of code (src/) | 43,467 |
| shadcn/ui components | 49 |
| App pages (routes) | 36 |
| Admin pages | 8 |
| Locale files | 4 (en, ru, de, es), ~2,064 keys each |
| Largest file | `src/pages/Index.tsx` — 2,007 lines |
| Files >500 lines | 23 |
| Files >1000 lines | 6 |

**Verdict:** medium-sized. Not "two-day audit" small, not "two-month rewrite" large. ~3-5 days of focused refactoring will materially improve maintainability.

---

## Stack inventory

### Confirmed from `package.json`

**Build & runtime:** Vite 5.4, React 18.3, TypeScript 5.8, SWC (via `@vitejs/plugin-react-swc`) — fast HMR.

**UI:** Tailwind 3.4 + shadcn/ui (49 components via Radix UI primitives). `class-variance-authority`, `tailwind-merge`, `clsx` — standard shadcn ecosystem.

**State:** Zustand 5.0 with `persist` middleware → LocalStorage. TanStack Query 5.83 is installed but **barely used** (just `QueryClientProvider` in `App.tsx`). It's ready to host all server state once Supabase lands.

**Forms:** React Hook Form 7.61 + Zod 3.25 + `@hookform/resolvers`. Good.

**Routing:** React Router DOM 6.30. Standard.

**Rich text:** TipTap 3.22 (starter-kit, image, link, placeholder, underline). Used in project descriptions and manifesto admin.

**i18n:** i18next 26.0 + `react-i18next` 17.0 + browser language detector.

**Icons:** `lucide-react` 0.462. Only icon library — clean.

**Toasts:** `sonner` 1.7. shadcn's `Toaster` is also present (in `App.tsx`), so we have two toast systems mounted — see findings below.

**Charts:** `recharts` 2.15.

**Other notable:** `date-fns` 3.6, `cmdk` 1.1 (command palette), `vaul` 0.9 (bottom sheets/drawers on mobile), `input-otp` 1.4 (verification code UI).

**Testing:** Vitest 3.2 + Testing Library. Setup file present, one example test, plus `ActionEditor.statusDropdown.test.tsx`. **Test coverage is essentially zero** — see findings.

### Lovable artifacts

- `lovable-tagger` in devDependencies — used by `vite.config.ts` for component tagging in dev mode. Removable once we leave Lovable behind.
- `.lovable/plan.md` — an internal Lovable execution plan for the i18n batch work. Has historical value, but does not belong in repo. Delete or move to `docs/archive/`.
- `bun.lockb` (272 KB) — Bun lockfile. We're on npm. **Delete this** to avoid future confusion when someone runs `bun install` and gets a different dependency tree.
- README is one line. Needs proper README.

---

## What's working well (preserve these)

### 1. Type definitions align with `03-MODEL.md`

`src/types/index.ts` (253 lines) is a clean, single-file source of truth for entity types. Goal, Project, Action, Ritual, Idea, DayEntry, Session — all match the documented model. Status enums are correct (`backlog | planned | done | delegated | dropped | cancelled` for Action; `active | completed | dropped` for Goal/Project). Subscription tier is `"free" | "all-in"` as designed.

Three `@deprecated` fields are explicitly marked (`energyCost`, `focusCost`, `morningEnergyScore`, `morningIntentNote`, `reflectionText`) — kept for legacy LocalStorage tolerance. That's the right approach.

**No drift between model docs and code.**

### 2. Mock-to-real swap pattern is real

`src/lib/mockAuth.ts` and `src/lib/useAuth.tsx` are properly isolated. Both files contain explicit comments calling out the swap point. The auth context (`useAuth()`) exposes a stable interface (`signUp`, `signIn`, `signOut`, `completeSignup`, `markEmailVerified`, etc.). Consumers (`Auth.tsx`, `AuthVerify.tsx`, `AuthRoute.tsx`) never reach into LocalStorage directly through auth concerns — they go through the hook.

This means: **Supabase Auth migration only touches `useAuth.tsx` and `mockAuth.ts`.** Consumers should compile without changes.

The same pattern shows in `src/lib/manifestoStorage.ts` (CMS storage for manifesto admin) — comment says "Mock LocalStorage; Supabase swap later."

### 3. Store architecture

`src/store/useStore.ts` (1,176 lines) is one large but coherent Zustand store. `partialize` correctly excludes UI state from persistence. Migration logic (`migrate` + `onRehydrateStorage`) handles version 2 schema changes for the deprecated `layers` flag. The store exposes computed selectors (`ritualMultiplier`, `stateIndicator`, `lifetimeCounters`) as pure functions taking `state` — these can be reused server-side later.

`window.__resetStore()` dev utility is useful.

The single store means migration to Supabase will require a careful plan — we'll touch many mutations — but the boundary is clean: one file owns all data ops.

### 4. Route gating works

`src/components/AuthRoute.tsx` provides `RequireAuth`, `RedirectIfAuthed`, `RequireAdmin`. `App.tsx` uses them consistently. Pending-signup resumption logic is correct.

Setup wizard guard (`SetupGuard` in `App.tsx`) and no-goals gate (`NoGoalsGate`) are reasonable layers on top.

### 5. i18n is real, not stubbed

All four locales have ~2,064 keys. Russian has 2,133 (some extra keys for plural forms). Locale files are structured by domain (`common`, `nav`, `actions`, `goals`, etc.) per the plan in `.lovable/plan.md`.

### 6. Type safety is high

35 `any` usages across 172 files is **low** for a generated codebase. Most are in `sampleSeed.ts` (translating TipTap JSON — acceptable) and translator function signatures (`t: (k, opts?: any) => string` — fixable with `TFunction` from i18next).

### 7. Vite alias `@/`

`vite.config.ts` defines `@/` → `./src/`. Consistent use across the codebase. Good.

---

## Findings — by priority

### 🔴 P0 — Beta blockers

**None.** Surprised by this, but the architecture genuinely doesn't have showstoppers. The mock auth works, data persists, the UX is complete enough to ship to friends today on LocalStorage alone.

### 🟡 P1 — Must fix before beta ships

#### P1.1 — Dev port conflict with PriorityOS

`vite.config.ts` hardcodes `port: 8080`. PriorityOS is presumably on the default 5173. So no immediate conflict, but the convention I proposed (PriorityOS=5173, ActOS=5174) is broken. **Decision needed:** keep 8080, or move to 5174 for consistency. Either works; pick and forget.

Also: `host: "::"` (IPv6 all-interfaces) is fine but unusual. `host: true` is the idiomatic Vite way to do the same. Cosmetic.

#### P1.2 — Two toast systems mounted simultaneously

`App.tsx` lines 4-5 import **both** `Toaster as Sonner` and `Toaster` from shadcn. Both are mounted (lines 146-147). This is dead weight — only one is being used (sonner, per `04-FEATURES.md`). Remove the shadcn `Toaster` and its file `components/ui/toaster.tsx` + `components/ui/use-toast.ts` + `hooks/use-toast.ts`. Possibly 200+ lines of dead code.

#### P1.3 — `Login.tsx` is dead code

`src/pages/Login.tsx` is a 32-line placeholder ("Sign in / Coming soon") that's still routed in `App.tsx` (`<Route path="/login" ...>`). The real auth flow is at `/auth`. Two routes pointing to two pages doing the same thing creates confusion. **Delete `Login.tsx`, redirect `/login` → `/auth`.**

#### P1.4 — Admin uses a separate mock identity

`src/admin/adminMock.ts` hardcodes `CURRENT_USER_EMAIL = "admin@actos.app"` and a separate `ADMIN_EMAILS` array. The real `useAuth()` exposes `user.isAdmin: boolean` (see `useAuth.tsx` line 14, and `RequireAdmin` guard). These two systems don't talk to each other.

This is OK during the all-mock phase but **will break in two ways during Supabase migration:**

1. Admin pages bypass `RequireAdmin` because `AdminLayout` is reachable without auth (per `App.tsx` line 170 — `<Route path="/admin" element={<AdminLayout />}>` has no `RequireAuth` wrapper).
2. The "current admin user" in audit logs comes from the hardcoded constant, not from real auth.

**Fix before beta:** wrap `AdminLayout` in `RequireAdmin`, replace `CURRENT_USER_EMAIL` with `useAuth().user.email`. ~30-minute fix.

#### P1.5 — Subscription tier lives in two places

`UserSettings.subscriptionTier` is stored in the persisted Zustand store (`settings`). But `AuthUser.isAdmin` lives in the LocalStorage auth user. When real backend lands, **the subscription tier needs to come from the user record on the server**, not from a local settings flag. Per `03-MODEL.md`, the user entity owns the `subscription` object.

**Action:** move `subscriptionTier` from `UserSettings` to `AuthUser`. This requires migration code for existing LocalStorage users (rare in beta but real users exist).

#### P1.6 — `package.json` has the default Lovable name

`"name": "vite_react_shadcn_ts"`. Cosmetic but embarrassing if anyone sees the repo. **Fix:** change to `"actos"`.

#### P1.7 — Missing README

One-line README. Beta-quality README needed for anyone (including future-you) cloning the repo: install steps, env vars (when we add them), run/build commands, link to `docs/`.

#### P1.8 — Three `console.log` calls in `mockAuth.ts`

Currently leak verification codes to browser console — intentional for testing (TODO comment is there). **These must be stripped when real Supabase email integration ships.** Not a blocker for beta because we'll replace the entire file, but flag it.

### 🟢 P2 — Should fix during refactor batch (post-beta-launch)

#### P2.1 — Oversized files

Six files >1,000 lines. These are not unmaintainable, but they're sliding toward it:

| File | Lines | Reason |
|---|---|---|
| `pages/Index.tsx` | 2,007 | Today page does too much. Contains SampleDataBanner, plan-today flow, close-day flow inline. Split into sub-components per logical zone. |
| `components/ActionEditor.tsx` | 1,448 | One file, many modes (create/edit, modal/slide-in, status transitions). Reasonable to split into composition. |
| `pages/Ideas.tsx` | 1,375 | Page + list + slide-in editor in one file. Editor extracts cleanly. |
| `components/PlanCloseModals.tsx` | 1,234 | Plan-today wizard + close-day recap in one file. Split. |
| `store/useStore.ts` | 1,176 | All entity ops in one place. Could split per-entity (`goalSlice.ts`, `actionSlice.ts`, etc.) using Zustand slice pattern. Decision: maybe defer to backend migration when we re-architect this anyway. |
| `admin/pages/AdminComponents.tsx` | 1,074 | Component smoke-test page. Could lazy-load sections, but low-priority since it's behind admin gate. |
| `components/RitualEditor.tsx` | 1,037 | Same shape as ActionEditor. Split similarly. |

**Refactor strategy:** don't split everything at once. Tackle one file per Cursor session, keep PRs reviewable.

#### P2.2 — `any` types in 35 spots

Mostly in two patterns:
1. `t: (k: string, opts?: any) => string` — use `TFunction` from `react-i18next` instead.
2. `f: any` for sample fixture loading in `lib/sampleSeed.ts` — fix by typing the fixture properly (one big interface).

Worth a single dedicated cleanup PR.

#### P2.3 — LocalStorage scattered across 24 files

75 raw `localStorage`/`sessionStorage` references across 24 files. Mostly legitimate (auth, theme, i18n, sample-data flags, recently-viewed). But several are domain-specific (`actos.setup.completed`, `actos.coachmark.*`, pending-signup, etc.) and should go behind a thin `storage.ts` abstraction.

**Why this matters for backend migration:** anything that's "user state that should sync across devices" needs to move to Supabase. Anything that's "this-browser-only UI preference" stays in LocalStorage. Right now they're indistinguishable.

**Action:** create `src/lib/storage.ts` with two namespaces (`localPref.*` for UI-only, `userState.*` for what needs to sync). Migrate over time.

#### P2.4 — Zero meaningful test coverage

Tests: one example.test.ts, one ActionEditor status dropdown test. That's it. For beta on friends, this is fine. For sustainable development past the beta, we need:

- Unit tests for `store/useStore.ts` computed values (multiplier formula, stateIndicator, goal progress math). These are pure functions; testing is easy.
- Unit tests for `lib/format.ts`, `lib/timeStats.ts`, `lib/sessionUtils.ts`, `lib/weekUtils.ts`, `lib/monthUtils.ts`. Math we care about.
- Integration tests for auth flow (mockable).

**Action:** schedule a "test bootstrapping" sprint after beta launch. Don't block the beta on it.

#### P2.5 — `lovable-tagger` Vite plugin

Plugin runs in dev mode to tag components for Lovable's UI. Removable. Won't affect production builds (already conditional).

#### P2.6 — `Manifesto.tsx` & `AdminManifesto.tsx` storage layer

Both read from `manifestoStorage.ts` which is LocalStorage. When real backend lands, this becomes a Supabase `manifesto_content` table read. Already noted in roadmap, just flagging the touch-point.

#### P2.7 — Mobile mock data in admin store

`adminStore.ts` persists impersonation state to LocalStorage. In multi-user backend, this is per-admin server state. Touch-point flagged.

#### P2.8 — `.gitignore` is incomplete

Missing common entries: `.env`, `.env.local`, `.env.production`, `*.tsbuildinfo`, coverage outputs. Update before we add real env vars.

#### P2.9 — `bun.lockb` should be deleted

We're using npm. Remove the file to prevent rogue `bun install` later.

#### P2.10 — Dev port and HMR overlay

`hmr.overlay: false` in `vite.config.ts` — suppresses the helpful in-browser error overlay. Why? Probably a Lovable workaround. **Remove this** for local dev — we want the overlay.

---

## What's missing (need to add)

### For backend migration (in order)

1. **`src/lib/supabase.ts`** — Supabase client singleton. Reads `import.meta.env.VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
2. **`.env.example`** — committed template; real `.env.local` is gitignored.
3. **Database schema as SQL migrations.** Goes in `supabase/migrations/` once we set up Supabase CLI locally.
4. **Row-Level Security policies.** One per table.
5. **TypeScript types from schema.** Auto-generated via `supabase gen types`.
6. **Real `mockAuth.ts` replacement** — Supabase Auth via `@supabase/supabase-js`.
7. **Server-state hooks** — `useGoalsQuery`, `useCreateGoalMutation`, etc. via TanStack Query (already installed).
8. **Realtime subscriptions** for multi-device sync (deferred per roadmap).

### For deployment

9. **Vercel project setup** + env vars connected to Vercel dashboard.
10. **GitHub Actions** (or Vercel preview deployments) for CI on PRs.
11. **`vercel.json`** if we need any custom config (rewrites, headers).
12. **Sentry SDK** wired into `main.tsx`.
13. **PostHog SDK** wired into `main.tsx` (with consent gate).
14. **Resend integration** as Supabase Edge Function (for verification emails).

### For product polish before beta

15. **Error boundary** at app root. Currently a runtime error nukes the entire page.
16. **Loading states** review — TanStack Query helps here once it's actually used.
17. **404 page** exists (`NotFound.tsx`) — but uses `console.error` on every 404 hit. Strip or send to monitoring.

---

## Recommended remediation order

### Phase 1 — Hygiene (1 day, before backend work)

These are pure cleanup, no architectural change. Do them in Cursor in one focused session.

1. Delete `bun.lockb`
2. Delete `Login.tsx`, redirect `/login` → `/auth` in `App.tsx`
3. Remove dual toast system (keep sonner, delete shadcn `toaster.tsx` + `use-toast`)
4. Rename `package.json` `name` to `"actos"`
5. Update `.gitignore` (add `.env*`, `*.tsbuildinfo`, `coverage/`)
6. Remove `hmr.overlay: false` from `vite.config.ts`
7. Move port to 5174 (or decide on 8080)
8. Move `.lovable/plan.md` to `docs/archive/lovable-i18n-plan.md` (or delete)
9. Write proper `README.md`

### Phase 2 — P1 fixes (1 day, before real auth lands)

1. Wrap `AdminLayout` in `RequireAdmin`
2. Replace `CURRENT_USER_EMAIL` constant with `useAuth().user.email` in admin code
3. Move `subscriptionTier` from `UserSettings` to `AuthUser` (with migration code)

### Phase 3 — Backend foundation (3-5 days)

This is where real work starts. Separate plan needed (`14-BACKEND-PLAN.md` — coming next).

### Phase 4 — Refactor batch (post-beta, ongoing)

Split oversized files. Remove `any` types. Bootstrap real test coverage.

---

## Open questions for product/PM (Stas)

1. **Port 8080 or 5174 for local dev?** No technical difference, just convention.
2. **`.lovable/plan.md` — keep as history (`docs/archive/`) or delete?** It's a Lovable internal artifact, no longer authoritative.
3. **Admin route policy** — should `/admin` be invite-only via `isAdmin` flag (current intent), or always require Supabase Auth user with role claim from JWT (more rigorous, requires more setup)? For beta with 30 friends, the simpler flag-on-user-row approach is fine. Flagging for awareness.
4. **Sample data after real signup** — current flow: Setup Wizard either gives sample workspace or empty. With Supabase, do we seed sample data server-side on user creation, or keep client-side seeding? Recommendation: keep client-side, less server complexity.
5. **`Login.tsx` deletion confirms** — your /login route is unused, right? Or are you sending the friends links to /login somewhere?

---

## Conclusion

The codebase is materially better than I expected from a Lovable export. The mock-to-real swap pattern is honored, types match docs, i18n is real, and there are no architectural roadblocks for the planned beta.

**~2 days of cleanup** (Phase 1 + Phase 2) gets us to a clean baseline. From there, backend migration runs in parallel with the refactor of oversized files. Beta in 4-6 weeks is realistic.

Next document: `14-BACKEND-PLAN.md` — concrete Supabase schema, migration order, deployment steps.
