# ActOS — Features

> **Document role:** catalog of all features, their state, and dependencies.
> **Read alongside:** `03-MODEL.md` (concepts) and `06-ROADMAP.md` (timing).

---

## Status legend

- 🟢 **v1** — required for first release
- 🟡 **v1.x** — soon after v1
- 🔵 **v2** — meaningful next stage
- ⚫ **Future** — known direction, no commitment yet

---

## Always-on Core

### 🟢 Goals
- Create, edit, archive, complete a Goal
- Maximum 2–3 active at any time (enforced)
- Type: short-term / mid-term
- Color assigned at creation
- Optional Description, Success Criteria (0–5), Target date
- "Ready to close" glow when all active projects closed
- "Near completion" indicator when ≥ 75% progress
- Dedicated Goals page (/goals) with sectioned grid
- Rich Goal cards: progress, projects/rituals/criteria/time, sparkline

### 🟢 Projects
- Page-based creation (navigate to /projects/{newId} in draft mode)
- Statuses: active / completed / dropped
- Project view: full page (/projects/:id) with rich-text description, references, actions list
- Description: rich-text TipTap-based with Read/Edit modes, Lucide toolbar, embedded images, uploaded files/video
- References: structured list, manually added
- Project actions: Mark complete, Drop (cascade), Delete (Tier 2), Split, Close-and-continue, Move to Goal
- Drop and Delete require confirmation (Tier 1 / Tier 2)
- Dedicated Projects page (/projects) with sectioned grid (Near Completion / Active / Stalled / Closed)
- No slide-in editor for Projects (all editing inline on page)

### 🟢 Actions (one-time)
- Create, edit, complete actions under a Project (or Goal as Backlog)
- Status flow: Backlog → Done / Delegated / Dropped / Cancelled
- Planned is DERIVED from scheduledDate (not separately chosen)
- Re-open from any terminal status back to Backlog
- 2-hour principle taught in onboarding
- Required fields: Title, Impact (1-10), Parent Goal; Time required for Done transition
- Past date scheduling triggers confirmation → marks Done with retroactive logging
- Retroactive entry/edit: actions can be created or modified with past completedAt timestamps
- Action editor as slide-in panel
- Status timestamps clickable → navigate to /reviews/days/{date}
- Status transitions logged with timestamps (plannedAt, completedAt, delegatedAt, droppedAt, cancelledAt)

### 🟢 Rituals (recurring actions)
- Create rituals with a schedule (daily / weekdays / weekly / monthly)
- Per-instance status: Pending / Done / Skipped / Missed
- Skipped = explicit user choice; Missed = passive
- Mark today's instance as Done from Today zone or Ritual editor
- Skip ritual instance from Plan today step 2 or Today zone
- Visualize consistency (chains, frequency charts, calendars)
- Can attach directly to a Goal
- Base Impact + Effective Impact with consistency-based multiplier
- Consistency growth: count-based, 7-tier ×1.00 to ×2.00
- No freeze on missed/skipped (multiplier accumulates only from Done)
- System templates: Weekly project audit, Monthly goal review
- Visible breakdown of multiplier in Ritual panel
- Archive ritual (soft delete); restoration possible

### 🟢 Value ≠ Effort
- Two parallel calculations of progress
- Visible in goal/project/period views
- Delegation: full Impact toward Value, 20% toward Effort, 20% toward Time Invested

### 🟢 Project Cost & Progress
- Each Action has user-rated Impact value (1-10, REQUIRED)
- Project Cost = sum of Impact (excluding Dropped/Cancelled)
- Project Progress = (Done + Delegated Impact) / Project Cost
- Goal Cost = sum of active Project Costs
- Honest progress: dropped/cancelled reduce cost, not artificially boost progress

### 🟢 Delegation
- Mark action as Delegated
- Free-text "to whom" (autocomplete from previous delegates)
- Optional expected return date and note
- v1: status only, no integrated execution
- /delegated full page (sidebar nav item with lucide Send icon, in Execution group):
  - Header with "+ Delegate" button (short verb label; direct create flow opens Action editor pre-filled with Delegated status)
  - Aggregate counts meta line: "{N} ACTIVE · {N} OVERDUE · {N} DUE TODAY" with appropriate colors
  - Tabs: Active (default) / Returned (history of delegations now Done)
  - Filters: DELEGATE / GOAL / DATE / Sort
  - Desktop row: title + meta "→ {delegate} · {parent goal} · {parent project}" + ColorCodedDatePill (overdue var(--text-warning), due today var(--accent), on track var(--text-tertiary)) + Impact pill
  - Mobile row: vertical two-row stack — title + ImpactPill on top; "→ {delegate} · {return-status}" inline meta with shortened format ("8d overdue" / "due today" / "in 3d" / "May 10") on bottom; parent goal/project dropped from meta on mobile
  - Click row → Action editor (delegated context)
