# ActOS — Screens Inventory

> **Document role:** complete catalog of all screens in the product. For every screen: purpose, states, entities shown, user actions, priority.
> **Read alongside:** `03-MODEL.md`, `04-FEATURES.md`, `05-FLOWS-AND-SCREENS.md`.

---

## How to read this document

Each screen described with:

- **Purpose** — what this screen exists to do.
- **States** — meaningful visual variations.
- **Entities shown** — which model entities are displayed.
- **User actions** — what the user can do.
- **Priority** — 🟢 v1 / 🟡 v1.x / 🔵 v2.

**Heavyweight vs lightweight entities:**
- **Heavyweight** (Goals, Projects) — full pages.
- **Goals**: edit metadata via slide-in panel.
- **Projects**: page-based creation AND editing — no slide-in panel for Projects.
- **Lightweight** (Actions, Rituals, Ideas) — modal for create, slide-in panel for edit.

---

## Section 1 — Onboarding (5 steps)

### 1.1 Welcome
- **Purpose**: introduce mental model in 30 seconds.
- **States**: single state.
- **User actions**: Continue.
- **Priority**: 🟢 v1.

### 1.2 First Goal
- **States**: empty input → filled input.
- **User actions**: enter title, pick type, Skip / Continue.
- **Priority**: 🟢 v1.

### 1.3 First Project
- **States**: empty with examples → filled.
- **User actions**: enter title, Skip / + Add another / Continue.
- **Priority**: 🟢 v1.

### 1.4 First Actions
- **States**: title + Impact (required, 1-10) + Time (required, minutes).
- **User actions**: enter action titles with Impact and Time, Skip / Done.
- **Priority**: 🟢 v1.

### 1.5 Onboarding handoff
- **Purpose**: brief transition to Today.
- **User actions**: Go to Today.
- **Priority**: 🟢 v1.

(Previous step "Choose optional layers" removed — Plan & Review and Time tracking are always on, no toggles.)

---

## Section 2 — Today

### 2.1 Today
- **URL**: `/today` (default route, redirects from `/`).
- **Layout structure** (top to bottom):
  - Page header (date, e.g., "Friday, May 8").
  - Day Type indicator (subtle, mono 11px uppercase + lucide icon, only in State B if Day Type set).
  - **TODAY zone** (adapts by state — see below).
  - **LOOKING BACK section** (recent active day card, only in States A and B).
- **States** (derived from DayEntry data, no separate routes):
  - **State A (not planned)**: TODAY zone shows single "What are you doing today?" card with "Start your day →" CTA (Tier A primary). If pre-scheduled actions exist for today, sub-line mentions count. Plan today does NOT auto-open — user explicitly clicks the CTA. LOOKING BACK section below.
  - **State B (planned, in progress)**: TODAY zone shows Main Task card (rich, var(--accent) border, Star icon, supports full action interactions including bidirectional checkbox toggle) → TODAY'S ACTIONS list (rows with prominent goal-tinted Impact pills on right, no overdue framing) → "+ Add action..." inline-add (inside Actions section) → TODAY'S RITUALS list (rows visually equal to actions: 52-56px, two-line, MultiplierPill prominent, Skip/Restore single toggle) → Close day button. LOOKING BACK section below.
  - **State C (closed, recap)**: full-page recap replaces TODAY zone — header "Day closed" + date + DayTypeIndicator + conditional greeting "Solid work today." (when total focused time ≥ 2 hours) + stat tiles (Value Added / Actions Done / Rituals Done / Sessions [conditional] / Time Invested) + Projects/Goals/Actions/Rituals sections (conditional on having content) + footer (Re-open day link + View in Days link). NO reflection section. NO LOOKING BACK below (State C IS the recap).
- **Entities shown**: today's Actions (where scheduledDate=today OR id in plannedActionIds) and Rituals (per schedule, excluding skipped).
- **User actions**: Start your day → Plan today flow (full-page); mark actions/rituals done (bidirectional checkbox toggle — click again re-opens); Skip/Restore rituals; clear/change Main Task via × on card; add new actions inline; Close day → State C recap; click Looking Back card → drill-down.
- **Priority**: 🟢 v1.

### 2.2 Looking Back card
- **Purpose**: contextual reference to most recent active day (bridge from previous activity).
- **Selector logic**: most recent DayEntry where dayType IN ('Execution', 'Recovery') AND has activity (any actions done OR rituals done). Skips Day Off / Sick / inactive days. Reflection criterion removed since reflection no longer exists.
- **Visibility**: hidden if no qualifying day exists (first-time users). Hidden in State C (recap is below the page header in C, no need for second backward-looking surface).
- **Heading**: "LOOKING BACK" (mono 11px uppercase var(--text-tertiary)).
- **Card content**:
  - Top line: relative date label + full date (e.g., "YESTERDAY · WED, MAY 6" / "2 DAYS AGO · TUE, MAY 5" / "5 DAYS AGO · FRI, MAY 2").
  - Day Type indicator with lucide icon.
  - Stats line: actions/rituals/time/value summary.
  - Per-goal effort breakdown.
  - "View full review →" link → drill-down for that day.
- **Priority**: 🟢 v1.

---

## Section 3 — Progress

### 3.1 Progress
- **URL**: `/progress`
- **States**: default; no goals; no projects.
- **Layout regions (in order)** — follows Goals → Goal-level time → Projects → Actions hierarchy:
  - Page header
  - Hero — 3 goal columns (state dot, title, big %, VALUE/EFFORT bars, sparkline, recent activity)
  - Time Investment — per-goal rows with per-project nesting (top 5 projects per goal, "+ N more projects ▾" expander for the rest). Goal-level time aggregation; sits directly under Hero as natural continuation of the goal-focused view.
  - **Active Projects** — capped at 6 cards, sorted by recent activity, stalled mixed in. Section header: "ACTIVE PROJECTS · {N total}" + meta "{N active} ACTIVE · {N stalled} STALLED". "View all {N} projects →" link below cards (Tier C, links to `/projects` with State=Active filter) — only shown if total active > 6.
  - Recently Closed Projects & Goals (visible if any closures in last 30 days; mixed list with status pills, "View all closed projects →")
  - Recently Closed Actions — unified ActionRow rows with Value pill + Time + closure date; "View all actions →" link below
  - Currently Delegated — counter + compact list, "View all delegated →" link
- **User actions**: navigate to Goal/Project pages, "+ Add goal" placeholder, click closure rows, "View all" navigation to /projects.
- **Priority**: 🟢 v1.

---

## Section 4 — Entity list pages

### 4.1 Goals
- **URL**: `/goals`
- **Page title**: "Goals".
- **Header**: unified pattern — title + "+ New goal" button (disabled with tooltip if 3 active goals already) + meta line "{N} GOALS · {N} ACTIVE · {N} COMPLETED".
- **Filters**: STATE / TYPE / Sort (in unified filter bar; horizontal scroll on mobile).
- **Goal pill behavior**: when goals are rendered as filter chips (e.g., /ideas filter), each pill is single-line with `white-space: nowrap`, NOT multi-line boxed chips.
- **States**:
  - **Active section**: rich Goal cards (Active + near-completion all in single grid, with visual indicator for ≥75%).
  - **Completed**: collapsible.
  - **Dropped**: collapsible.
- **User actions**: filters; click card → /goals/:id; "+ New goal" header button.
- **Empty state**: headline "No goals yet." + description + "+ New goal" CTA.
- **Priority**: 🟢 v1.

