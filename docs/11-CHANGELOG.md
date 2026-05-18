# ActOS — Changelog

> **Document role:** running log of significant product changes by date.
> **Read alongside:** `06-ROADMAP.md` (planned scope), `08-DESIGN-DECISIONS.md` (rationale), `15-TECH-DEBT.md` (open items).

---

## How to use this document

One entry per significant change. Most recent first. Each entry has:
- Date (YYYY-MM-DD).
- Milestone/category tag in brackets (e.g. `[Fix]`, `[M8]`, `[Infrastructure]`).
- Short title.
- Bullet list of what changed (5-10 lines).
- Optional pointer to the documents where details live.

Trivial fixes, copy tweaks, and visual polish do not earn an entry.

---

## 2026-05-17 [Fix] — Setup wizard UI cleanup: StepIndicator removed

Removed obsolete step counter from the simplified 2-screen wizard.

- `<StepIndicator n={1} />` removed from ThemeScreen render block.
- StepIndicator component definition kept in Setup.tsx for potential future redesign that wants step indication back.
- ChoiceScreen (now inert dead code) still references StepIndicator — left untouched per "preserve for future redesign" rule.
- Single-line change.

---

## 2026-05-17 [Fix] — Setup wizard UX polish: verify flash, sample seed race, card design restored

Three issues consolidated into one commit. All surfaced during manual testing of the wizard simplification (see prior entry).

**Issue 1 — AuthVerify flash:**
After OTP verify, user briefly saw `/auth` page and sometimes `/today` before redirecting to `/setup`. Root cause: `navigate('/setup')` fired before `useAuth().user` propagated via Supabase's `onAuthStateChange`. RequireAuth saw `user=null`, redirected to `/auth`. Then state propagated and re-redirected.

Fix in `src/pages/AuthVerify.tsx`:
- New state `verifiedAwaitingAuth` — set true on verify success, keeps "Verifying..." button visible
- New `useEffect([verifiedAwaitingAuth, user])` — waits for user truthy, then navigates to /setup with `replace: true`
- Safety timeout of 5s falls back to navigate anyway if state never propagates
- Early-return to /today suppressed during the propagation window

**Issue 2 — Sample data flash on /today:**
After "Try with sample data" → /today briefly showed "Create your first goal" empty-state prompt for 2-3 seconds before sample data lands. Root cause: 7 sequential Supabase inserts (~1-3s) ran fire-and-forget while user advanced through Theme screen faster.

Fix in `src/pages/Setup.tsx` (hybrid await pattern):
- `seedPromiseRef` holds the in-flight seed promise
- `finishing` state drives Theme Continue button spinner
- `pickSample` captures promise with no-op `.catch` (prevents unhandled-rejection on wizard abandon), advances to Theme
- `finish` awaits the promise inside try/catch (toast error fallback), then marks completed + navigates
- `ContinueCTA` gains `loading?: boolean` prop with Loader2 spinner + `setup.theme.continueLoading` label

If seed fails, error toast surfaces and user still lands on /today — never trapped.

**Card design restore:**
After the wizard simplification, Welcome screen had 2 plain rectangular buttons. User flagged the visual regression. Restored card-style layout from the inert ChoiceScreen:
- 2-card grid, `max-width: 880`, `auto-fit minmax(280px, 1fr)`, gap 6
- Each card: `border-radius: 8`, padding 32, minHeight 260
- Icons (Sparkles for sample / Target for fresh) + heading 20px + description 14px secondary
- Hover state: border subtle→default, surface base→hover
- Click triggers `onPickSample` / `onPickFresh` directly — no two-step Continue

i18n changes:
- Added: `setup.theme.continueLoading`, `setup.sampleSeedError`
- Overwrote: `setup.choice.own.body` to match new behavior (old text promised Goal Builder which no longer launches from here). New copy: "Start with an empty workspace. Create your first goal when you're ready."
- Removed: `setup.welcome.trySample`, `setup.welcome.startFresh` (replaced by card design)

Details: SESSION-REPORT 2026-05-17.

---

## 2026-05-17 [Fix] — Setup wizard simplified: DB flag instead of localStorage, login no longer triggers wizard

Architectural fix to the setup wizard's re-trigger problem and sample-data accumulation.

**Problem:**
- Setup wizard re-triggered on every login because the localStorage flag `actos.setup.completed` was cleared by signOut sweep and leaked between users on shared devices
- Sample data accumulated in user accounts (5 goals visible at one point: 2 real + 3 sample)
- "Set up my first goal" wizard path duplicated the inline "Create your first goal" prompt on /today

**Resolution:**

Migration `supabase/migrations/20260517000000_user_setup_flag.sql`:
- New column `public.users.has_completed_initial_setup boolean NOT NULL DEFAULT false`
- Backfill: `WHERE created_at < now()` (broader heuristic) marks all existing users as completed so no current user ever sees the wizard again