- Color-coded return date pill is the ONLY place "overdue" framing appears in app (vs scheduling-tool framing for actions)

### 🟢 Main Task of the day
- One action per day marked as Main Task
- Star icon (lucide Star, filled, var(--accent)) is canonical Main Task indicator across app
- Visible prominently in Today zone as rich card with var(--accent) border
- Card supports full action interactions: checkbox marks done with validation, click body opens Action editor, × clears Main Task (Tier 1 confirm)
- Set during Plan today step 2 MAIN TASK section, or change directly from Today zone

### 🟢 Visualizing progress
- Per-goal: 3 parallel axes (projects, rituals, criteria)
- Per-period (Reviews): sober factual summary
- Impact as clean counter (no badges)
- 30-day activity sparklines on Goal cards, Goal page hero, Time Investment
- Heatmap (52 weeks × 7 days) on Goal page

### 🟢 Goal page features
- Three parallel progress axes
- Value vs Effort split (always shown — base mechanic)
- Activity heatmap
- Recent activity feed
- Resource aggregates section (Time invested vs remaining)
- Ideas / Goal-level Backlog section (collapsible)
- "Visibly completable" glow

### 🟢 Project page features
- Two-column layout (description + actions left, metadata right)
- Rich-text description with file/image upload (TipTap, Read/Edit modes)
- Structured references list
- Actions list with smart grouping
- Inline action creation
- Project metadata sidebar
- Project growth banner

### 🟢 Project growth signal
- Surface when project ages (>30 days) or grows fast
- Gentle prompt to consider splitting
- Never blocking

### 🟢 Project cards (rich)
Used on /projects, Progress page, Goal page Active Projects:
- Header: parent goal label + state dot + "..." menu
- Title
- Value and Effort MeasureBars (signature mechanic visible at card level)
- ACTIONS row: breakdown by status ("9 done · 3 planned · 2 delegated", skipping zero counts)
- TIME row: "12h invested · 4h remaining"
- STARTED row: "Apr 15 · 21 days active"
- Footer: "Last activity: today"
- Min-height ~280-300px

---

## Always-on Core (formerly "Optional Layers")

The previous layer-toggle model is removed. The daily-planning ritual is the product.

### 🟢 Plan and review your days
- Plan today: full-page two-step wizard (NOT a modal). Step 1 = Day Type selection (4 colored cards). Step 2 = Actions picker + Main Task + Rituals (Execution/Recovery only). Day Off/Sick skip step 2.
- Close day: full-page recap (NOT a modal). Stat tiles + Projects + Goals + Actions Done + Rituals breakdown. NO reflection field.
- DayEntry persistence with isPlanned / isClosed state machine.
- Auto-close at midnight: rollover sets isClosed=true with closedAt=previous 23:59:59.
- Day Type variants: Execution / Recovery / Day Off / Sick.
- Plan today does NOT auto-open. User explicitly clicks "Start your day →" on State A.
- Combined Close+Plan modal: REMOVED — user navigates between Today states naturally.

### 🟢 Time tracking (always-on)
- Per-action time estimate (required for Done transition, in minutes 1-600)
- Per-ritual time estimate (required)
- (v1.x) Per-action actual time logged
- Time Investment section on Progress page (per-goal aggregates with sparklines + per-project nesting)
- Time invested per day in Reviews/Days drill-down (per-project breakdown)
- Time aggregates in Reviews/Weeks and Reviews/Months drill-downs
- Delegated actions contribute 20% of time (symmetric with Effort)

---

## Onboarding

### 🟢 Setup Wizard (3 screens) + branch
1. **Welcome** — name from registration, "Let's set this up.", Continue.
2. **Theme** — pick System / Light / Dark via tiles with live theme preview on hover.
3. **Getting started** — choose entry path:
   - **Show me how it works** → seed sample data (3 goals, 9 projects, 68 actions, 4 rituals, 5 ideas, 20 sessions, 60 day entries — all flagged `isSample: true`), land on /today with persistent banner "You're exploring a sample workspace · Clear and start fresh →". Settings → Data also has a "Clear sample data" row.
   - **Set up my own goal** → goal-builder flow (Goal → Project → Actions → /today).

Setup Wizard runs once per user, tracked in LocalStorage. No skip option (under 60 seconds total).

Visual character is deliberately different from the rest of the product: full-screen canvas, large typography, ceremonial pacing, Apple-device-setup feel. Concept explanation (Impact/Value/Effort) is NOT in onboarding — it's in inline L1 tooltips on Impact field and via progressive coachmarks (deferred).