### 4.2 Goal page
- **URL**: `/goals/:goalId`
- **Layout**:
  - Header (title, type, status, target date, "..." menu)
  - Description
  - Success Criteria
  - Hero stats (3 progress axes + STATE bars)
  - Resources (conditional)
  - Active Projects ("+ Add project" → page-based creation)
  - Rituals ("+ Add ritual")
  - Recent activity feed
  - Activity heatmap (52w × 7d)
  - Ideas / Goal Backlog (collapsible)
- **States**: empty; active; all projects closed (visibly completable); completed/dropped; target date passed.
- **User actions**: edit metadata, manage criteria, mark complete/drop/delete, add Project (navigate to /projects/{newId})/Ritual, navigate to Project pages, click action → editor.
- **Priority**: 🟢 v1.

### 4.3 Projects
- **URL**: `/projects`
- **Page title**: "Projects" (no "All" prefix).
- **Header**: unified pattern — title + "+ New project" button + meta line "{N} PROJECTS · {N} ACTIVE · {N} NEAR DONE · {N} STALLED · {N} CLOSED" (plain mono text — no plaque tiles).
- **Filters**: GOAL / STATE / Sort.
- **States**: sectioned by state (Near Completion / Active / Stalled / Closed).
- **Entities shown**: Projects (excluding drafts).
- **User actions**: filters; click card → Project page; "+ New project" → navigate to /projects/{newId} draft mode.
- **Empty state**: headline "No projects yet." + description + "+ New project" CTA + conditional hint "You'll need a goal first." (when no active goals).
- **Priority**: 🟢 v1.

### 4.4 Project page (creation + editing)
- **URL**: `/projects/:projectId`
- **Modes**:
  - **Draft mode** (isDraft=true): page is for creation; title placeholder "Untitled project"; subtle "DRAFT" indicator; promotes to real on title/action/reference/description content.
  - **Real mode** (isDraft=false): full project page with all features.
- **Layout regions**:
  - Header (title, status toggle, breadcrumb to goal, "..." menu)
  - Hero stats (left column: progress %, Value/Effort split, action counts per status)
  - Right rail (metadata sidebar — stack layout: Status / Parent Goal / Created / Age / Time invested / Last activity)
  - Description (rich-text Read/Edit modes with file/image upload)
  - References (structured list with "+ Add reference")
  - Actions list (smart grouping: Active expanded, Terminal collapsed)
  - Rituals section (if any)
  - Project growth banner (when applicable)
- **User actions**: inline edit title/goal/status, edit description, add/edit/remove references, mark complete/drop/delete, split / close-and-continue, move goal, add actions inline, click action → Action editor.
- **Priority**: 🟢 v1.

### 4.5 Actions
- **URL**: `/actions`
- **Page title**: "Actions" (no "All" prefix).
- **Layout**: full-width list with unified header pattern.
- **Header**: title "Actions" + "+ New action" button. Meta line: "{N} ACTIONS · {N} ACTIVE · {N} DONE · {N} DELEGATED".
- **Filters**: STATUS / GOAL / DATE / Sort (in unified filter bar; horizontal scroll on mobile).
- **States**: Active group on top, Terminal collapsible.
- **User actions**: filters; inline-add; click row → Action editor; mark done inline; "+ New action" → Action create modal.
- **Empty states**: per-page true empty (headline + description + CTA) or filtered empty (small "No items match these filters" with Clear filters link). See 13.2.
- **Priority**: 🟢 v1.

### 4.6 Delegated
- **URL**: `/delegated`
- **Sidebar**: nav item with lucide Send icon, in Execution group between Actions and Rituals.
- **Layout**: Medium tier (1024px max-width), unified header pattern.
- **Header**: title "Delegated" + "+ Delegate" button (Tier A, short label — opens Action editor modal pre-filled with Delegated status). Button keeps full label on mobile.
- **Meta line** (below title): "{N} ACTIVE · {N} OVERDUE · {N} DUE TODAY". Counts colored when > 0 (overdue var(--text-warning), due today var(--accent)).
- **Tabs**: Active (default — currently delegated actions) / Returned (history of delegations now Done).
- **Filters**: DELEGATE / GOAL / DATE / Sort.
- **List rows** (DelegatedRow pattern, see 09-DESIGN-SYSTEM § 3.10b — desktop pill + mobile inline variants):
  - Desktop: 56-60px height, three-column flex: stripe + title/meta + ColorCodedDatePill + ImpactPill.
  - Mobile: vertical two-row stack — title + ImpactPill on top row; "→ {delegate} · {return-status}" inline meta with shortened format on bottom row (e.g., "8d overdue", "due today", "in 3d").
- **ColorCodedDatePill**: see 09-DESIGN-SYSTEM § 3.25 for full state spec.
- **Returned tab rows**: return-status replaced with "returned {relative}".
- **User actions**: tabs; filters; click row → Action editor (delegated context); "+ Delegate" → Action create modal.
- **Empty state**: headline "Nothing delegated yet." + description "When you delegate an action to someone, it appears here with the expected return date so you can track what's outstanding." + "+ Delegate" CTA.
- **Priority**: 🟢 v1.

### 4.7 Rituals
- **URL**: `/rituals`
- **Page title**: "Rituals".
- **Layout**: card grid + top stats row + pending today list + ghost "+ Add ritual" card. Unified header (title + "+ New ritual" button + meta line "{N} RITUALS · {N} ACTIVE · {N} ARCHIVED").
- **User actions**: click card → editor; "+ Add ritual" or "+ New ritual" header button; mark today done from card.
- **Empty state**: headline "No rituals yet." + description about consistency multipliers + "+ New ritual" CTA.
- **Priority**: 🟢 v1.

### 4.8 Ideas
- **URL**: `/ideas`
- **Page title**: "Ideas".
- **Layout**: full-width list pattern (matches /actions). Master-detail layout REMOVED.
- **Header**: title "Ideas" + "+ New idea" button. Meta line: "{N} CAPTURED · {N} CONVERTED · {N} DISCARDED".
- **Filters**: STATUS / GOAL / DATE / Sort. STATUS default = Captured.
- **List rows**: ActionRow pattern with no checkbox; right side has small status pill (CAPTURED / CONVERTED / DISCARDED) instead of impact pill. Section grouping: ▾ TERMINAL · {N} collapsible when STATUS = "All".
- **User actions**: filters; click row → Idea editor (slide-in 480px desktop / bottom sheet mobile); "+ New idea" → Idea create modal (640px / bottom sheet); convert to action / project; discard / restore.
- **Empty state**: headline "No ideas yet." + description + "+ New idea" CTA.
- **Priority**: 🟢 v1.

---

## Section 5 — Reviews

### 5.1 Reviews / Days (list)
- **URL**: `/reviews/days`
- **Page title**: "Days".
- **Header**: unified pattern — title, NO CTA (read-only archive), meta line "{N} DAYS TRACKED".
- **Layout**: header + filters (DAY TYPE / GOAL / DATE / Sort) + list sorted descending.
- **User actions**: filters; click row → drill-down.
- **Empty state** (read-only review): plain inline message "No days tracked yet. Days appear here once you plan or close them." (no CTA).
- **Filtered empty**: "No items match these filters." + Clear filters link.
- **Priority**: 🟢 v1.

### 5.2 Day drill-down
- **URL**: `/reviews/days/{yyyy-mm-dd}`
- **Layout sections (in order)**:
  - Header (date, day type, started/closed times)
  - **Accomplishments** (stat tiles: Value Added / Actions Done / Rituals Done / Sessions / Time Invested)
  - Goals Closed (conditional)
  - Projects Closed (conditional)
  - Value Added (per-goal breakdown with % of goal)
  - Time Invested (per-project nested under goals; includes delegated × 0.2)
  - **Sessions** (chronological list of sessions for the day, conditional on >0)
  - Main Task
  - Actions sub-groups (Done / Delegated / Dropped / Cancelled / Not completed)
  - Rituals (Done / Skipped / Missed)
  - Day actions footer (Re-open day)