New `src/lib/queries/useUserSetup.ts`:
- `useUserSetupFlagQuery` reads the flag via TanStack Query
- `useMarkSetupCompletedMutation` writes optimistically

Code changes:
- `src/App.tsx` — SetupGuard refactored to read DB flag, removed legacy localStorage logic and the "actos-store exists" heuristic
- `src/pages/Setup.tsx` — wizard collapsed from 4 screens to 2:
  - Old: Welcome → Theme → Choice (Sample/Goal) → Pause/Builder
  - New: Welcome (with 2 buttons for sample/fresh choice) → Theme → /today
  - "Set up my first goal" path removed — inline /today prompt suffices for users with no goals
  - ChoiceScreen + PauseScreen retained as inert dead code per "preserve for future redesign" rule
- `src/lib/sampleSeed.ts` — removed stale `actos.setup.sampleDataSeeded` localStorage write
- `src/lib/queryKeys.ts` — added userSetup key
- i18n: `setup.welcome.trySample` + `setup.welcome.startFresh` keys added × 4 locales (later replaced by card design — see next-day entry)
- `docs/15-TECH-DEBT.md` updated: partially-addressed marker for "Setup/onboarding inline redesign"; parallel `useIdeas.ts:297` bug flagged

`/onboarding/goal` route preserved — used by 9+ live call sites (CommandPalette, KeyboardShortcuts, goalGuard, Index inline prompt, AllProjects, AllActions, Rituals).

Verified: 5 manual localhost tests passed (existing-user login, sign out + sign in, fresh signup + Start fresh, fresh signup + Try with sample data, DB flag persistence). `tsc` + `npm run build` clean.

---

## 2026-05-17 [Fix] — Project description double-encoding bug + idea conversion bug flagged

Critical bug in production: project descriptions accumulated escape characters on every save. `<p>Hello</p>` became `"\"\\\"<p>Hello</p>\\\"\""` and continued growing exponentially.

**Root cause.** `src/lib/rowMappers.ts` called `JSON.stringify(project.description)` on both insert and update paths. supabase-js itself JSON-encodes the entire request body — double-encoding. Read path never called `JSON.parse` — asymmetric. Each save added one escape layer.

**Fix.**
- `src/lib/rowMappers.ts:230-231, 251-253` — removed `JSON.stringify`. Description now passes through as a plain string. supabase-js handles JSON-encoding of the request body itself; a plain string lands in the jsonb column as a valid JSON-string value
- Header comment at lines 20-21 updated to document new contract
- `scripts/repair-project-description-escaping.ts` — one-off TypeScript script via supabase-js + service role connection. Reads all projects, peels accumulated JSON layers using stable fixed-point algorithm (repeated `JSON.parse` until result stops changing or stops being valid JSON-text). Dry-run mode (default) prints "would update N rows" with 3 before/after samples. `--apply` flag writes UPDATE batches in parallel of 10. Idempotent — re-running on already-clean rows is a no-op.

**Repair execution.**
- Dry-run on production: identified 40 projects needing repair, 0 already clean
- Apply mode result: `Updated 40 of 40 projects.`

**Bonus catch flagged.** Same JSON.stringify pattern in `src/lib/queries/useIdeas.ts:297` (RPC payload to `convert_idea_to_project`). Different code path, same bug class. Logged as P3 tech debt in `docs/15-TECH-DEBT.md`. Will be fixed in a future commit bundled with related work.

Details: SESSION-REPORT 2026-05-17.

---

## 2026-05-13 [Phase 4 Session 2] — Migrate Rituals, Ideas, Day Entries, Sessions to Supabase

Final data migration of Phase 4. All user data now lives in Supabase via TanStack Query. Zustand store reduced to UI state + preferences only.

- Net `useStore.ts`: 693 → 115 lines (-578)
- New `src/lib/queries/useRituals.ts` — 9 mutations + query (create, update, delete, archive, complete/uncomplete-for-date, skip/reopen/markMissed instance)
- New `src/lib/queries/useIdeas.ts` — 6 mutations + query, 2 use Postgres RPCs (capture, update, convertToAction, convertToProject, discard, moveToGoal)
- New `src/lib/queries/useDayEntries.ts` — `useUpsertDayEntryMutation` consolidates startDay/startDayPlan/updateDayEntry + `useCloseDayMutation` + `useReopenDayMutation`
- New `src/lib/queries/useSessions.ts` — 9 mutations + query (createDraft, complete, abort, addCompleted/Dropped/Planned, incrementCycles, setReflection, delete)
- New `src/lib/sampleDataActions.ts` — `useSeedSampleData` + `useClearSampleData` hooks
- New `scripts/fixture-to-uuid.py` — one-off transform of sample fixture short IDs to UUIDs
- New migration `20260513000000_idea_conversion_rpcs.sql` — Postgres RPCs for atomic idea conversion (SECURITY DEFINER + RLS check). Closes P1 cross-store conversion atomicity tech debt.
- New migration `20260513000001_drop_ritual_total_completions.sql` — column no longer read (derived from completion array at rowMapper boundary)
- Deleted: `src/lib/storeQueryRef.ts` — bridge no longer needed; 4 consumers migrated to direct cache reads via useQueryClient or useActiveGoals
- Deleted: `completeSignup` shim in `useAuth.tsx` (P2 tech debt closed)

