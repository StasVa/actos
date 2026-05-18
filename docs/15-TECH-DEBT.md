# ActOS — Technical Debt Registry

> **Document role:** explicit registry of known technical debt items, priorities, and disposition. Replaces the loose "Known technical debt" sections that were scattered across `12-TECH-STACK.md` and `FRONTEND-AUDIT.md`.
> **Read alongside:** `11-CHANGELOG.md` (what was actually shipped), `13-ARCHITECTURE.md` (system shape), `14-BACKEND-PLAN.md` (phase milestones).
> **Last updated:** 2026-05-17

---

## How this document works

Items have:
- **Priority**: P0 (security/data loss/blocker), P1 (functional bug or critical user-facing), P2 (UX/refactor before beta), P3 (post-beta cleanup).
- **Status**: Active or Resolved.
- **Location**: file:line or component name.
- **Issue**: what's wrong.
- **Workaround**: what users / contributors should do now.
- **Proper fix**: what we'll do when we get there.
- **When**: scheduled milestone or "post-beta".

Resolved items stay in the registry as a historical record. Move to bottom under "Resolved" once a commit closes them.

---

## Active items

### P1 — `useIdeas.useConvertIdeaToProjectMutation` double-encodes description

**Location:** `src/lib/queries/useIdeas.ts:297`.

**Issue:** Inside `useConvertIdeaToProjectMutation`, the RPC payload constructor for `convert_idea_to_project` does:

```ts
project.description !== undefined ? JSON.stringify(project.description) : null
```

This is the same bug class as the project mappers had (fixed in commit `ab7f1cd` on 2026-05-17). When a user converts an idea to a project, the resulting project's description goes through `JSON.stringify` while the read path doesn't apply `JSON.parse` — accumulates one escape layer immediately, more on subsequent edits.

**Workaround:** Idea-to-project conversion currently writes a doubly-encoded description. Affected projects can be repaired by re-running `scripts/repair-project-description-escaping.ts` after the fix lands.

**Proper fix:** Replace with `project.description ?? null`. Also verify whether the SQL function `convert_idea_to_project` does any further encoding before INSERT — if yes, address both sides.

**When:** Bundled with next related work, ~5-minute fix. Mark for inclusion in any commit that touches `useIdeas.ts`.

---

### P1 — Action timeline atomicity

**Location:** Action mutations in `src/lib/queries/useActions.ts`.

**Issue:** Action UPDATE and corresponding `action_timeline` INSERT are separate Supabase calls. Not transactional. If timeline INSERT fails after UPDATE succeeded, action history is incomplete.

**Workaround:** Acceptable for low-frequency action edits during beta. No data loss — UPDATE always wins, timeline insert is supplementary.

**Proper fix:** Either wrap in a Postgres function (SECURITY DEFINER, like `convert_idea_to_project`) or use a database trigger to write timeline on UPDATE. Trigger is cleaner — no application code change.

**When:** Pre-beta if real users start hitting it. Otherwise scheduled for first post-beta batch.

---

### P2 — Setup/onboarding inline redesign (partially addressed)

**Location:** `src/pages/Setup.tsx`, `src/pages/Auth.tsx`, `src/pages/AuthVerify.tsx`.

**Issue:** Current wizard is 2-screen (Welcome with sample/fresh choice + Theme) but still a separate post-signup ceremony. User's strategic idea: combine onboarding with registration inline (Apple Setup feel) — name/theme/goal-or-sample all in one continuous flow.

**Workaround:** Today's wizard works. 2 screens is short enough that users get through it.

**Proper fix:** Redesign post-signup flow to merge wizard steps into the registration card itself. Probably 2-3 commit's worth of work. Wait for drop-off metrics from real beta users before designing — current data is just founder + test accounts.

**When:** Post-beta. Wait for real user data.

---

### P2 — `createSyncStoragePersister` deprecation warning

**Location:** TanStack Query setup in `src/main.tsx` or `src/lib/queryClient.ts`.

**Issue:** TanStack Query 5.83 surfaces a deprecation warning for `createSyncStoragePersister`. Doesn't break functionality.

**Workaround:** Ignore the warning. Cache persistence works.

**Proper fix:** Migrate to the newer persistence API per TanStack docs. ~15 minutes work, low risk.