- **REFLECTION section REMOVED** — reflection field has been removed from the model entirely.
- **User actions**: click action → Action editor (retroactive); "+ Add action to this day" → Action editor (retroactive add); click closed entity → entity page; click session → Session detail panel; Re-open day.
- **Priority**: 🟢 v1.

### 5.3 Reviews / Weeks (list)
- **URL**: `/reviews/weeks`
- **Page title**: "Weeks".
- **Header**: unified pattern — title, NO CTA (read-only archive), meta line "{N} WEEKS TRACKED".
- **Layout**: header + filters (GOAL / DATE / Sort) + list of weeks sorted descending.
- **Each row**: "Week of May 5 — May 11" + day type distribution + stats summary (with sessions count + value) + per-goal effort breakdown.
- **User actions**: filters; click row → week drill-down.
- **Empty state**: plain inline message "No weeks tracked yet. Weeks appear here once you have day activity."
- **Priority**: 🟢 v1.

### 5.4 Week drill-down
- **URL**: `/reviews/weeks/{yearWeek}` (ISO 8601 e.g., 2026-W19)
- **Layout sections (in order)**:
  - Header (breadcrumb, week range title, week number meta, day type distribution)
  - **Accomplishments** (stat tiles with comparisons to previous week)
  - Goals Closed (conditional)
  - Projects Closed (conditional)
  - Value Added (per-goal with %)
  - Time Invested (per-goal with per-project nesting)
  - **Sessions** (aggregate stats + grouped by day, conditional on >0)
  - Days (7 day rows, click → /reviews/days/{date})
  - Top Contributing Actions (sub-grouped: Done / Delegated / Dropped / Cancelled)
  - Rituals (per-ritual week consistency + mini week-strip)
- **REFLECTIONS section REMOVED** — reflection field has been removed from the model entirely.
- **User actions**: click day row → day drill-down; click action → Action editor; click closed entity → entity page; click session → Session detail panel.
- **Priority**: 🟢 v1.

### 5.5 Reviews / Months (list)
- **URL**: `/reviews/months`
- **Page title**: "Months".
- **Header**: unified pattern — title, NO CTA (read-only archive), meta line "{N} MONTHS TRACKED".
- **Layout**: header + filters (GOAL / DATE / Sort) + list of months sorted descending.
- **Each row**: "May 2026" + day type distribution + stats summary (sessions, value, time) + per-goal effort breakdown.
- **User actions**: filters; click row → month drill-down.
- **Empty state**: plain inline message "No months tracked yet. Months appear here once you have day activity."
- **Priority**: 🟢 v1.

### 5.6 Month drill-down
- **URL**: `/reviews/months/{yearMonth}` (ISO format YYYY-MM e.g., 2026-05)
- **Layout sections (in order)**:
  - Header (breadcrumb, month title, day count + week count meta, day type distribution)
  - **Accomplishments** (stat tiles with comparisons to previous month)
  - Goals Closed (conditional)
  - Projects Closed (conditional)
  - Value Added (per-goal with %)
  - Time Invested (per-goal with per-project nesting)
  - **Sessions** (aggregate stats + per-week breakdown table, conditional on >0)
  - Weeks (list of weeks intersecting month, click → /reviews/weeks/{yearWeek}) — primary navigation pivot
  - Top Contributing Actions (sub-grouped, top 10-15 by Impact)
  - Rituals (per-ritual month consistency)
- **REFLECTIONS section REMOVED** — reflection field has been removed from the model entirely.
- **User actions**: click week row → week drill-down; click action → Action editor; click closed entity → entity page; click session → Session detail panel.
- **Priority**: 🟢 v1.

---

## Section 6 — Editors

### 6.1 Action editor
- **Purpose**: create or edit one-time action.
- **Triggers**:
  - **CREATE mode** (modal, 640px desktop / bottom sheet mobile): "+ New action" header button; ⌘K → Create action; "+ Add action to this day" in drill-down (retroactive); convert idea to action.
  - **EDIT mode** (slide-in 480px desktop / bottom sheet mobile): click existing action row anywhere.
  - Inline-add (Today, Project page, drill-down) commits without opening editor.
- **Field order**:
  1. Title
  2. STATE: Status dropdown + timestamp line + scheduled date picker (when Planned) + delegation block (when Delegated)
  3. PARENT: Goal → Project picker
  4. ESTIMATES: Impact (REQUIRED, 1-10), Time (REQUIRED for Done transition, 1-600 min)
  5. NOTES
- **States**:
  - Create mode (modal): explicit "Create" button (disabled until required fields filled).
  - Edit mode (slide-in): autosave on blur.
  - Status changes reveal/hide conditional fields.
- **Footer (contextual)**:
  - Create modal: Cancel + Create.
  - Backlog/Planned (edit): "..." (Duplicate, Delete) + Mark done.
  - Done (edit): "..." + Re-open.
  - Delegated (edit): "..." + Re-open + Mark done.
  - Dropped/Cancelled (edit): "..." + Re-open.
- **Discard guard**: closing create modal with filled fields → confirmation.
- **Status timestamps**: clickable date portion → /reviews/days/{date}, closes editor.
- **Priority**: 🟢 v1.

### 6.2 Goal editor
- **Purpose**: create or edit goal.
- **Triggers**:
  - **CREATE mode** (modal): "+ New goal" header button; "+ Add goal" placeholder.
  - **EDIT mode** (slide-in): "..." → Edit on goal card.
- **Constraint**: max 3 active goals.
- **Fields**: title, type, description, success criteria, target date.
- **User actions**: save / drop / delete / mark complete / re-open.
- **Priority**: 🟢 v1.

### 6.3 Ritual editor
- **Purpose**: create or edit ritual.
- **Triggers**:
  - **CREATE mode** (modal): "+ New ritual" header button; "+ Add ritual to this goal" on Goal page.
  - **EDIT mode** (slide-in): click existing ritual card.
- **Fields**: template chooser (new only), title, parent, schedule, base impact, time estimate.
- **User actions**: pick template/from scratch; mark today done; archive; delete.
- **Priority**: 🟢 v1.

### 6.4 Idea editor
- **Purpose**: create or edit idea.
- **Triggers**:
  - **CREATE mode** (modal, 640px desktop / bottom sheet mobile): "+ New idea" header button on /ideas; ⌘K → Capture idea; convert flows initiated from elsewhere.
  - **EDIT mode** (slide-in 480px desktop / bottom sheet mobile): click existing idea row on /ideas.
- **Fields**: Title, Status (with timestamp line), Parent Goal, Note, References, Attachments.
- **Footer (contextual)**:
  - Create modal: Cancel + Create.
  - Captured (edit): "..." menu (Delete) + "Convert to action" + "Convert to project" + "Discard".
  - Converted (edit): "..." menu (Delete) + read-only state, optional "Open {action|project}" link.
  - Discarded (edit): "..." menu (Delete) + "Restore".
- **User actions**: edit title/note/references/attachments; convert to action; convert to project; discard; restore.
- **Save**: explicit Create button in create mode; autosave on blur in edit mode.
- **Discard guard**: closing create modal with filled fields → confirmation.
- **Previous master-detail layout removed.**
- **Priority**: 🟢 v1.

### NO Project editor as slide-in
- Project creation and editing happen on the Project page (full-page).
- "+ New project" navigates to /projects/{newId} in draft mode.
- All metadata edits inline on page.

---

## Section 7 — Daily flows (Plan today, Close day)

These are full-page in-place takeovers of /today URL, NOT modals. Section header was previously "Daily flow modals" — renamed to reflect new architecture.