**Implementation decisions:**
- Ritual `totalCompletions` derived from joined `ritual_completions` array at rowMapper boundary — eliminates the atomicity gap that would have been P1 tech debt
- Day entries 3-mutator API consolidated to upsert with `onConflict: 'user_id,date'`
- Idea conversion via Postgres RPCs (SECURITY DEFINER + RLS check) closes the cross-store conversion atomicity
- `clearSampleData` uses 7 sequential DELETEs with `is_sample = true` filter
- Setup Wizard sample seed extended to push all 7 entity types in dependency order

**Bug fixes included:**
- Sample fixture short IDs (`g1`, `p1`, etc.) replaced with UUIDs via one-off Python script
- Multi-user sample seed: lazy `oldId → newId` remap in `sampleDataActions.ts` prevents 409 conflicts on second seed
- `signOut` localStorage cleanup expanded to sweep entire `actos.*` namespace (keep allowlist: `actos.theme`, `actos.i18n.language`, `actos-session-sound` + `actos.cms.*` prefix). Closes security gap where sign-out left previous user's state for next user on shared device.

Verified: `tsc`, `npm run build` clean. 3 fresh signups on localhost, all 7 entity types seeded successfully. Cross-user isolation verified. All entity CRUD operations tested.

---

## 2026-05-13 [Docs] — Changelog + new tech-debt registry

- New `docs/15-TECH-DEBT.md` — explicit P1/P2/P3 registry replacing the loose "Known technical debt" sections that were scattered across `12-TECH-STACK.md` and `FRONTEND-AUDIT.md`. Includes status (Active/Resolved), location, issue, workaround, proper fix, scheduling.
- Existing 11-CHANGELOG entries through 2026-05-13 reviewed and confirmed accurate.

---

## 2026-05-13 [Docs] — Architecture + backend plan refreshed to post-Phase-4 reality

- `13-ARCHITECTURE.md` updated to reflect Zustand-as-UI-only-state after Phase 4 Session 2
- `14-BACKEND-PLAN.md` updated: all Phases marked Done. Phase 4 broken into Session 1 (Goals/Projects/Actions) and Session 2 (Rituals/Ideas/DayEntries/Sessions). Phase 5 (deployment + actos.io) confirmed Done.
- Diagrams updated: removed transitional "becomes source of truth in Phase 2" notes

---

## 2026-05-13 [Docs] — CLAUDE.md + .cursorrules refresh

- Both files refreshed to reflect post-Phase-4 reality
- Removed obsolete patterns (LocalStorage as source of truth, "Lovable export" mindset)
- Added: TanStack Query patterns, optimistic write pattern, RLS testing requirement
- Atomic commit requirement reinforced

---

## 2026-05-13 [Perf] — Persist TanStack Query cache to localStorage

- TanStack Query cache now persisted via `createSyncStoragePersister` (built-in)
- On reload: cache hydrated instantly from localStorage before Supabase responds
- User sees app shell + last-known data immediately, then live data swaps in
- Reduces perceived load time on /today, /goals, /projects to essentially instant
- One deprecation warning surfaced from TanStack (`createSyncStoragePersister`); logged as P2 tech debt

---

## 2026-05-12 [Phase 4 Session 1] — Migrate Goals, Projects, Actions to Supabase

First half of the data migration. Goals, Projects, Actions now live in Supabase via TanStack Query. Pattern established for Session 2.

- New `src/lib/queries/useGoals.ts`, `useProjects.ts`, `useActions.ts` — full CRUD + custom mutations (close-and-continue, split, archive, etc.)
- New `src/lib/rowMappers.ts` — DB ↔ domain mapping at the boundary. All entity Row/Insert/Update types live here.
- New `src/lib/supabase.types.ts` — generated via `supabase gen types typescript --linked`
- `useStore.ts` reduced significantly — Goals/Projects/Actions slices removed, only UI state remains for these entities
- Optimistic writes everywhere — UI updates instantly, rolls back on error
- All consumers (pages, modals, ActionEditor, GoalBuilder, etc.) migrated from Zustand selectors to TanStack hooks