**When:** Any session that already has `queryClient.ts` open.

---

### P2 — i18n keys missing for Supabase auth errors

**Location:** `src/pages/Auth.tsx`, `src/pages/AuthVerify.tsx`.

**Issue:** Supabase returns auth errors in English ("Invalid login credentials", "Email not confirmed", etc.). We display them verbatim. Non-English users see English error text.

**Workaround:** None — errors are readable English.

**Proper fix:** Map Supabase auth error codes to our i18n keys. List of error codes: https://supabase.com/docs/reference/javascript/auth-error-codes.

**When:** Pre-beta cleanup pass on auth UX.

---

### P3 — `Action.impact` comment stale

**Location:** Likely `src/types/index.ts` or wherever Action type is defined.

**Issue:** Comment says "0..10" but DB enforces 1..10 via CHECK constraint (`actions_impact_check` in initial schema). Comment is wrong but code works correctly because DB enforces.

**Workaround:** N/A — code works.

**Proper fix:** Update comment to "1..10". One-line change.

**When:** Any session that touches Action type.

---

### P3 — `Project.description` typed as `string`

**Location:** `src/types/index.ts:43-44`.

**Issue:** Project.description is typed as `string` but it's actually an opaque HTML string from TipTap. TypeScript doesn't surface the structure. Decision A (post-2026-05-17 fix): treat as plain string. Type is correct.

**Workaround:** None needed — type matches behavior.

**Proper fix:** Consider whether to introduce a branded type (`type HtmlString = string & { __brand: 'html' }`) for additional type-level safety. Probably not worth it.

**When:** Possibly never. Re-evaluate post-beta.

---

### P3 — TipTap images stored as base64

**Location:** RichTextEditor in Project/Idea descriptions, and notes elsewhere.

**Issue:** Images pasted into TipTap editor are stored as base64 data URIs in the HTML string. Bloats descriptions for any project with screenshots. Costs DB storage and round-trip latency on every read.

**Workaround:** Don't paste large images. Or accept the cost.

**Proper fix:** Hook into TipTap's image extension; intercept paste/drop; upload to Supabase Storage; replace data URI with public URL. ~1 day's work including the upload UI, error handling, deletion sync.

**When:** Pre-beta if real users start hitting it. Otherwise post-beta polish.

---

### P3 — `ChoiceScreen` + `PauseScreen` inert dead code in Setup.tsx

**Location:** `src/pages/Setup.tsx`.

**Issue:** Two components retained as dead code after the 2026-05-17 wizard simplification, per "preserve for future redesign" rule. They no longer have call sites. TypeScript shows unused-variable hints but doesn't fail.

**Workaround:** Ignore the hints. Don't accidentally re-enable.

**Proper fix:** Two options:
- Delete entirely when next wizard redesign starts (saves ~150 lines)
- Keep as design reference, but extract to `src/pages/Setup/_dead/` subdirectory and add a "do not import" lint rule

**When:** Decide at the start of the next onboarding redesign session.

---

### P3 — Vite 5 → 6+ upgrade (security)

**Location:** `package.json`.

**Issue:** esbuild dev-server vulnerability fix requires Vite 6 major version bump. Vite 6 has breaking changes for some plugins.

**Workaround:** Dev-only vulnerability; production builds unaffected. Acceptable risk during beta-prep.

**Proper fix:** Upgrade Vite to 6.x, address breaking changes, retest dev server.

**When:** Post-beta first cleanup batch.

---

### P3 — jsdom 20 → 29 upgrade (security)

**Location:** `package.json`.

**Issue:** Transitive vulnerability fix in test environment dependency. Affects test env only.

**Workaround:** Tests run fine. Vulnerability not exploitable in test context.

**Proper fix:** Upgrade jsdom, re-run vitest suite to verify nothing broke.

**When:** Post-beta first cleanup batch.

---

### P3 — Test coverage bootstrap

**Location:** `src/**` — repository-wide.

**Issue:** Vitest is set up but test coverage is effectively zero. We've shipped Phase 2-5 + onboarding rework with zero automated tests. All manual verification.

**Workaround:** Manual localhost test pass per commit. Has caught issues but it's not scalable.

**Proper fix:** Bootstrap test coverage strategically:
- Unit tests for `src/lib/rowMappers.ts` (boundary correctness)
- Unit tests for selector logic in `src/lib/selectors/*`
- Integration tests for critical user flows (signup → seed → /today)

