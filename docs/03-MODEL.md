# ActOS — Model

> **Document role:** the conceptual model of the product. Defines entities, relationships, statuses, and rules. Foundation for both UX and data architecture.
> **Read alongside:** `00-VISION.md` for the principles behind these rules; `10-BEHAVIORS.md` for state transitions, cascade rules, and computed values.

---

## Hierarchy

```
Goal
 ├── Project
 │    └── Action (one-time)
 └── Ritual — a recurring action; can attach directly to Goal, bypassing Project
```

**Rules of attachment:**
- One-time actions typically live under a Project.
- Rituals (recurring actions) can live under a Project OR directly under a Goal.
- A Project always belongs to exactly one Goal.

**Capture entity:**
- **Idea** — a parking lot for unstructured thoughts. Belongs to a Goal. Convertible to Action or Project.

**Time-scope entities (records, not part of execution hierarchy):**
- **DayEntry** — record of a single day's plan.
- **Session** — record of a focused work block (timer-based). References Actions but does not own them.

**Account entity:**
- **User** — the authenticated account. Holds identity (email, display name) and subscription object (tier: `free` / `all-in`, plus billing fields).

---

## Entities

## Common entity fields

In addition to entity-specific fields, every persisted entity (Goal, Project, Action, Ritual, Idea) optionally carries:

- **isSample** (boolean) — `true` if seeded via Setup Wizard "Show me how it works" path. Used to identify sample-derived entities so they can be cleared in bulk via Settings → Data → "Clear sample data" or via the persistent banner on `/today`. Default `false` / absent for user-created entities. Editing a sample entity does NOT clear this flag.

---

### Goal

**A goal is a result, not an activity.** It describes a future state — concrete and measurable, something either achieved or not. Months or years of work toward it. The user has **maximum 2–3 active Goals** at any time. This is a hard constraint — not a suggestion. It exists to enforce focus.

Pattern test for whether something is a goal: does it describe a result (e.g., "$10k MRR", "100k YouTube subscribers", "Pass C1 Spanish exam") or an activity (e.g., "Build a side business", "Grow my channel", "Learn Spanish")? Activities are projects (or sequences of projects). Only results are goals.

**Types:**
- **Short-term** — horizon ~1 month
- **Mid-term** — horizon ~1 year

**Fields:**
- Title
- Type (short-term / mid-term)
- Color (assigned at creation: goal-1 / goal-2 / goal-3, used consistently across all visualizations)
- Created at
- Status: `active` / `completed` / `dropped`
- Description (optional, plain text)
- Success Criteria (optional, 0–5 checkboxable items)
- Target date (optional)

**Progress to Goal** is calculated from three parallel sources, shown as separate axes (never merged):
1. **Project progress** — completed Impact / Goal Cost.
2. **Ritual consistency** — chains/charts of rituals tied to the goal.
3. **Success Criteria** — checked items / total criteria.

**"Visibly completable" indicator.** When all active projects of a Goal are closed (completed or dropped), the Goal's card receives a subtle glow effect on its color stripe.

**"Near completion" indicator.** When a Goal's Value progress is ≥ 75%, its card receives a subtle visual indicator (small "READY TO CLOSE" badge or stripe glow).

**Overdue target date.** If target date is set and has passed without Mark complete: soft "overdue" indicator on the goal, no banner, no pressure.

---

### Project

A closeable unit of work that moves a Goal forward. **Projects must be closeable in a foreseeable horizon** — typically days to weeks. A Project is not just a container for actions — it is a **working space** where the user keeps the context, materials, and references.

**Fields:**
- Title
- Goal (parent)
- Created at
- Status: `active` / `completed` / `dropped`
- isDraft: boolean (during creation, hides project from lists until promoted)
- Description — rich-text (formatting, embedded images, uploaded files, video). Project's working context.
- References — list of external links; each reference has a URL (required) and an optional title