### 🟢 Goal-builder flow (when chosen on Wizard, or whenever a user has 0 active goals)
4-step flow with step counter "STEP N OF 4":
1. **Goal** — title + color + canonical examples expandable.
2. **Success Criteria** — 0-5 concrete signs the goal is reached. Skippable.
3. **Project** — auto-attached to goal.
4. **Actions** — Impact and Time required per action.

Lands on /today with planned day after step 4.

The same flow takes over the entire app whenever a user has 0 active goals — no sidebar, no header, just goal-builder until a goal is created. See DESIGN-DECISIONS "No-goals mode" for layout rules.

### 🟢 Settings
- Entry: user menu popover (sidebar bottom) → Settings.
- Sections: Account / Data.
- **Account**: avatar upload, email/password change, display name, delete account (Tier 2), demo subscription tier toggle, "Show admin tools" toggle, **Theme** (System / Light / Dark segmented control, persists to LocalStorage), **Language** (dropdown with native names — English / Русский / Deutsch / Español, persists to LocalStorage), default goal (where unattached actions and ideas land), lifetime stats (v1.x).
- **Data**: clear sample data, reset to seed data (dev), export JSON shell in v1, full export v1.x.
- Subscription section REMOVED from /settings (own page at /settings/subscription).
- Sign out button REMOVED from /settings (lives in user menu popover).

### 🟢 Subscription page (/settings/subscription) — Free + All-In
- Reachable via user menu popover → Subscription.
- Narrow tier (720px), single-column.
- Current plan card + comparison cards (Free + Pro side-by-side).
- Demo data only — payment integration deferred. All upgrade/downgrade buttons trigger demo confirmation modals.
- Free features: up to 3 active goals, unlimited actions/projects/ideas, local storage, daily planning, focus sessions.
- Pro features (planned): cloud sync, unlimited goals, priority support, early access.

---

## Daily flow

### 🟢 Today page (always-on)
- Default route: redirects from `/` to `/today`.
- Layout structure: Page header → Day Type indicator (subtle, lucide icon + label, only in State B/C) → TODAY zone → LOOKING BACK section (only in States A and B).
- Three states (derived from DayEntry data, no separate routes):
  - **State A (not planned)**: TODAY zone shows "What are you doing today?" CTA card with "Start your day →" button. If pre-scheduled actions exist, sub-line mentions count.
  - **State B (planned)**: TODAY zone shows Main Task card (rich, with Star icon and accent border) → TODAY'S ACTIONS list (with prominent goal-tinted Impact pills, no overdue framing) → "+ Add action..." inline-add → TODAY'S RITUALS list (rows visually equal to actions: 52-56px, MultiplierPill, Skip/Restore toggle) → Close day button.
  - **State C (closed, recap)**: full-page recap with stat tiles + Projects + Goals + Actions Done + Rituals + Re-open day / View in Days links.
- LOOKING BACK section below TODAY zone (in States A and B only): most recent active day card (skips Day Off / Sick / inactive), with relative date label.
- Bidirectional checkbox toggle: click Done action checkbox to re-open (action stays on today, all metrics revert).
- Minimalist focus.

### 🟢 Plan today flow (full-page two-step wizard)
- Triggered: click "Start your day →" CTA on Today State A. NOT auto-opened.
- Replaces /today content while user is planning (sidebar stays visible).
- **Step 1 — Day Type selection**:
  - Vertically centered composition.
  - Heading "What kind of day is it?" (Inter 24-28px medium primary text).
  - Sub-line "Pick one to start planning."
  - 4 large colored cards (~140px min-height each):
    - Execution (green tint, lucide Zap, "Full work day — normal expectations.")
    - Recovery (purple tint, lucide Leaf, "Light day, intentional rest.")
    - Day Off (gray tint, lucide Sun, "No work, fully off.")
    - Sick (amber-red tint, lucide Thermometer, "Illness — expectations suspended.")
  - Click auto-advances:
    - Execution / Recovery → step 2.
    - Day Off / Sick → DayEntry committed, navigate to State B (no step 2).
  - 2x2 grid on mobile.
- **Step 2 — Plan details** (Execution / Recovery only):
  - Compact Day Type dropdown at top (allows changing dayType — switching to Day Off/Sick triggers confirmation that clears actions/main task).
  - **ACTIONS** section with Inter 18-20px medium heading "Pick what you'll work on today.":
    - Two-pane ActionPicker (Available 60% + Selected 40% on desktop, stacked on mobile).
    - Available pane: filter dropdowns (custom, NOT native selects) → ALREADY SCHEDULED sub-section → action list (48px rows with ImpactPill + TimePill on right) → inline-add at bottom (with custom Goal/Project dropdowns).
    - Selected pane: numbered drag-reorderable rows with TimePill + × remove.
    - "Estimated time: {sum}" aggregate at bottom of Selected pane.
    - NO Quick Start preset cards (Heavy Lift / Quick Moves removed).
  - **MAIN TASK** section with heading "What single thing makes today a win?":
    - Optional dropdown "Pick from selected actions ▾".
  - **RITUALS TODAY** section with heading "Mark anything you want to skip.":
    - Each row: title + meta + MultiplierPill + TimePill + Skip toggle.
  - Footer: "Cancel" link (Tier C) + "Start day" button (Tier A). NOT "Plan day".
  - On submit: DayEntry committed, navigate to State B. Toast "Day started."
  - Validation: NO required minimum — submit can be clicked even with 0 selected actions.

