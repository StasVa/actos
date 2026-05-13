# ActOS — Technical Debt

> **Document role:** items we deliberately deferred to ship faster. Each has a chosen workaround AND a planned proper fix. Triaged by impact, not by when we noticed them.
> **Read alongside:** `06-ROADMAP.md` (forward scope), `11-CHANGELOG.md` (shipped work).
> **Audience:** Stas (PM) for prioritization; AI agents and contractors for context before touching related code.
> **Last updated:** 2026-05-13

---

## Priority levels

- **P1** — meaningful production risk or known UX gap. Schedule in the next 1-2 sessions.
- **P2** — code quality / cleanliness. Schedule when touching the adjacent file anyway.
- **P3** — cosmetic or low-impact. Pick up opportunistically.

---

## Active items

### P1 — Action timeline atomicity gap

**Location:** `src/lib/queries/useActions.ts` — `useChangeActionStatusMutation`

**Issue:** Action update + timeline event insert are two sequential DB calls. If step 2 fails (network blip, transient RLS error), the action row has the new status but no timeline event exists for the transition.

**Workaround:** Documented in code comments. Worst case is a missing audit row, not data corruption. Status change still reflects correctly in UI.

**Proper fix:** Wrap both writes in a Postgres function so they're transactional. OR change order (insert timeline first, update action second) and treat a trailing-update failure as the recoverable case.

**When:** Session 2 or when first user reports a timeline gap.

---

### P1 — Cross-store conversion can fail silently

**Location:** `src/pages/Ideas.tsx` — `convertToAction`, `ConvertProjectOverlay.submit`

**Issue:** Mutation creates action/project in Supabase, then Zustand marks idea as converted. If the second step fails (e.g., user closes browser between), the action exists but the idea is still "captured" — user might double-convert and create duplicates.

**Workaround:** `.catch()` chain added in Phase 4 Session 1 surfaces failures as toasts. User at least sees what went wrong.

**Proper fix:** Session 2 — when ideas migrate to Supabase, both writes happen in same transaction (or single SQL function), eliminating the cross-store gap entirely.

**When:** Session 2.

---

### P2 — `gnup` shim still in `useAuth.tsx`

**Location:** `src/lib/useAuth.tsx`

**Issue:** Vestigial shim left from Phase 3 transition. No consumers after `AuthVerify.tsx` rewrite — the shim returns the current Supabase-derived user but nothing calls it.

**Workaround:** None needed — it's inert code.

**Proper fix:** Delete the shim + its declaration in the `AuthCtx` interface + its entry in the context value object.

**When:** Next time anyone edits `useAuth.tsx` — ~5 line cleanup.

---

### P2 — `storeQueryRef.ts` bridge will outlive its purpose

**Location:** `src/lib/storeQueryRef.ts`

**Issue:** Bridge for legacy Zustand reads (`captureIdea` fallback) reading goals from TanStack cache. Marked with TODO header.

**Workaround:** None needed — works correctly during the strangler phase.

**Proper fix:** Delete entire file when ideas migrate to Supabase in Session 2. `captureIdea` becomes a TanStack mutation hook itself.

**When:** Session 2.

---

### P2 — Unused `useStore` import in `App.tsx`

**Location:** `src/App.tsx` line 47

**Issue:** Dead import after Phase 4 Session 1 — `App.tsx` no longer reads anything from the Zustand store directly.

**Workaround:** None needed. TypeScript flags as unused but build still passes.

**Proper fix:** Remove the import.

**When:** Next time `App.tsx` is edited.

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

(none yet — when items are fixed, move them here with the date and a one-line note pointing at the relevant commit or CHANGELOG entry)

---

## Adding new items

When you discover tech debt, add it here BEFORE shipping the workaround. Otherwise the context evaporates.

Required fields for each entry:
- **Location** — file path, line number if applicable
- **Issue** — what's wrong, concretely
- **Workaround** — what we're shipping instead (or "none — inert")
- **Proper fix** — the planned correct solution
- **When** — trigger condition for prioritization (which session, which user complaint, etc.)