**Project status semantics:**
- `active` — work in progress.
- `completed` — finished successfully.
- `dropped` — stopped; **all actions inside are also marked Dropped**; the project's cost is removed from the Goal Cost.

**Project actions (user-initiated):**
- **Mark complete** — primary action; project becomes `completed`.
- **Drop project** — sets status to `dropped`; cascades Drop to all child actions; subtracts Project Cost from Goal Cost. Tier 1 confirmation.
- **Delete project** — permanently removes the project and all its actions. Tier 2 confirmation (typing project name).
- **Split** — see growth flow.
- **Close-and-continue** — see growth flow.
- **Move to another Goal** — re-parent the project under a different active Goal.

**Project creation flow:**
- "+ New project" creates a draft project (isDraft=true) and navigates to /projects/{newId}.
- Page-based creation, not a slide-in panel.
- Project promotes from draft to real on any of: title entered, action added, reference added, description content added.
- If user navigates away from empty draft: silent delete.
- If draft has content but no title: soft prompt "Save 'Untitled project'?" with options Save / Discard / Cancel.

**Project growth signaling:**
- Age > 30 days without closing
- Action count grew significantly (e.g., from 4 to 12 in 14 days)

The user receives a gentle prompt: *"This project has grown. Want to split it?"* — never blocking.

**Description content:**
Rich-text editor (TipTap-based) supporting formatting, embedded images, uploaded files (images, documents, video). Description has Read mode (default) and Edit mode. Click on description content → enters Edit mode with cursor at click position. Toolbar appears with Lucide icons. Click "Done", press Esc, or click outside → returns to Read mode with autosave.

In v1: file/image storage uses base64 (LocalStorage). S3 storage planned post-backend.

**References:**
A separate, structured list of external links to docs, tickets in other systems, articles. Each reference has URL (required) + optional title. References added manually via "Add reference" — not auto-extracted from description text.

---

### Action

The atomic unit of execution — a one-time piece of work.

**Fields:**
- Title
- Parent: Project (typical) or Goal (only for Backlog actions)
- Status (see below)
- Scheduled date (optional, drives Planned status)
- Notes (plain text, with auto-detected links)
- **Impact — user-rated 1–10; REQUIRED, never 0 or empty**
- **Time estimate — minutes; REQUIRED for Done transition**
- Delegation target (free text + optional return date) — only when status is Delegated
- plannedAt — timestamp when status first changed to Planned
- completedAt — timestamp when status changed to Done (supports retroactive)
- delegatedAt — timestamp when status changed to Delegated
- droppedAt — timestamp when status changed to Dropped
- cancelledAt — timestamp when status changed to Cancelled

All ratings (Impact, Time) are **set by the user**. The system does not infer them.

**Required fields rule:**

Actions cannot be created or completed without certain fields. This is enforced because missing values corrupt downstream calculations (Project Cost, Goal Progress, Time Investment, Big Frog/Easy Wins ranking).

- **Title** — always required.
- **Impact** — always required (must be 1–10, never 0 or empty).
- **Time estimate** — required for Done transition. Backlog/Planned actions can have empty Time, but it must be set before marking Done.
- **Parent Goal** — always required (Project optional only for Goal-level Backlog).

UI enforcement:
- Save / Create button disabled until required fields filled.
- Tooltip on disabled button explains what's missing.
- Status transition to Done requires Impact and Time — blocked with inline error if missing.
- Existing actions without required fields (legacy data) show warning banner; cannot transition to Done until fixed.

**Statuses:**

*Active:*
- `Backlog` — captured, no scheduled date
- `Planned` — DERIVED state when action has a scheduledDate (not separately stored as user choice)

*Terminal:*
- `Done` — completed by the user
- `Delegated` — handed off (to a person or AI)
- `Dropped` — abandoned mid-progress; subtracts the action's Impact from Project Cost
- `Cancelled` — invalidated, was a bad plan from the start; also subtracts Impact from Project Cost

There is no "Skipped" or "Postponed" status for one-time actions. The user either changes the date, clears it, or marks Dropped/Cancelled.