### 🟢 Close day flow (full-page recap)
- Triggered: click "Close day" button on State B, OR auto-triggered at midnight rollover.
- Replaces /today content with full-page recap (Medium tier 1024px, sidebar stays visible).
- Header: "Day closed" + date + DayTypeIndicator + conditional greeting "Solid work today." (only when total focused time ≥ 2 hours).
- Stat tiles: VALUE ADDED / ACTIONS DONE / RITUALS DONE / SESSIONS (conditional, only when ≥1) / TIME INVESTED. Mobile: 2 per row.
- Conditional sections: PROJECTS · GOALS · ACTIONS DONE · RITUALS (Done/Skipped/Missed).
- NO REFLECTION section — reflection field removed from model.
- Footer: "Re-open day" link (Tier 1 confirmation) + "View in Days →" link → /reviews/days/{today}. NO submit button.
- Auto-close: at midnight rollover, isClosed set true with closedAt = previous day 23:59:59. Missed rituals marked.

---

## Strategic overview

### 🟢 Progress page (/progress)
- Hero: 3 goal columns
- "+ Add goal" placeholder when fewer than 3 active
- Active Projects with rich cards
- Recently Closed: last 5–10 closed actions and projects
- Currently Delegated: counter + compact list
- Time Investment (conditional)

### 🟢 Goals page (/goals)
- Page title: "Goals"
- Unified header: title + "+ New goal" button (disabled at 3 active goals) + meta line "{N} GOALS · {N} ACTIVE · {N} COMPLETED"
- Sectioned grid: Active / Completed / Dropped
- Active section: single grid (Near Completion visually distinguished, NOT separate section)
- Filters: STATE / TYPE / Sort
- Rich Goal cards
- Empty state: "No goals yet." + description + "+ New goal" CTA

### 🟢 Projects page (/projects)
- Page title: "Projects" (no "All" prefix)
- Unified header: title + "+ New project" button + meta line "{N} PROJECTS · {N} ACTIVE · {N} NEAR DONE · {N} STALLED · {N} CLOSED" (plain mono text — no plaque tile rendering)
- Sectioned grid: Near Completion / Active / Stalled / Closed
- "+ New project" → page-based creation flow
- Filters: GOAL / STATE / Sort
- Rich Project cards
- Empty state: "No projects yet." + description + "+ New project" CTA + conditional hint "You'll need a goal first." (when no active goals)

### 🟢 Actions page (/actions)
- Page title: "Actions" (no "All" prefix)
- Full-width list, unified header pattern
- Header: title + "+ New action" button + meta line "{N} ACTIONS · {N} ACTIVE · {N} DONE · {N} DELEGATED"
- Filters: STATUS / GOAL / DATE / Sort (in unified filter bar; horizontal scroll on mobile)
- Two-line action rows (52-56px)
- Active group on top, Terminal collapsible
- Inline-add input
- Empty state: "No actions yet." + description + "+ New action" CTA

### 🟢 Delegated page (/delegated)
- Page title: "Delegated"
- Full page (Medium tier 1024px max-width), unified header pattern
- Header: title + "+ Delegate" button (short verb label; opens Action editor pre-filled with Delegated status)
- Meta line: "{N} ACTIVE · {N} OVERDUE · {N} DUE TODAY" — overdue/due counts use color (var(--text-warning) and var(--accent) respectively when > 0)
- Tabs: Active (default) / Returned (history of delegations now Done)
- Filters: DELEGATE / GOAL / DATE / Sort
- Desktop row: title + meta "→ {delegate} · {parent goal} · {parent project}" + ColorCodedDatePill + ImpactPill
- Mobile row: vertical two-row stack — title + ImpactPill on top; "→ {delegate} · {return-status}" inline meta with shortened format on bottom
- ColorCodedDatePill: desktop pill (overdue var(--text-warning) tinted, due today var(--accent) tinted, on track var(--text-tertiary)) with relative context. Mobile inline (no background fill, color only): "8d overdue" / "due today" / "in 3d" / "May 10" / "no return date".
- Click row → Action editor (delegated context)
- Empty state: "Nothing delegated yet." + description + "+ Delegate" CTA

