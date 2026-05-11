# ActOS — Behaviors

> **Document role:** behavioral contract of the product. Every state mutation, derived computation, UI behavior, confirmation tier, and cascade rule. Source for both frontend implementation and backend API design.
> **Read alongside:** `03-MODEL.md` (entities and rules) and `09-DESIGN-SYSTEM.md` (visual specs).

---

## 1 — Principles

The behaviors below follow from product principles:

1. **The user is in control.** Every mutation is user-initiated. No auto-actions on user data (auto-archive, auto-cancel, etc.).
2. **Honest progress.** Computed values reflect current reality, not original intent. Drop and Cancel reduce project cost; they don't artificially boost progress percentages.
3. **Cascading respects intent.** Drop a project → drop its actions (consistent intent: "this didn't pan out"). But re-opening a dropped project doesn't auto-restore its actions (user decides what to bring back).
4. **Layer toggles preserve data.** Disabling a layer hides UI but never deletes user data. Re-enabling restores visibility.
5. **Confirmation tiers match severity.** Tier 1 for revertible/non-destructive. Tier 2 (name-typing) for permanent deletion.
6. **No silent failures.** Every state change produces visible UI feedback (toast, inline state update, etc.).

---

## 2 — Goal behaviors

### 2.1 Create goal

**Trigger**: "+ New goal" button on /goals OR "+ Add goal" placeholder on Progress hero OR ⌘K → Create new goal.

**Constraint**: max 3 active goals. Trigger button disabled (with tooltip) when 3 active exist.

**Default values**:
- status = active
- color = next available (goal-1, goal-2, goal-3 in order of vacancy)
- createdAt = now
- successCriteria = [] (empty)
- targetDate = null

**On save**:
- Goal created in store.
- Toast: "Goal '{title}' created".
- Goal editor closes.
- User remains on current page (or navigates if triggered from placeholder).

### 2.2 Edit goal

**Trigger**: "..." menu → Edit on goal card OR Goal page header → Edit.

**Editable fields**: title, type, description, successCriteria, targetDate, color (color rarely changed but allowed).

**Save**: autosave on blur in edit mode.

### 2.3 Mark goal complete

**Trigger**: Goal page Mark complete button OR "..." menu → Mark complete.

**Visibility of trigger**:
- "..." menu always shows it.
- Big button visible when "visibly completable" (all active projects closed) OR when ≥ 75% progress.

**Confirmation**: Tier 1 simple confirm. Body: "Mark this goal as complete? You can re-open it later if needed."

**On confirm**:
- Goal status → completed.
- completedAt = now.
- Goal moves to Completed section on /goals.
- Toast: "Goal '{title}' completed".
- Frees a slot for a new active goal.

### 2.4 Drop goal

**Trigger**: Goal page "..." menu → Drop OR /goals card "..." → Drop.

**Confirmation**: Tier 1. Body: "Drop this goal? Its projects, actions, and rituals will all be marked dropped. You can re-open the goal later, but child entities won't auto-restore."

**On confirm**:
- Goal status → dropped, droppedAt = now.
- **Cascade**: all child projects → dropped, all their actions → dropped (project cost recalculated to 0), all rituals attached to goal or its projects → archived.
- Goal moves to Dropped section.
- Toast: "Goal '{title}' dropped".

### 2.5 Delete goal

**Trigger**: "..." menu → Delete.

**Confirmation**: Tier 2 (name-typing). User must type goal title exactly.

**On confirm**:
- **Cascade permanent deletion**: goal + all projects + all actions + all rituals attached to goal/projects + all ideas attached to goal.
- DayEntries reference deleted action IDs become broken — handle gracefully (display "deleted action" placeholder in drill-down).
- Toast: "Goal '{title}' permanently deleted".

### 2.6 Re-open goal

**Trigger**: "..." menu on completed/dropped goal → Re-open.

**Confirmation**: Tier 1.

**On confirm**:
- Goal status → active.
- completedAt or droppedAt cleared.
- Goal reappears in Active section.
- **Children NOT auto-restored**: dropped projects/actions stay dropped. User manually re-opens what they want to continue. Toast hint: "Re-open child projects manually as needed."

### 2.7 Goal progress computation