**Planned as derived state:**

"Planned" is not a status the user actively chooses. It is the derived state when an action has a scheduledDate set. The Status dropdown does NOT include "Planned" as a clickable option. The user picks a date (Today / Tomorrow chips, or "Pick another date" calendar) and the status auto-derives to Planned. Clearing the date returns the action to Backlog.

This eliminates a brittle UX flow where users picked "Planned" and then had to provide a date through a separate step.

**Status transitions:**
- `Backlog` ↔ `Planned` — by adding/removing scheduledDate; auto-derived
- `Backlog` or `Planned` → `Done` — requires Impact and Time
- `Backlog` or `Planned` → `Delegated` — requires delegate name
- `Backlog` or `Planned` → `Dropped` or `Cancelled` — Tier 1 confirmation
- Any terminal → `Backlog` — re-open; Impact is restored to Project Cost; metrics recalculated

**Past date scheduling rule:**

When a user picks a past date for scheduling an action (via picker chips or calendar), the system shows a confirmation modal:

> "You picked May 3 (3 days ago), which is in the past. This action will be marked as Done on that date and counted in progress calculations."

On confirm: status → Done, completedAt = picked date, scheduledDate = picked date (preserved as historical record), plannedAt = null.

This protects the semantic integrity of "Planned" (always future or today) while supporting retroactive logging of completed work.

**Goal-level Backlog rule:** an Action can be attached directly to a Goal (without a Project) only if it is in `Backlog`. To plan or complete it, the user must first attach it to a Project. The Status dropdown is locked to Backlog when no Project parent is set.

**Retroactive entry/edit:**

Actions can be created or edited with past timestamps via the Reviews drill-down view. The action then appears in that day's drill-down view under appropriate sub-group (Done / Dropped / Cancelled / Delegated).

**Status timestamps in Action editor:**

Every terminal status displays a clickable timestamp line below the Status dropdown. The date portion is a link (with hover underline + accent color) that navigates to /reviews/days/{date} drill-down. Clicking the link closes the editor panel. Examples:
- "Completed today" / "Completed May 3 (3 days ago)"
- "Delegated to Maria · 2 days ago"
- "Dropped on May 3"
- "Cancelled on May 12"

Surrounding label words ("Completed", "Dropped on", "Delegated to X ·") are NOT part of the link — only the date text is clickable.

If status is Done AND scheduledDate ≠ completedAt, secondary line "Originally scheduled for {date}" appears as informational (not interactive).

#### The 2-hour principle

Actions should not exceed ~2 hours. If they do, they are usually hidden projects that need decomposing. This is a **principle**, not an enforced rule. Taught in onboarding.

#### Overdue actions (only with Plan & Review on)

If an Action is `Planned` for a past date and not completed, the system surfaces it with a soft indicator and offers Move (reschedule) or Cancel.

The system never automatically reschedules or hides overdue actions. The user must decide.

When `Plan & Review` is **off**, overdue concept doesn't apply.

---

### Ritual

A recurring action — something the user does on a schedule to move toward a goal.

In the data model, a Ritual is also an Action with `type: recurring`. In UI: always called "Ritual".

A Ritual does not close — it **repeats on a schedule**.

**Fields:**
- Title
- Parent: Project or Goal
- Schedule (daily / weekdays / weekly / monthly / custom)
- Schedule config
- Notes
- Base Impact — user-rated 1–10
- Effective Impact — `base_impact × consistency_multiplier`
- Consistency multiplier — derived from total successful completions
- Time estimate — minutes, applies per instance
- Completions log (date + status of each scheduled instance)
- Status: `active` / `archived`

**Per-instance status:**
- `Pending` — scheduled, not yet acted on
- `Done` — completed for that instance
- `Skipped` — user explicitly decided not to do this instance
- `Missed` — the scheduled day passed without Done or Skipped

`Skipped` differs from `Missed` semantically. Neither affects the multiplier (only Done does).