### 🟢 Rituals page (/rituals)
- Page title: "Rituals"
- Unified header: title + "+ New ritual" button + meta line "{N} RITUALS · {N} ACTIVE · {N} ARCHIVED"
- Card grid (2 columns desktop, 1 mobile)
- Top stats row, Pending today list
- Ritual cards with consistency calendar, frequency chart, multiplier
- Ghost "+ Add ritual" card
- Empty state: "No rituals yet." + description + "+ New ritual" CTA

### 🟢 Ideas page (/ideas)
- Page title: "Ideas"
- Full-width list pattern (matches /actions). Master-detail layout REMOVED.
- Unified header: title + "+ New idea" button + meta line "{N} CAPTURED · {N} CONVERTED · {N} DISCARDED"
- Filters: STATUS / GOAL / DATE / Sort. STATUS default = Captured.
- Rows: ActionRow pattern with no checkbox; right side has small status pill (CAPTURED / CONVERTED / DISCARDED) instead of impact pill
- Section grouping: ▾ TERMINAL · {N} collapsible when STATUS = "All"
- Click row → Idea editor (slide-in 480px desktop / bottom sheet mobile)
- "+ New idea" → Idea create modal (640px / bottom sheet)
- Convert to action / project, Discard / Restore
- Empty state: "No ideas yet." + description + "+ New idea" CTA

### 🟢 Reviews / Days (/reviews/days)
- Page title: "Days"
- Unified header: title (no CTA — read-only archive) + meta line "{N} DAYS TRACKED"
- List of past days, sorted descending
- Filters: DAY TYPE / GOAL / DATE / Sort
- Each row: date + day type + stats summary + per-goal effort breakdown
- Click row → drill-down
- Empty state: plain inline message "No days tracked yet. Days appear here once you plan or close them." (no CTA — read-only)

### 🟢 Day drill-down (/reviews/days/{date})
- Sections in order: Accomplishments → Goals Closed → Projects Closed → Value Added → Time Invested → Sessions → Main Task → Actions → Rituals (Reflection section REMOVED)
- Time Invested with per-project breakdown nested under goals
- Actions sub-groups: Done / Delegated / Dropped / Cancelled / Not completed
- Closed Projects/Goals sections show entities closed on that date
- "+ Add action to this day" — retroactive add
- Click action row → Action editor (retroactive edit)
- Re-open day option

### 🟢 Reviews / Weeks (/reviews/weeks)
- Page title: "Weeks"
- Unified header: title (no CTA) + meta line "{N} WEEKS TRACKED"
- List of past weeks sorted descending
- Filters: GOAL / DATE / Sort
- Each row: week range + day type distribution + stats summary + per-goal effort
- Click row → week drill-down
- Empty state: plain inline message "No weeks tracked yet. Weeks appear here once you have day activity."

### 🟢 Week drill-down (/reviews/weeks/{yearWeek})
- ISO 8601 week format (e.g., 2026-W19)
- Sections (in order): Accomplishments → Goals Closed → Projects Closed → Value Added → Time Invested → Sessions → Days → Top Contributing Actions → Rituals (Reflections section REMOVED)
- Days section: 7 day rows, click → Day drill-down
- Top Contributing Actions: sub-grouped by Done/Delegated/Dropped/Cancelled
- Comparisons to previous week in Accomplishments tiles

### 🟢 Reviews / Months (/reviews/months)
- Page title: "Months"
- Unified header: title (no CTA) + meta line "{N} MONTHS TRACKED"
- List of past months sorted descending
- Filters: GOAL / DATE / Sort
- Each row: month label + day type distribution + stats summary + per-goal effort
- Click row → month drill-down
- Empty state: plain inline message "No months tracked yet. Months appear here once you have day activity."

### 🟢 Month drill-down (/reviews/months/{yearMonth})
- ISO format YYYY-MM (e.g., 2026-05)
- Sections (in order): Accomplishments → Goals Closed → Projects Closed → Value Added → Time Invested → Sessions (per-week breakdown) → Weeks → Top Contributing Actions → Rituals (Reflections section REMOVED)
- Weeks section: list of weeks intersecting month, click → Week drill-down (primary navigation pivot)
- Comparisons to previous month in Accomplishments tiles

---

## Sessions (focus timer)

### 🟢 Sessions list page (/sessions)
- Page title: "Sessions"
- Unified header: title + "+ Start session" button (or "Resume active session" banner if in_progress) + meta line "{N} SESSIONS · {H}H TRACKED"
- All-time sessions history sorted descending
- Filters: MODE / DATE / Sort
- Stats row: total sessions / focused time / value added / completion rate
- Each row: time started / status pill / duration / mode / value stats
- Click row → Session detail panel (slide-in)
- Empty state: "No sessions yet." + description + "+ Start a session" CTA + conditional hint "You'll need at least one action in Backlog or Planned." (when no eligible actions)