**When:** Post-beta. Lessons from real users will inform what to test first.

---

### P3 — Code-split large pages

**Location:** `src/pages/Index.tsx`, `src/pages/ActionEditor.tsx`, etc. — see `FRONTEND-AUDIT.md`.

**Issue:** Some pages bundle to >500 kB. Build warning surfaces this. Initial load is slower than necessary.

**Workaround:** None — pages load fine, just slower than possible.

**Proper fix:** Lazy-load page-level routes via `React.lazy()` + `<Suspense>` boundaries. Bundle analyzer first to identify largest chunks.

**When:** Post-beta perf pass.

---

### P3 — Replace `any` types in i18n + sample seed loader

**Location:** i18n function signatures, `src/data/sample/sampleData.{locale}.ts` loaders.

**Issue:** A few `any` escapes in places where the type would be complex (translation function signatures with interpolation, sample data loader).

**Workaround:** Code works.

**Proper fix:** Replace with proper generic types or branded types.

**When:** Post-beta polish.

---

### P3 — Unify LocalStorage access behind `src/lib/storage.ts`

**Location:** Scattered `localStorage.getItem` / `setItem` calls across `src/lib`, `src/components`, `src/pages`.

**Issue:** No single abstraction. Distinguishing "user state that should sync to Supabase" vs "UI preferences that stay local" is implicit. signOut sweep logic lives in `useAuth.tsx` and depends on knowing the keyset.

**Workaround:** Current setup works. signOut sweep uses prefix matching with explicit allowlist.

**Proper fix:** Build `src/lib/storage.ts` abstraction with namespaced API:
```ts
storage.userState.get(key) / set(key, value) / clear()
storage.preferences.get(key) / set(key, value)
```
Migration is mechanical but touches many files.

**When:** Post-beta refactor batch.

---

## Resolved items

(Most recent first.)

### ✅ P1 — Project.description double-encoding bug

**Resolved:** 2026-05-17, commit `ab7f1cd`.

**What was wrong:** `rowMappers.ts` called `JSON.stringify` on description while read path didn't `JSON.parse`. supabase-js then JSON-encoded the request body again. Each save added one escape layer. After a few edits, descriptions were unreadable.

**What we did:** Removed `JSON.stringify` from both write paths in `rowMappers.ts`. Wrote `scripts/repair-project-description-escaping.ts` to peel accumulated layers from 40 affected production rows. Both sides shipped together.

**Notes:** Parallel bug discovered in `useIdeas.ts:297` (idea→project conversion RPC) — flagged as separate P1 above. Not fixed in same commit because separate code path.

---

### ✅ P2 — Setup wizard re-trigger on login

**Resolved:** 2026-05-17, commit `14fd3c8`.

**What was wrong:** Wizard showed on every login because `actos.setup.completed` localStorage flag was unreliable (cleared by signOut sweep, leaked between users).

**What we did:** Migrated to `public.users.has_completed_initial_setup` DB column. Wizard now shows only for new signups. Existing users backfilled to completed via broad heuristic (`created_at < now()`).

---

### ✅ P2 — Sample seed flash on /today

**Resolved:** 2026-05-17, commit `b0d4eae`.

**What was wrong:** After "Try with sample data" click, /today showed "Create your first goal" empty-state prompt for 2-3 seconds before sample seed completed.

**What we did:** Hybrid await pattern — seed kicks off on Welcome click, Theme Continue button awaits the in-flight promise with spinner. User sees no flash on /today.

---

### ✅ P2 — Auth verify flash to /auth

**Resolved:** 2026-05-17, commit `b0d4eae`.

**What was wrong:** After OTP verify, user briefly saw /auth and /today before redirecting to /setup. Race between Supabase session establishment and React state propagation.

**What we did:** AuthVerify keeps "Verifying..." state until `useAuth().user` propagates, then navigates directly to /setup. 5-second safety timeout fallback.

---

### ✅ P2 — `completeSignup` shim in useAuth.tsx

**Resolved:** 2026-05-13, commit shipped with Phase 4 Session 2.

**What was wrong:** Transitional shim from Phase 3 was still in place after real Supabase Auth landed. Dead code.