### 7.1 Plan today flow (full-page two-step wizard)
- **Trigger**: click "Start your day →" CTA on Today State A. Does NOT auto-open.
- **Form factor**: full-page in-place takeover of /today (sidebar stays visible). NOT a modal. Page header includes "Cancel" link top-right.
- **Architecture**: two-step wizard.

  **Step 1 — Day Type selection**:
  - Vertically centered composition.
  - Heading "What kind of day is it?" (Inter 24-28px medium primary text).
  - Sub-line "Pick one to start planning."
  - 4 large colored cards (~140px min-height each):
    - Execution (var(--state-active) green, lucide Zap, "Full work day — normal expectations.")
    - Recovery (var(--goal-3) purple, lucide Leaf, "Light day, intentional rest.")
    - Day Off (var(--state-stalled) gray, lucide Sun, "No work, fully off.")
    - Sick (var(--status-dropped) amber-red, lucide Thermometer, "Illness — expectations suspended.")
  - Click auto-advances:
    - Execution / Recovery → step 2.
    - Day Off / Sick → DayEntry committed silently (isPlanned=true, dayType set, no plannedActionIds, no plannedRitualIds), navigate to Today State B (which shows quiet day view).
  - 2x2 grid on mobile.
  - NO "Continue" button (selection IS proceed).

  **Step 2 — Plan details** (Execution / Recovery only):
  - Compact Day Type dropdown at top (allows changing dayType — switching to Day Off/Sick triggers confirmation that clears actions/main task).
  - **ACTIONS · {N selected}** section:
    - Heading sub-line "Pick what you'll work on today." (Inter 18-20px medium primary text — NOT mono uppercase tiny label).
    - Two-pane ActionPicker (Available 60% + Selected 40% on desktop, stacked on mobile).
    - Available pane: filter dropdowns (custom, NOT native selects) → ALREADY SCHEDULED sub-section (when applicable) → action list (48px rows with ImpactPill + TimePill on right) → inline-add at bottom (with custom Goal/Project dropdowns).
    - Selected pane: numbered drag-reorderable rows with TimePill + × remove. "Estimated time: {sum}" aggregate at bottom.
    - NO Quick Start preset cards (Heavy Lift / Quick Moves removed in earlier iteration).
  - **MAIN TASK** section:
    - Heading sub-line "What single thing makes today a win?" (Inter 18-20px medium primary text).
    - Optional dropdown "Pick from selected actions ▾".
  - **RITUALS TODAY · {N}** section (only if rituals scheduled today):
    - Heading sub-line "Mark anything you want to skip." (Inter 18-20px medium primary text).
    - Each row: goal stripe + title + meta + MultiplierPill + TimePill + Skip toggle.
  - Footer: "Cancel" link (Tier C left) + "Start day" button (Tier A right). NOT "Plan day".
- **Validation**: NO required minimum — submit can be clicked even with 0 selected actions. The day can be planned with just dayType + nothing else.
- **User actions**: pick Day Type → step 1 advances to step 2 OR commits Day Off/Sick directly; in step 2, change Day Type via compact dropdown; pick actions via two-pane bidirectional toggle; drag-reorder; pick Main Task; skip rituals; Start day OR Cancel.
- **On submit (Start day)**: DayEntry committed (dayType, plannedActionIds, plannedRitualIds, skippedRitualIds, mainTaskActionId, isPlanned=true). /today swaps to State B. Toast "Day started."
- **Removed from previous spec**: Intent textarea, Quick Start preset cards (Heavy Lift / Quick Moves), auto-open behavior, "Plan day" button label, modal form factor.
- **Priority**: 🟢 v1.

### 7.2 Close day flow (full-page recap)
- **Trigger**:
  - User clicks "Close day" button on Today State B.
  - Automatically when browser detects local date rollover at midnight: DayEntry.isClosed=true, closedAt=previous day's 23:59:59 (NOT current "now"). Missed rituals marked.