### 🟢 Session Builder (/sessions/new)
- Mode presets: Pomodoro / Continuous / Custom
- Duration config: work block (5-180min), break (0-30min), cycles (1-12)
- Live total calculation
- Action picker: two-pane (available left / selected right with drag-reorder)
- Goal/Project filters in available pane
- "Today's planned" sub-section if Plan & Review on
- Estimated time vs work total comparison
- Validation: ≥ 1 action required to start
- "Start session" creates Session, navigates to /sessions/active

### 🟢 Active session (/sessions/active)
- Large timer display (MM:SS, JetBrains Mono 96px desktop / 72px mobile)
- "WORK · CYCLE 2/4" or "BREAK · 5MIN" label above timer
- Progress ring/bar fills over cycle duration
- Current action card (with Mark done / Drop buttons)
- Action transitions through plannedActionIds in order
- Session controls: Pause / Skip break / Restart cycle / Abort
- Audio cues (opt-in, default on): work end / break end / session complete
- Visual flash on cycle end
- Explicit "Continue" between work/break (no auto-rollover)
- Focus Mode toggle (browser fullscreen)
- Timer state persists across reload via LocalStorage

### 🟢 Session detail panel (slide-in, reused everywhere)
- Triggered: click session row anywhere (sessions page, drill-downs, project/goal pages)
- Header: date + time started + status pill + duration
- Config summary: mode + durations + cycles
- Execution summary: actual duration + cycles completed + value added
- Actions list with status pill per action (DONE / DROPPED / NOT TOUCHED)
- Click action → Action editor (nested overlay)
- Delete session option ("..." menu, Tier 1 confirmation)

### 🟢 Sessions integration in drill-downs
- Day drill-down: SESSIONS section between Time Invested and Main Task
- Week drill-down: SESSIONS section between Time Invested and Days, with aggregate stats + grouped by day
- Month drill-down: SESSIONS section between Time Invested and Weeks, per-week breakdown table
- Sessions count appears in Accomplishments tiles
- List page row stats include sessions count

### 🟢 Sessions on entity pages
- Project page: SESSIONS section after Actions list, listing sessions with at least one plannedActionId in this project
- Goal page: SESSIONS section similar pattern
- Hidden if 0 sessions for that entity

### Session constraints
- Maximum 1 session in_progress at a time (per device)
- Single-device sync (LocalStorage scoped); v2 may add cloud sync
- Always-on feature (not gated behind layer toggle)
- Sessions are independent of DayEntry — either can exist without the other

---

## Header lifetime counters

### 🟢 Sidebar bottom counters
- "X projects closed · Y actions done"
- Click → Activity page (deferred to v1.x)
- Results-only: NO time counters
- Time aggregates in Profile (v1.x in Settings → Account)

### 🟢 Sidebar user menu (NEW)
- Bottom row of sidebar: clickable user identity trigger (avatar + name + email) on left, "?" Shortcuts icon button on right.
- Click identity trigger → popover above with: identity header → Settings → Subscription (with FREE/PRO TierBadge) → Admin (conditional, only when "Show admin tools" toggle ON) → divider → Sign out (Tier 1 confirmation).
- Replaces the previous separate "Settings" sidebar link. Settings now lives inside this menu.
- Replaces the previous separate "Sign out" button on /settings.
- Collapsed sidebar: only avatar visible centered, click opens menu to the right; "?" Shortcuts hidden (accessible via ⌘K).

### 🟢 Admin tools (dev only)
- Gated behind "Show admin tools" toggle in /settings → Account (default OFF).
- v1 admin tool: /admin/components — visual smoke test page rendering every component in every state. Single long scrollable page with sticky header + data source toggle (Live data / Mock data). Used for regression checking and visual consistency verification.
- When toggle OFF: URL works directly but no nav link.
- When toggle ON: "Admin" link appears in user menu popover (lucide Wrench icon, between Subscription and Sign out divider).
- This page is for developer/QA use only — never surfaced to end users.

---

## Search and Commands

### 🟢 Command Palette (⌘K)
- Single global search and command interface
- Triggered: ⌘K shortcut OR Search nav item
- 640px modal desktop, full-width mobile
- Default state: Recently Viewed / Quick Actions / Navigation
- Typing state: live-filtered grouped results
- Keyboard navigation

### 🟢 Sidebar Search nav item
- Top of sidebar
- Magnifying glass + "Search" label + "⌘K" hint
- Click opens Command Palette

### 🟢 No local search inputs
- Search inputs removed from list pages
- Filter dropdowns/chips remain
- Global search is unified entry

---

## Sidebar structure

### 🟢 Sidebar with icons and collapse

Each nav item has lucide icon + label. Sidebar can be collapsed to icon-only (64px width) via toggle button in top corner. Persists in LocalStorage. Cmd+\ shortcut also toggles.