#### Consistency-based Impact growth

| Total completions | Multiplier |
|-------------------|------------|
| 0–6               | ×1.00      |
| 7–13              | ×1.05      |
| 14–29             | ×1.10      |
| 30–59             | ×1.25      |
| 60–119            | ×1.50      |
| 120–359           | ×1.75      |
| 360+              | ×2.00      |

**Why count, not time:** rewards effort over calendar passage.
**Why total, not streak:** missed days don't subtract — forgiving, no shame.
**No freeze state:** missed/skipped don't affect multiplier.
**Why cap at ×2.0:** balances reward against system integrity.

#### System ritual templates

- **Weekly project audit** (weekly schedule)
- **Monthly goal review** (monthly schedule)

Templates pre-fill forms; user edits and confirms.

---

### Idea

A captured thought not yet committed to execution.

**Fields:**
- Title
- Parent Goal (required)
- Note (plain text, optional)
- References — same structure as Project references
- Image attachments
- Status: `captured` / `converted_to_action` / `converted_to_project` / `discarded`
- Captured at, discarded at, converted to ID

**Lifecycle:**
- **Capture** — fast input on /ideas page or via Command Palette.
- **Convert to Action** — opens Action editor pre-filled. User picks parent project. On save: action created, idea status → `converted_to_action`.
- **Convert to Project** — opens Project page (page-based creation) with idea content pre-filled. On save: project created under idea's goal, idea status → `converted_to_project`.
- **Discard** — soft delete. Idea status → `discarded`.

Ideas do not contribute to Goal Cost or Project Cost.

---

### DayEntry

A record of a single day. Created when the user starts the day (Plan today flow) or when actions are logged retroactively for that date.

