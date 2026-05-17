# ActOS — Technical Debt

> **Document role:** items we deliberately deferred to ship faster. Each has a chosen workaround AND a planned proper fix. Triaged by impact, not by when we noticed them.
> **Read alongside:** `06-ROADMAP.md` (forward scope), `11-CHANGELOG.md` (shipped work).
> **Audience:** Stas (PM) for prioritization; AI agents and contractors for context before touching related code.
> **Last updated:** 2026-05-17 (Setup wizard simplification)

---

## Priority levels

- **P1** — meaningful production risk or known UX gap. Schedule in the next 1-2 sessions.
- **P2** — code quality / cleanliness. Schedule when touching the adjacent file anyway.
- **P3** — cosmetic or low-impact. Pick up opportunistically.

---

## Active items

### P2 — Setup/onboarding inline redesign (partially addressed)

**Location:** `src/pages/Setup.tsx`, `src/App.tsx` (SetupGuard)

**Issue:** The first-run wizard is still a separate full-screen ceremony at `/setup` rather than inline with the signup flow. The 2026-05-17 simplification cut the wizard from 4 screens to 2 (Welcome with sample-or-fresh choice → Theme → /today), moved completion tracking from localStorage (`actos.setup.completed`) to `public.users.has_completed_initial_setup`, and removed the "Set up my first goal" path (users with zero goals see the existing inline prompt on `/today`). `ChoiceScreen` and `PauseScreen` remain in `Setup.tsx` as inert dead code for the eventual redesign.

**Workaround:** Wizard works correctly; the DB flag fixes the "wizard re-triggers on login" bug.

**Remaining work:** Full inline-with-signup redesign post-beta — fold theme choice and sample/fresh choice into the signup flow itself so first-run users never see a separate full-screen wizard.

**When:** Post-beta UX polish pass.

---

### P3 — `useIdeas.useConvertIdeaToProjectMutation` double-encodes description

**Location:** `src/lib/queries/useIdeas.ts:297`

**Issue:** The RPC payload constructor for `convert_idea_to_project` calls `JSON.stringify(project.description)` before sending to the SQL function. Same root cause as the 2026-05-16 `rowMappers` fix — supabase-js JSON-encodes the request body, so the inline stringify double-encodes. Each idea→project conversion adds one escape layer to the new project's description.

**Workaround:** None active. The bug only fires on the idea-to-project conversion path; manually-created projects are unaffected since the `rowMappers` fix landed.

**Proper fix:** Remove the `JSON.stringify` call; pass `project.description` through as a plain string. Then run a one-off repair on any projects that were converted from ideas after Phase 4 Session 1 (the existing `scripts/repair-project-description-escaping.ts` can be reused — its peel logic is idempotent).

**When:** Next time someone touches the ideas-to-projects conversion flow, or opportunistically.

---

### P1 — Action timeline atomicity gap

**Location:** `src/lib/queries/useActions.ts` — `useChangeActionStatusMutation`

**Issue:** Action update + timeline event insert are two sequential DB calls. If step 2 fails (network blip, transient RLS error), the action row has the new status but no timeline event exists for the transition.

**Workaround:** Documented in code comments. Worst case is a missing audit row, not data corruption. Status change still reflects correctly in UI.

**Proper fix:** Wrap both writes in a Postgres function so they're transactional. OR change order (insert timeline first, update action second) and treat a trailing-update failure as the recoverable case.

**When:** Reactive — when first user reports a missing timeline event, or as part of a broader audit/history surface upgrade.

---

### P2 — `createSyncStoragePersister` deprecated warning

**Location:** `src/lib/queryClient.ts`

**Issue:** `@tanstack/query-sync-storage-persister` marks `createSyncStoragePersister` as deprecated in its TypeScript types. Build still passes; warning is informational.

**Workaround:** Ignore the warning. The function still works correctly.

**Proper fix:** Monitor TanStack release notes. When they ship a replacement (likely a different factory function with cleaner API), migrate.

**When:** Reactive — when the function actually breaks or shows up in a CI warning we care about.

---

### P2 — i18n keys for Supabase auth errors

**Location:** `src/pages/Auth.tsx`, `src/pages/AuthVerify.tsx`