- **Form factor**: full-page recap (Medium tier 1024px), replaces /today State B content with State C. Sidebar stays visible. NOT a modal.
- **Layout sections** (in order):
  - Page header: "Day closed" (Inter 32-36px medium) + date + DayTypeIndicator compact + conditional greeting "Solid work today." (Inter 16px primary, ONLY when total focused time today ≥ 120 minutes).
  - 1px var(--border-subtle) divider.
  - Stat tiles row: VALUE ADDED / ACTIONS DONE / RITUALS DONE / SESSIONS (CONDITIONAL — only when ≥1 session today) / TIME INVESTED. Mobile: 2 per row.
  - PROJECTS section (only if any actions today touched projects): grouped list.
  - GOALS section (only if any goal progress today): per-goal "+{V} value · {H}h" line.
  - ACTIONS DONE list: compact ActionRow (Done state).
  - RITUALS section: grouped by Done / Skipped / Missed (only if rituals scheduled today).
  - **NO REFLECTION section** — reflection field has been removed from the data model.
  - Footer: "Re-open day" link left (Tier C, Tier 1 confirmation on click) + "View in Days →" link right (Tier C var(--accent)) → /reviews/days/{today's-date}. NO submit button.
- **Greeting tone**: "Solid work today." is the only positive acknowledgment, only when threshold met. NOT motivational. No exclamation marks, no emoji, no remedial messaging when low output.
- **User actions**: read recap; click Re-open day → confirmation → State B; click View in Days → /reviews/days/{date}; navigate away.
- **Removed from previous spec**: reflection input, Cancel/Close day buttons, modal form factor, "Done" submit button.
- **Priority**: 🟢 v1.

### 7.3 Removed flows
- **Combined Close yesterday + Plan today modal** — REMOVED. With auto-open Plan today removed and Close day as full-page state, user navigates between Today states naturally. If yesterday wasn't closed, midnight rollover auto-closes it; user opens app to a fresh State A with yesterday's recap accessible via Looking Back card or /reviews/days.

### 7.4 Past date confirmation modal
- **Trigger**: user picks a past date for scheduling.
- **Form factor**: Tier 1 confirmation modal.
- **Body**: explains action will become Done with retroactive logging.
- **User actions**: Cancel / Mark as Done on {date}.
- **Priority**: 🟢 v1.

---

## Section 8 — Search and Commands

### 8.1 Command Palette
- **URL**: not a route — modal accessible from any page.
- **Trigger**: ⌘K shortcut OR click "Search" in sidebar.
- **Form factor**: 640px modal desktop, full-width mobile.
- **States**: empty (Recently Viewed / Quick Actions / Navigation); typing (filtered grouped results).
- **User actions**: type, navigate keyboard, execute, close.
- **Priority**: 🟢 v1.

---

## Section 9 — Settings, Subscription, Admin

### 9.1 Settings — main
- **URL**: `/settings`.
- **Width tier**: Narrow (720px max-width).
- **Default section**: Account.
- **Sections**: Account / Data (no Tracking — layers are always-on).
- **Removed from page**: Subscription section (now its own page at /settings/subscription); Sign out button (now in user menu popover).
- **Entry**: user menu popover (sidebar bottom area) → Settings.
- **Priority**: 🟢 v1.

### 9.2 Settings — Account
- **States**: default; confirming destructive.
- **User actions**: change email/password; upload avatar; set display name; **switch theme (System / Light / Dark)**; delete account (Tier 2).
- **Theme row**: ThemeToggle component (DESIGN-SYSTEM § 3.33) — segmented control, immediate apply, persists to LocalStorage. Default: System (follows `prefers-color-scheme`). Helper text "Defaults to your system setting." above the control. Always visible.
- **Demo controls** (v1 prototype only, labeled "Demo controls (will be removed)"):
  - "Demo: subscription tier" dropdown (Free / Pro) for testing both UI states.
  - "Show admin tools" toggle (default OFF) — when ON, surfaces "Admin" link in user menu popover.
- **Priority**: 🟢 v1; 🟡 v1.x for stats area.

### 9.3 Settings — Data
- **URL**: `/settings` (Data section within Settings page).
- **Width tier**: Narrow (720px).
- **Sections**:
  - **Export** — download all user data as JSON (canonical export format includes all entities + metadata).
  - **Import** — upload a previously exported JSON to restore data. Tier 2 (name-typing) confirmation since this overwrites current data.
  - **Clear sample data** — visible only when any `isSample: true` entity exists. Tier 1 confirmation modal: "Clear sample workspace? This will delete all sample goals, projects, actions, rituals, and ideas. This can't be undone. Anything you've created yourself stays." On confirm: deletes all sample-flagged entities, toast "Sample workspace cleared. Let's set up your goal.", app enters no-goals mode if sample data was the only goals.
  - **Reset all data** — Tier 2 (name-typing) confirmation. Wipes everything in LocalStorage and returns user to Setup Wizard.
- **Parallel path**: the `/today` persistent banner ("You're exploring a sample workspace · Clear and start fresh →") triggers the same Clear sample data flow. Both routes work — banner is convenience, Settings is canonical.
- **Priority**: 🟢 v1.

### 9.4 Subscription page — Free + All-In
- **URL**: `/settings/subscription`.
- **Width tier**: Narrow (720px), single-column.
- **Page header**: breadcrumb "← SETTINGS" + title "Subscription" + sub-line "Manage your plan." + 1px divider.
- **Entry**: user menu popover (sidebar) → Subscription. NOT a tab inside /settings.
- **Layout**:
  - Status line at top: "You're on Free." or "Your plan: All-In · Active · Next billing {date}".
  - **Free card** (var(--surface-raised) bg, plain): "Free plan" heading + features list (up to 2 goals; all current features; last 90 days of history; standard support). Status pill "Active · No payment" if current.
  - **All-In card** (1px var(--accent) border, accent-toned heading): "Go All-In — $12/mo" + sub-line "Everything we ever build." + features list (up to 3 goals; all current features; unlimited history; priority support; every future feature, included). CTA button "Go All-In" (Tier A).
  - **Annual option** (small note below All-In card): "Save 17% with annual — $120/yr (vs. $144 monthly)." [Switch to annual] link.
  - **Lifetime card** (smaller, secondary, var(--surface-raised) bg, no accent border, optional in v1): "All-In Lifetime — $200 once" + "For believers. Pay once, never billed again, every feature ever. Limited availability." CTA "Go Lifetime."
- **Free plan features**: up to 2 active goals; unlimited projects/actions/rituals/ideas/sessions; all current features (Today, Progress, Reviews, Plan today, Close day, Sessions, Delegation, Ideas); last 90 days of history visible; standard support (Help docs).
- **All-In plan features**: up to 3 active goals; everything in Free; unlimited history (Reviews, Sessions, day entries — all the way back); priority support (direct email, 48h reply); every future feature included automatically; price locked at signup price.
- **Pricing**: Free $0; All-In $12/month, $120/year (save 17%), $200 Lifetime one-time. Pricing real (USD), payment integration is demo in v1 (Stripe Checkout when launched).
- **Buttons by current tier**:
  - On Free: All-In card → "Go All-In" (Tier A, demo modal). Free card → "Current plan" (disabled).
  - On All-In: Free card → "Downgrade to Free" (Tier 2 confirmation requiring "DOWNGRADE" typed). All-In card → "Manage subscription" (demo modal).
- **Demo only in v1** — payment integration deferred. All upgrade/downgrade buttons trigger demo confirmation modals ("All-In payment is coming soon. We'll email you when it's ready.").
- **All-In badge** appears in user menu popover header (next to display name) — small "All-In" pill, Inter 11px medium, var(--accent) color, no background. NOT shown anywhere else — All-In is a quiet status, not a visual flex.
- **No billing history section, no payment method section** in v1.
- **Priority**: 🟢 v1.

### 9.5 Admin components page (dev tool, NEW)
- **URL**: `/admin/components`.
- **Width tier**: Wide (1280px).
- **Purpose**: visual smoke test rendering every component in every state — for QA, regression checking, visual consistency verification.
- **Gating**: behind "Show admin tools" toggle in /settings → Account (default OFF). When OFF: URL works directly (acceptable for LocalStorage prototype) but no nav link. When ON: "Admin" link appears in user menu popover between Subscription and Sign out.
- **Layout**: single long scrollable page, NO tabs, NO inner sidebar. Sticky page header with backdrop blur + data source toggle (Live data / Mock data, Mock as default on first visit) + "Jump to section" anchor row.
- **Sections rendered** (in order, anchored): Atoms (color tokens / typography scale / spacing scale) → Buttons → Inputs → Pills (ImpactPill all I1-I10 across goal colors / TimePill all formats / MultiplierPill / ColorCodedDatePill desktop+mobile / status pills / TierBadge) → Rows (ActionRow all states / Compact ActionRow / DelegatedRow desktop+mobile / IdeaRow / RitualRow) → Cards (Goal / Project / Ritual / Day Type colored / Stat tile) → Headers and meta (per page) → Filter bar (desktop + mobile constrained) → Empty states (true empty per page + filtered empty + plain inline review messages) → Modals → Slide-in editors → Toasts → Avatar and user menu → Sidebar (full + collapsed + mobile drawer) → Day Type cards (4 colored variants) → Goal column on Progress hero.
- **Footer**: "Last updated: {date}" + "Coverage: {N} components / {N} states."
- **Theme verification**: Atoms section includes a live indicator showing the currently active theme (e.g. "THEME: LIGHT" in mono uppercase var(--text-tertiary)). Switching theme via Settings → Account is the way to verify; /admin/components has no theme-switch control of its own.
- **Priority**: 🟢 v1.

---

## Section 10 — Authentication

### 10.0 Pre-auth landing
- **Priority**: 🟢 v1.

### 10.1 Sign up
- **Priority**: 🟢 v1.

### 10.2 Sign in
- **Priority**: 🟢 v1.

### 10.3 Password reset
- **Priority**: 🟢 v1.

### 10.4 OAuth (Google)
- **Priority**: 🟡 v1.x.

---

## Section 11 — Project growth flows

### 11.1 Project growth banner (inline on Project page)
- **Priority**: 🟢 v1.

### 11.2 Split project wizard
- **Priority**: 🟢 v1 (MVP: 2 splits).

### 11.3 Close-and-continue flow
- **Priority**: 🟢 v1.

---

## Section 12 — AI delegation (v2)

### 12.1 Delegate to AI — context capture
- **Priority**: 🔵 v2.

### 12.2 AI execution status
- **Priority**: 🔵 v2.

### 12.3 AI result review
- **Priority**: 🔵 v2.

---

## Section 13 — Cross-cutting patterns

### 13.1 Sidebar / navigation
- **Each nav item**: lucide icon + label.
- **Collapse toggle**: top corner of sidebar, toggles between expanded (220px) and collapsed (64px icon-only). State persists in LocalStorage as `sidebarCollapsed`. Cmd+\ also toggles.
- **Auto-collapse**: on first load, if viewport width < 1100px AND `sidebarCollapsed` is undefined in LocalStorage, sidebar auto-collapses (then treated as user-set value, persists). User can toggle freely after.
- **Groups**:
  - Search (top, with ⌘K visible pill)
  - Execution: Today (Sun) / Progress (TrendingUp) / Actions (CheckSquare) / Delegated (Send) / Rituals (Repeat)
  - Strategy & Capture: Goals (Target) / Projects (FolderOpen) / Ideas (Lightbulb) / Sessions (Timer)
  - REVIEWS section header (uppercase mono, not clickable) → Days (CalendarDays) / Weeks (CalendarRange) / Months (Calendar) (flat, same level)
- **Collapsed mode**: only icons, hover shows tooltip with label; section headers hidden; lifetime counters hidden.
- **Bottom**: Lifetime counters / Shortcuts / Avatar.
- **Mobile (≤768px)**: full drawer overlay when open (always expanded width on mobile); hamburger button top-left of main content area; collapse toggle hidden.
- **Priority**: 🟢 v1.

### 13.2 Empty states
- **Two distinct states**:
  - **True empty** (zero items, no filters): centered, padding-top 80px, max-width 480px. Headline (Inter 18px medium) + description (Inter 14px var(--text-secondary), 1-2 sentences explaining the page) + Tier A CTA button + optional conditional hint (e.g., "You'll need a goal first.").
  - **Filtered empty** (items exist, filters yield zero): smaller, padding 48px 24px. "No items match these filters." + "Clear filters" Tier C link.
- **Per-page true empty copy**: see 09-DESIGN-SYSTEM § 4.7 for full table.
- **Review pages** (/reviews/days, /weeks, /months): plain inline message without CTA — these are read-only archives.
- **Tone**: factual, no motivational copy, no exclamation marks, no emoji.
- **Priority**: 🟢 v1.

### 13.3 Loading and error states
- **Pattern**: subtle skeleton on load; clear error with retry on failure.
- **Priority**: 🟢 v1.

### 13.4 Confirmation modals
- **Tier 1 (simple)**: standard confirm/cancel.
- **Tier 2 (name-typing)**: type entity name.
- **Priority**: 🟢 v1.

### 13.5 Toast notifications
- **Library**: sonner.
- **Priority**: 🟢 v1.

### 13.6 Ghost cards (creation affordance)
- **Pattern**: dashed border + "+" character.
- **Used in**: "+ Add goal" placeholder on Progress hero; "+ Add action to this day" drill-down (this is the only ghost-row pattern that survived unification — others were replaced by header "+ New X" buttons).
- **Priority**: 🟢 v1.

### 13.7 Inline-add inputs
- **Pattern**: dashed border + "+" prefix + transparent input + commit on Enter.
- **Used in**: Today zone (sticky bottom on mobile), Project page actions list (per status group on desktop), drill-down "+ Add action to this day".
- **Note**: removed from /actions (replaced by header "+ New action" button + modal).
- **Priority**: 🟢 v1.

### 13.8 Capture input — REMOVED
- The dashed-border capture input pattern previously used at the top of /ideas has been removed. Idea creation now uses the standard "+ New idea" header button + create modal pattern.

### 13.8a Unified page header pattern (NEW)
- **Used on**: every list page (/actions, /projects, /delegated, /goals, /rituals, /ideas, /sessions, /reviews/*, /progress).
- **Structure**: title row (title left, primary CTA Tier A right) + meta line below + 1px divider + filter bar.
- **Page rename**: "All actions" → "Actions"; "All projects" → "Projects". Other list pages already used single-word titles.
- **CTA on mobile**: keeps full label, does NOT collapse to icon-only. Both title and short label fit at 375px.
- **Filter bar on mobile**: single horizontal row, scrolls horizontally if it overflows. Sort included as last item, NOT moved to a separate row.
- **Per-page CTA labels**: see 09-DESIGN-SYSTEM § 2.2 table.
- **Priority**: 🟢 v1.

### 13.9 MeasureBar
- **Pattern**: 3-column flex (label / bar / value).
- **Used in**: Goal columns Hero; Goal cards /goals; Goal page hero STATE; Project cards.
- **Priority**: 🟢 v1.

### 13.10 Sparkline
- **Pattern**: 30-day mini bar chart, color-coded by goal.
- **Unified scale**: when comparing goals (Time Investment), all sparklines share same Y-axis max.
- **Used in**: Goal columns Hero; Goal cards /goals; Time Investment Progress.
- **Priority**: 🟢 v1.

### 13.11 Date picker pattern
- **Pattern**: Today / Tomorrow chips + "Pick another date" link → inline calendar.
- **Used in**: Action editor scheduled date; Delegation block expected return date.
- **Priority**: 🟢 v1.

### 13.12 Status timestamp link
- **Pattern**: clickable date portion of timestamp line (hover underline + accent).
- **Used in**: Action editor.
- **Behavior**: click → navigate to /reviews/days/{date}, close editor panel.
- **Priority**: 🟢 v1.

### 13.13 Z-index hierarchy
- Sidebar / regular page content: 0-10
- FAB (mobile /actions): 50
- Active session banner (sticky on other pages): 40
- Slide-in panel (Sheet): 90
- Slide-in panel content (dropdowns/popovers inside): 100
- Modals (create modals, Plan today, Close day, confirmations): 200
- Command Palette: 250
- Toasts: 300
- **Priority**: 🟢 v1.

---

## Section 14 — Sessions (focus timer)

### 14.1 Sessions list page

- **Purpose**: list of all sessions with history, entry to start a new session.
- **URL**: `/sessions`
- **Page title**: "Sessions".
- **Header**: unified pattern — title + "+ Start session" button + meta line "{N} SESSIONS · {H}H TRACKED".
- **Filters**: MODE / DATE / Sort.
- **States**:
  - **First-time (no history)**: empty state per 13.2 — headline "No sessions yet." + description + "+ Start a session" CTA + conditional hint "You'll need at least one action in Backlog or Planned."
  - **With history**: stats row + RECENT SESSIONS list.
  - **Active session in progress**: banner at top with "Resume" button (replaces or supplements "+ Start session").
- **Entities shown**: Sessions sorted descending by startedAt.
- **User actions**: start new session; click row → detail panel; resume active session.
- **Priority**: 🟢 v1.

### 14.2 Session Builder

- **Purpose**: configure a new session before starting.
- **URL**: `/sessions/new`
- **Sections**: Mode presets (Pomodoro / Continuous / Custom) → Duration config (work/break/cycles with live total) → Action picker (two-pane: available left, selected right with drag-reorder).
- **Filters in available pane**: Goal / Project; "Today's planned" sub-section if Plan & Review on.
- **Time match indicator**: compares sum of selected actions' time estimates vs work total.
- **User actions**: pick preset; configure durations; select and order actions; "Start session" creates Session with status=in_progress and navigates to /sessions/active.
- **Validation**: ≥ 1 action required.
- **Priority**: 🟢 v1.

### 14.3 Active session

- **Purpose**: timer experience while working through a session.
- **URL**: `/sessions/active`
- **Visible only**: when an in_progress session exists; redirects to /sessions otherwise.
- **Layout regions**:
  - Timer display (large MM:SS, JetBrains Mono 96px desktop / 72px mobile).
  - Above timer: phase label "WORK · CYCLE 2/4" or "BREAK · 5MIN".
  - Below timer: progress ring/bar.
  - Current action card with goal stripe, title, metadata, "Mark done" / "Drop" buttons.
  - Session controls: Pause / Skip break / Restart cycle / Abort.
  - Focus Mode toggle (top-right).
- **Audio cues**: opt-in (default on); work end / break end / session complete.
- **Visual flash**: brief on cycle end.
- **Explicit "Continue"**: between work/break transitions; no auto-rollover.
- **Persistence**: timer state in LocalStorage; resumes on reload.
- **User actions**: mark action done / drop / pause / skip break / restart cycle / abort / toggle focus mode.
- **Priority**: 🟢 v1.

### 14.4 Session detail panel (slide-in)

- **Purpose**: view past session details. Reused everywhere a session is clicked.
- **Form factor**: slide-in panel from right (480px desktop / bottom sheet mobile).
- **Triggers**: click any session row on /sessions, in any drill-down, or on Project/Goal page.
- **Content**: header (date/time/status pill) → config summary → execution summary (actual duration, cycles completed, value added) → actions list with status pill per action (DONE / DROPPED / NOT TOUCHED).
- **User actions**: click action → Action editor (nested overlay); delete session ("..." menu, Tier 1 confirmation).
- **Priority**: 🟢 v1.

### 14.5 Sessions integration in drill-downs

- **Day drill-down**: SESSIONS section between TIME INVESTED and MAIN TASK; chronological list of sessions for that day.
- **Week drill-down**: SESSIONS section between TIME INVESTED and DAYS; aggregate stats + sessions grouped by day.
- **Month drill-down**: SESSIONS section between TIME INVESTED and WEEKS; aggregate stats + per-week breakdown table.
- **List page row stats** (/reviews/days, /weeks, /months): include "{S} sessions" in stats line.
- **Accomplishments tile**: SESSIONS count tile; comparison vs previous period on Week/Month.
- Section hidden if 0 sessions for that period.
- **Priority**: 🟢 v1.

### 14.6 Sessions on entity pages

- **Project page**: SESSIONS section after Actions list; shows sessions where any plannedActionId belongs to this project.
- **Goal page**: SESSIONS section similar pattern.
- Section hidden if 0 sessions for entity.
- **Priority**: 🟢 v1.

---

## Summary by priority

| Priority | Count | Highlights |
|----------|-------|-----------|
| 🟢 v1    | ~50   | Full v1 product per Roadmap (includes Sessions, Reviews/Months) |
| 🟡 v1.x  | ~6    | OAuth, lifetime stats, export, custom schedules, Sessions cloud sync |
| 🔵 v2    | ~4    | AI delegation flow, native mobile foundations, goal templates |

---

## Section 11 — Setup Wizard (first-run)

### 11.1 Setup Wizard — Screen 0 Welcome
- **URL**: `/setup` (or `/welcome`).
- **States**: default (only state).
- **Layout**: full-screen, centered. Logo mark + "Welcome, {firstName}." + "Let's set this up." + "Continue →".
- **No sidebar, no header chrome**.
- **User actions**: Continue → Screen 1.
- **Priority**: 🟢 v1.

### 11.2 Setup Wizard — Screen 1 Theme
- **URL**: `/setup/theme`.
- **States**: no selection (Continue disabled); selection (Continue enabled).
- **Layout**: full-screen, "Pick your look." heading, three theme tiles with mini-mockup SVGs, "Continue →" bottom.
- **User actions**: hover tile → live theme transition; click tile → select; Continue → Screen 2; Back → Screen 0.
- **Bottom nav**: "← Back" left, "Step 1 of 3" right.
- **Priority**: 🟢 v1.

### 11.3 Setup Wizard — Screen 2 Getting started
- **URL**: `/setup/start`.
- **States**: no selection; selection.
- **Layout**: "How would you like to start?" + two cards (Sparkles icon "Show me how it works" / Target icon "Set up my own goal").
- **User actions**: select card; Continue → Screen 3; Back → Screen 1.
- **Bottom nav**: "← Back" left, "Step 2 of 3" right.
- **Priority**: 🟢 v1.

### 11.4 Setup Wizard — Screen 3 Setup pause
- **URL**: `/setup/loading` (or transient state).
- **States**: in-progress only (1.2s).
- **Layout**: thin progress line + "Setting up your workspace..." text. Fade-out + redirect after 1.2s.
- **No user actions**: pure transition state.
- **Bottom nav**: "Step 3 of 3" right; no Back button.
- **Priority**: 🟢 v1.

### 11.5 Setup Wizard outcome — sample data path
- After Screen 3 with "Show me how it works" selected: workspace seeded with sample entities (`isSample: true`) per the canonical fixture, redirect to `/today`.
- Persistent functional banner at top of /today: "You're exploring a sample workspace." with "Clear and start fresh →" link.
- NOT dismissible — no ✕. Stays until any `isSample: true` entity exists.
- Click "Clear and start fresh" → Tier 1 confirmation → on confirm, delete all sample entities, toast, app enters no-goals mode (since sample data was the only goals).
- Settings → Data → "Clear sample data" is the parallel canonical path.

### 11.6 Setup Wizard outcome — goal-builder path
- After Screen 3 with "Set up my own goal" selected: redirect to goal-builder flow (full-page, same route used regardless of entry).
- Steps: **Goal → Success Criteria → Project → Actions → /today**. Step counter "STEP N OF 4".
- The goal-builder also runs outside onboarding whenever a user has 0 active goals and triggers Plan today / Create action / Create ritual. Same UI, same steps.

### 11.7 Goal-builder — Goal step
- **States**: empty input; with text; examples expanded.
- **Layout**: target icon + STEP 1 OF 4 header. "Create your first goal" heading. ONE description paragraph. Title input with placeholder "e.g. Get my SaaS to $10k MRR". "+ Examples" expandable revealing 5 canonical examples. COLOR row (3 dots). Create goal / Skip buttons.
- **User actions**: type title, click example to fill, pick color, Create goal → step 2.

### 11.8 Goal-builder — Success Criteria step
- **States**: empty (no criteria added); with N criteria (1-5).
- **Layout**: STEP 2 OF 4 header. "What does 'done' look like?" heading. Description mentioning user can edit later on goal page. Empty state shows "+ Add criterion" link. Each added criterion is an inline text input (max 120 chars) with ✕ remove. Up to 5. Continue + "Skip — add later" buttons.
- **User actions**: add/edit/remove criteria, Continue → step 3.

### 11.9 Goal-builder — Project step
- **States**: empty; with text.
- **Layout**: STEP 3 OF 4 header. Project title input with placeholder ("e.g. Set up landing page"). Brief framing line. Create / Skip.
- Auto-attached to goal from step 1.

### 11.10 Goal-builder — Actions step
- **States**: 0 actions; 1-N actions.
- **Layout**: STEP 4 OF 4 header. Inline-add for actions (Impact and Time required per action). List of added actions. Done button.
- After Done → redirect to /today.

### 11.11 No-goals mode (replaces previous /today empty state)
- When goals = 0, goal-builder takes over the entire app. NO sidebar, NO header. Any URL resolves to goal-builder.
- Top-left: small ActOS logo (no link). Top-right: account avatar with menu (Settings, Sign out).
- Step 1 (Goal): NO Skip button — user must create a goal to exit this mode.
- Steps 2-4 keep Skip availability.
- Triggers: any state where active goal count = 0.
- Step 4 (Actions): inline explainer block between description and form, explaining IMPACT and TIME fields and why they're required.
- Once user has 1+ active goals, normal app layout returns.


---

## Section 15 — Public site (marketing + auth)

Pages outside the authenticated product chrome. Same dark theme, separate top bar / footer. Public to logged-out visitors; logged-in users hitting `/` redirect to `/today`.

Full details in `08-DESIGN-DECISIONS.md` § "Public site (landing, manifesto, pricing)" and § "Auth flow".

### 15.1 Landing (`/`)
- **URL**: `/`.
- **Auth state**: Logged in → redirects to `/today`. Logged out → renders landing.
- **Layout**: Single-screen experience above the fold + FAQ below the fold + footer.
  - Top bar: Logo left (`ActOS`, 32px, `Act` white + `OS` orange, clickable home), nav right (`Manifesto · Pricing · Sign in`). Sticky on scroll with backdrop blur after 80px.
  - Hero (compressed ~280px): headline `Stop scheduling. / Start moving.` (two hard-break lines, 56px desktop), sub-line `The OS for getting things done.` (18px secondary), primary orange CTA `Open ActOS →` linked to `/auth#signup`.
  - Background: subtle radial orange glow (`var(--goal-2)` 10% center → transparent) behind hero block.
  - Product demo: device-frame container, 960px max width, 16:10 aspect, subtle orange-tinted shadow below. CSS-animated mockup of Today page or static fallback.
  - Scroll hint chevron at bottom of screen 1.
  - FAQ section (screen 2): heading `Questions, answered.` + manifesto link above accordion (`Why tasks and issues stop you moving toward goals.` with `ArrowUpRight` icon, links to `/manifesto`) + 5 accordion items.
  - Footer: copyright left, social icons center, badge placeholder right. Sub-row: `Manifesto · Pricing · Privacy · Terms` + language switcher dropdown.
- **Priority**: 🟢 v1.

### 15.2 Manifesto (`/manifesto`)
- **URL**: `/manifesto`. Public always (logged-in users can also visit).
- **Layout**: Medium-style essay.
  - Top bar (Manifesto nav item active), max-width 720px article container.
  - Byline: 48px circle avatar (initials `SV` in `var(--surface-raised)` + 1px border, swap to `<img>` later) + name `Stanislav Vasilevschii` + role `Founder of ActOS · May 2026`.
  - Title `Tasks won't get you there.` — Inter 56px medium, left-aligned.
  - Deck/subtitle — 24px / 18px secondary.
  - Body: Inter 19px / 17px, line-height 1.7. H2s 28px medium with 64px top margin. Drop cap on first paragraph (64px first letter floats left). Pull quote with 3px orange left border. 22 paragraphs across 5 sections.
  - Closing CTA: `Stop scheduling. Start moving.` + orange button + reassurance.
  - Footer (same as landing).
- **Content source**: i18n keys (`manifesto.*`) by default. If `actos.cms.manifesto.{locale}` exists in LocalStorage (from admin editor), use that instead.
- **Priority**: 🟢 v1.

### 15.3 Pricing (`/pricing`)
- **URL**: `/pricing`. Public always.
- **Layout**: One-screen design.
  - Top bar (Pricing nav item active).
  - Heading `Free to start. $12 to commit.` (48px / 32px medium).
  - Sub-line `Pick what fits today. Switch any time.` (18px / 16px secondary).
  - Two cards side-by-side, 960px max container, 48px padding each:
    - Free card: `FREE` badge, `$0 forever`, tagline `For people exploring the philosophy.`, 6 features with check icons, outline-style `Start free` button.
    - All-In card: 1px orange border, `RECOMMENDED` pill top-right outside, `ALL-IN` badge, `$12 /mo`, sub-line `or $120/yr — save 17%`, tagline `For people ready to commit.`, 6 features, filled orange `Go All-In` button.
  - 30-day refund line below cards (`30-day refund.` bold + body).
  - Pricing FAQ: heading `Common questions.` + 4 accordion items.
  - Footer.
- **Priority**: 🟢 v1.

### 15.4 Auth (`/auth`)
- **URL**: `/auth` (sign in mode default) or `/auth#signup` (sign up mode).
- **Auth state**: Logged in → redirects to `/today`. Logged out → renders auth form.
- **Layout**: Single page, two modes.
  - Top: ActOS logo centered, 48px from top. Clickable to `/`.
  - Middle: form card max-width 400px, vertically centered.
  - Mode-switching elements when toggling (7 of them):
    - Heading (`Welcome back.` ↔ `Let's get you set up.`)
    - Sub-line (`Open ActOS in a few seconds.` ↔ `Set up your account in 30 seconds.`)
    - Fields (Email+Password ↔ **Name**+Email+Password)
    - Forgot password link (visible ↔ hidden)
    - Submit button label (`Sign in` ↔ `Create account`)
    - Footer toggle text (`Don't have an account? Sign up` ↔ `Already have an account? Sign in`)
    - Terms note (hidden ↔ visible)
  - Email field persists across toggle. Password clears on toggle.
  - Social section: separator `or` + Google + Apple buttons. Click → "Coming soon" modal (mock).
  - Bottom-left: `← Back to homepage` link, 32px from bottom-left edges.
- **Priority**: 🟢 v1.

### 15.5 Auth verify (`/auth/verify`)
- **URL**: `/auth/verify`. Only accessible if `actos.auth.pendingSignup` exists in LocalStorage.
- **Layout**: Same chrome as `/auth` (logo top, card middle, back link bottom-left).
  - Heading `Check your email.` (32px / 24px medium).
  - Sub-line: `We sent a 6-digit code to {email}.` Email in bold.
  - 6 single-character inputs, 56×56px each, `inputMode="numeric"`. 12px gap. Auto-advance focus on type, backspace clears + moves back, paste distributes 6 digits across inputs.
  - Auto-submit when all 6 filled (no button click required).
  - `Verify and continue` button (orange, full width, 48px height) — fallback if user wants explicit click.
  - `Didn't get it? Resend (29s)` — 30s cooldown after click. New code generated.
  - `Wrong email? Change it` — returns to `/auth#signup` + clears pending.
  - Error states (below inputs): expired, incorrect with attempt count, too many attempts.
- **Mock**: code generated client-side, shown in dev toast (`[DEV] Code: 123456`) + console.log. No real email.
- **Resilience**: tab-close persistence via `actos.auth.pendingSignup`. Stale (>24h) auto-cleared.
- **Priority**: 🟢 v1.

### 15.6 Auth reset (`/auth/reset`)
- **URL**: `/auth/reset`. Forgot password placeholder flow.
- **Layout**: Same chrome as `/auth`.
  - Heading `Reset your password.`
  - Sub-line `Enter your email and we'll send a reset link.`
  - Single Email field + `Send reset link` button.
  - On submit (mock, any valid email): show success state inline — checkmark + `If that email is registered, we've sent a reset link.` (Privacy pattern.)
  - `← Back to sign in` link returns to `/auth`.
- **Mock**: no actual email sent.
- **Priority**: 🟢 v1.

### 15.7 Admin: manifesto editor (`/admin/manifesto`)
- **URL**: `/admin/manifesto`. Requires `isAdmin: true` flag on user record. Non-admin → redirect to `/today`. Non-authenticated → redirect to `/auth?next=/admin/manifesto`. No nav link — accessed via direct URL only.
- **Layout**: Full-page split editor.
  - Sticky header: ActOS logo (links to `/today`) + `Cancel` + `Save` orange button.
  - Tabs row: `[EN] [RU] [DE] [ES]` left, `Last saved: 2m ago` (or `Unsaved changes` in orange) right.
  - Split view:
    - Left: WYSIWYG editor (TipTap). Toolbar with B / I / H1 / H2 / paragraph / blockquote / bullet list / hr / link. Single-line "Subtitle / deck" input above the WYSIWYG body. Content area matches public manifesto typography (max-width 720px, Inter 19px, line-height 1.7).
    - Right: live preview rendering manifesto exactly as public page (with byline, title, deck, body).
  - Bottom-left: nothing — this isn't a regular auth page.
- **Storage**: `actos.cms.manifesto.{locale}` in LocalStorage with `{ title, deck, body: TipTapJSON, savedAt }`. One entry per locale.
- **Initial content**: first load per locale imports from i18n keys (`manifesto.*`) into TipTap document.
- **Mobile**: shows "Manifesto editor is desktop-only" message — no editor rendered.
- **Priority**: 🔵 v1.x (founder tool, not user-facing).