**Value %** = (sum of Impact of Done + Delegated actions in goal's projects) / Goal Cost × 100.

**Effort %** = (sum of Impact × 1.0 of Done actions + 0.2 × Impact of Delegated actions in goal's projects) / Goal Cost × 100.

**Time Invested** = (sum of Time × 1.0 for Done actions + Time × 0.2 for Delegated actions) across all projects in goal. The 20% delegation discount applies symmetrically to Time, parallel to Effort.

**Goal Cost** = sum of all active project costs in goal (excluding dropped projects, which contribute 0).

**Goal "ready to close"**: Value ≥ 75% triggers visual indicator on cards.

**Goal "visibly completable"**: all active projects in goal are closed (completed or dropped). Triggers stripe glow + banner.

---

## 3 — Project behaviors

### 3.1 Create project

**Trigger**: "+ New project" affordance OR "+ Add project" on Goal page OR ⌘K OR convert idea to project.

**Required**: title, parent goalId.

**Default values**:
- status = active
- description = empty
- references = []
- createdAt = now

**On save**:
- Project created in store.
- Toast: "Project '{title}' created in '{goal title}'".
- Project editor closes; user navigates to /projects/:id (the new project page).

### 3.2 Edit project

**Trigger**: "..." menu → Edit OR direct field edit on project page.

**Editable**: title, parent goal, description (rich-text), references.

**Description autosave**: on blur and after 3s of inactivity.

**Reference operations**:
- Add reference: inline form expands, URL required, title optional.
- Edit reference: inline edit on row.
- Remove reference: "..." menu → Remove (no confirmation; revertible easily).

### 3.3 Mark project complete

**Trigger**: Project page Mark complete button OR "..." menu → Mark complete.

**Visibility of trigger button**:
- Always visible in "..." menu.
- Banner suggestion appears when all actions in project are Done or Delegated.

**Confirmation**: Tier 1. Body: "Mark this project complete?"

**On confirm**:
- Project status → completed, completedAt = now.
- Toast: "Project '{title}' completed".
- Goal Value/Effort/Time recompute.

### 3.4 Drop project

**Trigger**: "..." menu → Drop.

**Confirmation**: Tier 1. Body: "Drop this project? All its actions will be marked dropped. The project cost will be removed from the goal cost."

**On confirm**:
- Project status → dropped, droppedAt = now.
- **Cascade**: all child actions → dropped. Each action's droppedAt = now.
- Project Cost recomputes to 0 (since all actions dropped).
- Goal Cost recomputes (project no longer contributes).
- Toast: "Project '{title}' dropped".

### 3.5 Delete project

**Trigger**: "..." menu → Delete.

**Confirmation**: Tier 2 (name-typing).

**On confirm**:
- Permanent deletion of project + all actions + rituals attached to project.
- Toast: "Project '{title}' permanently deleted".

### 3.6 Move project to another goal

**Trigger**: "..." menu → Move to another goal.

**UI**: dropdown of active goals (excluding current parent).

**On confirm**:
- Project goalId updated.
- All child actions inherit new goalId.
- Project color stripe updates to new goal's color across all visualizations.
- Toast: "Project moved to '{new goal title}'".

### 3.7 Split project

**Trigger**: project growth banner OR "..." menu → Split.

**Wizard** (multi-step):
- Step 1: choose how many splits (2 minimum).
- Step 2: assign each action to one of the new projects.
- Step 3: name each new project.
- Step 4: confirm.

**On confirm**:
- New projects created (status active, parent goal same as original).
- Original project: status → completed (closeable rationale: split is a form of close).
- Actions reassigned per user's mapping.
- Toast: "Project split into {N} new projects".

### 3.8 Close-and-continue

**Trigger**: project growth banner OR "..." menu → Close-and-continue.

**Flow**:
- Review: shown actions classified as done vs remaining.
- Confirm successor project name (default: original name + suffix or duplicate).
- On confirm:
  - Original project: status → completed.
  - New successor project created with remaining (non-Done) actions transferred.
  - Toast: "Closed '{original}'. Continuing in '{new}'".

### 3.9 Project Cost computation

**Project Cost** = sum of Impact of all actions where status NOT IN (dropped, cancelled).

**Project Value %** = (sum of Impact of Done + Delegated actions) / Project Cost × 100.

**Project Effort %** = (sum of Impact of Done + 0.2 × Delegated actions) / Project Cost × 100.

**Project Time Invested** = sum of Time × 1.0 for Done actions + Time × 0.2 for Delegated actions.

**Project Time Remaining** = sum of Time estimates for Backlog + Planned actions.

**Recomputed on**: action status change, action Impact change, action Time change, action add, action delete.

### 3.10 Project "stalled" indicator

**Stalled** when last activity (Done or Delegated action OR completed sub-action OR project edit) is > 7 days old.

Visualized via state indicator dot color: `var(--state-stalled)` instead of `var(--state-active)`.

### 3.11 Project growth signal

**Triggers banner** when:
- Age > 30 days without close, OR
- Action count grew significantly in 14 days (e.g., from 4 to 12, or 50% increase).

**Banner is non-blocking**. User can dismiss; reappears 14 days later if conditions persist.

---

## 4 — Action behaviors

### 4.1 Create action

**Triggers**:
- Inline-add input (Today, Project page, drill-down): commits Backlog or Planned action without opening editor.
- "+ New action" header button on /actions: opens Action editor as MODAL (640px, centered).
- ⌘K → Create new action: opens Action editor as modal.
- "+ Add action to this day" in Reviews drill-down: opens Action editor with retroactive defaults.
- Convert idea to action: opens Action editor pre-filled.

**Modal field order** (top to bottom): Title → Estimates (Impact + Time) → Parent (Goal + Project) → Scheduled date → Notes (collapsed by default). State field is NOT shown in create modal — status auto-derives from Scheduled date (no date = Backlog, date = Planned, past date = Done via existing past-date confirmation).

**Required fields for create**:
- Title (non-empty after trim).
- Impact (numeric, 1-10).
- Parent Goal selected. Project is optional — empty Project = Goal-level Backlog (valid configuration).
- Time estimate is NOT required at create. Empty Time is valid for Backlog/Planned. Required only for Done transition (unchanged).
- scheduledDate is optional. Empty = Backlog. Set = Planned (or Done if past date).
- delegate name: required IF status = Delegated (delegated path is separate flow, not via create modal).

**Default values**:
- status auto-derives from scheduledDate (no explicit default needed)
- impact = empty (user must enter; no default of 0 to avoid accidental save)
- timeEstimate = empty (allowed for Backlog/Planned)
- createdAt = now

**Validation in create modal**:
- "Create action" button is always clickable. When required fields are missing, button appears desaturated (opacity 0.6) but still triggers validation on click.
- Enter key on Title input triggers submit attempt.
- On submit attempt with missing required fields: inline errors appear under each missing field, first error field receives focus.
- No tooltip on button (replaced by inline errors).
- Discard guard on close if any field filled.
- Inline-add commits without full validation (Impact required on edit, not create).

**Inline error messages**:
- Empty Title: "Add a title."
- Empty/invalid Impact: "Impact is required (1-10)."
- Missing Parent Goal: "Pick a goal."
- (No error for empty Time at create — Time is optional until Done transition.)
- (No error for empty Project — Goal-level Backlog is valid.)

**Validation behavior on Done transition** (unchanged):
- Inline error appears below field when blocking (Inter 12px var(--text-warning)).
- Status transition to Done blocked if Impact = 0 or empty: error "Impact is required to mark this action Done."
- Status transition to Done blocked if Time = 0 or empty: error "Time estimate is required to mark this action Done."

**On save**:
- Action created.
- Project Cost recomputes (Value, Effort, Time totals).
- Toast: "Action '{title}' created" (only for editor flow; inline-add silent).
- **Post-create navigation**: modal closes and user returns to the list view they were on. The slide-in Action editor does NOT open automatically. The new action appears in the list at its correct sorted position. If the user wants to edit immediately, they click the row — no pre-emption.

**Legacy actions without required fields**:
- If imported / migrated actions have Impact = 0: show warning banner at top of editor "This action has no Impact set. Set a value to include it in progress calculations."
- Editor allows fixing other fields, but blocks status transition to Done until Impact and Time are set.

### 4.2 Edit action

**Trigger**: click any action row.

**Editable**: title, parent (project or goal-level Backlog), status, scheduledDate, notes, impact, costs (if layers on), delegation info (if Delegated).

**Save**: autosave on field blur.

**Status as derived state**:

"Planned" is NOT a status the user explicitly selects. It is the **derived state** when an action has a scheduledDate set. The Status dropdown does not include "Planned" as a clickable option. Users transition between Backlog ↔ Planned by adding/removing scheduledDate via the DatePickerChips component.

**Status transitions trigger side effects**:

To **Backlog**: scheduledDate cleared. Action returns to Backlog group. plannedAt timestamp preserved (history).

To **Planned (auto-derived from scheduledDate)**:
- User clicks "Today" or "Tomorrow" chip, OR picks future date in calendar.
- scheduledDate = picked date.
- status auto-derives to Planned.
- plannedAt = now (if not already set).
- No explicit dropdown click.

To **Done**:
- Validation: Impact required (> 0), Time required (> 0). Block transition with inline error if missing.
- completedAt = now.
- Toast: "Action marked done".
- Project Cost stays same (Done counts in cost).
- Value, Effort, and Time Invested recompute.

To **Delegated**:
- Reveal Delegation block in editor.
- Status changes to Delegated only after delegate name (required) is entered.
- delegatedAt = now (when name entered).
- Optional expectedReturnDate, delegationNote.
- Action appears in /delegated.
- Toast: "Delegated to {name}".

To **Dropped**:
- Confirmation (Tier 1). Body: "Drop this action? Its impact will be removed from the project cost."
- On confirm: droppedAt = now.
- Project Cost recomputes (Impact subtracted).
- Toast: "Action dropped".

To **Cancelled**:
- Confirmation (Tier 1). Body: "Cancel this action? It will count as never done."
- On confirm: cancelledAt = now.
- Project Cost recomputes.
- Toast: "Action cancelled".

**Re-open from terminal status**:
- Status → Backlog (default).
- Clear current terminal timestamp (completedAt, droppedAt, cancelledAt).
- Keep history of plannedAt and delegatedAt (those are historical state markers).
- Project Cost recomputes if action was previously Dropped or Cancelled (Impact restored).
- Toast: "Action re-opened".

**Past date scheduling — confirmation flow**:

When user picks a date strictly < today via chips or calendar:

1. Tier 1 confirmation modal appears.
2. Title: "Schedule for past date?"
3. Body: "You picked {date} ({relative — '3 days ago' / 'last week'}), which is in the past. This action will be marked as Done on that date and counted in progress calculations."
4. Actions: Cancel (Tier C link) / "Mark as Done on {short date}" (Tier A button).
5. On confirm:
   - status = Done (not Planned).
   - completedAt = picked date (timestamp at noon UTC of that day).
   - scheduledDate = picked date (preserved as historical record).
   - plannedAt = null (never genuinely planned).
   - Project Cost recomputes.
   - Action appears in /reviews/days/{date} under Done sub-group.
   - Toast: "Marked done on {short date}".
6. On cancel: no state change, picker reverts.

Today (current date) does NOT trigger this confirmation — picking today sets status=Planned for today (normal flow).

Edge case: editing existing Done action and changing completedAt to past date does NOT trigger this confirmation (action is already Done; just adjusting when).

**Status timestamp display in Action editor**:

Below Status dropdown, display contextual timestamp line:
- Status = Backlog: no timestamp line.
- Status = Planned, scheduledDate = today: "Scheduled for today".
- Status = Planned, scheduledDate = future: "Scheduled for {date}" or "Scheduled for tomorrow".
- Status = Planned, scheduledDate < today (overdue): "Overdue · scheduled for {date}" in var(--text-warning).
- Status = Done: "Completed today" / "Completed yesterday" / "Completed {date} ({relative})".
- Status = Delegated: "Delegated to {name} · {relative}".
- Status = Dropped: "Dropped on {date}".
- Status = Cancelled: "Cancelled on {date}".

**Clickable timestamps**:
- The date portion is wrapped in a `<Link to="/reviews/days/{iso}">` element.
- Hover: underline + accent color.
- Click: navigates to drill-down for that date AND closes the Action editor panel.
- Surrounding label words ("Completed", "Dropped on", "Delegated to X ·") are NOT part of the link — only the date text is clickable.

If status is Done AND scheduledDate ≠ completedAt date:
- Secondary line below timestamp: "Originally scheduled for {date}" in var(--text-tertiary).
- Informational, not interactive.

### 4.3 Delete action

**Trigger**: Action editor → Delete (icon at bottom).

**Confirmation**: Tier 1.

**On confirm**:
- Permanent removal.
- Toast: "Action deleted".

### 4.4 Retroactive entry / edit

**Triggers**:
- "+ Add action to this day" in Reviews drill-down: opens editor with `scheduledDate=that date`, `status=done` (default), `completedAt=that date`.
- Click action row in Reviews drill-down: opens editor in edit mode. User can change `completedAt` to a different date.

**Effect**:
- Saving with past completedAt logs work to that day's drill-down.
- Changing completedAt to different date moves action between drill-downs.
- All cascading recomputations happen normally.

### 4.5 Bidirectional checkbox toggle (mark done ↔ re-open)

**Behavior**: clicking checkbox on an action row toggles status in both directions.

**If status IS Backlog or Planned (active)**:
- Validates Impact + Time set (required for Done transition).
- Marks action Done. completedAt = now.
- Project Cost recompute, Project/Goal Value/Effort/Time Invested recompute.
- DayEntry done counts increment.
- Toast: "Action marked done".

**If status IS Done**:
- Re-opens immediately (no confirmation).
- status = Planned (not Backlog).
- scheduledDate = today (action stays on Today).
- completedAt = null.
- Project Cost recomputes.
- Project/Goal Value/Effort/Time Invested recompute (subtracted).
- DayEntry done counts decrement.
- Toast: "Action re-opened".

**If status IS Delegated, Dropped, or Cancelled**:
- Checkbox is disabled (greyed out, cursor not-allowed).
- Tooltip on hover: "Re-open this action via the editor".
- Click → no action.

**Visual transitions on re-open**:
- Checkbox unchecks (animation: checkmark fades out).
- Title strikethrough removed.
- Title color: var(--text-secondary) → var(--text-primary).
- Action immediately re-sorts to active group (above Done actions in list).
- Counts update live ("2 done · 2 remaining" → "1 done · 3 remaining").

**Applies to functional list views**:
- Today zone TODAY'S ACTIONS list.
- /actions list page.
- Project page actions list.
- Main Task card on Today zone.

**Does NOT apply** (preserve click-to-edit pattern):
- Reviews drill-down lists (archival views).
- Recently Closed Actions on /progress (archival view).
- Plan today step 2 picker (different interaction — toggles selection, not status).

**Toast rate-limiting**: rapid checkbox clicks don't queue toasts; only the final action's result is shown.

### 4.6 Goal-level Backlog action

**Definition**: action with projectId=null, goalId=set, status=Backlog.

**Constraint**: status locked to Backlog while projectId is null.

**To plan or complete**: user must first assign to a project (Action editor → Parent picker).

**UI hint** in Action editor: "Assign to a Project to plan or complete."

### 4.7 Action editor footer CTA logic

The footer CTAs adapt to mode (new vs edit) and current status. Footer never shows "Mark done" while creating — that would let users save+complete in one click without filling details.

**New mode (action being created, no id yet)**:
- Right side: "Create" button (Tier A — accent bg, white text).
- Left side: "Cancel" link (Tier C).
- Hidden: Mark done, Re-open, Delete buttons.
- "Create" disabled until all required fields filled.

**Edit mode — Backlog or Planned status**:
- Right side: "Mark done" button (Tier A).
- Left side: "..." menu (Duplicate, Delete with Tier 1 confirmation).
- Click "Mark done" runs validation (Impact, Time); blocks with inline error if missing.

**Edit mode — Done status**:
- Right side: "Re-open" button (Tier B secondary).
- Left side: "..." menu (Duplicate, Delete).

**Edit mode — Delegated status**:
- Right side: "Mark done" button (Tier A) — for when delegate completes the work.
- Middle: "Re-open" button (Tier B).
- Left side: "..." menu.

**Edit mode — Dropped or Cancelled status**:
- Right side: "Re-open" button (Tier B).
- Left side: "..." menu.

**Visual**:
- Footer: 1px var(--border-subtle) top border, 16px vertical padding.
- Sticky to bottom of slide-in panel.
- Buttons follow Tier A/B/C styling.

### 4.8 Delegated page (/delegated) behaviors

**Sidebar navigation**: nav item with lucide Send icon, in Execution group between Actions and Rituals.

**Page layout** (Medium tier, 1024px max-width, unified header pattern):

1. **Header** with page title "Delegated" + "+ Delegate" button (Tier A; short verb label, keeps full label on mobile).
2. **Meta line** (below title): "{N} ACTIVE · {N} OVERDUE · {N} DUE TODAY" — counts colored when > 0 (overdue var(--text-warning), due today var(--accent)).
3. **Tabs**: Active (default — currently delegated) / Returned (history of delegations now Done).
4. **Filter bar**: DELEGATE / GOAL / DATE / Sort (in unified filter bar; horizontal scroll on mobile).
5. **List**: DelegatedRow pattern (no checkbox; desktop = three-column flex; mobile = vertical two-row stack with inline return-status). See 09-DESIGN-SYSTEM § 3.10b for full spec.

**Direct create flow** ("+ Delegate" button):
- Opens Action editor as MODAL (640px desktop, bottom sheet mobile) — same modal pattern as creating any action.
- Pre-filled with status=Delegated (locked initially, can change).
- Delegation block visible by default (Delegate name field + Expected return date + Note).
- Required fields highlighted: Title + Delegate name + Parent (Goal/Project).
- Submit → action created with status=Delegated, delegatedAt = now. Modal closes. Action appears in /delegated Active tab.

**Color-coded return date** (the ONLY place "overdue" framing exists in app) — two presentations:

Desktop (≥ 769px), pill format:
- Overdue (expectedReturnDate < today): var(--text-warning) text + 8% opacity background + format "return {date} · {N}d ago".
- Due today (expectedReturnDate = today): var(--accent) text + 8% opacity background + format "return today".
- Future (expectedReturnDate > today): var(--text-tertiary) text + no background + format "return {date}" or "return in {N}d · {date}".
- No date: italic "no return date" var(--text-tertiary).

Mobile (≤ 768px), inline in meta line, color only (no background fill):
- Overdue: "{N}d overdue" (e.g., "8d overdue") in var(--text-warning).
- Due today: "due today" in var(--accent).
- Future ≤ 7 days: "in {N}d" (e.g., "in 3d") in var(--text-tertiary).
- Future ≥ 8 days: "{Mon D}" (e.g., "May 10") in var(--text-tertiary).
- No date: italic "no return date" in var(--text-tertiary).
- Parent goal and parent project are dropped from the meta line on mobile to free up space.

Tooltip on hover/long-press (both viewports): full absolute date + relative context.

**Returned tab**: shows actions which were delegated and are now Done. Return-status replaced with "returned {relative}". Click row → Action editor (Done state).

**Tab transitions** (when delegated action transitioned to Done):
- Disappears from Active tab.
- Appears in Returned tab.
- Reflected in goal/project progress at full Impact.

**When delegated action transitioned to Dropped/Cancelled**:
- Disappears from Active tab.
- Does NOT appear in Returned (only Done = "successfully returned").
- Stays in /actions filtered by status.

**Empty state** (Active tab with no delegated actions):
- Headline: "Nothing delegated yet."
- Description: "When you delegate an action to someone, it appears here with the expected return date so you can track what's outstanding."
- CTA: "+ Delegate".

**Empty state** (Returned tab with current filters yielding zero):
- "No items match these filters." + "Clear filters" link.

**⌘K integration**:
- "Delegated" appears in navigation matches.
- Action search results include delegated actions (with → delegate name).

---

## 5 — Ritual behaviors

### 5.1 Create ritual

**Trigger**: "+ Add ritual" ghost card OR "+ Add ritual to this goal" on Goal page OR ⌘K.

**Optional starting point**: template chooser (Weekly project audit / Monthly goal review / Create from scratch).

**Modal field order** (top to bottom): Title → Estimates (Base Impact + Time) → Parent (Goal + Project) → Schedule → Notes (collapsed by default). NO Time-of-day field — was removed (notifications/reminders are out of v1 scope).

**Required fields for create**:
- Title (non-empty after trim).
- Base Impact (numeric, 1-10). Per MODEL § Ritual: "Base Impact — user-rated 1–10".
- Time estimate (> 0 minutes). Per MODEL § Ritual: "Time estimate — minutes, applies per instance".
- Parent Goal selected. Project is optional — empty Project = Goal-level ritual.
- Schedule selected (Daily / Weekdays / Weekly / Monthly / Custom). Plus schedule config sub-fields when Weekly (day-of-week multi-select), Monthly (day-of-month or Nth-weekday), Custom (per existing data model).

**Default values**:
- status = active
- baseImpact = empty (user must rate; no default of 0 to avoid accidental save)
- timeEstimate = empty (user must enter)
- totalCompletions = 0
- multiplier = ×1.00
- completionHistory = []

**Validation in create modal**:
- "Create ritual" button is always clickable. When required fields missing, button appears desaturated (opacity 0.6) but still triggers validation on click.
- Enter key on Title input triggers submit attempt.
- On submit attempt with missing required: inline errors appear under each missing field, first error field receives focus.
- No tooltip on button (replaced by inline errors).
- Discard guard on close if any field filled.

**Inline error messages**:
- Empty Title: "Add a title."
- Empty/invalid Base Impact: "Base Impact is required (1-10)."
- Empty/invalid Time: "Time is required."
- Missing Parent Goal: "Pick a goal."
- Missing Schedule: "Pick a schedule."
- (No error for empty Project — Goal-level ritual is valid.)

**On save**:
- Ritual created.
- Toast: "Ritual '{title}' created".
- Post-create navigation: modal closes and user returns to the list view they were on. The slide-in Ritual editor does NOT open automatically (matches Action create flow).

### 5.2 Edit ritual

**Trigger**: click ritual card on /rituals.

**Editable**: title, parent, schedule, baseImpact, notes, costs.

**Save**: autosave on blur.

### 5.3 Mark ritual instance done

**Trigger**: checkbox on Today zone ritual row OR "Mark today done" on ritual card.

**On click**:
- completionHistory adds entry: { date: today, status: 'done' }.
- totalCompletions += 1.
- Multiplier recomputes per the 7-tier formula.
- Goal Effort recomputes (Effective Impact = base × multiplier).
- Toast: "Ritual marked done — multiplier now ×{newMultiplier}".

### 5.4 Skip / Restore ritual instance

**Trigger**: single Skip toggle button on Plan today step 2 RITUALS TODAY section OR Today zone TODAY'S RITUALS row.

**Default state**: ritual is "happens today" (not skipped). Button shows "Skip".

**On click "Skip"**:
- Ritual ID added to DayEntry.skippedRitualIds for today.
- completionHistory adds entry: { date: today, status: 'skipped' }.
- totalCompletions NOT incremented.
- Multiplier unchanged.
- Row visually faded (opacity 0.5) in Today zone and Plan today step 2.
- Button changes to "Restore".
- Toast: "Ritual skipped for today".

**On click "Restore"** (from skipped state):
- Ritual ID removed from DayEntry.skippedRitualIds.
- Most recent { date: today, status: 'skipped' } entry removed from completionHistory.
- Row returns to normal opacity.
- Button changes back to "Skip".
- Toast: "Ritual restored to today's plan".

**Why single button toggle** (instead of dual Keep/Skip):
- Default = "ritual happens today" (per ritual schedule). Keep is the default state, doesn't need a button.
- Skip is the explicit opt-out for a single day.
- Removes one click and reduces UI clutter.
- Toggle is always reversible within the same day.

### 5.5 Missed ritual instance

**Definition**: ritual was scheduled for today, day passed (now > today), no Done or Skipped recorded.

**Auto-handled**: when day rolls over, system creates entry { date: yesterday, status: 'missed' } for unmarked rituals.

**Effect**: completionHistory grows with missed entries; multiplier unaffected.

### 5.6 Ritual multiplier formula

| Total completions (Done) | Multiplier |
|--------------------------|------------|
| 0–6 | ×1.00 |
| 7–13 | ×1.05 |
| 14–29 | ×1.10 |
| 30–59 | ×1.25 |
| 60–119 | ×1.50 |
| 120–359 | ×1.75 |
| 360+ | ×2.00 |

**Effective Impact** (used in Goal Effort) = baseImpact × multiplier.

**Recomputed**: on every Done entry added.

### 5.7 Archive ritual

**Trigger**: "..." menu → Archive.

**Confirmation**: Tier 1. Body: "Archive this ritual? You won't see it in active lists, but its history is preserved."

**On confirm**:
- Status → archived, archivedAt = now.
- Hidden from default /rituals view; visible in "Archived" filter or section.
- No longer scheduled for new days.
- Toast: "Ritual archived".

### 5.8 Restore archived ritual

**Trigger**: "..." menu on archived ritual → Restore.

**On click**:
- Status → active.
- archivedAt cleared.
- Resumes scheduling per its schedule.
- Multiplier and history preserved (count picks up where it was).

### 5.9 Delete ritual

**Trigger**: "..." menu → Delete.

**Confirmation**: Tier 1.

**On confirm**: permanent. History gone. Toast: "Ritual deleted".

---

## 6 — Idea behaviors

### 6.1 Capture idea

**Trigger**: "+ New idea" header button on /ideas OR ⌘K → Capture idea.

**Form factor**: Idea creation modal (640px desktop, bottom sheet mobile). Same modal pattern as Action / Goal / Ritual creation.

**Required**: title.

**Fields**:
- Title (auto-focused, required).
- Goal (dropdown, defaults to user's primary or first active goal — with goal-color dot before each option).
- Note (textarea, optional).

**Default values on create**:
- status = captured
- references = []
- imageAttachments = []
- capturedAt = now

**On save (click Create button)**:
- Idea created.
- Modal closes.
- Toast: "Idea captured in '{goal title}'".

**Discard guard**: closing modal with title or note filled → confirmation.

### 6.2 Edit idea

**Trigger**: click idea row on /ideas list. Idea editor opens as slide-in panel (480px desktop, bottom sheet mobile).

**Editable**: title, note, references, imageAttachments, parent goal.

**Save**: autosave on blur.

**Footer adapts to status**:
- Captured: "..." menu (Delete) + "Convert to action" (Tier B) + "Convert to project" (Tier B) + "Discard" (Tier C).
- Converted: "..." menu (Delete) + read-only state, optional "Open {action|project}" link.
- Discarded: "..." menu (Delete) + "Restore" (Tier B).

### 6.3 Convert idea to action

**Trigger**: "Convert to action" button in Idea editor footer (Captured state only).

**Flow**:
- Action create modal opens (overlays the idea editor).
- Pre-filled: title from idea title, notes from idea note, parent goal from idea goal.
- User picks parent project (required to leave Backlog).
- Save → Action created. Idea status → converted_to_action, idea.convertedToId = action.id.
- Toast: "Idea converted to action in '{project}'".

### 6.4 Convert idea to project

**Trigger**: "Convert to project" button in Idea editor footer (Captured state only).

**Flow**:
- Navigate to /projects/{newId} draft mode (page-based creation).
- Pre-filled: title from idea title, description from idea note, parent goal from idea goal.
- Save → Project created. Idea status → converted_to_project, idea.convertedToId = project.id.
- Toast: "Idea converted to project in '{goal}'".

### 6.5 Discard idea

**Trigger**: "Discard" button in Idea editor footer (Captured state only).

**Confirmation**: Tier 1.

**On confirm**:
- Status → discarded, discardedAt = now.
- Hidden from default Captured filter.
- Visible when STATUS filter set to Discarded or All.
- Toast: "Idea discarded".

### 6.6 Restore idea

**Trigger**: "Restore" button in Idea editor footer (Discarded state only).

**On click**:
- Status → captured, discardedAt cleared.
- No confirmation (reversible, low-stakes).
- Toast: "Idea restored".

### 6.7 Move idea to another goal

**Trigger**: edit idea, change parent goal selector.

**On save**: idea.goalId updated. Idea moves between goals' Ideas section.

---

## 7 — Day-level behaviors

### 7.1 Plan today trigger — REMOVED auto-open

**Auto-open behavior has been REMOVED**. Plan today does NOT auto-open on first /today load each day. The session-storage "dismissed for current session" flag is no longer used and should be removed from any persistence layer.

User must explicitly initiate planning by clicking "Start your day →" CTA on Today State A. No nudges, no automatic prompts.

**Rationale**: Less paternalism, lower morning friction. User opens the planner when they're actually ready to plan, not because the app demands it.

### 7.2 Plan today flow (full-page two-step wizard)

**Trigger**: user clicks "Start your day →" on /today State A.

**Form factor**: full-page in-place takeover of /today URL. Sidebar stays visible. NOT a modal. NOT a separate route — same /today URL, content swaps based on local in-flow state.

**Architecture**: two-step wizard.

#### Step 1 — Day Type selection

Vertically centered composition.

- Heading "What kind of day is it?" (Inter 24-28px medium primary text — NOT a tiny mono uppercase label).
- Sub-line "Pick one to start planning." (Inter 14px var(--text-secondary)).
- 4 large colored cards (~140px min-height each):

  | Card | Accent token | Lucide icon | Title | Description |
  |------|--------------|-------------|-------|-------------|
  | Execution | var(--state-active) (green) | Zap | "Execution" | "Full work day — normal expectations." |
  | Recovery | var(--goal-3) (purple) | Leaf | "Recovery" | "Light day, intentional rest." |
  | Day Off | var(--state-stalled) (gray) | Sun | "Day Off" | "No work, fully off." |
  | Sick | var(--status-dropped) (amber-red) | Thermometer | "Sick" | "Illness — expectations suspended." |

- Card has 40px circle filled with day-type accent at ~12% opacity, lucide icon centered (20px) in full saturated accent.
- Card hover: border lights up to full saturation accent color.
- 2x2 grid on mobile.
- "Cancel" link top-right of page.
- NO "Continue" button — selection auto-advances.

**Click behavior — auto-advance**:
- Execution / Recovery → commit dayType to local state, advance to step 2 immediately (150ms cross-fade or instant).
- Day Off / Sick → commit DayEntry directly (isPlanned=true, dayType set, plannedActionIds=[], plannedRitualIds=[], mainTaskActionId=null), navigate to Today State B (which shows quiet day view since nothing planned).

**Browser refresh during step 1**: dayType selection NOT yet persisted to LocalStorage. Refresh returns to /today State A.

#### Step 2 — Plan details (Execution / Recovery only)

Top: compact Day Type dropdown (see DESIGN-SYSTEM § 3.26 variant 3) — allows changing dayType without leaving step 2:
- Click dropdown → popover lists all four day types with colored dots.
- Switching to Execution ↔ Recovery: no confirmation, dayType updates, stay on step 2.
- Switching to Day Off / Sick: confirmation "Switch to {dayType}? Your planned actions and main task will be discarded." On confirm: plannedActionIds cleared, mainTaskActionId cleared, commit DayEntry, navigate to State B.

Sections vertically with 32px gap between (each with prominent Inter 18-20px medium primary heading sub-line):

1. **ACTIONS · {N selected}** — sub-line "Pick what you'll work on today.":
   - Two-pane ActionPicker (Available 60% + Selected 40% on desktop, stacked on mobile).
   - **Available pane**: filter dropdowns (GOAL / PROJECT / Status — custom dropdowns, NOT native `<select>`) → "ALREADY SCHEDULED · {N}" sub-section (when applicable, pre-checked actions where scheduledDate=today set before today; user can un-check) → action list with 48px rows (3px goal stripe + checkbox + two-line content + ImpactPill + TimePill on right) + bidirectional checkbox toggle → inline-add at bottom (custom Goal/Project dropdowns, NOT native selects).
   - **Selected pane**: "SELECTED · {N}" heading + numbered drag-reorderable rows (each: drag handle + number + title + breadcrumb + TimePill + × remove) + "Estimated time: {H}h {M}m" aggregate.
   - **NO Quick Start preset cards** — Heavy Lift / Quick Moves removed.

2. **MAIN TASK** — sub-line "What single thing makes today a win?":
   - Optional dropdown "Pick from selected actions ▾" (lists currently selected actions). Disabled when 0 actions selected (or shown but with empty placeholder).
   - User can leave Main Task unset — day still saves.

3. **RITUALS TODAY · {N}** (only if rituals scheduled today) — sub-line "Mark anything you want to skip.":
   - Each row: 3px goal stripe + title + meta + MultiplierPill (goal-tinted) + TimePill (neutral) + Skip toggle.
   - Click Skip → row faded (opacity 0.5), button → "Restore". Click Restore → unfaded.

**Footer**:
- "Cancel" link left (Tier C). On click: discard guard if any selections made, otherwise silent revert to Today State A.
- "Start day" button right (Tier A). NOT "Plan day".

**Validation**: NO required minimum. Submit button always enabled. Can commit DayEntry with 0 selected actions and no Main Task — handles "I just want to mark dayType, figure out actions later" cases.

**On submit (Start day)**:
- DayEntry created or updated.
- isPlanned = true.
- dayType set.
- plannedActionIds = user's selected actions (from picker — includes any newly-created from inline-add).
- plannedRitualIds = rituals NOT in skippedRitualIds.
- skippedRitualIds = rituals where user clicked Skip toggle.
- mainTaskActionId = user's pick from MAIN TASK section (or null).
- For pre-scheduled actions un-checked in step 2: scheduledDate cleared (action returns to Backlog).
- For inline-added actions: status=Backlog with scheduledDate=today.
- /today swaps to State B.
- Toast: "Day started." (NOT "Day planned" — verb match with "Start day" button).

**Browser refresh during step 2**: DayEntry was not yet committed in step 1, so refresh returns to step 1.

**Mobile (≤ 768px)**:
- Step 1 cards: 2x2 grid.
- Step 2 picker: vertical stack (Available top, Selected below).
- Footer "Start day" button: sticky bottom (above safe-area inset).
- "Cancel" footer link hidden on mobile (top-right Cancel suffices) to free vertical space.

### 7.3 Close day flow (full-page recap)

**Trigger**:
- User clicks "Close day" button in Today State B.
- OR automatically when browser detects local date rollover at midnight: DayEntry.isClosed=true, closedAt=PREVIOUS day's 23:59:59 (NOT current "now" which is already next day). Missed rituals marked: any DayEntry.plannedRitualIds where the ritual has no completionHistory entry for that date AND not in skippedRitualIds → completionHistory entry { date, status: 'missed' } added.

**Form factor**: full-page recap, replaces Today State B content with State C. Sidebar stays visible. NOT a modal.

**Layout** (Medium tier, 1024px max-width):

- Page header:
  - Title "Day closed" (Inter 32-36px medium).
  - Sub-line: full date "Friday, May 8" + DayTypeIndicator compact (e.g., "⚡ EXECUTION DAY" mono uppercase).
  - Conditional greeting line below sub-header (Inter 16px var(--text-primary), 8px gap):
    - "Solid work today." — ONLY when total focused time today (sum of Done action times in minutes) ≥ 120.
    - Otherwise: NO greeting line at all (no negative or remedial messaging when low output).

- 1px var(--border-subtle) divider.

- **Stat tiles row** (5 tiles when sessions > 0, 4 when not):
  - VALUE ADDED: sum of Impact from Done + Delegated × 0.2.
  - ACTIONS DONE: count of actions marked Done today.
  - RITUALS DONE: count of rituals marked Done today.
  - SESSIONS (CONDITIONAL — only when ≥1 session today): count + sub-line "{H}h {M}m focused".
  - TIME INVESTED: sum of action times for Done + (Delegated time × 0.2).
  - Tile styling: var(--surface-raised) bg, 1px var(--border-subtle), 6px radius, padding 16px 20px. Big number Inter 24-28px medium tabular. Label mono 11px uppercase var(--text-tertiary).
  - Mobile: 2 tiles per row.

- **PROJECTS** section (only if any actions today touched projects): grouped list "Project · {N} actions done", click → /projects/{id}.
- **GOALS** section (only if any goal progress today): per-goal "+{V} value · {H}h" line with goal-color dot, click → /goals/{id}.
- **ACTIONS DONE · {N}** list: compact ActionRow pattern (Done state — line-through, dimmed Impact pill).
- **RITUALS · {N done} · {N skipped} · {N missed}** section: grouped by status (only if rituals scheduled today).

- **REFLECTION section — REMOVED ENTIRELY**. Reflection field has been REMOVED from the data model. NO reflection input, NO reflection text rendering on this page.

- Footer (NOT sticky):
  - Left: "Re-open day" link (Tier C). Click → Tier 1 confirmation "Re-open this day? You'll be able to mark more actions and re-close it later." On confirm: DayEntry.isClosed=false, closedAt cleared, /today swaps back to State B.
  - Right: "View in Days →" link (Tier C var(--accent)). Click → /reviews/days/{today's-date}.
  - NO "Done" or "Continue" submit button — page IS the recap.

**Mobile (≤ 768px)**:
- Stat tiles: 2 per row.
- Sections stack normally.
- Footer "Re-open day" and "View in Days →" stay in normal flow; not sticky.

### 7.4 REMOVED — Combined Close yesterday + Plan today flow

This flow has been REMOVED. With auto-open Plan today removed and Close day as full-page state, user navigates between Today states naturally:
- Yesterday wasn't closed → midnight rollover auto-closes it (isClosed=true, closedAt=23:59:59 previous day, missed rituals marked).
- User opens app today → /today renders State A (fresh, unplanned).
- Yesterday's recap accessible via Looking Back card or /reviews/days drill-down.

### 7.5 Looking Back section selector

**Used by**: Today page LOOKING BACK section (visible in States A and B; NOT in State C since C IS the recap).

**Function**: `getMostRecentActiveDay()` returns the DayEntry to display in Looking Back card, or null if none qualifies.

**Selector logic**:
1. Find all DayEntry rows where `dayType IN ('Execution', 'Recovery')`.
2. Filter to entries with activity: at least one of (Done actions count > 0, Done rituals count > 0). **Reflection criterion removed** since reflection no longer exists in the model.
3. Exclude today's DayEntry.
4. Sort descending by date.
5. Return first entry, or null.

**Date label format** (computed from days-ago):
- 1 day ago: "YESTERDAY · {short date}".
- 2-7 days ago: "{N} DAYS AGO · {short date}".
- 8+ days ago: "{N} DAYS AGO · {short date}" (still relative, easy to scan).

**If null returned**: Looking Back section hidden entirely (no card, no heading).

### 7.6 Main Task behaviors

**Setting Main Task**:
- Set during Plan today step 2 MAIN TASK section (dropdown of selected actions from picker, or rich card if already set).
- After day planned: change/clear directly from Today zone Main Task card.

**Visual treatment** (canonical Star icon convention):
- Lucide Star icon (filled, var(--accent)) as the universal Main Task marker.
- Used on Today zone Main Task card (14px), TODAY'S ACTIONS list row when row is Main Task (12px inline before title), Reviews drill-down Day section, Action editor banner ("★ This is your Main Task for today").
- Tooltip on hover: "Main Task for today".

**Mark done flow** (from Main Task card OR from inline TODAY'S ACTIONS row — both update same action):
- Click checkbox on Main Task card → bidirectional toggle (mark done with validation, click again re-opens).
- DayEntry.mainTaskActionId pointer remains set even after Done — Main Task celebrates the day's win, doesn't clear on completion.
- Done state visual: title strikethrough + dimmed, "Done at HH:MM" sub-line, "✓ Day's win" badge, border still var(--accent) (preserves achievement framing), × button still available.

**Clear / change Main Task**:
- Click × button on Main Task card → Tier 1 confirmation modal: "Clear Main Task? You can pick another from today's actions."
- On confirm: DayEntry.mainTaskActionId = null. Card transitions to UNSELECTED placeholder ("Pick a Main Task" with dashed border + Star icon, click reveals dropdown of today's actions).
- Click placeholder → dropdown shows today's planned actions (those in plannedActionIds with status NOT IN done/dropped/cancelled). Pick item → mainTaskActionId set, card transitions to FILLED state.

**Empty state** (no actions planned yet for today):
- Placeholder shows "No actions planned · add some first" (var(--text-tertiary)).
- Click is no-op.

**Sync between Main Task card and TODAY'S ACTIONS list row**:
- Same action visible in two places (card above + list row below in Today zone).
- Marking done from EITHER place updates the same action — synced UI.
- Star icon visible inline in list row when action is mainTaskActionId (12px var(--accent), filled, before title).

### 7.7 Re-open closed day

**Trigger**: "Re-open day" link in Today State C footer OR /reviews/days drill-down "Re-open day" button.

**Confirmation**: Tier 1.

**On confirm**:
- isClosed → false.
- closedAt cleared.
- Day becomes editable again.
- Toast: "Day re-opened. Continue editing."

### 7.8 Day computed values

**Total time invested** = sum of (Time × 1.0 for Done actions completed on day) + (Time × 0.2 for Delegated actions where delegatedAt = day).

**Per-goal time** = same but scoped to actions whose project belongs to goal.

**Per-project time** = same but scoped to actions in specific project.

**Action counts**:
- Done: count of actions where status=done AND completedAt=day.
- Skipped: count of rituals where instance status=skipped on day. (No action has Skipped status.)
- Not completed: count of actions in plannedActionIds where status NOT IN (done, delegated, dropped, cancelled) at end of day.

**valueAdded**: sum of Impact from Done + Delegated actions where the relevant timestamp falls on day.

**valuePerGoal**: array of `{ goalId, impactAdded, actionsCount, delegatedCount, percentageOfGoalCost }`.

### 7.9 Week computed values

**Week** is a derived view, not a stored entity. Identified by ISO 8601 yearWeek format (e.g., `2026-W19`).

**getWeekSummary(yearWeek)** returns:
- startDate, endDate (ISO date strings).
- days: array of DayEntry for the 7 days (entries may be missing for gap days).
- actions: array of all actions where completedAt or droppedAt or cancelledAt or delegatedAt falls within week range.
- rituals: array of `{ ritualId, instances: { date, status }[] }` aggregating ritual completion history within week.
- closedProjects: array of Project where completedAt or droppedAt within week.
- closedGoals: array of Goal where completedAt or droppedAt within week.
- dayTypeDistribution: `{ execution, recovery, dayOff, sick }` count of each.
- totalTimeMinutes: Time × 1.0 (Done) + Time × 0.2 (Delegated) within week.
- perGoalTime: array of `{ goalId, minutes, percentage }`.
- perGoalProjectTime: array of `{ goalId, projects: { projectId, minutes }[] }`.
- **valueAdded**: sum of Impact from Done + Delegated actions in week.
- **valuePerGoal**: array of `{ goalId, impactAdded, actionsCount, delegatedCount, percentageOfGoalCost }`.
- **sessions**: array of Session where startedAt within week range.
- **sessionsAggregateStats**: `{ totalFocusMinutes, avgFocusMinutes, completionRate, totalValue, totalActionsDone, totalActionsDropped }`.
- **previousWeekValue / previousWeekSessions**: comparison values for "vs last week" tile.

**getWeeksWithActivity()** returns array of yearWeek strings — all weeks with at least one Done action OR DayEntry OR Session.

### 7.10 Month computed values

**Month** is a derived view, not a stored entity. Identified by ISO format YYYY-MM (e.g., `2026-05`).

**getMonthSummary(yearMonth)** returns:
- startDate, endDate.
- weeks: array of yearWeek strings that include at least one day in this month.
- days: DayEntry array for all days in month.
- actions: Action array (any timestamp within month).
- rituals: same shape as week.
- closedProjects, closedGoals: filtered by month.
- dayTypeDistribution.
- totalTimeMinutes (Done × 1.0 + Delegated × 0.2).
- perGoalTime, perGoalProjectTime.
- valueAdded, valuePerGoal.
- sessions: Session array where startedAt within month range.
- sessionsAggregateStats: same shape as week.
- sessionsPerWeek: array of `{ yearWeek, sessionsCount, totalMinutes, valueAdded }` for per-week breakdown table.
- previousMonthValue / previousMonthSessions: for comparison tiles.

**getMonthsWithActivity()** returns array of yearMonth strings — all months with activity.

### 7.11 Session selectors

**getActiveSession()**: returns Session with status='in_progress' or null. Maximum 1.

**getSessionsForDay(date)**: Sessions where startedAt's local date == date.

**getSessionsForWeek(yearWeek)**: Sessions where startedAt within week range.

**getSessionsForMonth(yearMonth)**: Sessions where startedAt within month range.

**getSessionsForProject(projectId)**: Sessions where any plannedActionId's parent project is projectId.

**getSessionsForGoal(goalId)**: Sessions where any plannedActionId's parent project's goalId is goalId.

**getSessionsAggregateStats(sessions)**: returns `{ totalFocusMinutes, avgFocusMinutes, completionRate, totalValue, totalActionsDone, totalActionsDropped }`.

**Value calculation**: each Session.valueAdded = sum of Impact across completedActionIds. Computed at read time (not stored).

**Cross-month weeks**: weeks may span two months (e.g., week Apr 28 - May 4). Such weeks appear in BOTH months' Month drill-down Weeks section. Sessions / actions are scoped to the specific month they belong to (not duplicated).

---

## 8 — Always-on Core behaviors

ActOS does not have user-toggleable layers. The previous "optional layers" model has been removed in favor of always-on core mechanics. The daily-planning ritual is the product.

### 8.1 Plan & Review (always on)

**Plan today flow** (full-page two-step wizard, see 7.2):
- Triggered manually via "Start your day →" CTA on Today State A. NOT auto-opened.
- Replaces /today State A content while user is planning. Sidebar stays visible.
- Step 1: Day Type selection (4 large colored cards centered on page). Click auto-advances; Day Off/Sick commit DayEntry directly and skip step 2.
- Step 2 (Execution/Recovery only): compact Day Type dropdown + ACTIONS picker (two-pane, no Quick Start cards) + MAIN TASK + RITUALS TODAY + footer "Cancel" / "Start day".
- Intent section removed (was textarea "Today I will..."). Quick Start preset cards (Heavy Lift / Quick Moves) removed.

**Close day flow** (full-page recap, see 7.3):
- Triggered via "Close day" button in Today State B, OR auto-triggered at midnight rollover.
- Full-page recap replaces /today State B with State C. Sidebar stays visible. NOT a modal.
- Sections: stat tiles (Value Added / Actions Done / Rituals Done / Sessions [conditional] / Time Invested) + Projects + Goals + Actions Done + Rituals (Done/Skipped/Missed).
- NO REFLECTION section — reflection field has been removed from the model entirely.
- Conditional greeting "Solid work today." only when total focused time ≥ 2 hours.
- Footer: "Re-open day" (Tier 1 confirmation) + "View in Days →". NO submit button.

**Combined Close yesterday + Plan today**: REMOVED. Auto-close at midnight handles unclosed days passively. User opens fresh State A in the morning.

**Today page** has 3-state behavior:
- State A (not planned): single CTA card "What are you doing today?" with "Start your day →" button. If pre-scheduled actions exist for today, sub-line mentions count.
- State B (planned, in progress): Day Type indicator (subtle, lucide icon + label) → MainTaskCard (rich, accent border, Star icon, supports bidirectional checkbox toggle) → TODAY'S ACTIONS list (with prominent goal-tinted Impact pills, no overdue framing) → "+ Add action..." inline-add (inside Actions section) → TODAY'S RITUALS list (rows visually equal to actions, with MultiplierPill and Skip/Restore toggle) → Close day button.
- State C (closed, recap): full-page recap (see 7.3).

**Looking Back card** visible on Today below TODAY zone in States A and B (NOT in State C, since C IS the recap). Card shows most recent active day (skips Day Off / Sick / inactive), with relative date label.

DayEntries persist; Reviews/Days drill-down lists them.

### 8.2 Time tracking (always on)

**Time estimate field** is always visible in:
- Action editor (Estimates section).
- Ritual editor.

**Time required for**:
- Done transition on actions.
- Ritual creation.

**Time Investment section** on Progress page — always shown.

**Time invested rows** in Reviews drill-down — always shown when data exists.

**Delegation discount**: delegated actions contribute 20% of Time to Time Invested (symmetric with Effort). This is the "Value ≠ Effort" mechanic extended to time.

### 8.3 What was removed

The previous "Log Energy" and "Log Focus" layers have been removed entirely:
- No energy/focus toggles in Settings.
- No energy/focus fields in editors.
- No energy sections in Plan today / Close day flows.
- No energy section in Reviews drill-downs.
- Existing data with legacy energyCost / focusCost / morningEnergyScore / eveningEnergyScore fields is tolerated by the store but not displayed.

The previous "Log Time" toggle has been removed — Time tracking is always on.

The reflection text field has been removed from DayEntry — no reflection input or display anywhere in the app.

The previous Settings → Tracking section is removed entirely. Settings now contains only Account / Data sections.

---

## 9 — Session behaviors (focus timer)

### 9.1 Start session

**Trigger**: user clicks "Start session" in Builder (/sessions/new) after configuring mode, durations, and selecting actions.

**Validation**: ≥ 1 action selected. Builder's "Start session" button disabled otherwise.

**Constraint check**: query store for any session with status='in_progress'. If exists, block start with toast "Resume your active session first" + auto-navigate to /sessions/active.

**On start**:
- createDraftSession(config) called with mode, workDuration, breakDuration, cyclesPlanned, plannedActionIds.
- Session entity created in store with id (UUID), status='in_progress', startedAt=now.
- Navigate to /sessions/active.
- Timer initialized: phase='work', remainingSeconds=workDuration*60, currentCycle=1.
- Toast: "Session started. Focus."

### 9.2 Mark action done during session

**Trigger**: user clicks "Mark done" on current action card.

**Validation**:
- Impact required (> 0). If missing: open Action editor as overlay, prompt to fill.
- Time required (> 0). Same flow.

**On confirm**:
- Action: status='done', completedAt=now (standard transition logic, all side effects fire).
- Session: addCompletedActionToSession(sessionId, actionId).
- Card transitions to next action in plannedActionIds (first one not in completed/dropped lists).
- Toast: "Marked done. {nextAction.title} next."
- If no next action: card shows "All planned actions completed. Add another or end session." state.

### 9.3 Drop action during session

**Trigger**: user clicks "Drop" on current action card.

**Confirmation**: Tier 1 modal "Drop this action? It won't count toward value."

**On confirm**:
- Action: status='dropped', droppedAt=now (standard transition, Project Cost recomputes).
- Session: addDroppedActionToSession(sessionId, actionId).
- Card transitions to next action.

### 9.4 Pause session

**Trigger**: user clicks Pause button.

**Effect**:
- Timer stops counting down.
- Phase label changes to "PAUSED".
- Timer text dimmed (opacity 0.5).
- Click again → resume from same remainingSeconds.

**No effect on**: cyclesCompleted, durations, action card.

### 9.5 Skip break

**Trigger**: user clicks Skip break button (only visible during break phase).

**Effect**:
- Break ends immediately.
- Next work cycle starts (or session completes if last cycle).
- Treats break as fully completed.

### 9.6 Restart cycle

**Trigger**: user clicks Restart cycle (only visible during pause).

**Confirmation**: Tier 1 "Restart current cycle? Time elapsed in this block will be lost."

**On confirm**: remainingSeconds reset to full cycle duration. Cycle counter unchanged.

### 9.7 Abort session

**Trigger**: user clicks Abort button.

**Confirmation**: Tier 1 "End session early? Your progress will be saved."

**On confirm**:
- abortSession(sessionId) called.
- Session: status='aborted', endedAt=now.
- cyclesCompleted frozen at current value (if currently in cycle 3 and aborted: cyclesCompleted=2 if cycle 2 finished, else still cyclesCompleted from last completion).
- Navigate to /sessions list.
- Toast: "Session ended. {actualDuration}min focused."

Aborted session is a valid record. It appears in history and aggregates the same as completed — just with status indicator.

### 9.8 Cycle end (work block)

**Trigger**: timer reaches 0 during work phase.

**Effect**:
- Audio cue (if opt-in on).
- Visual flash (var(--accent) 0.2 opacity, 300ms fade).
- Timer paused.
- Modal/banner: "Work block done · time for a break" with "Continue to break" (Tier A) and "End session" (Tier C).

**On "Continue to break"**:
- session.cyclesCompleted += 1 (this work block is fully counted).
- Phase changes to 'break'. Timer resets to breakDuration*60.
- If breakDuration=0 (continuous mode): skip break, go straight to next work cycle (or session complete).

**Explicit user click required** — no auto-rollover.

### 9.9 Cycle end (break)

**Trigger**: timer reaches 0 during break phase.

**Effect**:
- Audio cue (lighter chime).
- Modal: "Break done · ready for next cycle?" with "Continue to work" / "End session".

**On "Continue to work"**:
- Phase changes to 'work'. currentCycle += 1. Timer resets to workDuration*60.
- If currentCycle > cyclesPlanned: session complete (handle via session end flow, not break flow).

### 9.10 Session completion

**Trigger**: all cycles completed (cyclesCompleted = cyclesPlanned after final work block).

**Effect**:
- completeSession(sessionId): status='completed', endedAt=now.
- Audio cue (longer celebratory tone, restrained).
- Final modal: "Session complete · {workTotal}min focused" + summary stats: "{N} actions done, {M} dropped, +{value} value added".
- Buttons: "Review session" → opens Session detail panel; "Done" → navigate to /sessions.

### 9.11 Reload during active session

**Trigger**: user reloads page or closes browser tab during in_progress session.

**Persistence**: timer state (remainingSeconds, currentCycle, phase, isPaused) persisted in LocalStorage on every state change.

**On reload**:
- Compute current logical state from session.startedAt and stored state.
- If stored remainingSeconds and not paused: subtract elapsed real time (now - lastUpdateTime).
- If subtraction would put remainingSeconds < 0: handle phase transitions (move to next cycle/break).
- Resume timer.

**Edge case — long absence**:
- If user returns after time when session would have ended (e.g., 2-hour session, returns 5 hours later): mark session as aborted automatically with actualDuration = original planned total.
- Show toast on /sessions/active load: "Session ended automatically — too much time elapsed."

### 9.12 Session deletion

**Trigger**: user clicks Delete in Session detail panel "..." menu.

**Confirmation**: Tier 1 "Delete this session? Actions you marked done during it will remain Done."

**Effect**:
- deleteSession(sessionId) — removes from store.
- Actions referenced by completedActionIds remain in their current state (don't undo).
- Toast: "Session deleted."

### 9.13 Audio preferences

**Setting**: stored in LocalStorage as `sessionAudioEnabled` (boolean, default true).

**Toggle UI**: small "Sound: on/off" control in /sessions/active corner.

**On toggle**: persists preference. Sounds either play or are muted on cycle ends.

**Visual flash always plays** regardless of audio setting.

### 9.14 Navigation guard during active session

**Trigger**: when session has status='in_progress' and user attempts to navigate away from /sessions/active (sidebar nav, breadcrumb, browser back, direct URL change, tab close).

**Behavior**: confirmation modal opens BEFORE navigation completes.

**Modal**:
- Title: "Session in progress".
- Body: "You have an active session running. {remainingTime} left of {plannedTotal}min total."
- Three actions:
  - "Cancel" (Tier C link) — closes modal, stays on /sessions/active.
  - "Continue session" (Tier B button) — closes modal, allows navigation. Session continues running in background.
  - "End session" (Tier A button) — calls completeSession, navigates to /sessions/{id}/summary.

**Persistent banner on other pages**:

When user IS navigated away from /sessions/active and session is still in_progress, show banner at top of main content area on every page (not /sessions/active itself):

- Background var(--surface-elevated), 1px var(--border-subtle) bottom border, padding 8px 16px.
- Sticky top, z-index 40.
- Content: "● Session in progress · {remainingTime} left of {phase}" (left, with var(--state-active) dot) + "Return →" link (right, var(--accent)).
- Updates every second.
- Click "Return →" navigates back to /sessions/active.

**Banner disappears** when session ends. If session ended naturally while user was on another page: toast "Session complete. View summary →" with link to /sessions/{id}/summary.

### 9.15 Session Summary view

**Route**: /sessions/{sessionId}/summary

**Auto-triggered**:
- When session reaches final cycle completion (all cycles done).
- When user clicks "End session" (early completion).
- When user clicks "Abort".

All three paths land here.

**Content**:
- Header: status pill (COMPLETED / COMPLETED EARLY / ABORTED) + duration + relative time.
- Accomplishments stat tiles: Value Added / Actions Done / Focused / Cycles. If actualDuration < plannedDuration AND status=completed: also "TIME SAVED" tile.
- Actions list: each planned action with status pill (DONE / DROPPED / NOT TOUCHED). NOT TOUCHED rows dimmed (opacity 0.6, italic title). Click row → Action editor overlay.
- Time breakdown (planned vs actual focus time + breaks).
- Footer CTAs: "View on /sessions" link / "Done" button (navigates to /today or /sessions).

**Direct URL access**: works for past sessions too — `/sessions/{anyId}/summary` shows the summary view as historical record.

---

## 10 — Cross-entity / system behaviors

### 10.1 LocalStorage persistence

**Library**: Zustand `persist` middleware.

**Storage key**: `actos-store`.

**Auto-persist**: every state mutation triggers save.

**Hydration**: app loads from LocalStorage if present, else uses initial mock data.

**Clear/reset**: dev-only utility `__resetStore()` available in browser console.

### 10.2 Computed selectors (derived values)

These are functions, not stored fields. Recomputed on read or memoized.

- `getProjectCost(projectId)` → sum Impact of non-dropped/cancelled actions.
- `getProjectProgress(projectId)` → { value, effort } %.
- `getProjectTimeInvested(projectId)` → sum (Time × 1.0 for Done) + (Time × 0.2 for Delegated).
- `getProjectTimeRemaining(projectId)` → sum Time of Backlog/Planned actions.
- `getGoalCost(goalId)` → sum of active project costs.
- `getGoalProgress(goalId)` → { value, effort, criteriaMet, ritualConsistency }.
- `getGoalTimeInvested(goalId)` → sum across projects in goal, with 20% delegated discount.
- `getRitualMultiplier(ritualId)` → ×N from totalCompletions tier.
- `getRitualEffectiveImpact(ritualId)` → baseImpact × multiplier.
- `getStateIndicator(entityType, entityId)` → 'active' if last activity within 7 days, else 'stalled'.
- `getTodaysActions()` → actions where scheduledDate=today (or in plannedActionIds for today's DayEntry).
- `getTodaysRituals()` → rituals scheduled per their schedule for today AND not in skippedRitualIds.
- `getOverdueDelegations()` → actions where status=delegated AND expectedReturnDate < today.
- `getBigFrog()` → up to 3 actions matching Heavy lift criteria (top 25% Impact + top 25% Time).
- `getEasyWins()` → up to 5 actions matching Quick moves criteria (Impact ≥ median, Time ≤ 60min).
- `getDaySummary(date)` → see Section 7.6.
- `getWeekSummary(yearWeek)` → see Section 7.7.
- `getMonthSummary(yearMonth)` → see Section 7.8.
- `getActiveSession()`, `getSessionsForDay/Week/Month/Project/Goal` → see Section 7.9.

### 10.3 Cascading rules

| Action | Cascades to |
|--------|-------------|
| Drop goal | All projects → dropped, all actions → dropped, all rituals → archived |
| Drop project | All actions → dropped |
| Delete goal | All projects + actions + rituals + ideas in goal → permanently deleted |
| Delete project | All actions + rituals attached to project → permanently deleted |
| Re-open dropped goal | NOTHING auto-restored (manual per child) |
| Re-open dropped project | NOTHING auto-restored |
| Move project to different goal | All child actions inherit new goalId; project color stripe updates |
| Convert idea to action/project | Idea status changes; new entity created |

### 10.4 Confirmation tier rules

**Tier 1 (simple confirm)** for:
- Drop goal / project / action.
- Cancel action.
- Discard idea.
- Archive ritual.
- Re-open dropped goal / project / action.
- Mark goal complete.
- Re-open day.

**Tier 2 (name-typing confirm)** for:
- Delete goal.
- Delete project.
- Delete account.

**No confirmation** for:
- Mark action done.
- Mark ritual done / skipped.
- Most edits (autosave).
- Capture idea.

### 10.5 Toast notifications

Trigger toasts on:
- Entity creation (Goal, Project, Action, Ritual, Idea).
- Entity status changes (mark done, complete, drop, delegate).
- Multiplier updates on ritual done.
- Idea conversions.
- Validation errors (e.g., "Goal limit reached").
- Day plan / close completion.

Don't trigger toasts on:
- Inline-add (silent capture is the point).
- Field edits (autosave is silent).
- Filter changes.
- Navigation.

### 10.6 Lifetime counters

**Counters in sidebar bottom**: "X projects closed · Y actions done"

**Computation**:
- "Projects closed" = count of projects where status IN (completed, dropped) — yes, dropped counts as "closed" in this counter (factual).
- "Actions done" = count of actions where status=done (lifetime, all-time).

**Click**: navigates to Activity page with all-time filter (deferred to v1.x).

**Excluded from counters**: Time aggregates (they live in Settings → Account in v1.x).

**In collapsed sidebar mode**: counters hidden (only icons visible).

### 10.7 Search and command behaviors

**⌘K Command Palette** triggers from any page.

**Search results computation**:
- Goals: title contains query (case-insensitive).
- Projects: title contains query.
- Actions: title OR notes contains query.
- Rituals: title contains query.
- Ideas: title OR note contains query.
- Days (DayEntry): NOT searchable in v1 (previously searched reflectionText / morningIntentNote, both fields removed). Day-level navigation goes through /reviews/days date pickers instead. Future: may surface day matches by date range or day type.

**Result groups**: rendered in this order:
1. Goals
2. Projects
3. Actions
4. Rituals
5. Ideas
6. Days
7. Commands (matching command names)
8. Navigation (matching navigation labels)

**Empty input state**: shows Recently Viewed (last 5) + Quick Actions (applicable) + Navigation.

**Recently Viewed**: persisted in LocalStorage, max 5 entries. Updated on entity click/navigation.

### 10.8 Sidebar collapse and mobile behavior

**Desktop collapse**:
- Sidebar can be collapsed to icon-only mode (64px) via toggle button in sidebar header.
- Collapsed state stored in LocalStorage as `sidebarCollapsed: boolean` (default false).
- Cmd+\ keyboard shortcut also toggles.
- Smooth 200ms width transition.
- Main content area margin-left adjusts (220px ↔ 64px).
- In collapsed mode: nav items show icon only, label appears in tooltip on hover (250ms delay); section headers hidden; lifetime counters hidden.

**Mobile sidebar (≤768px)**:
- Hidden by default.
- Hamburger button in top-left of main area opens sidebar as drawer overlay (slide from left).
- Drawer takes 280-320px width, full height. Always full expanded width on mobile (no icon-only mode).
- Backdrop dims main content (rgba(0,0,0,0.4)).
- Tap outside drawer or hamburger again closes.
- Collapse toggle hidden on mobile.

**Auto-collapse on first load**:
- If viewport width < 1100px AND `sidebarCollapsed` is undefined in LocalStorage (first visit / no previous toggle), sidebar auto-collapses.
- After auto-collapse, treated as user-set value (persists in LocalStorage).
- User can toggle freely after this; their choice persists.
- On viewport resize: do NOT auto-toggle. User stays in their chosen state.

### 10.9 State indicator

**"Active" vs "Stalled"** for entities:
- Active: had Done activity (action or ritual instance) within last 7 days.
- Stalled: no Done activity in last 7+ days.

**Visual**: 8px dot, color `var(--state-active)` or `var(--state-stalled)`.

**Hover tooltip**: "Active. Last activity: today" or "Stalled. Last activity: 11 days ago".

### 10.10 Page width tier system

**Decision**: Every content page declares ONE of three width tiers (max-width of main content column, centered).

**Tiers**:
- **Narrow (720px max)**: Settings (all sub-pages), Auth pages (Sign up, Sign in, Pre-auth landing), 404.
- **Medium (1024px max)**: Today, /actions, /delegated, /goals, /projects, /rituals, /ideas, /sessions, /reviews/days (list + drill-down), /reviews/weeks (list + drill-down), /reviews/months (list + drill-down), Goal page, Project page, Session Builder, Active session, Session Summary.
- **Wide (1280px max)**: /progress (multi-column hero needs space).

**Implementation**:
- Container: `margin: 0 auto`, `max-width: 720|1024|1280px` based on declared tier.
- Padding: 32px horizontal on desktop, 24px on tablet, 16px on mobile.
- Container sits inside main content area (which is shifted right by sidebar width).

**Modal widths separate from tier system**:
- Action editor modal: 640px.
- Goal/Ritual/Idea editor modal: 640px.
- Confirmation modal: 480px.
- Command Palette: 640px.
- (Plan today and Close day are NOT modals — they are full-page in-place takeovers of /today URL.)

### 10.11 Mobile responsive behaviors

**Standard breakpoints**:
- Mobile small: ≤ 480px
- Mobile: 481-768px
- Tablet: 769-1024px
- Desktop: 1025-1280px
- Desktop wide: 1281px+

**Touch targets** (mobile ≤ 768px):
- All interactive elements minimum 44px tap target.
- Compact 40px rows in pickers bumped to 48px on mobile.
- Action rows already 52-56px (sufficient).
- Inline-add inputs: 48px minimum on mobile.

**Page header on mobile** (unified across all list pages — see 09-DESIGN-SYSTEM § 2.2):
- Title and CTA stay on the same row. CTA keeps full label — does NOT collapse to icon-only "+" on mobile. Both fit at 375px because titles are single words and labels are short.
- Meta line below title wraps to multiple lines via flex-wrap if it overflows. Do not shrink font size.
- No per-page custom layouts (no plaque tile rows, no sub-headers between title and filters).

**Filter bar on mobile**:
- Single horizontal row that horizontal-scrolls if it overflows (`overflow-x: auto`, hide scrollbar, `-webkit-overflow-scrolling: touch`).
- Sort dropdown is the LAST item in the scroll row, NOT moved to a separate row.
- Do NOT wrap filters to a second row on mobile.

**Modal patterns on mobile** (≤ 768px):
- All modals (Plan today, Close day, entity create modals — Action / Goal / Ritual / Idea, confirmations) become bottom sheets.
- Slide from bottom, 100vw width, 90vh max height.
- Border-radius: 16px on top corners only.
- Handle indicator at top (40px wide × 4px tall, var(--text-tertiary), centered).
- Swipe down to dismiss (with discard guard for filled forms).
- Slide-in editors (Action/Goal/Ritual/Idea edit) also become bottom sheets.

**Multi-column layouts stack on mobile**:
- /progress hero: 3 columns desktop → single column on mobile (CSS grid `grid-template-columns: 1fr;` with 16px gap). Each stacked goal card gets full content visible — title not truncated, MeasureBars at full width, sparkline at proper size, Recent activity rendered as a flat short list (NOT a vertical word-stack).
- Plan today step 2 two-pane picker: side-by-side desktop → stacked vertical on mobile (Available list on top, Selected list below).
- Drill-down stat tiles: 4-5 per row desktop → 2 per row on mobile.
- Goals list cards: grid desktop → stacked single column on mobile.
- Projects list cards: grid desktop → stacked single column on mobile.

**DelegatedRow on mobile** (≤ 768px):
- Vertical two-row stack instead of three-column flex.
- Top row: title (full width minus ImpactPill) + ImpactPill on right.
- Bottom row: "→ {delegate} · {return-status}" inline meta with shortened return formats. Parent goal/project dropped to free space.
- See 09-DESIGN-SYSTEM § 3.10b for full spec.

**Inline-add patterns on mobile**:
- Today's Actions inline-add: sticky to bottom of viewport on mobile (above virtual keyboard area when not focused).

**FAB on mobile** for /actions only:
- Floating "+" button bottom-right.
- 56px circle, var(--accent), z-index 50.
- Click → opens Action editor as bottom sheet.

**Typography on mobile**:
- Page headers (Inter 24-32px desktop) drop to Inter 20-24px on mobile.
- Big stat numbers (Inter 28-32px) drop to Inter 24-28px.
- Body text (Inter 14-15px) unchanged.
- Mono labels (mono 11px) unchanged.

**Safe areas and overflow**:
- Body: `overflow-x: hidden` globally to prevent horizontal scroll.
- iOS safe-area-inset-* respected for notched devices (top, bottom).
- Sticky bottom elements (FAB, sticky inline-add): respect safe area bottom.
- Scrollable areas: `webkit-overflow-scrolling: touch` for smooth momentum scroll.

### 10.12 Sidebar user menu (NEW)

**Sidebar bottom area structure** (top to bottom):
1. Lifetime counters (mono 11px var(--text-tertiary)). Hidden in collapsed mode.
2. 8px gap + 1px var(--border-subtle) divider + 8px gap.
3. Bottom row (flex justify-between, padding 8px 12px):
   - Left: SidebarUserTrigger — clickable button with avatar (32px circle, initials on hashed color) + display name + email.
   - Right: "?" Shortcuts icon button (32x32px, lucide HelpCircle 16px). Hidden in collapsed mode.

**SidebarUserTrigger click behavior**:
- Opens UserMenuPopover anchored above the trigger (or to the right when sidebar is collapsed).
- Click outside / Esc / item click → closes popover.
- Active state (popover open): trigger background = var(--surface-hover).

**UserMenuPopover content** (top to bottom):
1. Identity header: padding 12px 14px, avatar + display name (Inter 13px medium) + email (Inter 11px var(--text-tertiary)). 1px var(--border-subtle) bottom border.
2. **Settings** menu item: lucide Settings icon + label "Settings". Click → /settings, close popover.
3. **Subscription** menu item: lucide Sparkles icon + label "Subscription". Right side: subtle "All-In" pill if user is All-In (Inter 11px medium, var(--accent) color, no background); nothing shown if user is Free. Click → /settings/subscription, close popover.
4. **Admin** menu item (CONDITIONAL — only when "Show admin tools" toggle in Settings is ON): lucide Wrench icon + label "Admin". Click → /admin/components, close popover.
5. 1px var(--border-subtle) divider, 4px vertical margin.
6. **Sign out** menu item: lucide LogOut icon + label "Sign out". Click → Tier 1 confirmation modal "Sign out of ActOS?" with "Sign out" / "Cancel" buttons. On confirm: clear session, redirect to /signin.

**Display name fallback**: if user.displayName is null/empty, show first part of user.email before "@".

**Avatar generation**: use user.avatarSeed to deterministically hash to a color; render initials of displayName (or email username) in the circle.

**Mobile (sidebar drawer)**:
- Identity trigger and popover work normally inside the drawer.
- Popover anchored above trigger; if it would overflow viewport top, use bottom-up flow with normal page scroll.

### 10.13 Subscription tier behavior

**user.subscription object** (per MODEL):
- `tier`: `'free' | 'all-in'`. Default: `'free'`.
- `startedAt`, `billingCycle`, `priceLockedAt`, `endsAt` — see MODEL § Common entity fields → subscription.

**Demo controls** (v1 prototype):
- "Demo: subscription tier" dropdown in /settings → Account, options Free / All-In. Flipping updates `user.subscription.tier` in LocalStorage and triggers UI re-render — All-In badge in user menu, locked rows on Reviews if downgrading to Free with >90d data, etc.
- Dev-only toggle hidden in production (or behind feature flag). For LocalStorage prototype, leave visible. Label clearly: "Demo controls (will be removed)".

**Surfacing tier — quiet, not loud**:
- All-In badge in UserMenuPopover identity header (next to display name): subtle "All-In" pill, Inter 11px medium, var(--accent) color, no background.
- All-In badge in /settings/subscription page header.
- NOT shown anywhere else — not on /today header, not in sidebar, not on any list page. All-In is internal status, not a visual flex.

**Upgrade / downgrade flows** (v1 demo only):
- "Go All-In" button → confirmation modal "Subscribe to All-In? $12/mo, billed monthly. Cancel anytime." → on confirm: demo modal "All-In payment is coming soon. We'll email you when it's ready." with single "Got it" button. No real payment.
- "Downgrade to Free" button → Tier 2 confirmation modal requiring user to type "DOWNGRADE" → on confirm: demo modal "Downgrades will be available soon."
- "Manage subscription" button (when on All-In) → demo modal "Subscription management is coming soon."
- "Switch to annual" / "Go Lifetime" → demo modals.

**Gates (active when tier === 'free')**:
- Goal creation when active count ≥ 2 → soft block modal in goal create flow.
- Reviews/Sessions/day entries older than 90 days → render locked rows with click-to-modal.
- Sparkline data on /progress and goal pages → clip to 90 days.
- Lock modal: "This is part of your history. All-In keeps your full history forever — every day, every week, every month back to day one. Free shows the last 90 days." Primary CTA "Go All-In — $12/mo" (Tier A), secondary "Maybe later" link.

**Graceful downgrade**:
- All-In with 3 active goals → tier flips to free → 3 goals stay active. New-goal button disabled with banner "Reduce to 2 goals or renew All-In to add more."
- 14-day grace period before history locks engage after downgrade (gives user time to export or renew).
- All data preserved on storage; returning to All-In re-unlocks immediately.

**No real payment integration in v1**. All payment-related UI surfaces lead to demo modals. Real Stripe Checkout integration follows backend implementation.

### 10.14 Admin tools gating

**"Show admin tools" toggle**: in /settings → Account, default OFF.

**When OFF**:
- /admin/* routes are accessible if URL is typed directly (acceptable for LocalStorage prototype).
- No "Admin" link in user menu popover.
- No mention of admin tools anywhere in user-visible UI.

**When ON**:
- "Admin" link appears in user menu popover between Subscription and the Sign out divider (lucide Wrench icon).
- /admin/* pages remain accessible same as before.

**Future migration to backend**: replace this toggle with role-based gate (`user.role === 'admin'`). The toggle is purely a v1 prototype mechanism.

**v1 admin routes**:
- `/admin/components` — visual smoke test page (see DESIGN-SYSTEM § 5.16 / 07-SCREENS-INVENTORY § 9.5).

**Future admin routes** (deferred): data inspector, fixture seeder, release notes feed.

---

## 11 — UI behaviors

### 11.1 Editor panels

- Slide-in from right on desktop, bottom sheet on mobile.
- Click outside (backdrop) → autosave + close (in edit mode), or "Discard changes?" prompt (in new mode if any field filled).
- Esc → same as backdrop click.
- X button → same.

### 11.2 Modals

- Backdrop click → close. For confirmation modals: backdrop click does NOT auto-confirm — user must click Cancel explicitly or Esc.
- Esc key → close.
- Plan today and Close day are NOT modals — they are full-page in-place takeovers of /today URL with their own Cancel link / footer navigation.

### 11.3 Hover and focus

- All interactive elements have visible hover state.
- Focus ring on keyboard nav: 2px `var(--accent)` outline, 2px offset.
- Tab order follows visual order.

### 11.4 Form validation

- Inline errors below field on submit.
- Sober text (Inter 12px `var(--text-warning)`).
- No red banners.
- **Create / Submit button is NEVER disabled** in entity creation modals (Action, Ritual, etc.) — on submit attempt with missing required fields, inline errors appear and focus jumps to first error. This replaces the previous "disabled until valid" pattern, which hid the reason for non-submittability behind hover.
- Other forms (Settings, Profile, etc.) may still use "disabled until valid" if appropriate — but creation modals are explicitly always-enabled.

### 11.5 Sidebar user menu and identity trigger

**Bottom row of sidebar** has these elements (left to right):
- **User identity trigger** (clickable button): avatar circle (32px, initials on hashed color) + two-line text (display name Inter 13px medium + email Inter 11px var(--text-tertiary)). Hover: var(--surface-hover) bg. Click → opens UserMenuPopover above the trigger.
- **"?" Shortcuts icon button**: 32x32px, lucide HelpCircle 16px var(--text-tertiary). Hover: var(--text-primary), var(--surface-hover) bg. Click → opens existing Shortcuts modal.

**UserMenuPopover content** (top to bottom):
1. Identity header (read-only): avatar + name + email. 1px var(--border-subtle) bottom border.
2. **Settings** menu item: lucide Settings icon + "Settings" label. Click → /settings, close popover.
3. **Subscription** menu item: lucide Sparkles icon + "Subscription" label. Right side: subtle "All-In" pill if user is All-In (Inter 11px medium, var(--accent) color, no background); nothing if Free. Click → /settings/subscription, close popover.
4. **Admin** menu item (CONDITIONAL — only when "Show admin tools" toggle in Settings is ON): lucide Wrench icon + "Admin" label. Click → /admin/components, close popover.
5. 1px var(--border-subtle) divider with 4px vertical margin.
6. **Sign out** menu item: lucide LogOut icon + "Sign out" label. Click → Tier 1 confirmation modal "Sign out of ActOS?" with "Sign out" / "Cancel" buttons. On confirm: clear session, redirect to /signin.

**Popover dismissal**:
- Click outside popover → close.
- Esc key → close.
- Click on a menu item → execute action and close.

**Collapsed sidebar mode** (64px): only avatar visible centered. Click opens popover anchored to the right of the avatar. "?" Shortcuts hidden (accessible via ⌘K → "Shortcuts" command).

**Mobile drawer**: identity trigger and popover work normally inside the drawer.

### 11.6 Subscription page (/settings/subscription)

**Form factor**: dedicated page at `/settings/subscription`. Reachable via user menu popover → Subscription. Breadcrumb "← SETTINGS" navigates to /settings.

**Demo data only in v1** — payment integration deferred. See § 10.13 for full flow descriptions. All upgrade/downgrade buttons trigger demo modals; no real Stripe integration in v1.

**Page sections**:
1. Page header: breadcrumb + title + sub-line + 1px divider.
2. Current plan card: tier name + TierBadge + description + status line ("ACTIVE · NO PAYMENT REQUIRED" or "ACTIVE · NEXT BILLING {date}").
3. Plan comparison: two cards (Free + Pro) side-by-side. Current tier card has 1px var(--accent) border.

**Demo subscription tier toggle in /settings → Account**: lets user flip between free and all-in for testing. Updates `user.subscription.tier` field. Reflected immediately in user menu (All-In badge appears/disappears) and on /settings/subscription card highlighting (current plan emphasis).

### 11.7 Admin components page (/admin/components)

**Form factor**: full-width Wide tier page (1280px max-width). Single long scrollable list of every component in every state.

**Gating**: behind "Show admin tools" toggle in /settings → Account (default OFF). When OFF: URL works directly but no nav link. When ON: "Admin" link appears in user menu popover between Subscription and Sign out.

**Sticky page header** with backdrop blur:
- Title "Components" (Inter 24px medium).
- Sub-line "Visual smoke test of every component in every state."
- Right side: data source toggle (Live data / Mock data, segmented control).
- Below header: 1px divider + "Jump to section ↓" anchor row (mono 11px uppercase, links to all section anchors).

**Mock data fixtures** (used when toggle = Mock data, default on first visit):
- 3 sample goals across all goal colors.
- 3 sample projects (one per goal).
- 12 sample actions across all states.
- 3 sample rituals (different multipliers).
- 4 sample ideas (Captured / Converted / Discarded states).
- 2 sample sessions (in_progress + completed).
- 1 sample DayEntry for today.

**Live data toggle**: components pull from current LocalStorage. Components show graceful "no data" placeholders if user has none of that entity yet.

**Toggle persists** in LocalStorage so reloading remembers user's choice.

**Sections rendered** (16 anchored sections in order): Atoms → Buttons → Inputs → Pills → Rows → Cards → Headers and meta → Filter bar → Empty states → Modals → Slide-in editors → Toasts → Avatar and user menu → Sidebar → Day Type cards → Goal column on Progress hero.

**Footer**: "Last updated: {date}" + "Coverage: {N} components / {N} states." Counts derived programmatically.

**Page is for developer/QA use only** — not surfaced to end users via Command Palette or any nav surface other than the gated user menu link.

---


### 11.8 Theme behavior

**Storage**: LocalStorage key `actos.theme`. Possible values: `'light' | 'dark' | 'system'`. Default on fresh install: `'system'`.

**Application mechanism**:
- Theme is applied by setting `document.documentElement.dataset.theme` to `'light'` or `'dark'`. Always an explicit value — never unset, since CSS targets `[data-theme="dark"]` and `[data-theme="light"]` directly.
- An inline script in `index.html` `<head>` runs synchronously before any CSS loads:
  1. Reads `actos.theme` from LocalStorage.
  2. If `'system'` (or unset): resolves against `window.matchMedia('(prefers-color-scheme: dark)').matches`.
  3. Sets `data-theme` on `<html>` accordingly.
- This prevents flash of wrong theme on page load / reload.

**System mode behavior**:
- When `actos.theme === 'system'`: app subscribes to `matchMedia('(prefers-color-scheme: dark)')` change events and updates `data-theme` live.
- When `actos.theme === 'light'` or `'dark'`: app unsubscribes from system preference. The choice is sticky until user picks System again.

**Switcher interaction** (Settings → Account, ThemeToggle § 3.33):
- Click on a segment:
  1. Updates LocalStorage `actos.theme` to the chosen value.
  2. If chosen is `'system'`: subscribe to `matchMedia` and apply current resolved value.
  3. If chosen is `'light'` or `'dark'`: unsubscribe from `matchMedia` and apply directly.
  4. Update the segmented control's active segment.
- No save button. No toast. The visible app re-render is the confirmation.

**Currently-applied indicator**:
- The segment matching the stored value (`'system'` / `'light'` / `'dark'`) is visually highlighted. NOT the currently-resolved theme — i.e. if user selected System and the OS is dark, the System segment is highlighted, not Dark.

**Sonner toast theme**:
- Toaster's `theme` prop is wired to the resolved theme (`'light'` or `'dark'`), not to the user's stored choice. Toasts always render in the theme the rest of the app is showing.

**No theme-related side effects on other state**:
- Switching theme does NOT alter user data, layouts, or any non-visual setting.
- No analytics events fired for theme changes (in v1).

**Future**: high-contrast variant would add a third theme value (e.g. `'high-contrast'`) and a fourth segment. Not in scope for M8.


### 11.9 Sort dropdown options per list page

The Sort dropdown (rightmost element of the filter bar — see DESIGN-SYSTEM § 2.4) has a per-page option set. Default is the first option in each list. Selection persists per page in LocalStorage.

**Tie-breakers (universal)**:
- Primary: `createdAt` desc (newer first).
- Secondary: entity `id` (deterministic — prevents render flicker on equal values).

**Missing-value handling**: when sort key value is null/empty, those entities sort to the END of the list (regardless of asc/desc direction). They are "undetermined", not "smallest" or "largest". This applies to all numeric sort keys across pages.

**Per-page sort options**:

| Page | Options (default first) |
|---|---|
| /actions | Recent first · Oldest first · Highest impact · Lowest impact · Longest first · Shortest first |
| /projects | Recent activity · Most progress · Least progress · Highest cost · Newest · Oldest |
| /delegated | By due date · Recently delegated · By delegate name |
| /goals | Recent activity · Highest progress · Newest · Oldest |
| /rituals | Recent activity · Highest consistency · Lowest consistency · Newest |
| /ideas | Recently captured · Oldest · By goal |
| /sessions | Recent first · Longest first · Shortest first |
| /reviews/days | Most recent · Oldest · Most actions done · Most time invested · Most value · Most effort |
| /reviews/weeks | Most recent · Oldest · Most actions done · Most time invested · Most value · Most effort |
| /reviews/months | Most recent · Oldest · Most actions done · Most time invested · Most value · Most effort |

**Reviews sort symmetry**: /reviews/days, /reviews/weeks, /reviews/months use the same six sort options for consistency. Per-period entries are sorted by the same aggregates regardless of period length. Weeks and months may surface additional aggregates in display (e.g., rituals done, projects closed), but those are NOT sort options — keeps the menu predictable across the three review pages.

**Sort key definitions for review pages**:
- `Most actions done`: sum of action.completedAt within period; counts Done status only.
- `Most time invested`: sum of Time Invested across all actions completed/delegated in period (Done = 100% of estimate; Delegated = 20% per MODEL "Value ≠ Effort" table).
- `Most value`: sum of Value contribution in period (Done = 100% of Impact; Delegated = 100% of Impact; Dropped/Cancelled = 0).
- `Most effort`: sum of Effort across actions in period (Done = 100% of Impact; Delegated = 20% of Impact; Dropped/Cancelled = 0). Effort and Time Invested correlate but are not identical — Effort uses Impact units, Time Invested uses minutes.

**Storage keys** — separate per page (selecting "Most value" on /days does not affect /weeks):
- `actos.actions.sort`
- `actos.projects.sort`
- `actos.delegated.sort`
- `actos.goals.sort`
- `actos.rituals.sort`
- `actos.ideas.sort`
- `actos.sessions.sort`
- `actos.reviews.days.sort`
- `actos.reviews.weeks.sort`
- `actos.reviews.months.sort`

Stored value is the canonical option key (e.g., `"recent_first"`, `"highest_impact"`, `"most_value"`), NOT the human label — so labels can be retitled without breaking persisted preferences. Invalid stored values fall back to the page default.

## 11.10 Auth-gated routing

Single source of truth: `useAuth()` hook reads `actos.auth.user` from LocalStorage.

Routing rules:
- `/` (landing): logged in → redirect `/today`; logged out → render landing.
- `/manifesto`, `/pricing`: public always — render regardless of auth state.
- `/auth`, `/auth#signup`: logged in → redirect `/today`; logged out → render auth form.
- `/auth/verify`: requires `actos.auth.pendingSignup` in LocalStorage. Otherwise → redirect `/auth#signup`.
- `/auth/reset`: public always.
- `/today`, `/goals/*`, `/projects/*`, `/actions/*`, `/setup`, `/settings/*`: logged out → redirect `/auth?next={original-path}`. Logged in → render.
- `/admin/manifesto`: requires authenticated user with `isAdmin: true`. Non-admin authenticated → redirect `/today`. Logged out → redirect `/auth?next=/admin/manifesto`.

On successful sign in: navigate to `next` query param if present, else `/today`. `replace: true` so back button doesn't loop.

On successful sign up + verification: navigate to `/setup` (replace history). Setup wizard runs as normal. User name pre-filled from auth state.

## 11.11 Sign up verification behavior

After sign up form submit:
1. Generate 6-digit code client-side (mock; real backend will generate server-side).
2. Store `actos.auth.pendingSignup` with `{ name, email, password, code, codeExpiresAt (10 min), attemptsRemaining: 5, createdAt }`.
3. Navigate to `/auth/verify`.
4. Dev mode shows code in toast `[DEV] Code: 123456` + console.log.

On `/auth/verify`:
- Auto-submit when all 6 inputs filled.
- Correct code: create `actos.auth.user` with `emailVerified: true`. Clear pending. Navigate `/setup`.
- Wrong code: decrement `attemptsRemaining`. Show error with remaining count. Clear inputs, focus first.
- 5 wrong: forced resend. Verify button disabled until new code.
- Code expired (>10 min): error message. Resend enabled.
- Resend: 30s cooldown. Generate new code. Restart timer.

Tab-close resilience: pending state persists in LocalStorage. Next visit to `/`, `/auth`, or any auth route → redirect to `/auth/verify` to resume. Stale pending (>24h old) auto-cleared.

## 11.12 Sign in behavior

Mock: any valid email + password (matching regex + ≥8 chars) succeeds.

If `actos.auth.user` exists for the entered email in LocalStorage, restore it. Otherwise create a "returning user" entry with `emailVerified: true` (assume returning users are already verified).

No verification step on sign in. No setup wizard. Navigate to `next` param or `/today`.

## 11.13 Forgot password behavior

`/auth/reset`. Single email field + submit button.

On submit: show in-card success state — `If that email is registered, we've sent a reset link.` (Standard privacy pattern — don't reveal whether email exists in DB.)

Mock: no actual email sent. Any valid email triggers success.

Back link returns to `/auth`.

## 11.14 Language switcher behavior

In-product: Settings → Language dropdown shows current language in native name. Dropdown menu lists `English / Русский / Deutsch / Español`. Click switches via `i18n.changeLanguage(lang)` and persists to LocalStorage `actos.i18n.language`. No page reload.

Public footer: dropdown trigger button shows current language in native name + chevron. Menu opens **upward** (footer at page bottom). Same behavior as in-product Settings — synchronized through the same LocalStorage key.

Initial language detection (first visit, no LocalStorage entry): browser detect via i18next-browser-languagedetector. Fallback EN for unknown locales.

Sample data on signup: reads current language from LocalStorage at the moment of setup, loads corresponding `sampleData.{locale}.ts` dataset. Sample data fixes at setup time; switching language later does NOT reload sample data.

## 11.15 Manifesto admin behavior

`/admin/manifesto` requires `isAdmin: true` flag.

Editor state per locale: tabs preserve unsaved state when switching. Switching tabs with unsaved changes triggers confirm dialog. Cancel button with unsaved changes triggers confirm dialog.

Save writes to `actos.cms.manifesto.{locale}` in LocalStorage. Timestamp updates ("Last saved: 2m ago" or "Just now" — relative format). Save button disables (clean state).

Initial load per locale: imports from i18n keys into TipTap document. Subsequent loads read from LocalStorage.

Public `/manifesto` page reads from LocalStorage first (if entry exists for current locale), else falls back to i18n keys.

## 12 — Future / Phase 2+ behaviors (not in v1)

These are placeholders for v1.x and v2 development:

- AI delegation execution pipeline (v2).
- Notifications system (v1.x).
- Calendar view alternative for Reviews (v1.x).
- Sessions multi-device sync via cloud (v1.x).
- Native mobile app (post-v1).
- Backend integration (post-v1 prototype).
- Multi-user / sharing (post-v1).
- Lifetime stats area in Settings → Account (v1.x).
- Custom recurring schedules for rituals (v1.x).
- Goal templates (v2).

---

## 13 — Edge cases and error handling

### 13.1 Action with deleted parent

If an action's project is deleted (cascade) but the action somehow survives (shouldn't happen but defensive):
- Treat as orphan; display in /actions with "Deleted project" placeholder breadcrumb.
- User can reassign or delete.

### 13.2 Ritual with archived parent

Project archive doesn't auto-archive its rituals. Goal archive does.

### 13.3 Goal limit edge case

If user has 3 active goals + 1 drop happens externally (e.g., undo), they can immediately add a 4th. Limit checks at point of creation only.

### 13.4 No-goals mode

When the user has 0 active goals (after dropping all, completing all, or clearing sample data), the app enters no-goals mode:

- The standard layout (sidebar, top header) is hidden.
- Goal-builder takes over the full viewport regardless of URL.
- Top-left: small ActOS logo (no link). Top-right: account avatar with menu (Settings + Sign out).
- No ✕ close button anywhere.
- Step 1 (Goal) has NO Skip button — user must enter a title and create the goal to exit. Steps 2-4 keep Skip availability.
- After at least one active goal exists, no-goals mode exits and standard layout returns.
- Previous data (closed projects, dropped actions, ritual history) is preserved in storage but not visible until a new active goal exists. Once user creates a goal, they can navigate to /reviews to see history.

This is treated as a transient state, not a dashboard state — there is no "goalless overview" surface to design for.

See `08-DESIGN-DECISIONS.md` → Onboarding → "No-goals mode".

### 13.5 Sample data lifecycle

Sample data is seeded only via Setup Wizard "Show me how it works" path. Each entity is flagged with `isSample: true` in storage. Behavior:

- Sample entities are functionally identical to user-created entities. They appear in lists, count toward metrics, can be edited.
- Editing a sample entity does NOT remove the `isSample` flag. The entity is still considered sample-derived.
- A persistent banner on `/today` shows whenever ANY `isSample: true` entity exists: "You're exploring a sample workspace. [Clear and start fresh →]". No ✕ dismiss — banner is functional, not informational.
- Click "Clear and start fresh" → Tier 1 confirmation → on confirm, deletes all `isSample: true` entities. User-created entities (added during exploration) are preserved.
- Settings → Data → "Clear sample data" is the parallel canonical path with the same behavior.
- After a clear, user is naturally in no-goals mode (since sample data included the only 3 active goals) → goal-builder takes over.

### 13.6 LocalStorage quota exceeded

Rare but possible with heavy use of base64 images:
- Catch quota error.
- Show toast: "Storage limit reached. Remove some attachments or images."
- Prevent further mutations until user acts.

### 13.7 Time zones

All dates stored as ISO date strings (YYYY-MM-DD) in user's local time zone. Comparisons assume same time zone.

For v1, single-device single-user, this is fine. Cross-device sync (post-backend) will handle TZ properly.

### 13.8 Concurrent edits

Single-user app, but multiple tabs possible. LocalStorage is shared:
- If user edits in tab A and saves, tab B's state may be stale until next read.
- v1 acceptable: last write wins. Refresh tab B to see updates.
- v1.x: real-time sync via storage event listener.