**What we did:** Deleted the shim. No callers remained after the migration.

---

### ✅ P2 — `storeQueryRef.ts` bridge

**Resolved:** 2026-05-13, commit shipped with Phase 4 Session 2.

**What was wrong:** Bridge file used during the Zustand→TanStack transition to access query data from Zustand selectors. 4 known call sites.

**What we did:** Migrated 4 consumers to direct cache reads via `useQueryClient` or dedicated hooks (`useActiveGoals`, etc.). Deleted the bridge.

---

### ✅ P1 — Sample fixture short IDs (`g1`, `p1`, etc.) instead of UUIDs

**Resolved:** 2026-05-13, commit shipped with Phase 4 Session 2.

**What was wrong:** Sample fixtures used semantic short IDs that failed Supabase's UUID validation on insert.

**What we did:** `scripts/fixture-to-uuid.py` — one-off Python script that transformed all fixture IDs to UUIDs while preserving cross-entity references. Committed.

---

### ✅ P1 — Multi-user sample seed duplicate-key conflict

**Resolved:** 2026-05-13, commit shipped with Phase 4 Session 2.

**What was wrong:** Sample fixtures had fixed UUIDs. When a second user (or the same user signing up twice) triggered the seed, INSERTs hit 409 duplicate-key errors on the fixture UUIDs.

**What we did:** Lazy `oldId → newId` remap at seed time. Each user gets fresh UUIDs while cross-entity references are rewritten in-place.

---

### ✅ P1 — signOut LocalStorage namespace leak

**Resolved:** 2026-05-13, commit shipped with Phase 4 Session 2.

**What was wrong:** signOut only cleared a few specific LocalStorage keys. Other `actos.*` state (UI prefs, last-viewed goal, etc.) leaked to the next user on a shared device.

**What we did:** signOut sweep now removes the entire `actos.*` namespace with an explicit allowlist for cross-user-safe keys (`actos.theme`, `actos.i18n.language`, `actos-session-sound`, `actos.cms.*` prefix for admin manifesto drafts).

---

### ✅ P1 — Cross-store idea conversion atomicity

**Resolved:** 2026-05-13, commit shipped with Phase 4 Session 2.

**What was wrong:** Converting an idea to an action/project required writing to two stores: insert into target table, update idea status. Not transactional.

**What we did:** Postgres RPCs `convert_idea_to_action` and `convert_idea_to_project` (SECURITY DEFINER + RLS check). Single round-trip, atomic.

---

### ✅ P1 — Ritual `totalCompletions` denormalized field stale

**Resolved:** 2026-05-13, migration `20260513000001_drop_ritual_total_completions.sql`.

**What was wrong:** `totalCompletions` was being denormalized at update time but reads also went through the join — risk of drift.

**What we did:** Column dropped from the table. `totalCompletions` derived from joined `ritual_completions` array at the rowMapper boundary. Single source of truth.

---

### ✅ All P1s closed in Phase 1

**Resolved:** 2026-05-11.

7 of 8 P1s from the original frontend audit closed in Phase 1 hygiene pass. The 8th (`subscriptionTier` move from settings to user record) closed in Phase 2 with the schema migration.

---

## Notes for future Claude Code sessions

1. **Audit `JSON.stringify` calls at Supabase boundaries.** The 2026-05-17 double-encoding bug pattern (`JSON.stringify` on write, no `JSON.parse` on read, jsonb column) may exist elsewhere. Worth a one-time grep when next at the boundary.

2. **Don't trust "P3 cosmetic" classifications.** Project.description was classified P3 cosmetic. It was a P1 functional bug in disguise — symptoms were rare until Phase 4 Session 1 made every project edit go through the broken mapper.

3. **DB flags > localStorage flags** for cross-device, cross-session, cross-user-on-shared-device state. Worth the migration cost.

4. **Race conditions in auth flows** are common. When a React component navigates after an async auth event, it's almost always racing the auth state propagation. Pattern: keep the source component mounted, wait via `useEffect`, navigate when state has settled.

5. **Repair scripts are not free.** Always dry-run with stable-fixed-point peeling logic and 3 sample before/after pairs printed. Verify samples look right BEFORE applying. The 2026-05-17 repair caught the right 40 rows on the first try because the dry-run preview was reviewed.

---

*End of registry.*