Group 1 — Search:
- Search (⌘K visible as readable pill)

Group 2 — Execution:
- Today (lucide Sun)
- Progress (lucide TrendingUp)
- Actions (lucide CheckSquare)
- Delegated (lucide Send)
- Rituals (lucide Repeat)

Group 3 — Strategy & Capture:
- Goals (lucide Target)
- Projects (lucide FolderOpen)
- Ideas (lucide Lightbulb)
- Sessions (lucide Timer)

Group 4 — Reviews (flat, not collapsible):
- REVIEWS section header (uppercase mono, not clickable)
- Days (lucide CalendarDays)
- Weeks (lucide CalendarRange)
- Months (lucide Calendar)

Sidebar bottom:
- Lifetime counters (hidden in collapsed mode)
- "?" Shortcuts link
- Avatar (Settings / Sign out)

In collapsed mode: section headers hidden, only icons visible with tooltip on hover.

**Auto-collapse behavior**: on first load with viewport width < 1100px, sidebar auto-collapses (then treated as user-set value, persists in LocalStorage). User can toggle freely after that.

---

## AI as delegate

### 🟢 v1: AI as a delegation target
- Mark action as Delegated → AI
- No execution pipeline yet — status only

### 🔵 v2: AI execution pipeline

---

## Public site (marketing)

ActOS has a three-page public site for new visitors before signup. Same dark theme as the product. Details in `08-DESIGN-DECISIONS.md` § "Public site (landing, manifesto, pricing)".

### 🟢 Landing page (`/`)
- Single-screen hero (compressed to fit above the fold on 1080p+): headline `Stop scheduling. / Start moving.`, sub-line `The OS for getting things done.`, primary orange CTA `Open ActOS →`.
- Below hero: product demo frame (CSS-animated mockup of Today page, with orange-tinted shadow). Falls back to static screenshot or video MP4 when real demo content is available.
- Top bar: ActOS logo (Act white + OS orange) + nav (`Manifesto · Pricing · Sign in`). Sticky on scroll with backdrop blur.
- FAQ section below the fold: heading `Questions, answered.`, 5 accordion items, plus a standalone manifesto link above the accordion (`Why tasks and issues stop you moving toward goals.`).
- Footer: copyright, social icons (Twitter/GitHub/LinkedIn), badge placeholder, sub-row links (`Manifesto · Pricing · Privacy · Terms`), language switcher dropdown.
- Logged-in users hitting `/` redirect to `/today`.

### 🟢 Manifesto page (`/manifesto`)
- Medium-style essay layout. Founder voice (Stanislav Vasilevschii).
- Byline: 48px circle avatar (initials `SV`) + name + role + date.
- Title: `Tasks won't get you there.` Left-aligned 56px medium.
- Deck/subtitle, then article body: 5 H2 sections, 22 paragraphs, drop cap on first paragraph, one pull quote with orange left border, closing CTA.
- Same top bar + footer as landing.
- Public — accessible logged-out or in.

### 🟢 Pricing page (`/pricing`)
- One-screen layout. Heading `Free to start. $12 to commit.`
- Two cards side-by-side: Free ($0 forever, 2 active goals) and All-In ($12/mo, 3 active goals, `RECOMMENDED` pill).
- 30-day refund line below cards.
- Small FAQ (4 items: change plans / cancel / price changes / free trial).
- Same top bar + footer as landing.
- Public — accessible logged-out or in.

### 🟢 Auth pages (`/auth`, `/auth/verify`, `/auth/reset`)
- See `### 🟢 Authentication` under "Cross-cutting concerns" below for full spec.
- `/auth` — combined sign in / sign up.
- `/auth/verify` — inline 6-digit code verification after signup.
- `/auth/reset` — forgot password placeholder flow.

### 🟢 Internationalization (public site)
- All public pages localized to EN/RU/DE/ES (159 keys total).
- Footer has language switcher: dropdown trigger showing current language in native name (`Русский ▾`), menu opens upward with all 4 options + checkmark on active.
- Language inherits from `actos.i18n.language` LocalStorage (set by browser detect on first visit or by Settings → Language).
- Sample data on signup is locale-aware: per-locale dataset files (`sampleData.{en,ru,de,es}.ts`) selected based on user's language at signup time.

### 🔵 Admin: Manifesto editor (`/admin/manifesto`)
- Founder-only WYSIWYG editor for manifesto content. Built on TipTap.
- Gated by `isAdmin: true` flag on user record (LocalStorage now, server-side later).
- 4 locale tabs (EN/RU/DE/ES). Split view: editor left, live preview right.
- Mock LocalStorage storage; Supabase swap later.
- Desktop-only (mobile shows "desktop-only" message).
- Closing CTA section is NOT editable — stays in i18n keys (structurally part of page chrome).
- No nav link — accessed via direct URL only.