**Fields:**
- date (ISO date string, primary key)
- dayType — `Execution` / `Recovery` / `Day Off` / `Sick`
- mainTaskActionId
- plannedActionIds — array of action IDs explicitly selected during Plan today
- plannedRitualIds — array of ritual IDs user committed to that day
- skippedRitualIds — array of ritual IDs explicitly skipped
- isPlanned — boolean
- isClosed — boolean — automatically set true at midnight rollover OR when user clicks "Close day" in State B
- closedAt — timestamp (when auto-set, uses previous day's 23:59:59 local time, NOT current time)

**Removed fields** (deprecated / removed in later iterations):
- ~~reflectionText~~ — REMOVED. Reflection field has been removed from the model entirely. No reflection input or display anywhere in the app.
- ~~morningIntentNote~~ — REMOVED earlier (deprecated when intent textarea was removed from Plan today).

**Day Type semantics:**
- **Execution** — full work day, normal expectations.
- **Recovery** — light day, intentional rest.
- **Day Off** — no work, fully off.
- **Sick** — illness, expectations suspended.

---

### Session

A focused work block — a Pomodoro-style or continuous timer where the user commits to a specific list of actions for a fixed duration. Sessions are the **execution layer** of the product: where the user actually does the work, not just plans it.

A Session is a self-contained record of one focus episode. It captures: when it ran, how long, what was attempted, what was completed, what value was produced.

**Fields:**

*Identity & state:*
- id (UUID)
- status: `in_progress` / `completed` / `aborted`

*Timestamps:*
- startedAt (ISO timestamp)
- endedAt (ISO timestamp; null while in_progress)

*Configuration (set in Builder, immutable after start):*
- mode: `pomodoro` / `continuous` / `custom`
- workDuration (minutes per work block)
- breakDuration (minutes per break, 0 for continuous mode)
- cyclesPlanned (number of work blocks; 1 for continuous, typically 4 for Pomodoro)

*Action plan:*
- plannedActionIds — array of Action IDs in chosen execution order
- completedActionIds — array of Action IDs marked Done during session, in completion order (subset of planned)
- droppedActionIds — array of Action IDs marked Dropped during session (subset of planned)

*Cycle tracking:*
- cyclesCompleted — number of work blocks user completed (frozen at session end)

**Computed (selectors, not stored):**
- actualDuration: minutes between startedAt and endedAt; null while in_progress.
- valueAdded: sum of Impact across completedActionIds.

**Status semantics:**
- `in_progress` — session is currently running. Maximum 1 session in this status at any time, per device (LocalStorage scoped). Timer state persists across reload.
- `completed` — all planned cycles finished. endedAt set. cyclesCompleted = cyclesPlanned.
- `aborted` — user ended session early. endedAt set. cyclesCompleted = cycles fully finished before abort.

**Lifecycle:**

1. **Builder** — user configures mode, durations, cycles, action list. No Session entity created yet (builder is local component state).
2. **Start** — user clicks "Start session". Session created with status=in_progress, startedAt=now, configuration locked.
3. **Active** — timer runs through work/break cycles. User marks actions Done or Dropped. After each work block, audio cue + explicit "Continue" required (no auto-rollover).
4. **End** — either:
   - All cycles complete → status=completed.
   - User aborts → status=aborted.
- endedAt set. cyclesCompleted frozen. Value and Effort recompute on parent goals (since actions were marked Done with completedAt = now).

**Constraints:**
- A user has at most one Session with status=in_progress at any time. Attempting to start a second session blocks until current one ends.
- Mode and durations are set in Builder; they are not editable mid-session.
- Aborted sessions are valid records — duration is whatever the user achieved. They count toward history and aggregates the same way as completed sessions, just with status indicating intent.

**Relationship to Actions:**
- Sessions reference Actions via plannedActionIds, completedActionIds, droppedActionIds.
- When user marks an action Done during a session, the standard action transition logic fires (completedAt = now, Impact required, etc.). Session just records which actions were touched.
- Sessions do not own actions — actions persist independently with their own status.

**Relationship to DayEntries:**
- Sessions and DayEntries are independent. A session may run on a day with no DayEntry (Plan & Review off). A DayEntry may have zero sessions (user worked without timer).
- For aggregation: sessions for a date = sessions where startedAt's local date matches.

**Visibility across the app:**
- /sessions — list of all sessions (recent + history).
- Day drill-down — sessions that started on that day.
- Week drill-down — sessions in week, grouped by day.
- Month drill-down — sessions in month, per-week breakdown.
- Project page — sessions where any plannedActionId belonged to this project.
- Goal page — sessions where any plannedActionId's project belonged to this goal.

Sessions are not gated behind a layer toggle — they are always-on. Users who don't use sessions simply don't see them populate in drill-downs (sections hidden when count = 0).

---

### User

The authenticated account. One per app instance in v1 prototype (no multi-account or workspace support).

**Fields:**
- id (UUID)
- email
- displayName (optional — falls back to first part of email before "@" if not set)
- avatarSeed (used to deterministically hash to a color for the initials avatar)
- subscription — object with `tier: 'free' | 'all-in'`, `startedAt`, `billingCycle`, `priceLockedAt`, `endsAt` (see § Common entity fields → subscription)
- createdAt
- updatedAt

**subscriptionTier semantics:**
- `free` — default for all users. Core features only. Local data storage.
- `all-in` — paid tier. $12/mo monthly, $120/yr annual (save 17%), or $200 one-time Lifetime. Currently a UI-only differentiation (no payment integration in v1; demo modals on upgrade/downgrade). Surfaces as a quiet "All-In" pill in the user menu popover header only — NOT pushed visually elsewhere. Demo controls in /settings → Account allow flipping between tiers for testing.

**Subscription object on user:**
- `subscription.tier` — `'free' | 'all-in'` (default `'free'`)
- `subscription.startedAt` — timestamp when user became All-In (null on Free)
- `subscription.billingCycle` — `'monthly' | 'annual' | 'lifetime' | null`
- `subscription.priceLockedAt` — the price the user pays; preserved across future price increases (existing All-In members never see a price hike as long as they stay subscribed)
- `subscription.endsAt` — when current billing period ends; relevant for downgrade-pending state

**Enforcement points** (gated by `subscription.tier`):
- Goal creation when active count ≥ 2 → soft block modal.
- Reviews/Sessions/Day entries older than 90 days → render locked.
- Sparkline data on `/progress` and goal sparklines → clip to 90 days for Free.

**Tier transitions:**
- Upgrade Free → All-In: instant unlock of all gates. Toast "Welcome to All-In. Full history is back."
- Downgrade All-In → Free: Tier 2 confirmation (name-typing "DOWNGRADE"). Subscription persists until billing period ends, then locks engage. Existing 3-goal users with expired All-In: graceful degrade — 3 goals stay active, new-goal blocked until they reduce to 2 or renew.

**No multi-user fields in v1**: no roles, no workspace memberships, no team affiliations. These will be added when collaboration features are introduced post-v1.

---

## Value ≠ Effort

The signature mechanic. Two parallel measures of progress.

### For one-time actions

| Status      | Value (toward goal) | Effort (personal workload) | Time Invested |
|-------------|---------------------|----------------------------|---------------|
| Done        | 100% of Impact      | 100% of Impact             | 100% of Time  |
| Delegated   | 100% of Impact      | 20% of Impact              | 20% of Time   |
| Dropped     | 0% (Impact removed) | 0%                         | 0%            |
| Cancelled   | 0% (Impact removed) | 0%                         | 0%            |

`Dropped` and `Cancelled` actively **reduce the project's total cost**, so progress is measured against current realistic plan, not original optimistic plan.

The 20% delegation discount applies symmetrically to Value and Time Invested. The user spent ~20% of the work doing handover and follow-up, not the full execution time. This is honest accounting.

### For Rituals

- **Effort over a period** = sum of Effective Impact for completed instances
- **Goal contribution** = continuous accumulation; consistency feeds into goal's progress visualization

---

## Project Cost & Progress

**Project Cost** = sum of Impact values of all actions in the project, **minus** Impact of Dropped or Cancelled actions.

**Project Progress** = (sum of Impact of Done + Delegated actions) / Project Cost.

**Goal Cost** = sum of all its Project Costs.

**Goal Progress** = (sum of completed Impact across the goal) / Goal Cost. Plus parallel ritual-consistency axis.

---

## Always-on Core (formerly "Optional Layers")

ActOS no longer has user-toggleable layers. The previous "optional layers" model is replaced by always-on core mechanics, because the daily-planning ritual IS the product.

### Plan and review your days
- Plan today flow available via "Start your day →" CTA on /today State A. NOT auto-opened.
- Close day flow available via "Close day" button on /today State B, OR auto-triggered at midnight rollover.
- DayEntry persistence with isPlanned / isClosed state machine.

### Time tracking
- Per-action time estimate — required for Done transition
- Per-ritual time estimate — required at creation
- Time Investment visible on Progress page
- Time invested per day/week/month in Reviews drill-downs (per-project breakdown)
- Delegated actions contribute 20% of time (symmetric with Effort)

The previous Energy and Focus tracking concepts have been removed entirely. Subjective per-action ratings on those dimensions added friction without enough benefit.

---

## Main Task of the day

One Action per day marked as Main Task. Visible at the top of the Today zone as a rich card with var(--accent) border and Star icon (lucide Star, filled, var(--accent)).

The Star icon is the canonical Main Task indicator across the app — appears inline in action lists (TODAY'S ACTIONS, /actions, drill-downs) on the Main Task row, in Action editor banner, and anywhere else that action surfaces.

Set during Plan today step 2 (MAIN TASK section dropdown — optional, can be skipped), or change/clear directly from Today zone via × button on the card. Clearing requires Tier 1 confirmation.

Main Task card supports full action interactions: checkbox marks done with validation (bidirectional — click again re-opens), click body opens Action editor.

---

## Daily Flow

### Morning — Plan today

Triggered manually via "Start your day →" CTA on Today State A. Does NOT auto-open. Full-page in-place takeover of /today URL (NOT a modal).

Two-step wizard:

**Step 1 — Day Type selection** (full-page centered composition):
- Heading "What kind of day is it?" + sub-line "Pick one to start planning."
- 4 large colored cards: Execution (green) / Recovery (purple) / Day Off (gray) / Sick (amber-red).
- Click auto-advances. Day Off / Sick commit DayEntry directly and skip step 2.

**Step 2 — Plan details** (Execution / Recovery only):
- Compact Day Type dropdown at top (allows changing without leaving step 2).
- ACTIONS section with two-pane picker (Available + Selected). NO Quick Start preset cards (removed).
- MAIN TASK section (optional dropdown).
- RITUALS TODAY section (Skip toggles).
- Footer: Cancel / "Start day" button.

The Intent section was removed earlier — focus on action commitment, not narrative framing.

User submits ("Start day") or cancels (with discard guard if any selections made).

### Evening — Close day

Triggered manually via "Close day" button on Today State B, OR automatically at midnight rollover. Full-page recap (NOT a modal). Replaces Today State B content with State C.

Auto-summary: stat tiles (Value Added / Actions Done / Rituals Done / Sessions / Time Invested) + Projects + Goals + Actions Done list + Rituals breakdown.

Conditional greeting "Solid work today." appears only when total focused time ≥ 2 hours.

NO reflection input — reflection field has been removed from the model.

Footer: "Re-open day" link + "View in Days →" link. NO submit button — page IS the recap.

### Combined Close + Plan flow — REMOVED

The previous combined modal (close yesterday + plan today) has been removed. With auto-open Plan today removed and Close day as full-page state, user navigates between Today states naturally. If yesterday wasn't closed, midnight rollover auto-closes it; user opens app and sees today as State A (fresh, unplanned), with yesterday's recap accessible via Looking Back card or /reviews/days.

---

## Visualizing progress

### Per-goal view
Three parallel axes: Project progress, Ritual consistency, Success Criteria.

### Reviews

Sidebar Reviews section consolidates archive views:
- **Days** — list with drill-down (v1).
- **Weeks** — list with drill-down (v1).
- **Months** — list with drill-down (v1).

Each review shows factual aggregates: actions done/delegated/dropped/cancelled, ritual consistency, top contributing actions per goal, time investment, value added, sessions, project/goal closures.

**Tone:** factual, never evaluative.

### Impact as a counter

Impact accumulates visibly. **No badges. No achievements.** Clean number, not reward system.

User controls Impact scale (1–10 per action). System doesn't normalize or compare across users.

---

## Action signals: Big Frog and Easy Wins

Auto-derived signals computed from existing fields. **Conceptual definitions** retained in spec but NOT surfaced as separate UI in v1 (the Quick Start preset cards on Plan today were removed). May resurface as Sort options on /actions or Plan today step 2 in a later iteration ("Sort: Heavy lift first" / "Sort: Quick wins first").

### Big Frog (Heavy lift)
- Impact in top 25% of active goals' open actions.
- Time estimate in top 25% (heavy time-cost actions).

### Easy Wins (Quick moves)
- Impact at or above median.
- Time estimate ≤ 1 hour.

### Source set
Open actions of active goals. Goal-level Backlog excluded.

Required Impact and Time values guarantee these signals are computable.

---

## Constraints summary

- **Max 2–3 active Goals** (hard limit)
- **Actions ≤ ~2 hours** (principle)
- **Projects close in foreseeable horizon** (soft signal)
- **One-time actions live under Project** (typical, except Goal-level Backlog)
- **Ideas live under Goal** (always)
- **Action requires Impact 1–10** (always; enforced)
- **Action requires Time estimate** for Done transition (enforced)
- **Planned status is derived** from scheduledDate, not separately chosen
- **Past date scheduling triggers Done conversion** with confirmation