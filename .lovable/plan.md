# i18n Completion — execution plan

Scope is too large for one safe pass (~27k lines JSX/TSX, multiple 1000+ line files). Splitting into 4 sequential batches. Each batch ends with a clean build and a coverage delta. No "deferred to Part 2" — every batch fully closes its surface.

## Batch A — Foundations (this turn)

**Goal:** add every new key to `en.json`, consolidate duplicates, swap call sites in shared/leaf components and status pills (the Part 1 bug).

1. Rewrite `en.json` to the full target set (~500 keys), alphabetized. Domains: `common`, `nav`, `sidebar`, `time`, `status`, `dayType`, `filters`, `sort`, `validation`, `confirm`, `toast`, `subscription`, `lock`, `sample`, `editor`, `today`, `actions`, `rituals`, `sessions`, `delegated`, `goals`, `projects`, `ideas`, `reviews`, `progress`, `settings`, `setup`, `goalBuilder`, `noGoals`.
2. Consolidate duplicates: drop `common.actions`, drop `editor.overflow.{delete,duplicate,drop,archive}` in favor of `common.*`, keep `status.done` ≠ `common.done` split (commented).
3. Swap call sites in **shared, low-risk** components:
   - `ActionRow.tsx` — status pill labels via `t('status.*')`
   - `FilterDropdown.tsx`, `SortDropdown.tsx` — filter/sort labels
   - `ConfirmModal.tsx` (already), `LockModal.tsx`, `EditorFooterControls.tsx` — labels + Tier-2 prompts
   - `ProjectCard.tsx`, `EmptyState.tsx`, `PageHeader.tsx`, `MobileHeader.tsx`, `UserMenu.tsx`, `LifetimeCounters.tsx`, `MetaPills.tsx`, `ReturnDatePill.tsx`, `NavLink.tsx`, `NoGoalsLayout.tsx`, `KeyboardShortcuts.tsx`
4. Swap **all top-level page chrome** strings (page titles, "+ New X" CTAs, tab labels, empty states) across: `AllActions`, `AllProjects`, `AllDelegated`, `Goals`, `Ideas`, `Rituals`, `Sessions`, `Progress`, `Reviews`, `ReviewsDays`, `ReviewsWeeks`, `ReviewsMonths`, `Settings`, `SettingsSubscription`.

**Explicitly out of Batch A** (going to Batch B–D, not "deferred forever"): `ActionEditor` (1441), `RitualEditor` (1027), `GoalEditor` (629), `PlanCloseModals` (1227), `Setup` (485), `GoalBuilder` (in `pages/GoalBuilder.tsx`), `SessionBuilder` (908), `SessionActive` (938), `SessionSummary`, `CloseDayRecap`, `CommandPalette` (778), `Index` (Today body content), drill-down detail pages (`Review*Detail`, `GoalDetail`, `ProjectDetail`).

## Batch B — Today + Plan/Close + No-Goals + Setup wizard

`Index.tsx`, `PlanCloseModals.tsx`, `CloseDayRecap.tsx`, `NoGoalsLayout.tsx` (full pass), `Setup.tsx`, `pages/GoalBuilder.tsx` (4 steps), `SettingsPanel.tsx`, `RitualPanel.tsx`, `LifetimeCounters.tsx`, `AccomplishmentsSection.tsx`, `OutcomeAddedSection.tsx`, `TimeInvestmentSection.tsx`, `SessionsSection.tsx`.

## Batch C — Editors + CommandPalette

`ActionEditor.tsx`, `RitualEditor.tsx`, `GoalEditor.tsx`, `EditorShell.tsx`, `CommandPalette.tsx`, status timestamp lines, validation tooltips, "Add Impact and Time first" patterns, all editor toasts.

## Batch D — Sessions + Reviews + Detail pages + final sweep

`SessionBuilder.tsx`, `SessionActive.tsx`, `SessionSummary.tsx`, `ActiveSessionGuard.tsx`, `GoalDetail.tsx`, `ProjectDetail.tsx`, `ReviewDayDetail.tsx`, `ReviewWeekDetail.tsx`, `ReviewMonthDetail.tsx`, `SettingsSubscription` deep flows (downgrade Tier-2, Lifetime card, demo modals). Final ripgrep sweep for stray English literals; fix or flag with file+line+reason.

---

## Why batched, not one-shot

- Megafiles need careful per-section editing; one bad search/replace in a 1400-line file silently breaks rendering and is hard to back out.
- Each batch is independently buildable & visually verifiable — if Batch B introduces a regression, A is still good.
- Keeps `en.json` reviewable: after Batch A you have the canonical key skeleton; later batches only fill in usages, rarely add new keys.

## What you get at the end of Batch A (this turn)

- `en.json` at ~500 keys, alphabetized, deduped — the full vocabulary.
- Status pill bug from Part 1 fixed everywhere it renders.
- All shared/leaf components and page chrome translating.
- Coverage report: which files swapped, which keys added, what's queued for B/C/D with explicit file paths.

Confirm and I'll execute Batch A now, then continue B → C → D in subsequent turns.