Action timeline writes split into separate INSERT — flagged as P1 atomicity tech debt (action UPDATE + timeline INSERT are not transactional, edge case for write failures mid-call).

---

## 2026-05-12 [Phase 3] — Real auth via Supabase

- Mock auth (`useAuth.tsx` with LocalStorage `actos.auth.user`) replaced with real Supabase Auth integration
- Sign up: real account creation in `auth.users`, magic-link OTP via Resend
- Sign in: Supabase email/password authentication
- `/auth/verify`: real 6-digit OTP verification via `supabase.auth.verifyOtp`
- Sign out: clears Supabase session + sweeps `actos.*` LocalStorage namespace
- RequireAuth guard reads `useAuth().user` (now Supabase user object, not LocalStorage blob)
- All existing UI integrations adapted to new shape
- `completeSignup` shim preserved temporarily (closed in Phase 4 Session 2)
- `handle_new_user` trigger creates `public.users` row on `auth.users` INSERT
- All beta users get All-In tier by default via the same trigger

---

## 2026-05-12 [Phase 5] — Deployment + actos.io live

- Vercel project linked to GitHub repo, auto-deploy on push to main
- Domain `actos.io` connected via Cloudflare DNS
- Environment variables configured: SUPABASE_URL, SUPABASE_ANON_KEY, public site origin
- Email sender `noreply@actos.io` verified in Resend, TXT records added in Cloudflare
- Production smoke test: signup → verify → sign in flow all working from actos.io

---

## 2026-05-11 [Infrastructure] — Lovable export → local repo, Phase 1 hygiene pass, backend plan locked

End of in-Lovable phase. Project moved to a local Cursor + Claude Code workflow against `github.com/StasVa/actos`. Phase 1 (hygiene) shipped in two clean commits.

**Local environment setup:**
- SSH keys generated for GitHub (replaces HTTPS auth used in PriorityOS sister project)
- Repo cloned to `~/Documents/actos`. PriorityOS at `~/Documents/priority-os` stays untouched and parallel
- `npm install` baseline established; 19 audit vulnerabilities reduced to 5 safe dev-only ones
- AI agent context files added at repo root: `.cursorrules` and `CLAUDE.md`

**Phase 1 hygiene (committed):**
- `package.json` renamed `vite_react_shadcn_ts` → `actos`. Version 0.0.0 → 0.1.0
- Vite dev port 8080 → 5174 (avoids PriorityOS on 5173). `strictPort: true` added
- `lovable-tagger` plugin removed (dev-only Lovable artifact)
- `bun.lockb` deleted (we use npm)
- `.lovable/plan.md` folder deleted
- `Login.tsx` placeholder deleted; `/login` redirects to `/auth`
- Duplicate shadcn Toaster system removed (kept sonner)
- `.gitignore` expanded
- `README.md` rewritten from 1-line placeholder

**Frontend audit baseline (`FRONTEND-AUDIT.md`):**
- 172 TS/TSX files, 43,467 lines. 49 shadcn components, 36 app pages, 8 admin pages
- Zero P0. 8 P1 (7 closed in Phase 1). 10 P2

**Backend stack locked:**
- Hosting: Vercel + Supabase US-region. Email: Resend. Monitoring: Sentry + PostHog
- Payments deferred — all beta users get All-In tier via Supabase trigger
- Domain: `actos.io`

**New documents:**
- `12-TECH-STACK.md`, `13-ARCHITECTURE.md`, `14-BACKEND-PLAN.md`, `FRONTEND-AUDIT.md`

---

## 2026-05-11 [Docs] — Knowledge base audit + public site / auth alignment

Full pass through all 12 knowledge files to bring documentation in sync with the work done in this session (public landing system, manifesto page, pricing page, auth flow, inline verification, admin editor, public i18n, language switcher, sample data localization). 9 of 12 files updated.

---

## 2026-05-11 [Marketing] — Inline email verification during signup (replaces background banner)

Replaced the deferred "verify your email" banner with inline 6-digit code prompt right after signup. Apple ID / Slack pattern.

---

## 2026-05-11 [Architecture] — Sample data localization: 4 locales

Sample workspace dataset translated into RU/DE/ES alongside English. Closes a deferred item from the M8.5 i18n batch.

---

## 2026-05-11 [Admin] — Manifesto admin editor at /admin/manifesto

WYSIWYG editor for founder to edit manifesto content without code pushes. Built on TipTap (ProseMirror). Mock LocalStorage storage now; Supabase swap later.

---

## 2026-05-09 [UX] — No-goals mode → goal-builder onboarding

Empty-state goal-builder treatment for users without any goals. Replaces scattered empty-state copy across all entity pages.

---

*(Earlier entries unchanged — see project knowledge for full history.)*