---

## Things deliberately not in v1

- ⚫ Sub-actions / nested checklists
- ⚫ Calendar integration / time-blocking
- ⚫ Recurring rest-days / "skip without breaking the chain" (Skipped status covers this)
- ⚫ Reminders and notifications
- ⚫ Native mobile app
- ⚫ Team / multi-user / sharing
- ⚫ Public goal sharing
- ⚫ Templates / goal libraries (beyond 2 universal ritual templates)
- ⚫ Import from Notion / Todoist / etc.
- ⚫ Reviews / Months (deferred to v2)
- ⚫ Export / API
- ⚫ Themes beyond Light / Dark / System (Workshop Light shipped in M8 with theme switcher in Settings → Account; further customization is post-v1)

---

## Cross-cutting concerns

### 🟢 Page width tiers (system-level)

All content pages declare one of three width tiers (max-width of main content column, centered):

- **Narrow tier (720px)**: Settings (all sub-pages), Auth pages (Sign up, Sign in, Pre-auth landing), 404. Single-column reading or focused interaction.
- **Medium tier (1024px)**: Today, Actions list, Delegated, Goals list, Projects list, Rituals list, Ideas list, Sessions list, Reviews/Days (list + drill-down), Reviews/Weeks (list + drill-down), Reviews/Months (list + drill-down), Goal page, Project page, Session Builder, Active session, Session Summary. Standard list/workflow content.
- **Wide tier (1280px)**: Progress page (multi-column hero needs space).

Padding: 32px horizontal on desktop, 24px on tablet, 16px on mobile.

### 🟢 Responsive breakpoints

Standard breakpoints used everywhere:
- Mobile small: ≤ 480px
- Mobile: 481-768px
- Tablet: 769-1024px
- Desktop: 1025-1280px
- Desktop wide: 1281px+

### 🟢 Mobile patterns (≤ 768px)

- Sidebar becomes drawer overlay (hamburger top-left, backdrop dim, tap outside closes). No collapsed icon-only mode on mobile.
- Touch targets minimum 44px (Apple guideline). Compact 40px rows in pickers bumped to 48px.
- All modals become bottom sheets: slide from bottom, 100vw width, 90vh max height, top-corner radius 16px, handle indicator, swipe-down dismiss with discard guard if filled.
- Slide-in editors (Action/Goal/Ritual edit) become bottom sheets.
- Multi-column layouts stack:
  - /progress hero: 3 columns → single column
  - Plan today picker: side-by-side panes → stacked (Available top, Selected below)
  - Drill-down stat tiles: 4-5 per row → 2 per row
  - Goals/Projects card grids: stacked single column
- Inline-add for Today's actions: sticky to bottom of viewport.
- FAB on /actions: floating "+" bottom-right (56px circle, var(--accent), z-index 50, opens Action editor as bottom sheet).
- Typography: page headers Inter 24-32px → 20-24px on mobile; big stat numbers 28-32px → 24-28px.
- Body overflow-x: hidden globally (no horizontal scroll).
- iOS safe area insets respected for notched devices.

### 🟢 Authentication
- Combined sign in / sign up page at `/auth`. Single URL, two modes (toggle via bottom link). URL hash `/auth#signup` deep-links to sign up mode.
- Sign up: Name + Email + Password fields. Inline 6-digit code verification at `/auth/verify` after submit. User is `emailVerified: true` from completion.
- Sign in: Email + Password. Forgot password link to `/auth/reset`.
- Social auth: Google + Apple buttons. Click shows "Coming soon" modal (real OAuth post-launch).
- Auth-gated routing: product routes require auth (`/today`, `/goals/*`, `/projects/*`, `/setup`); public routes always accessible (`/`, `/manifesto`, `/pricing`).
- Mock implementation via LocalStorage (`actos.auth.user`, `actos.auth.pendingSignup`). `useAuth()` hook is single source of truth. Real Supabase swap is isolated to one file (`mockAuth.ts`).
- Sign out from user menu (sidebar bottom) clears auth state + redirects to `/`.

### 🟢 Data persistence
- Single-user, prototype: LocalStorage with Zustand persist middleware
- Production (post-backend): cloud-synced

### 🟢 Tone
- Factual copy, no motivational language
- No emoji-heavy UI (Unicode markers acceptable)
- No infantilizing badges or celebrations

### 🟢 Z-index hierarchy
- Sidebar / regular page content: 0-10
- FAB (mobile /actions): 50
- Active session banner (sticky on other pages): 40
- Slide-in panel (Sheet): 90
- Slide-in panel content (dropdowns/popovers inside Sheet): 100
- Modals (entity create modals, confirmations, command palette): 200
- Command Palette: 250
- Toasts: 300