**Issue:** Supabase error messages render raw (English). Mock auth had translated error keys (`auth.error.invalidCode`, etc.); we removed them during Phase 3 and didn't add new ones for the Supabase error model.

**Workaround:** English error messages on Russian/German/Spanish locales. Acceptable for beta (technical users tolerate this).

**Proper fix:** Dedicated i18n polish pass:
1. Catalog Supabase error scenarios that surface to users
2. Add i18n keys for each in `en`, `ru`, `de`, `es` locale files
3. Map Supabase error → key in `Auth.tsx` / `AuthVerify.tsx`

**When:** Before beta launch to non-English-speaking testers, OR opportunistically during a future auth-flow edit.

---

### P3 — `Action.impact` comment says "0..10"

**Location:** `src/types/index.ts` — `Action` interface

**Issue:** Comment on `impact` field reads `// 0..10` but DB CHECK constraint is 1..10 and UI enforces 1..10 (Impact-required gate for Done transition).

**Workaround:** None — stale comment is harmless because DB and UI both enforce 1..10.

**Proper fix:** Update comment to `// 1..10`.

**When:** Whenever — pure cosmetic.

---

### P3 — `Project.description` typed as `string`

**Location:** `src/types/index.ts` — `Project` interface

**Issue:** Stored as opaque JSON string at the rowMapper boundary. App type doesn't expose the TipTap doc structure. Consumers treat the field as a black box; only TipTap reads/writes it.

**Workaround:** Works correctly. The opaqueness is fine because nothing outside TipTap parses the content.

**Proper fix:** Post-beta — introduce a `TiptapDoc` type and surface it through `Project` type. Audit all consumers to handle the typed shape rather than raw string.

**When:** Post-beta, or when we add a feature that needs structured access to description content (e.g., search across descriptions).

---

### P3 — TipTap embedded images as base64

**Location:** TipTap editor in Project descriptions, `RichTextEditor.tsx`

**Issue:** Base64-encoded images bloat description JSON. Works but inefficient — every image becomes ~1.5x its byte size in storage, slow to fetch on render, can't be cached separately.

**Workaround:** Works for beta scale (30 users, modest image use).

**Proper fix:** Upload images to Supabase Storage bucket `project-media`. Path `{user_id}/{uuid}.{ext}`. Public reads, RLS uploads constrained to caller's `user_id` prefix. TipTap node stores URL instead of base64.

**When:** v1.x — once we see beta users actually pasting many images, or description payloads cause perceptible slowdowns.

---

## Resolved items

- **2026-05-13 — P1 Cross-store conversion can fail silently** — Closed in Phase 4 Session 2. Idea conversions now use Postgres RPCs (`convert_idea_to_action`, `convert_idea_to_project`) that wrap both writes in a single transaction. See migration `supabase/migrations/20260513000000_idea_conversion_rpcs.sql` and `src/lib/queries/useIdeas.ts`.
- **2026-05-13 — Ritual completion counter atomicity** — Avoided rather than fixed. `Ritual.totalCompletions` is now derived from the joined `ritual_completions` array (count of `status='done'`) at the mapper boundary, not stored. A single insert records a completion; no second write needed. The DB column `rituals.total_completions` remains but is no longer read. See `src/lib/rowMappers.ts` `rowToRitual`.
- **2026-05-13 — P2 `completeSignup` shim in `useAuth.tsx`** — Removed in Phase 4 Session 2 cleanup. No callers existed.
- **2026-05-13 — P2 `storeQueryRef.ts` bridge** — Deleted in Phase 4 Session 2. The four call sites (captureIdea, CommandPalette, AdminComponents, goalGuard) now read from TanStack cache directly via `useQueryClient` or `useGoalsQuery`.
- **2026-05-13 — P2 Unused `useStore` import in `App.tsx`** — Removed in Phase 4 Session 2 cleanup.

---

## Adding new items

When you discover tech debt, add it here BEFORE shipping the workaround. Otherwise the context evaporates.

Required fields for each entry:
- **Location** — file path, line number if applicable
- **Issue** — what's wrong, concretely
- **Workaround** — what we're shipping instead (or "none — inert")
- **Proper fix** — the planned correct solution
- **When** — trigger condition for prioritization (which session, which user complaint, etc.)
