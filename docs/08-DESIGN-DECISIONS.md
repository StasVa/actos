# ActOS — Design Decisions

> **Document role:** running log of design decisions made for each screen, panel, and pattern.
> **Read alongside:** `03-MODEL.md`, `07-SCREENS-INVENTORY.md`, `09-DESIGN-SYSTEM.md`.

---

## How to use this document

For each screen / panel / pattern: Decisions / Open / Prompt notes.

Decisions live here. Concepts and entity rules live in `03-MODEL.md`. Design tokens live in `09-DESIGN-SYSTEM.md`. If a decision changes a rule, the rule moves to `03-MODEL.md` and is referenced from here.

---

## Visual direction — Workshop

### Decisions

**Direction**: Dense workspace, "Workshop" character. References: Obsidian, Linear, Plane.so, ClickUp. Available in two themes:
- **Dark** (default): the original Workshop palette.
- **Light**: cool gray (macOS Light / Linear Light reference). Same character, same density, same hairline-driven structure — only the token values swap.

**Palette**: surfaces, text in three tiers, muted borders, deep electric blue accent (unchanged across themes), per-goal colors (teal / orange / purple), state and status colors. Specific values for both themes in `09-DESIGN-SYSTEM.md` § 1.2.

**Typography**: Inter for UI, JetBrains Mono for numbers and metadata. Tabular figures.

**Visual gesture**: Hairlines + measured grid + selective surface tone shifts. NOT box-shadows. Applies to both themes — light does NOT add shadows to compensate for less surface contrast.

**No emoji** in UI. Unicode characters (✓, →, ●, ▾, └) acceptable as semantic markers.

### Theming plan

**Pre-backend phase** (M8): both Workshop Dark and Workshop Light shipped, with theme switcher in Settings → Account. Default: system preference (`prefers-color-scheme`). High-contrast variant for accessibility considered as a separate v1.x exploration.

**Implementation approach**:
- All tokens defined as CSS variables under `:root, [data-theme="dark"]` and `[data-theme="light"]`.
- Theme applied via `data-theme` attribute on `<html>`.
- Inline script in `<head>` resolves and applies theme before paint to avoid flash.
- LocalStorage key `actos.theme` stores user choice (`'light' | 'dark' | 'system'`).
- `'system'` mode listens to `matchMedia('(prefers-color-scheme: dark)')` and reacts to OS-level changes; explicit choices stop listening.
- Sonner toaster `theme` prop wired to active theme.

**Pills use fixed width, not min-width**:
- ImpactPill: 40px. TimePill: 64px. MultiplierPill: 56px. Compact ImpactPill: 34px.
- Sized to fit the longest legitimate value of each type ("I10", "1h 30m", "×2.00").
- Rationale: in any list with pills on the right edge, content-fitted widths cause the column to jitter row-by-row — "I10" wider than "I3", "1h 30m" wider than "20m". Small inconsistencies that read as sloppy at the list level. Fixed width makes the right edge stable, which makes the list feel typeset.
- Cost: a tiny amount of horizontal space wasted on shorter values. Trade is worth it for column alignment.
- Format strings unchanged ("1h 30m", "I10", "×1.50") — readability of individual values matters too. We didn't switch to "90m" / "01:30" notation.

**This rule is universal**: ALL row right-side clusters that pair an Impact-equivalent pill with time use TimePill (not inline text). Applies to /today, /actions, Project page, Recently Closed Actions on /progress, RitualRow, Plan today panes — everywhere. Per-list overrides are not allowed.

**Time-relative text in archival lists** (e.g., "today" / "2d ago" / "yesterday" on Recently Closed) is also fixed-width — rendered in a ~80px right-aligned column after TimePill. Three-column right edge alignment: `[ImpactPill 40px] [TimePill 64px] [Time-relative 80px right-aligned]`.

**Time text in meta lines** (the descriptive second/third line of a row, e.g. "Goal name · Project name") stays as inline text — meta lines are prose context, not pill clusters. If a row has time in BOTH a meta line AND a right-side TimePill, remove from the meta line to avoid duplication.

### Open

- High-contrast accessibility variant (deferred to v1.x).

## Information architecture

### Settings as a standalone sidebar button

Settings lives as its own sidebar icon (lucide gear), positioned above the avatar in the footer section — NOT inside the UserMenuPopover.

**Rationale**:
- Settings is a frequent user operation (theme, data, account info, demo controls). Hiding it behind avatar → menu (2 clicks) adds friction without reason.
- Standalone sidebar button is reachable in 1 click in any sidebar state (collapsed or expanded).
- Standard pattern across productivity tools (Linear, Notion, etc.) — users expect Settings as a top-level nav item.

**UserMenuPopover** focuses on **identity + low-frequency operations**:
- Identity header (display name + email + All-In badge if applicable).
- Subscription (manage billing, upgrade — touched monthly, not daily).
- Help (when docs exist).
- Admin (conditional, dev tool).
- Sign out (rare).

This division makes the popover semantically clean — it's an "account hub", not a "settings & account hub". Settings deserves its own first-class entry.

### Sidebar footer structure

Footer section contains, top to bottom:
1. Settings button (gear icon, navigates to /settings).
2. Avatar (opens UserMenuPopover on click).

8-12px gap between them. 24-32px gap between Settings and the last content nav item above it (visible separation between content navigation and account navigation).



### Decisions

**Default route**: `/` redirects to `/today`.

**Route structure**:
- `/today` — operational focus
- `/progress` — strategic overview
- `/goals` — list
- `/goals/:id` — goal page
- `/projects` — list (excluding drafts)
- `/projects/:id` — project page (creation in draft mode + editing)
- `/actions` — full archive
- `/delegated` — currently delegated
- `/rituals` — all rituals
- `/ideas` — capture and conversion
- `/reviews/days` — list of past days
- `/reviews/days/:date` — drill-down for specific day
- `/reviews/weeks` — list of past weeks
- `/reviews/weeks/:yearWeek` — drill-down for specific week (ISO 8601 e.g., 2026-W19)
- `/reviews/months` — list of past months
- `/reviews/months/:yearMonth` — drill-down for specific month (YYYY-MM e.g., 2026-05)
- `/sessions` — sessions list with history
- `/sessions/new` — Session Builder
- `/sessions/active` — Active session timer
- `/sessions/:id/summary` — Session Summary view
- `/settings` — settings

**Legacy redirects**:
- `/` → `/today`
- `/home` → `/today`
- `/all-actions` → `/actions`
- `/all-projects` → `/projects`
- `/all-delegated` → `/delegated`

### Sidebar structure

Each nav item has lucide icon + label. Sidebar can be collapsed to icon-only mode (64px width) via toggle button at top.

**Top — Logo + Collapse toggle**:
- "ActOS" logo (truncates to "A" mark in collapsed mode).
- Right side: PanelLeftClose / PanelLeftOpen icon button. Click toggles. Persists in LocalStorage as `sidebarCollapsed` (default false).
- Cmd+\ keyboard shortcut also toggles.
- **Auto-collapse**: on first load, if viewport width < 1100px AND `sidebarCollapsed` undefined in LocalStorage, sidebar auto-collapses (then treated as user-set value, persists). User can toggle freely after.

**Section dividers**: 1px var(--border-subtle), 16px vertical margin.

**Search** (top, with visible ⌘K pill):
- Search icon (lucide Search).
- Pill on right: ⌘K in JetBrains Mono 11px var(--text-secondary), surface-elevated bg, 1px border-subtle, padding 2px 6px, radius 3px.
- In collapsed mode: pill hidden.

**Group — Execution**: Today (Sun) / Progress (TrendingUp) / Actions (CheckSquare) / Delegated (Send) / Rituals (Repeat).

**Group — Strategy & Capture**: Goals (Target) / Projects (FolderOpen) / Ideas (Lightbulb) / Sessions (Timer).

**Group — Reviews** (FLAT, not collapsible):
- "REVIEWS" section header (mono 11px uppercase letter-spacing 0.06em var(--text-tertiary), padding 8px 12px). Not clickable, doesn't toggle anything — just visual separation.
- Days (CalendarDays) / Weeks (CalendarRange) / Months (Calendar) — at same nav level as other top-level items, NOT indented.

**Bottom**: Lifetime counters, "?" Shortcuts, Avatar (Settings dropdown).

**Nav item layout (expanded)**:
- Padding 8px 12px.
- Display flex align-center, gap 12px.
- Icon left (16px var(--text-secondary), var(--text-primary) on hover/active).
- Label (Inter 14px medium).
- Active route: 2px var(--accent) left border + var(--surface-hover) bg + label/icon var(--text-primary).

**Collapsed state (64px width)**:
- Only icons, centered horizontally.
- Item padding 12px (40x40 tap target).
- Hover: tooltip with label appears to right (250ms delay).
- Section headers hidden.
- Lifetime counters hidden (too cramped).
- Avatar centered at bottom.

**Smooth 200ms transition** on width change.

**Mobile**: full drawer (always expanded width when open). Collapse toggle hidden on mobile.

### Open

(none — IA settled)

---

## Action Editor (slide-in panel)

### Decisions

**Layout & frame**:
- Slide-in panel from the right, 480px desktop, bottom sheet mobile.
- All fields visible at once (no collapse/accordion).
- Z-index: 90 (panel), 100 (popovers/dropdowns inside panel).

**Field order** (top to bottom):

1. **Title** (required, focused on create).
2. **STATE section**:
   - Status dropdown (Backlog / Done / Delegated / Dropped / Cancelled — Planned NOT in dropdown, derived).
   - Timestamp line (clickable date portion → drill-down).
   - Scheduled date picker (Today / Tomorrow chips + "Pick another date") — visible when status is non-terminal.
   - Delegation block — visible when status = Delegated.
3. **PARENT section**: Goal → Project hierarchical picker.
4. **ESTIMATES section**:
   - Impact (REQUIRED, 1-10).
   - Time estimate (REQUIRED for Done transition, 1-600 minutes).
5. **NOTES section**: plain text + auto-detect links.

**Rationale for order**: Status is most-changed field (active work). Parent is set once. Estimates are reflective fields. Notes at bottom.

**Status dropdown behavior**:
- 5 options: Backlog / Done / Delegated / Dropped / Cancelled.
- "Planned" REMOVED from clickable options (auto-derived from scheduledDate).
- Click "Done" with Impact missing → inline error, no transition.
- Click "Delegated" → reveals Delegation block. Status changes once delegate name filled.
- Click "Dropped" / "Cancelled" → Tier 1 confirmation BEFORE applying.
- Goal-level Backlog (no project): dropdown locked to Backlog, others disabled with tooltip.

**Scheduled date picker**:
- Section heading: "SCHEDULED DATE" (no "REQUIRED" — date is optional; without date = Backlog, with date = Planned).
- Two chips: Today / Tomorrow.
- Link "Pick another date" with calendar icon → expands inline calendar.
- After date picked: chips/button replaced with summary "May 15 (in 9 days)" + "Change" link.
- "Clear" link removes date, returns to Backlog.
- **Past date confirmation**: picking a date < today triggers Tier 1 confirmation: "You picked May 3 (3 days ago). Action will be marked as Done on that date." On confirm → status=Done with retroactive logging.

**Required fields enforcement**:
- Save / Create button disabled until title + impact + parent set; Time required for Done transition.
- Tooltip on disabled button explains what's missing.
- Status transition to Done blocked with inline error if Impact or Time missing.
- Existing actions without required fields show warning banner: "This action has no Impact set. Set a value to include it in progress calculations."
- Number inputs validated 1-10 (clamp on blur), Time 1-600 minutes.
- Native spinner arrows hidden globally.

**Create vs Edit form factor**:
- **Create mode** uses centered modal (640px desktop, bottom sheet mobile). Triggered by "+ New action", ⌘K → Create, "+ Add action to this day", convert idea.
- **Edit mode** uses slide-in panel (480px from right). Triggered by clicking an existing action row.
- Same fields and validation in both modes; container differs.

**Footer (contextual)**:
- New mode: "Cancel" (Tier C) + "Create" (Tier A, disabled until valid).
- Edit mode Backlog/Planned: "..." menu (Duplicate, Delete) + "Mark done" (Tier A).
- Edit mode Done: "..." menu + "Re-open" (Tier B).
- Edit mode Delegated: "..." menu + "Re-open" + "Mark done".
- Edit mode Dropped/Cancelled: "..." menu + "Re-open".

**Save behavior**:
- New mode: explicit Create button. Action persists only after valid Save.
- Edit mode: autosave on blur/change.
- After Save on create: panel closes, user returns to context screen.

**Status timestamp line**:
- Below Status dropdown.
- Examples: "Completed today" / "Completed May 3 (3 days ago)" / "Delegated to Maria · 2 days ago" / "Dropped on May 3" / "Cancelled on May 12".
- Date portion is a `<Link>` styled with hover-underline + accent color.
- Surrounding label words ("Completed", "Dropped on", etc.) NOT clickable.
- Click date → close editor panel + navigate to /reviews/days/{date}.
- If status=Done and scheduledDate ≠ completedAt: secondary line "Originally scheduled for {date}" (informational, not interactive).

**Retroactive entry/edit**:
- When opened from Reviews drill-down for a past date: defaults to status=Done, completedAt=that date, pre-filled scheduledDate=that date.
- Editing existing Done action's completedAt to different date: no confirmation, just save (action already Done).

**Triggers**:
- Click any action row anywhere.
- Inline-add inputs commit Backlog action without opening editor (fast capture).
- "+ Add action" via ⌘K Command Palette.
- "+ Add action to this day" in Reviews drill-down (retroactive mode).
- Convert idea to action (pre-filled).

### Open

- Inline-add input behavior with required Impact: should it ask for Impact via small inline picker after title, or commit with placeholder Impact and prompt later?
- Mobile bottom sheet behavior specifics.

---

## Project page

### Decisions

**Layout**: two-column on desktop (left: title + description + actions; right: metadata sidebar with progress, references summary). Single column on mobile.

**Page-based creation**:
- "+ New project" anywhere → generate UUID, create draft (isDraft=true), navigate to /projects/{newId}.
- Page loads with empty fields, title auto-focused.
- Draft promotes to real on title/action/reference/description content.
- Empty draft + navigate away → silent delete.
- Draft with content but no title + navigate away → soft prompt Save / Discard / Cancel.
- Draft NOT shown in /projects, Goal page, or other lists.
- "DRAFT" indicator next to status while isDraft=true.

**No slide-in editor for Projects**. All metadata edits inline on page:
- Click title → edit inline.
- Click goal badge → dropdown of active goals.
- Click status → toggle (Active/Completed/Dropped) with confirmation for destructive.

**Header**:
- Title (Inter 32-36px medium, click to edit).
- Goal badge (small, click to change).
- Status toggle (Active/Completed/Dropped or single dropdown).
- "..." menu: Edit / Drop (Tier 1) / Delete (Tier 2) / Split / Close-and-continue / Move to another Goal.

**Info block**:
- Progress % with visual bar.
- Value % vs Effort % split.
- Age (days).
- Action counts per status.

**Description (rich-text)**:
- TipTap-based editor with Read mode (default) and Edit mode.
- Read mode: content renders as final formatted output, no toolbar/border. Hover shows subtle outline + "Edit" button top-right.
- Edit mode: toolbar appears at top with Lucide icons (Bold, Italic, Underline, Strikethrough, H2, H3, Bullet list, Numbered list, Quote, Link, Image, File). Save status indicator + "Done" button on right.
- Click anywhere on Read content → Edit mode with cursor at click position.
- Click "Done" / Esc / outside → save + Read mode.
- Empty state: dashed border + "+" + "Describe the project, add references, materials..."
- Auto-save on blur and after 3s of inactivity.
- Status indicator state machine: idle → "Editing..." → "Saving..." → "Saved ✓" (1.5s fade).

**References**:
- Below Description.
- Section heading "REFERENCES · {n}" + "+ Add reference" link (right side).
- Each reference: URL (required) + optional title.
- Inline form for adding/editing.
- Click reference → opens URL in new tab.
- "..." menu per row: Edit / Remove.

**Actions list**:
- Smart grouping: Active (Backlog + Planned) on top expanded; Terminal collapsible below.
- Within Active: sub-grouped by status.
- Inline-add input per Active sub-group.
- Click row → Action editor.

**Drag-and-drop**:
- Within status group: yes (manual reordering).
- Between status groups: no (status changes via Action editor).

**Project status transitions**:
- All actions Done/Delegated, project not yet completed → non-blocking "Mark project complete" banner.
- System never auto-completes.
- Drop project: Tier 1 confirmation; cascades.
- Delete project: Tier 2 (type project name).
- Re-opening dropped project: actions stay Dropped.

**Project growth banner**:
- Visible when age >30 days OR rapid action growth.
- Options: Split / Close-and-continue / Keep as is.

### Open

- File upload UX: drag-drop, paste, button (all three).
- Video upload size limits.

---

## Goal page

### Decisions

**Header**:
- Goal title (Inter 32-36px).
- Type badge (subtle).
- Status indicator.
- Optional target date (with soft "overdue" if passed).
- Mark complete button.
- "..." menu: Edit / Drop (Tier 1) / Delete (Tier 2).

**Description**: optional plain text.

**Success Criteria**:
- 0–5 checkboxable items.
- Counter: "X / Y criteria met".
- Third axis of progress.

**Hero stats — three sections**:

Top tier:
- **Left**: Big progress number + "PROGRESS · OUTCOME" + stats line.
- **Right**: 3 pillars (PROJECTS / RITUALS / CRITERIA) with numbers.

Bottom tier — STATE block:
- Always: VALUE row + EFFORT row (label + bar + value).
- Hint: "Effort discounts delegated work to 20%."

Below hero: "Last activity today · 11 actions done overall".

NO sparkline in Goal page hero (lives on /goals cards and Progress hero columns).
NO Time row in STATE block (separate Resources section).

**Resources block** (only if data exists):
- Heading "RESOURCES".
- Time row: "Time spent: 10h · Time remaining: 10h estimated" (includes 20% delegated discount in spent).
- Sessions row (if any sessions for this goal): "{N} sessions · {H}h focused".

**Active Projects section**:
- Rich Project cards.
- "+ Add project to this goal" → page-based creation flow with goal pre-set.

**Rituals section**:
- Cards with title, schedule, recent consistency.
- "+ Add ritual" opens editor.

**Recent activity feed**:
- Last 5–10 events.
- Mixed Done/Delegated + project closures.
- "View all activity →" link to /reviews/days.

**Activity heatmap**:
- 52 weeks × 7 days.
- Click day → /reviews/days/{date}.

**Ideas / Goal-level Backlog section**:
- Collapsible.
- Lists actions captured under Goal without project.
- Quick actions: Assign to Project / Create new Project / Delete.

**"Visibly completable" indicator**:
- All active projects closed → glow on goal stripe + non-blocking banner.

### Open

- Layout density on wide screens.
- Heatmap visualization library.

---

## Goals page (/goals)

### Decisions

**Header**:
- Title "Goals".
- Right: meta string + "+ New goal" button (Tier A).
- "+ New goal" disabled at 3 active goals (tooltip).

**Filters**: STATE / TYPE / SORT.

**Sections**:
- ACTIVE (single grid containing all active goals):
  - Sorted: ready-to-close (≥75%) first, then by recent activity.
  - Near-completion goals visually distinguished by indicator/glow on card (NOT separate section).
- COMPLETED (collapsible).
- DROPPED (collapsible, default collapsed).

**Goal cards** (rich content):
- Header: type badge + state dot + "..." menu.
- Title.
- Big progress number + "PROGRESS · VALUE".
- VALUE bar + EFFORT bar.
- Divider.
- Stat rows: PROJECTS / RITUALS / CRITERIA / TIME.
- Divider.
- Activity sparkline (30-day, goal color).
- Footer: "Last activity: today".
- Click body → /goals/:id.

**No ghost cards in grid** — "+ New goal" only in page header.

### Open

(none)

---

## Today page (/today)

### Decisions

**Purpose**: minimalist operational focus on today's work. The most-used page in the product. NO Hero, Active Projects, footer row (those live on /progress).

**Three states, all rendered at /today** (state derived from DayEntry data):

- **STATE A — Not planned** (no DayEntry exists for today, OR DayEntry.isPlanned = false).
- **STATE B — Planned, in progress** (DayEntry.isPlanned = true AND DayEntry.isClosed = false).
- **STATE C — Closed, recap** (DayEntry.isClosed = true).

There are no separate routes (/today/plan, /today/close) — Plan today and Close day are temporary in-place takeovers of the /today URL.

**Layout structure** (top to bottom in States A and B; replaced entirely in C):

1. **Page header** — date "Friday, May 8" (Inter 24-32px medium).

2. **Day Type indicator** (only in State B, only if Day Type set):
   - Format: lucide icon + label "EXECUTION DAY" (mono 11px uppercase letter-spacing 0.06em var(--text-secondary)).
   - Icon mapping: Execution=Zap (green tint), Recovery=Leaf (purple), Day Off=Sun (gray), Sick=Thermometer (amber-red).
   - Subtle, not hero-sized. Below page header, 6-8px gap.

3. **TODAY zone** (adapts by state, see below).

4. **LOOKING BACK section** (in States A and B only; State C IS the recap so no LOOKING BACK below it).

**STATE A (not planned)**:

TODAY zone shows single CTA card:
- Background: var(--surface-elevated). Border: 1px var(--border-subtle). 8px radius. Padding: 32px 40px. Centered.
- Heading: "What are you doing today?" (Inter 20px medium).
- Sub: "Pick today's actions to start." (Inter 14px var(--text-secondary)).
- Primary CTA: "Start your day →" (Tier A button).
- If pre-scheduled actions exist (scheduledDate=today set yesterday or earlier): sub-line "{N} actions already scheduled for today" (mono 12px var(--text-tertiary)).

Click "Start your day →" → /today swaps to Plan today step 1 (full-page in-place takeover).

**Auto-open behavior — REMOVED**: Plan today does NOT auto-open on first /today load. User must explicitly click "Start your day →".

**STATE B (planned)**:

TODAY zone with full content (top to bottom):

- **Main Task card** (only if mainTaskActionId set):
  - Heading row: lucide Star icon (16px var(--text-tertiary)) + 8px gap + "MAIN TASK" mono label.
  - Card styling: var(--surface-raised) bg, 1px var(--accent) border (visually emphasized vs other cards), 6px radius, 16px 20px padding, 3px goal color stripe on left.
  - Layout: flex align-center, gap 12px. Content: checkbox + Star icon (14px var(--accent), filled) + action title (Inter 16px medium) + meta line (parent breadcrumb mono 12px) + right group (Impact pill + Time + × button to clear).
  - Bidirectional checkbox: click marks done with validation, click again re-opens (action stays on today, all metrics revert). Done state: title strikethrough + dimmed, "Done at HH:MM" sub-line, "✓ Day's win" badge, border still accent (preserves achievement framing), × still available.
  - × button: Tier 1 confirmation "Clear Main Task?" → unselected placeholder state.
  - Click body (not checkbox or ×) → Action editor.

- **TODAY'S ACTIONS list**:
  - Heading "TODAY'S ACTIONS · {N}" + sub-line "{X} done · {Y} remaining" (live updating).
  - Actions where (scheduledDate=today OR id in DayEntry.plannedActionIds), sorted active group → done group.
  - Unified ActionRow pattern (52-56px, two-line, goal stripe, checkbox, title, parent + time meta, prominent goal-tinted Impact pill on right).
  - Star icon inline before title when row is Main Task for current day.
  - Bidirectional checkbox toggle (mark done ↔ re-open).
  - **No overdue indicator for active actions** — scheduledDate not surfaced in list (anti-deferral framing). For Delegated rows specifically, return-time pill carries warning color when overdue — that's the only "overdue" surface on regular ActionRow lists. Full "OVERDUE" badge framing reserved for /delegated page.

- **"+ Add action..." inline-add input** (inside Actions section, before Rituals heading): dashed border, type title + Enter → action created (Backlog with scheduledDate=today, status=planned), auto-included in today's plan.

- **TODAY'S RITUALS list**:
  - Heading "TODAY'S RITUALS · {N}" + sub-line "{X} done · {Y} pending · {Z} skipped".
  - Ritual rows visually equal to action rows: 52-56px height, two-line layout, goal stripe (3px), checkbox, title, meta line, goal-tinted MultiplierPill on right (format "×1.50"), Skip/Restore single toggle.
  - Click checkbox → marks ritual instance done for today.
  - Click Skip → row faded; button → "Restore".
  - Click row body → Ritual editor (slide-in).

- **Close day button** at bottom (Tier B, var(--border-default)).

**STATE C (closed) — Day closed recap**:

Triggered by clicking "Close day" in State B, OR automatically at midnight (browser local date rollover sets DayEntry.isClosed = true, closedAt = previous day's 23:59:59).

The /today page swaps to a full-page recap layout (Medium tier 1024px, replaces State B content, sidebar visible):

- Page header: "Day closed" (Inter 32-36px medium).
- Sub-line: full date "Friday, May 8" + DayTypeIndicator compact (e.g., "⚡ EXECUTION DAY" mono uppercase).
- Conditional greeting line below sub-header (Inter 16px var(--text-primary)):
  - "Solid work today." — ONLY when total focused time today (sum of Done action times in minutes) ≥ 120 minutes.
  - Otherwise: NO greeting line at all (no negative messaging when low output).
- 1px var(--border-subtle) divider.

- **Stat tiles row** (5 tiles when sessions > 0, 4 tiles when sessions = 0):
  - VALUE ADDED: sum of Impact from Done + Delegated × 0.2.
  - ACTIONS DONE: count of actions marked Done today.
  - RITUALS DONE: count of rituals marked Done today.
  - SESSIONS (CONDITIONAL — only when ≥1 session today): count + sub-line "{H}h {M}m focused".
  - TIME INVESTED: sum of action times for Done + (Delegated time × 0.2).
  - Tile style: var(--surface-raised) bg, 1px var(--border-subtle), 6px radius, padding 16px 20px. Big number Inter 24-28px medium tabular. Label mono 11px uppercase.
  - Mobile: 2 per row.

- **PROJECTS** section (only if any actions today touched projects): grouped list "Project · N actions done", click → /projects/{id}.
- **GOALS** section (only if any goal progress today): per-goal "+{V} value · {H}h", click → /goals/{id}.
- **ACTIONS DONE** list: compact ActionRow pattern (Done state, line-through, dimmed Impact pill).
- **RITUALS** section (only if any rituals scheduled today): grouped by Done / Skipped / Missed.

- **REFLECTION section — REMOVED ENTIRELY**. Reflection field has been REMOVED from the data model. NO reflection input, NO reflection text rendering anywhere on this page.

- Footer row (NOT sticky):
  - Left: "Re-open day" (Tier C). Click → Tier 1 confirmation "Re-open this day?". On confirm: DayEntry.isClosed = false, navigate to State B.
  - Right: "View in Days →" (Tier C var(--accent)). Click → /reviews/days/{today's-date}.
  - NO submit button — the page IS the recap.

**Auto-close at midnight**: when browser detects local date has changed (timer or focus/visibility-change event) and there's a DayEntry for previous date with isPlanned=true and isClosed=false: set isClosed=true, closedAt=previous day's 23:59:59 (NOT current "now"), mark missed rituals (any DayEntry.plannedRitualIds without completionHistory entry for that date AND not in skippedRitualIds → completionHistory entry { date, status: 'missed' } added). No notification.

**LOOKING BACK section** (in States A and B; NOT in State C):

- Heading: "LOOKING BACK" (mono 11px uppercase var(--text-tertiary)).
- Visibility: hidden if no qualifying day exists (first-time users).
- Selector: most recent DayEntry where dayType IN ('Execution', 'Recovery') AND has activity (Done actions OR Done rituals). Skips Day Off / Sick / inactive days. (Reflection criterion removed since reflection no longer exists.)
- Card: relative date label + full date + DayTypeIndicator + stats line + per-goal effort breakdown + "View full review →" link.
- Card styling: var(--surface-elevated) bg, 1px var(--border-subtle), 6px radius, 24px padding.

### Open

- Mobile compact layout for Today zone.

---

## Progress page (/progress)

### Decisions

**Purpose**: strategic overview.

**Layout regions** (top to bottom, separated by 32-40px) — follows Goals → Goal-level time → Projects → Actions hierarchy:

1. Page header.
2. Hero (3 goal columns):
   - Same composition as Goal column spec.
   - "+ Add goal" placeholder when fewer than 3 active.
3. Time Investment:
   - Heading + aggregate ("{X}H {Y}M LAST 30 DAYS · {X}H {Y}M ALL-TIME").
   - Per-goal rows: goal label + sparkline (unified Y-axis scale) + 30-day and all-time time numbers.
   - Per-project rows nested under each goal (top 5 projects by time invested in last 30 days).
   - "+ {N-5} more projects ▾" expander when 6+ projects.
   - Excluded: projects with 0 time both 30-days and all-time.
   - Sits directly under Hero because it's a goal-level breakdown — natural continuation of the goal-focused view.
4. **Active Projects** (capped at 6):
   - Section header: "ACTIVE PROJECTS · {N total}" + meta "{N active} ACTIVE · {N stalled} STALLED" (only if stalled > 0).
   - 6 project cards max, sorted by recent activity. Stalled mixed in by activity (state dot visually distinguishes).
   - "View all {N} projects →" link below cards (Tier C, links to `/projects` with State=Active filter) — only shown if total active > 6.
   - Project card visual: rich card with VALUE/EFFORT bars, ACTIONS row, TIME row, STARTED row, sparkline, "Last activity" footer. Stripe colored by parent goal.
5. Recently Closed Projects & Goals (visible if any closures last 30 days):
   - Mixed list of closed projects + goals, sorted by closure date.
   - Status pill (COMPLETED / DROPPED) per row.
   - Stats line per row: "{N} actions done · +{V} value · {H}h invested" (for project) or "{N} projects · +{V} value · {H}h" (for goal).
   - Click row → entity page.
   - "View all closed projects →" link below.
6. Recently Closed Actions:
   - Unified ActionRow style (52-56px, two-line).
   - Right side: Value pill (colored by goal) + Time + closure date.
   - "View all actions →" link below.
7. Currently Delegated: counter + compact list.
   - "View all delegated →" link below.

**Why this order**: top-down hierarchy is Goals (Hero) → goal-level time (Time Investment) → projects (Active Projects) → retrospective (Recently Closed × 2 + Currently Delegated). Time Investment sits above Active Projects because it's a goal-level aggregation — natural continuation of the Hero — while Active Projects is project-level detail. Current work (Hero + Time Investment + Active Projects) lives above retrospective sections.

**Active Projects cap of 6**: more than 6 turns the page into scroll soup; fewer hides too much. Stalled projects are deliberately not separated into their own callout — that would shame inactivity, which is anti-philosophy. They appear in the list if they're in the top 6 by activity, otherwise they're accessible via "View all" or `/projects`.

### Open

- Whether to expose a quick goal-filter on Active Projects section.

---

## Goal column on Hero (Progress page)

### Decisions

**Composition**:
1. Header: goal color dot + Inter 16-18px title + "..." menu + state indicator dot.
2. Big progress number (Inter 36-44px) — Value %.
3. Stats line: "X of Y projects closed · Z actions done".
4. "PROGRESS · VALUE" label.
5. "Last activity: today" / "yesterday" / "5d ago".
6. VALUE bar (MeasureBar).
7. EFFORT bar (MeasureBar).
8. "ACTIVITY · LAST 30 DAYS" label.
9. Sparkline (30-day, goal color).
10. Recent activity ("Recent: ✓ X · ✓ Y · ✓ Z").

**MeasureBar component**:
- 3-column flex: label (56px) / bar (flex-grow) / value (36px right-aligned).
- DOM order: label → bar → value.
- Bar: 6-8px height, var(--surface-hover) bg, fill in goal color.

**Grid containment** (critical):
- Outer: `grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px`.
- Each column: `min-width: 0; overflow: hidden`.

### Open

(none)

---

## Project cards (rich)

### Decisions

Used on /projects, Progress page Active Projects, Goal page Active Projects.

**Composition**:
1. Header: parent goal label + state dot + "..." menu.
2. Title (Inter 16-18px).
3. **MeasureBars** — Value / Effort:
   - 8px gap between rows.
   - Same MeasureBar component as Goal columns.
4. **Stat rows** (separated 6-8px):
   - **ACTIONS row**: breakdown by status. Format: "9 done · 3 planned · 2 delegated · 0 backlog" (skip zero-count).
   - **TIME row**: "12h invested · 4h remaining" (Time Invested includes 20% of delegated; remaining from non-terminal estimates).
   - **STARTED row**: "Apr 15 · 21 days active" (closed projects: "Apr 15 · closed in 28 days").
   - Stat row styling: row height ~24px, flex justify-between.
5. **Divider**: 1px var(--border-subtle), 16px vertical margin.
6. **Footer**: "Last activity: today" (label tertiary, value secondary).

**Card dimensions**:
- Min-height ~280-300px.
- Padding 20px 24px.
- Goal color stripe 3px on left edge.

### Open

- Mobile responsive specifics.
- Adapt sizing for narrow contexts (Goal page where cards are smaller).

---

## List page architecture (full-width list vs sectioned grid vs page-based)

### Decisions

**Full-width list + slide-in panel** (uniform pattern):
- **Actions** — compact content, list-dominant.
- **Delegated** — same, focus on overdue (color-coded return date).
- **Ideas** — content-rich (notes, references, attachments) but reads cleanly as a list with a slide-in editor for the detail. Previously master-detail; refactored for consistency.
- **Sessions** — chronological list with detail slide-in.

**Sectioned grid pages** (rich cards, multi-column on desktop):
- **Goals** — rich cards in single grid (Active / Completed / Dropped).
- **Projects** — cards sectioned by state (Near completion / Active / Stalled / Closed).
- **Rituals** — cards in 2-column grid with consistency calendar.

**Page-based** (full page navigation, no slide-in):
- **Goals** — view via /goals/:id (creation in modal).
- **Projects** — view AND creation via /projects/:id.

**Master-detail layout**: NO LONGER USED. Removed in favor of full-width list + slide-in editor for /ideas. The 540px max-width centering rule that previously applied to master-detail right pane has been removed.

### Open

(none)

---

## Plan today flow (full-page wizard)

### Decisions

**Form factor**: full-page in-place takeover of /today URL. NOT a modal. Sidebar stays visible. Replaces /today State A content while user is planning.

**Architecture**: two-step wizard.

- **Step 1 — Day Type selection**: vertically centered composition with heading "What kind of day is it?" (Inter 24-28px medium primary text) + sub-line "Pick one to start planning." (Inter 14px var(--text-secondary)) + 4 large colored cards.
- **Step 2 — Plan details** (only for Execution / Recovery): action picker + Main Task + Rituals Today + footer. Day Off / Sick skip step 2 entirely.

**Auto-open behavior — REMOVED**: Plan today does NOT auto-open on first /today load. The session-storage "dismissed for current session" flag is gone. User must explicitly click "Start your day →" on State A.

**Step 1 — Day Type cards** (large colored variant — see DESIGN-SYSTEM § 3.26 variant 2):

Four cards in a single row (2x2 grid on mobile), gap 16px, all flex: 1, min-height ~140px:

| Card | Accent | Lucide icon | Title | Description |
|------|--------|-------------|-------|-------------|
| Execution | var(--state-active) (green) | Zap | "Execution" | "Full work day — normal expectations." |
| Recovery | var(--goal-3) (purple) | Leaf | "Recovery" | "Light day, intentional rest." |
| Day Off | var(--state-stalled) (gray) | Sun | "Day Off" | "No work, fully off." |
| Sick | var(--status-dropped) (amber-red) | Thermometer | "Sick" | "Illness — expectations suspended." |

Click behavior — auto-advance:
- Execution / Recovery: commit dayType to local state, advance to step 2 immediately (150ms cross-fade or instant).
- Day Off / Sick: commit DayEntry immediately (isPlanned=true, dayType set, no plannedActionIds, no plannedRitualIds, no mainTaskActionId), navigate to /today State B (which shows a quiet day view since nothing is planned).

NO "Continue" button on step 1. NO pre-selected state on entry.

**Step 2 — Plan details** (Execution / Recovery only):

Top: compact Day Type dropdown (see DESIGN-SYSTEM § 3.26 variant 3), e.g., "DAY TYPE: ● Execution ▾". Click to change dayType. Switching to Day Off / Sick: confirmation "Switch to {dayType}? Your planned actions and main task will be discarded." On confirm: dayType updates, plannedActionIds cleared, mainTaskActionId cleared, commit DayEntry, navigate to State B.

Sections vertically (32px gap between):

1. **ACTIONS · {N selected}** + sub-line "Pick what you'll work on today." (Inter 18-20px medium primary text — NOT a tiny mono uppercase label).

   Two-pane ActionPicker (see DESIGN-SYSTEM § 3.29). Available pane (60% desktop) + Selected pane (40%). Mobile: stacked.

   Available pane:
   - Filter dropdowns: GOAL / PROJECT / Status (custom dropdowns, NOT native `<select>`).
   - "ALREADY SCHEDULED" sub-section.
   - Action list with 48px rows + ImpactPill + TimePill on the right.
   - Inline-add at bottom (custom Goal/Project dropdowns, NOT native selects).

   Selected pane:
   - Numbered drag-reorderable rows with TimePill on right + × remove button.
   - "Estimated time: {H}h {M}m" aggregate at bottom.

   **Removed from previous spec**: Quick Start preset cards (Heavy Lift / Quick Moves) — removed from Plan today. Big Frog / Easy Wins terminology may resurface later as Sort options ("Sort: Heavy lift first" / "Sort: Quick wins first") — not in v1.

2. **MAIN TASK** + sub-line "What single thing makes today a win?" (Inter 18-20px medium primary text).
   - Picker dropdown "Pick from selected actions ▾". Optional — user can skip.

3. **RITUALS TODAY · {N}** + sub-line "Mark anything you want to skip." (only if rituals scheduled today).
   - Each row: title + meta + MultiplierPill + TimePill + Skip toggle.

Footer:
- "Cancel" link left (Tier C). Discard guard if any selections made.
- "Start day" button right (Tier A). NOT "Plan day" — renamed for consistency with State A's "Start your day →" CTA.
- Validation: NO required minimum — submit can be clicked even with 0 selected actions. The day can be planned with just dayType + nothing else.

On submit (Start day): DayEntry committed (isPlanned=true, plannedActionIds, plannedRitualIds, mainTaskActionId, dayType). Page swaps to State B. Toast: "Day started."

Mobile: footer button becomes sticky bottom (above safe-area inset).

**Inline-add parent pickers — inline text, not boxed dropdowns**:
- The inline-add at the bottom of the Available pane (Plan today step 2, Session Builder) uses inline text triggers for Goal and Project parent — NOT boxed FilterDropdowns.
- Visual: dotted underline on goal/project name, no chevron, no background, no border. Reads as "in {dot} {Goal} · {Project}" — like a sentence, not a form.
- Click opens a standard popover for selection.
- Rationale: the inline-add lives in a dense list context. Boxed dropdowns visually dominate the form and read as office-style chrome — clashing with the Workshop aesthetic. Inline text triggers preserve density and give the inline-add a single visual gesture (one dashed-bordered card with text inside) instead of two competing layers.
- Smart default still applies: 1 goal + 1 project → both pre-filled.
- The "lightweight" 48px inline-add used elsewhere (Today zone, Project page) does NOT have parent pickers and is unchanged.

---

## Close day flow (full-page recap)

### Decisions

**Form factor**: full-page replacement of /today State B content. NOT a modal. Sidebar stays visible.

**Triggered**:
- User clicks "Close day" button in State B.
- Automatically when browser detects local date rollover (timer or focus/visibility-change event) AND DayEntry.isPlanned=true AND DayEntry.isClosed=false: set isClosed=true, closedAt=previous day's 23:59:59 (NOT current "now"). Mark missed rituals.

Layout (Medium tier 1024px):

- Header: "Day closed" (Inter 32-36px medium) + date + DayTypeIndicator compact + conditional greeting "Solid work today." (Inter 16px primary, ONLY when total focused time today ≥ 120 minutes).
- 1px var(--border-subtle) divider.
- Stat tiles row: VALUE ADDED / ACTIONS DONE / RITUALS DONE / SESSIONS (conditional, only when ≥1 session today) / TIME INVESTED. Mobile: 2 per row.
- Conditional sections (hidden if empty): PROJECTS · GOALS · ACTIONS DONE · RITUALS.
- **NO REFLECTION section** — reflection field has been REMOVED from the data model entirely.
- Footer: "Re-open day" link left (Tier C, with Tier 1 confirmation), "View in Days →" link right (Tier C var(--accent)) → /reviews/days/{today's-date}. NO submit button.

**Greeting tone**: "Solid work today." is the only positive acknowledgment, only when threshold met. Tone: factual, not motivational. No exclamation marks, no emoji, no remedial messaging when low output.

**Reflection field removal — model migration**:
- DayEntry.reflectionText field DROPPED from model.
- Existing data with reflectionText: column dropped, data lost (LocalStorage prototype, acceptable).
- /reviews/days/{date} drill-down: REFLECTION section removed.
- Onboarding: any reflection mention removed.
- LOOKING BACK card selector: reflection criterion removed (was "Done actions OR Done rituals OR reflection set" → now "Done actions OR Done rituals").

---

## Removed daily flow patterns

The following are EXPLICITLY REMOVED from v1:

- **Plan today modal** (centered 720px) — replaced by full-page two-step wizard.
- **Close day modal** — replaced by full-page recap.
- **Combined Close + Plan modal** — removed entirely; user navigates between Today states naturally.
- **Auto-open Plan today behavior** — removed; user explicitly initiates planning.
- **Quick Start preset cards** (Heavy Lift / Quick Moves) — removed from Plan today.
- **Reflection text field** — removed from model and all UI surfaces.

**Day Type variants**: Execution / Recovery / Day Off / Sick — visualized with lucide icons in Plan today step 1 large colored cards, step 2 compact dropdown, Today page Day Type indicator (compact), Looking Back card, drill-down headers.

**Skipped ritual status**:
- Set during Plan today step 2 (Skip toggle) or directly from Today zone.
- Different from Missed (passive).
- Doesn't affect ritual multiplier.

**Past date confirmation modal**:
- Tier 1 confirmation when user picks past date in scheduling.
- Body: "You picked {date} ({relative}), which is in the past. This action will be marked as Done on that date and counted in progress calculations."
- Actions: Cancel / Mark as Done on {date}.

### Open

- Notification system for evening reminder (deferred to v1.x).
- Mobile bottom sheet specifics.

---

## Reviews / Days

### Decisions

**List page (/reviews/days)**:
- Header: title + meta + filters (DAY TYPE / GOAL / DATE RANGE).
- Search removed (global ⌘K).
- List sorted descending.
- Day row: date + day type badge + stats summary + per-goal effort breakdown.
- Click → drill-down.

**Drill-down (/reviews/days/{date})**:
- Header: breadcrumb + date + day type sub-line + meta.
- Sections (top to bottom):
  - Accomplishments (stat tiles: Value Added / Actions Done / Rituals Done / Sessions / Time Invested)
  - Goals Closed (conditional on >0)
  - Projects Closed (conditional on >0)
  - Value Added (per-goal breakdown with % of goal)
  - Time Invested (per-project nested under goals; includes 20% delegated discount)
  - Sessions (chronological list of sessions for the day, conditional on >0)
  - Main Task
  - Actions sub-groups: Done / Delegated / Dropped / Cancelled / Not completed (only show non-empty)
  - Rituals (Done / Skipped / Missed)
  - Day actions footer (Re-open day)
- **REFLECTION section REMOVED** — reflection field has been removed from the model entirely.
- "Intent" section also removed (was deprecated earlier).

**Time Invested per-project breakdown**:
- Always show per-project under goals (even if 1 project contributed).
- Project rows visually subordinate: indented, "└" prefix, smaller mono text.

**Closed Projects/Goals sections**:
- Only render if entity has completedAt or droppedAt timestamp matching this date.

### Open

- Calendar view as alternative to list (deferred to v1.x).

---

## Reviews / Weeks

### Decisions

**List page (/reviews/weeks)**:
- Header: title + meta "{N} weeks tracked" + filters (DATE RANGE / GOAL).
- Default DATE RANGE: Last 3 months.
- List sorted descending.
- Week row:
  - Top line: "Week of May 5 — May 11" + relative meta ("This week" / "Last week" / "2 weeks ago").
  - Sub-line: day type distribution.
  - Stats summary: "+{V} value · 8 actions done · {S} sessions · 3 rituals consistent · 12h 30m invested".
  - Per-goal effort breakdown line.

**Drill-down (/reviews/weeks/{yearWeek})**:
- ISO 8601 week format (e.g., 2026-W19).
- Header: breadcrumb + week range title + week number meta + day type distribution.
- Sections (top to bottom):
  - Accomplishments (stat tiles with comparisons to previous week)
  - Goals Closed (conditional on >0)
  - Projects Closed (conditional on >0)
  - Value Added (per-goal with %)
  - Time Invested (per-goal with per-project nesting; includes 20% delegated)
  - Sessions (aggregate stats + grouped by day, conditional on >0)
  - Days (7 day rows, click → /reviews/days/{date})
  - Top Contributing Actions (sub-grouped: Done / Delegated / Dropped / Cancelled)
  - Rituals (per-ritual week consistency + mini week-strip)
- **REFLECTIONS section REMOVED** — reflection field has been removed from the model entirely.

**Day rows in drill-down**:
- Date (e.g., "Mon May 5") + day type pill + stats + "→" arrow.
- Click → /reviews/days/{date}.
- Gap days (no DayEntry): greyed row "Mon May 5 — No activity logged", no click.

**Week summary computation**:
- No new persisted entity for Week — pure computed via `getWeekSummary(yearWeek)`.

### Open

(none — design settled)

---

## Reviews / Months

### Decisions

**List page (/reviews/months)**:
- Page header: title "Months" + meta "{N} months tracked" + filters (DATE RANGE / GOAL).
- List of months sorted descending. Default range: Last 12 months.
- Each month row:
  - Top line: "May 2026" + relative meta ("This month", "Last month", "2 months ago").
  - Sub-line: day type distribution ("20 Execution · 5 Recovery · 4 Day Off").
  - Stats: "+{V} value · {N} actions done · {S} sessions · {M} rituals · {H}h invested".
  - Per-goal effort breakdown line.
- Empty state: "No tracked months yet."

**Drill-down (/reviews/months/{yearMonth})**:
- URL format: YYYY-MM (e.g., 2026-05).
- Header: breadcrumb + month title + sub-line ("31 days · {N} weeks tracked") + day type distribution.
- Sections in order:
  - Accomplishments (stat tiles with comparisons to previous month).
  - Goals Closed (conditional).
  - Projects Closed (conditional).
  - Value Added (per-goal breakdown).
  - Time Invested (per-goal with per-project nesting; includes 20% delegated).
  - Sessions (aggregate stats + per-week breakdown table).
  - **Weeks** (PRIMARY NAVIGATION — list of weeks intersecting month, click → week drill-down).
  - Top Contributing Actions (top 10-15 by Impact, grouped by goal).
  - Rituals (per-ritual month consistency).
- **REFLECTIONS section REMOVED** — reflection field has been removed from the model entirely.

**Navigation pivot**: Weeks section is the primary drill-down — users land on Month, browse weeks, drill into individual weeks. From there they can navigate to days.

**Cross-month weeks**: weeks that span two months (e.g., Apr 28 - May 4) appear in BOTH months' drill-downs (in the Weeks section). This preserves week boundaries.

### Open

(none — design settled)

---

## Sessions (focus timer)

### Decisions

**Sessions are always-on**, not gated behind a layer toggle. Users who don't use sessions simply don't see them populate in drill-downs.

**Single-device scope** in v1 (LocalStorage). Multi-device cloud sync deferred to v1.x or v2.

**Maximum 1 active session at a time**. Attempting to start while another is in_progress: blocked with toast + auto-navigate to /sessions/active.

**Sessions list page (/sessions)**:
- Page header: "Sessions" + all-time meta ("{N} sessions · {H}h tracked").
- Three states:
  - First-time (no history): educational empty state with "+ Start a session" button + explanatory text.
  - With history: stats row + RECENT SESSIONS list.
  - Active session in progress: banner at top with "Resume" button (replaces "+ Start").
- List rows compact: time, status pill, duration, mode, value stats. Click → Session detail panel.

**Session Builder (/sessions/new)**:
- Mode presets: Pomodoro (25/5/4) / Continuous (60/0/1) / Custom.
- Duration config: workDuration (5-180min), breakDuration (0-30min), cyclesPlanned (1-12).
- Live total calculation displayed below inputs.
- Action picker:
  - Two-pane on desktop (available left, selected right with drag-reorder).
  - Stacked on mobile.
  - Filters: Goal / Project. "Today's planned" sub-section if Plan & Review on.
  - Available actions = Backlog + Planned status, parent project in active goal.
  - Selected actions: numbered, drag-reorderable, removable.
- Time match indicator: compares sum of selected time estimates vs work total ("+15min buffer" / "+5min over" / "Well-matched").
- Validation: ≥ 1 action required to start.
- "Start session" → creates Session, navigates to /sessions/active.

**Active session view (/sessions/active)**:
- Centered timer (JetBrains Mono, 96px desktop / 72px mobile, MM:SS, tabular-nums).
- Phase label above: "WORK · CYCLE 2/4" or "BREAK · 5MIN".
- Progress ring or bar fills over cycle duration.
- Current action card below timer (goal stripe, title, metadata, Mark done / Drop buttons).
- Session controls: Pause / Skip break / Restart cycle / Abort.
- Focus Mode toggle (top-right) — browser fullscreen + chrome hidden.
- Audio cues: opt-in (default on). Three sounds: work end / break end / session complete.
- Visual flash on cycle end (var(--accent) opacity 0.2, 300ms).
- Explicit "Continue" between work/break — no auto-rollover. User chooses to proceed.
- Timer state persists in LocalStorage. Reload resumes correctly.
- Long absence: auto-aborted with elapsed = original planned total.

**Session detail panel (slide-in)**:
- 480px desktop / bottom sheet mobile.
- Reused everywhere: /sessions, drill-downs, Project/Goal pages.
- Content: header (date/time/status pill) → config summary → execution summary → actions list with status pill per action.
- Click action → Action editor (nested overlay).
- "..." menu: Delete session (Tier 1 confirmation).

**Sessions visibility**:
- Day drill-down: SESSIONS section between TIME INVESTED and MAIN TASK. Chronological list.
- Week drill-down: SESSIONS section between TIME INVESTED and DAYS. Aggregate stats + grouped by day.
- Month drill-down: SESSIONS section between TIME INVESTED and WEEKS. Aggregate stats + per-week breakdown table.
- Project page: SESSIONS section after Actions list. Sessions involving project's actions.
- Goal page: SESSIONS section. Sessions involving goal's projects.
- Section hidden if 0 sessions in scope.
- Accomplishments tile: SESSIONS count with comparison vs previous period (Week/Month).

**Cycle end UX**:
- Audio cue + visual flash.
- Modal: "Work block done · time for a break" with explicit "Continue to break" button.
- User must click — no auto-rollover. This is mindful, not automated.

**Pause behavior**:
- Timer stops. Phase label "PAUSED". Timer text dimmed.
- Resume from same remainingSeconds.
- Pause does not affect cycle counts or duration tracking when resumed.

**Abort behavior**:
- Tier 1 confirmation.
- Session: status=aborted, endedAt=now, cyclesCompleted frozen.
- Aborted sessions are valid records — count toward history same as completed, just with status indicator.

**Action selection rule**:
- Available pool: actions in Backlog or Planned status, parent project in active goal.
- Excludes: Done, Delegated, Dropped, Cancelled actions; actions in dropped projects.
- Goal-level Backlog (no project): excluded from picker (can't select for execution without project parent).

### Open

- Audio file selection / customization (v1.x).
- Multi-device cloud sync (v1.x or v2).
- Session templates (save common configs as reusable presets) (v1.x).
- Session statistics page / leaderboard (post-v1).

---

## List view pages (Actions, Delegated, Projects, Rituals, Ideas, Sessions)

### Decisions — common across list pages

**Page rename — drop "All" prefix**:
- "All actions" → "Actions"
- "All projects" → "Projects"
- Other pages already use single-word titles. Sidebar nav and page H1 always match.

**Unified page header pattern** (full spec in 09-DESIGN-SYSTEM § 2.2):
- Title row: title left, primary CTA Tier A button right. CTA keeps full label on mobile (no icon-only collapse).
- Meta line below title (mono 11px uppercase, wraps to second line on narrow viewports).
- 1px var(--border-subtle) divider below.
- Filter bar: horizontal row, scrolls horizontally on mobile, Sort included as last item (NOT moved to a separate row).
- No per-page custom layouts — no sub-stat plaque rows, no inline "Sort:" elements outside the filter bar.

**Per-page CTA labels**:
- /actions → "+ New action"
- /projects → "+ New project"
- /delegated → "+ Delegate"
- /goals → "+ New goal" (disabled with tooltip if 3 active goals already)
- /rituals → "+ New ritual"
- /ideas → "+ New idea"
- /sessions → "+ Start session"
- /reviews/* → no CTA (read-only archives)
- /progress → no CTA (dashboard page)

**Empty states** (per page, full copy in 09-DESIGN-SYSTEM § 4.7):
- True empty (zero items, no filters): headline + description + Tier A CTA button. Centered, padding-top 80px (not vertically centered in viewport).
- Filtered empty (items exist but filters yield zero): smaller "No items match these filters." + "Clear filters" link, NOT a full empty state.
- Review pages: plain inline message without CTA, since they are read-only archives.

**Action row pattern (unified across all pages)**:
- Height: 52-56px.
- Layout: 3px goal stripe + checkbox + 2-line content + right group.
- Top line: title (Inter 15px medium). Star icon (lucide Star, var(--accent), filled, 12-14px) inline before title when row is Main Task for current day.
- Bottom line: meta (mono 12px var(--text-secondary)) "Goal · Project · Time" (delegate appended for Delegated state context).
- Right side: prominent goal-tinted Impact pill (padding 4px 10px, 4px radius, Inter 13px medium tabular, ~36px min-width). For delegated rows on desktop: color-coded return date pill (overdue/due today/on track) + Impact pill.
- Hover: var(--surface-hover).
- Selected state: var(--surface-elevated) + accent left border.
- Terminal actions (Done, Dropped, Cancelled): line-through title, dimmed colors.
- **No overdue framing** for actions in scheduled date — the pill is removed (was "MAY 5" date pill on Today). Overdue framing reserved exclusively for /delegated rows (return date pill).
- **Bidirectional checkbox toggle** in functional list views: Today, /actions, Project page, Main Task card. Click checkbox toggles status in both directions (Active → Done with validation, Done → Planned re-open with metric revert, action stays on today). Disabled for Delegated/Dropped/Cancelled with tooltip "Re-open via the editor".
- Drill-down lists (Reviews) preserve click-to-edit pattern (no toggle in archival views).

**Pages applying this row pattern**:
- /actions
- /delegated (with delegated-specific meta line + ColorCodedDatePill)
- /ideas (with status pill on right instead of impact pill, no checkbox)
- /today (Today zone — Main Task card + TODAY'S ACTIONS list)
- /reviews/days drill-down (Done / Delegated / Dropped / Cancelled / Not completed sub-groups)
- /reviews/weeks drill-down (Top Contributing Actions sub-groups)
- /reviews/months drill-down
- Project page actions list
- Plan today step 2 Available pane (48px rows with ImpactPill + TimePill)

### Open

(none)

---

## /ideas page architecture

### Decisions

**Layout**: full-width list pattern (matches /actions). Master-detail layout has been REMOVED.

**Header**: standard unified header — title "Ideas", "+ New idea" Tier A button, meta line "{N} CAPTURED · {N} CONVERTED · {N} DISCARDED".

**Filters**: STATUS / GOAL / DATE / Sort. STATUS default = Captured.

**List rows**: ActionRow pattern with these differences:
- No checkbox (ideas don't have a done state).
- Right side: small status pill (mono 11px uppercase, padding 4px 8px, neutral tint — transparent bg + 1px var(--border-subtle), text var(--text-secondary)) showing CAPTURED / CONVERTED / DISCARDED.
- Meta line format depends on status: "{Goal} · Captured {relative}" / "{Goal} · Converted to {entity-type}: {entity title}" / "{Goal} · Discarded {relative}".
- Converted rows: title in var(--text-secondary), meta entity link clickable.
- Discarded rows: dimmed (opacity 0.6).

**Section grouping**: matches /actions Active/Terminal pattern — when STATUS filter is "All", show ▾ TERMINAL · {N} collapsible section below the active list (containing Converted + Discarded). When STATUS filter is set to a specific value, no terminal grouping.

**Idea editor — slide-in panel** (480px desktop, bottom sheet mobile): triggered by clicking any row. Same chrome as Action editor edit mode. Fields: Title (Inter 18-20px medium, click-to-edit) → STATE (status dropdown + status timestamp line) → PARENT (Goal selector with goal-color dots) → NOTE (textarea) → REFERENCES → ATTACHMENTS. Footer adapts to status: Captured shows "Convert to action" / "Convert to project" / "Discard"; Converted shows read-only with optional "Open {entity}" link; Discarded shows "Restore". Autosave on blur.

**Idea creation — modal** (640px desktop, bottom sheet mobile): triggered by "+ New idea" header button. Fields: Title (auto-focused) + Goal (defaults to user's primary or first active goal) + Note (optional). Footer: Cancel + Create (disabled until title filled). Discard guard on close if any field filled.

### Open

(none)

---

## Page width tiers (system-level)

### Decisions

All content pages declare ONE of three width tiers (max-width of main content column, centered).

**Three tiers**:

- **Narrow (720px max-width)**: single-column reading or focused interaction.
  - Pages: Settings (all sub-pages), Auth pages (Sign up, Sign in, Pre-auth landing), 404.

- **Medium (1024px max-width)**: standard list/workflow pages — most of the app.
  - Pages: Today, /actions, /delegated, /goals, /projects, /rituals, /ideas, /sessions, /reviews/days (list + drill-down), /reviews/weeks (list + drill-down), /reviews/months (list + drill-down), Goal page, Project page, Session Builder, Active session, Session Summary.

- **Wide (1280px max-width)**: dashboard pages with multi-column hero content.
  - Pages: /progress (3-column hero needs space).

**Container styling**:
- Margin: 0 auto (centered).
- Max-width: 720px / 1024px / 1280px depending on tier.
- Padding: 32px horizontal on desktop, 24px on tablet, 16px on mobile.

**Rationale**:
- Conservative widths preserve readability (line lengths 60-80 chars optimal for text).
- Predictability across pages — every page has classified tier, no ad-hoc widths.
- Visual centering on large monitors is acceptable; the page is the canvas, not the screen.
- Different from Notion/Linear which go full-width — those tools have heavier multi-column content. ActOS is more reading-oriented.

**Modal widths separate from tier system**:
- Action editor modal: 640px.
- Goal/Ritual editor modal: 640px.
- (Plan today and Close day are NOT modals — they are full-page in-place takeovers of /today URL.)
- Confirmation modal: 480px.
- Command Palette: 640px.

### Open

(none)

---

## Mobile responsive behavior

### Decisions

**Breakpoints** (use everywhere):
- Mobile small: ≤ 480px
- Mobile: 481-768px
- Tablet: 769-1024px
- Desktop: 1025-1280px
- Desktop wide: 1281px+

**Sidebar behavior**:
- Desktop: 220px expanded / 64px collapsed via toggle (LocalStorage `sidebarCollapsed`, Cmd+\ shortcut).
- Auto-collapse on first load when viewport < 1100px AND `sidebarCollapsed` undefined. Then treated as user-set.
- Mobile (≤ 768px): drawer overlay. Hamburger button top-left of main content, backdrop dim, tap outside closes. Always full expanded width on mobile (no collapse mode). Collapse toggle hidden.

**Touch targets**:
- All interactive elements minimum 44px tap target on mobile.
- Compact 40px rows in pickers bumped to 48px on mobile.
- Action rows already 52-56px (sufficient).

**Modal patterns on mobile (≤ 768px)**:
- All modals (Plan today, Close day, entity create modals, confirmations) become bottom sheets.
- Slide from bottom, 100vw width, 90vh max height.
- Border-radius: 16px on top corners.
- Handle indicator at top (40px wide × 4px tall, var(--text-tertiary), centered).
- Swipe down to dismiss with discard guard if filled.
- Slide-in editors (Action/Goal/Ritual edit) also become bottom sheets.

**Multi-column layouts stack on mobile**:
- /progress hero: 3 columns → single column.
- Plan today picker: side-by-side panes → stacked (Available top, Selected below).
- Drill-down stat tiles: 4-5 per row → 2 per row.
- Goals/Projects card grids: stacked single column.

**Inline-add patterns**:
- Today's Actions inline-add: sticky to bottom of viewport on mobile (above virtual keyboard area when not focused).

**FAB (floating action button)**:
- /actions on mobile only: floating "+" bottom-right (56px circle, var(--accent), z-index 50). Click opens Action editor as bottom sheet.

**Typography on mobile**:
- Page headers (Inter 24-32px) drop to 20-24px.
- Big stat numbers (Inter 28-32px) drop to 24-28px.
- Body text unchanged.

**Safe areas**:
- iOS safe-area-inset-* respected for notched devices.
- Body overflow-x: hidden globally.
- Sticky bottom elements respect safe area bottom.

### Open

- Native mobile app (post-v1).

---

## Patterns

### Main Task indicator (Star icon)

**Decision**: One canonical visual marker for Main Task across the app.

**Marker**: lucide Star icon (filled, var(--accent)).

**Used wherever a Main Task action appears**:
- **Today zone Main Task card**: Star 14px filled var(--accent), prominently in card header next to title.
- **TODAY'S ACTIONS list row** (when action is Main Task for today): Star 12px inline before title in row.
- **Plan today step 2 MAIN TASK section heading**: Star 16px var(--text-tertiary) (hollow/empty visual when no Main Task picked) → Star 14px filled var(--accent) when card displays selected Main Task.
- **Reviews drill-down Day section**: Star inline in Main Task heading.
- **Action editor banner** (when action is current day's Main Task): "★ This is your Main Task for today" mono var(--accent).

**Tooltip**: hover on Star → "Main Task for today".

**Rationale**: a single visual marker creates consistent recognition. Without it, Main Task is just "another item with accent border" — hard to spot in a long list. Star is universally understood as "important / starred".

**Why not crown/flag/target**: Star is most legible at small sizes (12px) and most universally recognized. Crown / Target carry secondary connotations (royalty / aim) that feel forced. Flag implies "marking for follow-up" which is wrong direction.

### Bidirectional checkbox toggle

**Decision**: Mark done is reversible from the same checkbox.

**Behavior**: click checkbox on Active action → marks Done (with validation). Click checkbox on Done action → re-opens (status = Planned, scheduledDate = today, all metrics revert).

**Applies to functional list views**:
- Today zone (TODAY'S ACTIONS list, Main Task card).
- /actions list page.
- Project page actions list (per status group).

**Does NOT apply** (preserve click-to-edit pattern):
- Reviews drill-down lists (archival views, retroactive editing via Action editor only).
- Recently Closed Actions on /progress (archival).
- Plan today step 2 picker (different interaction — toggles selection, not status).

**Disabled states**: Delegated, Dropped, Cancelled actions show disabled checkbox with tooltip "Re-open via the editor".

**Rationale**: simple mistakes (mis-click checkbox) shouldn't require navigating to editor to undo. Symmetric mark/un-mark is more intuitive and matches modern app expectations.

### Delegated row variation

**Decision**: /delegated rows use modified ActionRow pattern with distinct desktop and mobile layouts.

**Differences from standard ActionRow** (desktop, ≥ 769px):
- No checkbox (delegated actions can't be marked done from list — must go through Action editor).
- Meta line format: "→ {delegate} · {parent goal} · {parent project}" (delegate prominent).
- Right side: ColorCodedDatePill (overdue var(--text-warning) tinted bg / due today var(--accent) tinted bg / on track var(--text-tertiary) no bg, with relative context "return DATE · 7d ago" / "return today" / "return in 3d") + ImpactPill.
- Tooltip on date pill hover for clean relative context.

**Mobile rework** (≤ 768px) — vertical two-row stack:

The right-side date pill on desktop crushes the title to ~8 characters at 375px viewport. On mobile, restructure the row so the title gets full width:

- Top row: title (full width minus ImpactPill) + ImpactPill on the right.
- Bottom row (meta line, mono 12px): `→ {delegate} · {return-status}` where {return-status} is rendered inline in the meta with color coding only (NO background fill) and shortened format strings:
  - Overdue → "{N}d overdue" (e.g., "8d overdue").
  - Due today → "due today".
  - On track ≤ 7 days → "in {N}d".
  - On track ≥ 8 days → "{Mon D}" (e.g., "May 10").
  - No date → "no return date" italic.
- Parent goal and parent project DROPPED from meta on mobile — recoverable by tapping into the Action editor.
- The full absolute date moves to the long-press / hover tooltip.

**"Overdue" framing rationale**: only appears here in the app — vision doesn't surface "overdue" for self-scheduled actions ("Today is the only horizon" principle), but delegated work depends on others, so overdue is operationally meaningful. Color tokens (var(--text-warning) and var(--accent)) carry the state on mobile when the background fill is dropped.

### /delegated header CTA naming

**Decision**: header button is labeled "+ Delegate" (not "+ New delegated action" or "+ New action").

**Rationale**: "New delegated action" is three words too long, breaks visual hierarchy on mobile (button competes with page title for width), and violates the "concise, no filler words" tone principle. "+ Delegate" is a single verb that clearly describes what the button does. Slight semantic stretch (it opens a form rather than delegating instantly) is acceptable — same convention as "Compose" in email apps.

**Click behavior**: opens Action create modal pre-filled with status=Delegated, Delegation block visible by default. Required fields: Title + Delegate name + Parent (Goal/Project).

Other "+ New X" buttons (`+ New action`, `+ New goal`, `+ New project`, `+ New ritual`, `+ New idea`) keep the "New" prefix because their nouns are short single words. /delegated is the special case because "delegated action" compounds badly.

### Editor form factor — Create vs Edit

**Decision**: entity editors use different form factors for creation vs editing.

**Create mode** → centered modal (640px desktop, bottom sheet mobile).
- Triggered by "+ New X" header buttons, ⌘K Create, "+ Add action to this day", convert idea.
- Backdrop dims rest of UI.
- Modal allows wider field layouts (2-column for Estimates, Parent picker, etc.).
- Discard guard on close if any field filled.
- Footer: Cancel + Create buttons.

**Edit mode** → slide-in panel (480px from right).
- Triggered by clicking existing entity row.
- Sidebar context preserved.
- Autosave on blur (no explicit Save button).
- Footer adapts to status (Mark done, Re-open, etc.).

**Applies to**: Action, Goal, Ritual, Idea editors.

**Project remains full-page** (creation flow navigates to /projects/{newId} draft mode; editing happens inline on Project page).

### Creation affordance — header button

**Universal pattern across list pages**: each entity list page has "+ New X" button in the unified page header (right side, see 09-DESIGN-SYSTEM § 2.2).

**Triggers**:
- Desktop and mobile: button with full label "+ New action" / "+ New goal" / "+ New project" / "+ New ritual" / "+ New idea" / "+ Delegate" / "+ Start session". Button keeps the full label on mobile — does NOT collapse to icon-only "+", because titles are single words and labels are short, so they fit comfortably even at 375px.
- All lead to creation modal (or page for Project).

**Inline-add inputs remain** in local contexts where parent is implicit:
- Today zone (sticky bottom on mobile).
- Project page actions list (per status group).
- Drill-down "+ Add action to this day".

**FAB on mobile** for /actions page only — floating "+" bottom-right (56px, var(--accent), z-index 50). Optional supplement to the header button on the most-used list page.

### Ghost card (creation affordance — surviving uses)

**Visual**: dashed border var(--border-default) + "+" icon + descriptive text.

**Applied to** (surviving uses after unification):
- "+ Add goal" placeholder on Progress hero (when fewer than 3 goals).
- "+ Add action to this day" in Reviews drill-down (retroactive logging).

**Hover**: dashed becomes solid var(--accent), text becomes text-primary.

### Inline-add input

**Visual**: dashed border + "+" prefix + transparent input + commit on Enter.

**Applied to**: Today zone, Project page actions list (per status group), drill-down retroactive add.

**Removed from**: /actions list page (replaced by header "+ New action" button).

**Behavior**: type title, press Enter → action created (Backlog), no editor opens.

### Capture input (Ideas) — REMOVED

The dashed-border capture input previously used at the top of /ideas has been removed. Idea creation now goes through the standard "+ New idea" header button → Idea creation modal, matching all other entity creation flows.

### Tooltip

**Visual**: var(--surface-elevated) bg + 1px var(--border-default) border + no shadow + 250ms hover delay.

**Used for**: sparkline bars, state dots, consistency calendar cells, "..." menu hints.

### Filter dropdown

**Trigger button** (compact): "LABEL: value ▾".
- Padding 6px 10px, 4px radius, transparent default.
- Hover: var(--surface-hover) bg, var(--border-default) border.
- Active (filter applied): border var(--accent), value bold.

**Popover**: var(--surface-elevated), 1px border, single-select, hover var(--surface-hover), selected ✓ + var(--accent).

### Confirmation modals

**Tier 1 (simple)**:
- Modal var(--surface-elevated), 1px border, 6px radius, padding 24px.
- Cancel / Confirm (Confirm in warning amber for destructive).
- Used for: Drop entities, Cancel/Drop action, Discard idea, Archive ritual, Re-open dropped, Mark complete, **Past date scheduling**.

**Tier 2 (name-typing)**:
- Same shell + verification field.
- "Type '{entity name}' to confirm permanent deletion."
- "Permanently delete" disabled until input matches.
- Used for: Delete goal, Delete project, Delete account.

### Toast notifications

**Library**: sonner.
**Position**: bottom-right.
**Style**: var(--surface-elevated) bg, 6px radius, sober.

**Triggers**:
- Action created / done / delegated.
- Project created / completed / dropped.
- Goal created / marked complete.
- Ritual marked done with multiplier update.
- Idea captured / converted.
- Past date confirmation result ("Marked done on May 3").
- Validation errors.

### Date picker pattern

**Used in**: Action editor scheduled date, Delegation block expected return date.

**Layout**:
- Section heading.
- Two chips: "Today" / "Tomorrow".
- "Pick another date" link with calendar icon.
- Chip click sets date immediately.
- "Pick another date" expands inline calendar (shadcn Calendar).
- After date picked: chips replaced with summary "May 15 (in 9 days)" + "Change" link.
- "Clear" link removes date.

**Past date click** triggers confirmation flow.

### Status timestamp link pattern

**Visual**: clickable date portion of timestamp line.
- Style: hover-underline + accent color.
- Surrounding label words NOT clickable.
- Click → close panel + navigate to /reviews/days/{date}.

### Number input pattern

**Native spinner arrows hidden** globally:
```css
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield;
}
```

**Validation**:
- 1-10 range fields (Impact): clamp on blur with brief amber border flash + tooltip.
- Time field: 1-600 minutes, step 5.

**Create modal — restructured for clarity**:
- Field order: Title → Estimates → Parent → Date → Notes. Estimates jump up because Impact is always-required and Time is the most-changed field; State dropdown removed entirely.
- State field removed from create modal. Status auto-derives from Scheduled date per MODEL ("Planned is NOT a status the user explicitly selects"). Showing a Backlog/Planned dropdown was misleading — users who picked "Planned" then had to provide a date in a separate step. Now there's only one path: pick a date or don't.
- Parent rendered as compact pills in one row instead of two stacked dropdowns. Goal pill includes 8px goal-color dot. Saves vertical space, reads as one logical unit ("which goal/project does this belong to?").
- Notes collapsed by default behind "+ Add notes" link. Most actions are created without notes; the always-visible textarea wasted vertical space.
- "Create" button never disabled. Always clickable; on submit attempt with missing required fields, inline errors appear and focus jumps to first error. Replaces the previous disabled+tooltip pattern, which hid the reason for disability behind hover.
- Time estimate moved to optional at create (was already de-facto optional per MODEL — required only for Done transition — but the disabled-button rule treated it as required). Now create can submit with just Title + Impact + Goal.

**Required fields for create** (matches MODEL exactly):
- Title (non-empty).
- Impact (1-10).
- Parent Goal.
- Project optional — empty = Goal-level Backlog (valid).
- Time optional at create — required only for Done transition.
- Date optional — empty = Backlog, set = Planned, past = Done via existing confirmation.

**Ritual create modal — same restructure as Action create**:
- Field order: Title → Estimates (Base Impact + Time) → Parent → Schedule → Notes. Estimates jump up (matches Action). Parent above Schedule.
- Time-of-day field REMOVED. It was in the form but never displayed or used anywhere — dead UI tied to a hypothetical reminder feature that's out of v1 scope per ROADMAP.
- Base Impact and Time required at create (per MODEL § Ritual data fields). Previous behavior allowed `baseImpact = 0` as default — invalid per MODEL ("Base Impact — user-rated 1–10") and creates the same accidental-save risk that Action create avoids.
- Parent rendered as compact pills in one row (same pattern as Action create).
- Notes collapsed behind "+ Add notes" link.
- "Create ritual" button never disabled; on submit attempt with missing required fields, inline errors appear and focus jumps to first error.
- Schedule kept as a full-width dropdown — it's the most complex field and needs config sub-fields for Weekly/Monthly. Compact pill would hide that complexity.

**Required fields for ritual create** (matches MODEL § Ritual):
- Title.
- Base Impact (1-10).
- Time estimate (> 0 min).
- Parent Goal (Project optional — empty = Goal-level ritual).
- Schedule + config.




- Block non-numeric input via keydown.

---

## Onboarding

### Decisions

**Two-layer structure**:
1. **Setup Wizard** (3 screens) — ceremonial first-run experience. Identity decisions (theme) + entry-path choice (sample data vs goal builder). Always shown on first sign-in.
2. **Goal Builder** (Goal → Project → Actions → Today) — existing flow, runs only if user picks "Set up my own goal" on Setup Wizard.

**Setup Wizard runs once per user, tracked via `actos.setup.completed: true` in LocalStorage. No skip option — the 3 screens take <60 seconds.**

**Setup Wizard visual character — deliberately different from main product**:
- Full-screen canvas, no sidebar, no header.
- Apple-device-setup feel: ceremonial, breathing space, large typography (40-56px headings vs 24-32px in product).
- 80-120px padding from edges. Generous spacing.
- One question per screen.
- Text-style CTAs ("Continue →") instead of box buttons. Buttons are typographic, not chrome.
- One accent color per screen.
- Cross-fade transitions between screens (250ms, ±8px slide), Apple's "swift out" cubic.
- Always starts in Dark theme regardless of system preference. Dark is the canonical Workshop aesthetic; first impression should be in the primary look. User can change on Screen 1 — Dark tile is pre-selected by default, Continue is enabled from start. After Setup Wizard completes, the user's chosen theme persists per the standard `actos.theme` logic.

**Setup Wizard screens**:

1. **Screen 0 — Welcome.** Logo mark, "Welcome, {firstName}.", "Let's set this up.", "Continue →". Single screen, no decoration. Logo + heading + sub + CTA.
2. **Screen 1 — Theme.** "Pick your look." Three theme tiles (System / Light / Dark). Each tile shows an SVG mini-mockup of ActOS UI in the relevant theme — sidebar shape, hero card with two progress bars, three goal-color dots in the title bar — NOT a sun/moon icon. Mockup colors come from real product tokens (each tile is wrapped in `data-theme` scope so CSS variables resolve to the relevant theme): top progress bar `var(--accent)`, bottom bar `var(--goal-1)` (teal), three dots `var(--goal-1)` / `var(--goal-2)` / `var(--goal-3)`. NO hardcoded generic blues or greens — the preview must accurately reflect the live app. Dark tile is pre-selected by default (selected state: 2px `var(--accent)` border, label `var(--accent)` weight 600). Hover on a different tile transitions the entire wizard theme live (300ms CSS variable swap on root `data-theme`). Continue is enabled from the start (always a valid selection). "Step 1 of 3" bottom-right, "← Back" bottom-left.
3. **Screen 2 — Getting started.** "How would you like to start?" Two cards: "Show me how it works" (Sparkles icon, sample data path) vs "Set up my own goal" (Target icon, goal-builder path). Selected = accent border. "Step 2 of 3".
4. **Screen 3 — Setup pause.** Thin progress line (200×2px) animating from 0 to 100% over 1.2s. "Setting up your workspace..." text above. After 1.2s, fade-out + redirect.

**Branch outcomes**:
- "Show me how it works" → seed sample data per the canonical fixture (3 goals, 9 projects, 68 actions, 4 rituals, 5 ideas, 20 sessions, 60 day entries — see PRODUCT § Canonical example goals + sample-data-fixture.json). Each entity flagged `isSample: true`. Redirect to `/today`. Persistent functional banner at the top of /today: "You're exploring a sample workspace." with "Clear and start fresh →" link. NOT dismissible — banner stays until sample data is cleared.
- "Set up my own goal" → redirect to goal-builder step 1. Continues through Criteria → Project → Actions → Today.

**Sample workspace banner** (on /today when any `isSample: true` entities exist):
- Single-line banner, sticky to top of /today (does NOT scroll away).
- **Lives inside the main content area** — uses the same horizontal paddings as the page H1. NOT a viewport-spanning layer crossing into sidebar territory. When sidebar collapses, banner shifts with content area.
- Layout: flex row, `justify-content: space-between`, vertical-center alignment. Padding 12-14px vertical, matching page horizontal padding (24-32px desktop / 16-20px mobile).
- Background `var(--surface-hover)`. Bottom 1px `var(--border-subtle)` hairline for separation. No top border, no shadow.
- Text "You're exploring a sample workspace." — Inter 13px, `var(--text-secondary)` (NOT tertiary — must be readable).
- Action "Clear and start fresh →" — Inter 13px medium, `var(--accent)`. Hover: brighter accent + arrow translates 2px right. Opens Tier 1 confirmation modal.
- No ✕ close button — banner is functional, not informational. Persists until sample data is cleared.
- Mobile (≤ 640px): if elements fit on one line, keep on one line at smaller size; otherwise stack vertically (text top, CTA below, 4px gap).
- Confirmation copy: "This will delete all sample goals, projects, actions, rituals, and ideas. This can't be undone. Anything you've created yourself stays."
- On confirm: delete all `isSample: true` entities, toast "Sample workspace cleared. Let's set up your goal.", app enters no-goals mode automatically (sample data was the only goals), goal-builder takes over.
- Settings → Data → "Clear sample data" remains as parallel path. Both routes work; Settings is canonical for destructive operations, banner is convenience.

**Settings → Data**: new "Clear sample data" row appears only if `isSample: true` entities exist. Tier 1 confirmation, deletes only sample entities, keeps user-created.

**Tone**: factual, sparse. No "Welcome to your productivity journey!" The wizard is short and direct.

**Removed from previous spec**:
- ~~Step 1 "Welcome + Model"~~ with the long Impact/Time/Value/Effort explanation. Concept explanation now lives in two places: L1 tooltip on Impact field in create modals (already shipped) and progressive coachmarks (deferred — see Open below). Long-form explanation in onboarding was making the first impression feel like reading documentation.
- ~~"Five steps"~~ flat structure. Replaced by Setup Wizard + branch.

**Why this restructure**: the old onboarding asked the user to read a wall of explanation before doing anything. Setup Wizard makes the first impression about the user's choices — name (already from registration), look (theme), how to start (sample vs build) — and gets them to a working state in <60 seconds. The product itself teaches the model through use, with progressive coachmarks filling in concepts as they're encountered.

**Edit modal vs Create modal — different footer patterns**:

These are two different mental models — Create has a real "save" action; Edit has continuous auto-save with state changes.

- **Create mode footer**: standard pattern — `[Cancel]` left, `[Create entity]` right (Tier A primary blue). The Create button is genuinely a save: it persists a new entity. No auto-save indicator (nothing exists yet to save).
- **Edit mode footer**: different pattern — `[⋯ overflow] [Saved ✓]` left, `[✓ Mark done]` right.
  - `Mark done` uses `var(--state-done)` (green-tinted), NOT primary blue. Visual category signals "state change", not "save". Solves user confusion where primary-blue "Mark done" reads as "Save" and either (a) makes users distrust auto-save and look for save button, or (b) leads to accidental clicks thinking it's save.
  - Auto-save indicator ("Saved" / "Saving...") makes persistence explicit. Removes ambiguity about whether edits are stored.
  - Overflow menu (`⋯`) holds destructive/secondary actions: Duplicate, Drop, Delete. Delete requires Tier 2 confirmation (typing "DELETE"). Drop requires Tier 1.
  - **No discard guard** on close — there are no unsaved changes when auto-save is explicit. Removes the previous "You have unsaved changes. Discard?" modal.
- Applies to: Action edit, Ritual edit, Idea edit (if exists). Goal/Project pages get the same pattern but no "Mark done" right-side action — they use status controls instead. Create modals (NEW Action, NEW Ritual) keep the standard primary-blue Create button.

**Goal-vs-Project framing in copy**:
- Goals are **results**, not activities. The product enforces this through copy on every surface that demonstrates a goal: onboarding, empty states, help, create modals.
- Onboarding goal step shows ONE concise description paragraph: "A goal is a result you want to reach — months or years of work toward something concrete you'll know you've achieved." That's it. No multi-paragraph instruction prose, no inline tip lines. Goal-vs-activity contrast is taught through the canonical examples list, not through prose.
- Title placeholder: "e.g. Get my SaaS to $10k MRR" (single placeholder, not rotating).
- "Examples" expandable below input shows 5 of the 8 canonical examples (PRODUCT § Canonical example goals).
- Project create modal gets framing copy: "A project is a chunk of work that finishes — usually in days or weeks. Break a goal into projects, projects into actions." Project placeholder uses concrete deliverables ("Set up landing page", "Ship MVP v1").
- /goals and /projects empty states reinforce the contrast.
- Why: examples in UI copy teach scale. The previous "e.g. Launch personal portfolio site" placeholder calibrated users toward project-sized goals, which produces shallow goals and vague projects. Results-oriented examples set the right pattern. Multi-paragraph onboarding text added overhead — examples teach faster than prose.

**Goal-builder is a 4-step flow** (Goal → Success Criteria → Project → Actions → /today). Step counter "STEP N OF 4":
- **Step 1 — Goal**: title + color + canonical examples expandable. One paragraph of description (above).
- **Step 2 — Success Criteria**: dedicated step for 0-5 criteria. Empty by default with "+ Add criterion" link. Each criterion is plain text, max 120 chars, can be removed via ✕. Continue is always enabled (criteria are optional). "Skip — add later" link beside Continue. Description on this step mentions "you can add or change these anytime on the goal page" — so the previous tip-line in step 1 is no longer needed.
- **Step 3 — Project**: same as before, auto-attached to goal.
- **Step 4 — Actions**: same as before, Impact and Time required per action.
- After step 4 → /today.

**Why a dedicated Success Criteria step** (not inline on Goal step, not just a tip):
- Inline form on Goal step would overwhelm — that step needs to feel light.
- A tip line about criteria was easy to miss and didn't actually help users set them.
- A dedicated step gives criteria visual weight without forcing them — Skip is one click. Users who care set them now; users who don't can come back later.

**No-goals mode — goal-builder is the entire UI when goals = 0**:

ActOS doesn't function without at least one active goal. Rather than scatter empty states across every screen, the app enters a "no-goals mode" when goals = 0: goal-builder takes over the full viewport, sidebar and header are hidden, and any URL the user visits resolves to the builder.

- Triggers automatically: any state where active goal count = 0. New users (after Setup Wizard with goal-builder path), users who dropped/completed all goals, users who cleared sample data.
- Layout: no sidebar, no top header. Full-screen goal-builder. Top-left shows minimal ActOS logo (no link). Top-right shows account avatar with menu (Settings + Sign out only — Settings opens but returns to builder on close).
- No ✕ close button on builder screens during no-goals mode (there's nowhere to close to).
- Step 1 (Goal): NO Skip button. The user must enter a title and click Create goal — without a goal, the loop never exits.
- Steps 2-4 (Criteria, Project, Actions): Skip remains available. These are optional. User lands on /today after step 4 with at least the goal.
- After at least one goal exists, no-goals mode exits and the standard app layout (sidebar + header) takes over.
- Previous data (closed projects, dropped actions, ritual history) is preserved across no-goals re-entries — it's just not visible until a new active goal exists.

**Why this stronger rule** (replaces the previous "redirect on action + empty states" approach):
- The previous approach left dead ends: a user could land on /today with 0 goals, see empty state, and bounce. Redirecting only on specific actions (Plan today, Create action) didn't cover plain navigation.
- All non-goal pages assume goals exist for their math. Empty states on each were band-aids over a routing problem.
- "No active goals" is treated as a transient state the user resolves by creating a new goal — not a state to design dashboards around.

**Removed from the previous spec** (no longer needed):
- /today empty state with "+ Create your first goal" CTA
- /projects, /rituals, /actions empty states with "Goals come first" redirect
- Disabled "+ New X" buttons with tooltip
- Action-specific redirect on Plan today / Create action / Create ritual

**Step 4 (Actions) inline explainer**:
- Onboarding Step 4 shows an explainer block between description and form, explaining IMPACT and TIME fields and why they're required.
- Block uses prose with bullets, no chrome, no info icon — first encounter with these fields needs unmissable explanation, not hover-revealed tooltip.
- The explainer block is ONLY in the onboarding goal-builder Step 4. Routine action create modal uses the existing L1 tooltip on Impact label — sufficient when user has already learned the mechanics.

**Behavior details**:
- Browser back button respects screen progression.
- Refresh mid-wizard restores current screen via `actos.setup.currentScreen` in LocalStorage.
- `prefers-reduced-motion: reduce` disables all animations (instant transitions).
- Mobile (≤ 768px): tiles stack vertically, font-sizes drop (heading 36px), padding 24px.

### Open

- Progressive coachmarks system (callouts on first encounter with surfaces like /progress, first ritual creation, first delegation, first weekly review). Spec'd separately, not in this iteration. Storage pattern: `actos.coachmark.{id}: dismissed`.
- Resume mid-flow if user closes browser tab during Setup Wizard — currently relies on LocalStorage; cloud-sync changes this post-backend.
- Should "Show me how it works" path also auto-plan today (using sample data) so the user lands on State B with a planned day, not State A? Currently lands on State A — user sees the planning entry point.


---

## Metric explanation strategy

### Decisions

**Problem**: four close-meaning words in the product — Impact, Value, Effort, Time — three of which feel synonymous in everyday speech. User actually only enters Impact and Time; Value, Effort, Time Invested are derived. Without staged explanation, users think they have to "manage Value" or "set Effort".

**Three layers, progressive depth**:

| Layer | Where | Depth |
|---|---|---|
| L1 — Minimal | Action / Ritual create modals, Impact field tooltip | One sentence |
| L2 — Contextual | Goal page and Project page hero only (NOT on dashboards / list views) | Two short paragraphs |
| L3 — Full | Onboarding step 1 (Welcome + Model) | Full explanation of the model |

**L1 — Impact tooltip on create**: explains Impact ONLY. No mention of Value/Effort here — too early. Copy: "How much does this task move your goal? 1 = small thing, 10 = critical. You decide — this is your judgment of importance, not time spent."

**L2 — Info icon next to VALUE/EFFORT bars on detail pages only**: appears on Goal page (`/goals/:id`) hero and Project page (`/projects/:id`) hero. Popover explains both metrics together and frames their relationship. Copy: "Value — how far the goal has moved... / Effort — your personal workload..."

**Why detail pages only**: list views and dashboards (`/today`, `/progress`, `/goals` cards, project list cards) are surfaces users scan repeatedly. An info icon on each card becomes daily noise. Detail pages are deep-dive surfaces where users come to understand a single entity — a single icon there is reference material, not clutter. The italic caption "Effort discounts delegated work to 20%." is removed everywhere; the popover is the single source of explanation.

**L3 — Onboarding step 1**: full model explanation (see Onboarding section above for content).

**Don't explain at any layer** (intentional reticence):
- Goal Cost / Project Cost as internal denominators.
- Multiplier step function for rituals (just show the multiplier, not the schedule).
- Re-opening retroactively recalculating past periods.
- That Dropped/Cancelled remove Impact from Cost (side effect, not user-facing rule).

**Future L4** (not in M8): a "How progress is calculated" page in Settings or Help, for the curious 5%. Deferred.

**Tooltip primitive**: reuse existing Radix/Floating UI tooltip. Auto-flip placement. Click-and-hover both open. Esc / click-outside / re-click closes.

### Open

- Whether to add quick "What's this?" links inside the popover that go to L4 page when it exists.
- Mobile UX: do popovers feel intrusive on touch, or do they need a sticky behavior?



---

## Auth screens

### Decisions

**Scope for v1**: email + password only.

**Pre-auth landing**: minimal, 2 CTAs.

**Sign up**: email + password (min 8 chars) + show/hide toggle. After: auto sign-in, redirect to Onboarding.

**Sign in**: email + password + "Forgot password?". Generic error message.

**Password reset**: two-step. Token expires 1 hour.

**Session**: 30 days from last activity.

**OAuth (Google)**: deferred to v1.x.

### Open

- Email verification UI (v1.x).
- Magic link option.

---

## Settings

### Decisions

**Entry**: user menu popover (sidebar bottom area) → Settings. NOT a direct sidebar nav item.

**Page layout**: sidebar with sections + main area. Narrow tier (720px max-width).

**Sections in v1**:
- Account (email, password, avatar, display name, delete account).
- Data (export shell in v1, full export v1.x).

**Removed from /settings**:
- Subscription section — moved to its own page at `/settings/subscription`.
- Sign out button — moved to user menu popover.
- Tracking section — removed earlier; there are no layer toggles. Plan & Review and Time tracking are always on.

**Demo controls section** (v1 prototype only — labeled "Demo controls (will be removed)"):
- "Demo: subscription tier" dropdown — Free / Pro toggle to test both UI states.
- "Show admin tools" toggle (default OFF) — when ON, surfaces "Admin" link in user menu popover.

**Theme switcher row**:
- Placed in Account section, after display name / email rows, before destructive actions.
- 3-segment control: System / Light / Dark (see DESIGN-SYSTEM § 3.33).
- Helper text above: "Defaults to your system setting."
- Selecting an option immediately applies the theme — no save, no toast.
- Default: `'system'` — follows `prefers-color-scheme` and reacts to OS changes.
- Explicit Light / Dark choices stop listening to system preference until user picks System again.
- Always visible. Not behind any toggle, not in a collapsed section.
- These dev-only controls are gated behind a feature flag in production.

**Delete account**: Tier 2 confirmation (type email).

**Lifetime stats area** (v1.x in Account section): Time aggregates, sessions stats, value/effort lifetime.

### Open

- Mobile sidebar layout.

---

## Subscription page (/settings/subscription)

See "Subscription model — Free vs All-In" section above for full layout, copy, pricing, and button behaviors. The previous Free/Pro placeholder spec has been superseded by the All-In model.

### Open

- Real Stripe Checkout integration (deferred until backend).
- Lifetime SKU configuration in Stripe (defer card from /settings/subscription if not ready at launch).

---

## Sidebar bottom area / user menu

### Decisions

**Bottom area structure** (top to bottom):
1. Lifetime counters: "X projects closed · Y actions done" (mono 11px var(--text-tertiary)). Hidden in collapsed sidebar.
2. 8px gap + 1px var(--border-subtle) divider + 8px gap.
3. Bottom row (flex, justify-between, padding 8px 12px):
   - Left: SidebarUserTrigger — clickable button with avatar + name + email. Opens UserMenuPopover.
   - Right: "?" Shortcuts icon button (32x32, lucide HelpCircle 16px). Hidden in collapsed sidebar (Shortcuts accessible via ⌘K).

**SidebarUserTrigger** (see DESIGN-SYSTEM § 3.32):
- Expanded: avatar + two-line text (name + email).
- Collapsed: only avatar centered.

**UserMenuPopover** (see DESIGN-SYSTEM § 3.31):
- Anchored above trigger (or to right when collapsed).
- Items in order: identity header → Settings → Subscription (with TierBadge) → Admin (CONDITIONAL — only when "Show admin tools" toggle is ON) → divider → Sign out (Tier 1 confirmation).

**Removed from sidebar**: standalone "Settings" link (now inside popover), standalone "?" link (now icon button), separate "Sign out" surface.

### Open

(none)

---

## Admin tools

### Decisions

**Purpose**: developer/QA tooling for the v1 prototype. Not user-facing.

**Gating**: behind "Show admin tools" toggle in /settings → Account (default OFF). When OFF: URL works directly (acceptable for LocalStorage prototype) but no nav link. When real backend arrives, replace with role-based gate (`user.role === 'admin'`).

**v1 admin tools**:

- **/admin/components** — visual smoke test page rendering every component in every state. Single long scrollable page. Page header sticky with backdrop blur + data source toggle (Live data / Mock data). 16 sections covering Atoms / Buttons / Inputs / Pills / Rows / Cards / Headers / Filter bar / Empty states / Modals / Slide-in editors / Toasts / Avatar / Sidebar / Day Type cards / Goal column. Used for regression checking after rebuilds, visual consistency verification, and as documentation for new contributors. See DESIGN-SYSTEM § 5.16.

- Reachable via user menu popover → Admin (only when toggle is ON). Icon: lucide Wrench.

### Open

- Future admin tools (data inspector, fixture seeder, release notes feed) — deferred.

---

## Command Palette

### Decisions

**Trigger**: ⌘K shortcut OR click "Search" in sidebar top.

**Form factor**: 640px modal desktop, full-width modal mobile.

**Default state (empty input)**:
- Recently Viewed (last 5).
- Quick Actions (Plan today, Close day, Create new action/project/goal/ritual, Capture idea — applicable only).
- Navigation (Go to Today, Progress, Goals, Projects, Actions, Rituals, Ideas, Reviews/Days, Reviews/Weeks, Settings).

**Typing state**:
- Live-filtered grouped results.
- Groups: Goals / Projects / Actions / Rituals / Ideas / Days / Commands / Navigation.
- Section headings only when section has results.

**Keyboard nav**:
- Up/Down to select, Enter to execute, Esc to close.
- First non-section row selected by default.

**No scope filters in v1**.

**Local search inputs removed** from individual list pages.

### Open

- Scoped search in v1.x (tabs in palette).

---

## (Future entries to be added as we design)

- Mobile-specific decisions (bottom sheets, drawer, FAB).
- AI delegation flows (v2).
- Reviews / Months (v2).
- Onboarding final copy.
- Notification system (v1.x).
- Workshop Light theme tokens (pre-backend phase).
## Subscription model — Free vs All-In

**Two-tier model**: Free (default) and All-In ($12/mo paid). No "Pro" tier — that's generic SaaS naming. "All-In" reflects the leap-of-faith pitch: members commit to the product's future, the product commits to delivering every feature it ever ships at the locked-in price.

**Why "All-In" not "Pro"**:
- "Pro" implies "amateur" semantically — wrong opposition for our audience (Free users are early-stage believers, not amateurs).
- "Pro" doesn't carry meaning beyond "paid tier" — generic across SaaS.
- "All-In" is psychological commitment, not feature list. Resonates with our users (ambitious people who recognize the all-in mental model from their own work).
- "All-In" is hyphenated (not "All In" or "ALL-IN") — reads as one entity, like a product name.

**Pricing**: $12/mo monthly, $120/yr annual (save 17%), $200 Lifetime one-time (optional SKU; defer if Stripe not configured at launch).

**Pitch line** (used everywhere All-In is presented): "Go All-In — $12/mo, everything we ever build."

**What Free includes**:
- All current features.
- Up to 1 active goal. The strict 1-goal cap creates an immediate functional upgrade trigger when the user wants to add their second goal — typically within the first weeks. This is a stronger pull-up than the longer-term 90-day history cliff.
- 90 days of history (Reviews, Sessions, day entries).
- Standard support (Help docs).

**What All-In adds on top**:
- Goal cap raised to 3 (full philosophy bound).
- Unlimited history (back to day one).
- Priority support (direct email, 48h reply).
- Every future feature included automatically — when we ship cloud sync, AI suggestions, integrations, etc., All-In members get them at no additional cost.
- Price-locked: subscribers never see a price hike as long as they stay subscribed.

**Why these specific gates** (history + goal cap, not feature gating):
- Feature gating is the standard SaaS playbook but conflicts with our positioning. We sell quality of execution, not feature presence.
- History-based gating is **value-aligned**: long-term retrospective is genuinely more valuable, naturally pulls heavy users toward upgrade as their data accumulates. Three months in, the cliff appears; six months in, the value of upgrading is obvious.
- Goal cap (2 vs 3) preserves the philosophy. Both tiers operate within "max 2-3 goals" — Free gives 2, All-In gives the full 3. We never break the principle.

**History lock UX** (90-day cliff for Free):
- Older entries don't disappear — they appear as **locked rows** in Reviews lists, with reduced opacity + lock icon + click-to-modal flow.
- Sparklines and time charts truncate at 90 days with subtle "Go All-In for full history" footer link.
- Lock modal: "This is part of your history. All-In keeps your full history forever..." with "Go All-In — $12/mo" CTA.
- Active entities (goals, projects, actions, rituals, ideas) are NEVER locked regardless of age — they're current state, not history.
- /today, /progress hero, goal page metrics — never locked. The breakdowns view is what locks for Free, not the current totals.

**Goal cap UX**:
- Free user with 1 active goal trying to create a 2nd: goal create modal shifts to soft block state inline (not a separate "you can't" modal — the form stays, the message replaces the heading area).
- Soft block offers: "Go All-In" (primary), "Save draft" (creates as draft for later activation), "Cancel".
- /goals page header line: "1 of 1 goal active · Go All-In for 3."
- Soft block modal copy: heading "Free is built for one goal at a time." Body: "Most ambitious people work on 2-3. All-In lifts the cap to 3 — the full focus range ActOS is designed around. Your draft will be saved if you'd like to continue later."
- Sample data path interaction: sample data still seeds 3 active goals (demonstrates full product). When user clears and creates their first goal, then attempts to add a 2nd, the soft block fires — and the implicit pitch lands naturally ("you saw what 3 goals looks like").

**Downgrade behavior** (graceful, not punitive):
- All-In user with 3 active goals → subscription expires → 3 goals stay active, new-goal button blocks with "Reduce to 2 or renew All-In" message.
- 14-day grace period before history starts locking after downgrade.
- All data preserved on storage. Returning to All-In re-unlocks immediately.
- Tier 2 confirmation (typing "DOWNGRADE") for explicit downgrade — protects against accidents.

**All-In badge — quiet, not loud**:
- Appears only in user menu popover header (next to display name).
- Subtle "All-In" pill, Inter 11px medium, accent color, no background.
- NOT shown on /today header, sidebar, or persistent UI surfaces.
- All-In is an internal change, not a status flex. The product looks identical for All-In members.

**No trial**:
- Free is genuinely useful — it's not a teaser. Free is the trial, with no time limit.
- 90-day history lock is a natural pull-up moment, not a sales tactic.
- Avoids the "your trial expires in N days" anti-pattern that productivity apps overuse.

**Feature inclusion promise — soft language**:
- We say: "All-In includes new features as they launch." (Soft, accurate.)
- We do NOT say: "Lifetime guarantee, every feature ever, no exceptions." (Strong, hard to honor with future infrastructure costs.)
- The pitch line "everything we ever build" is rhetorical — the legal commitment is "current + new features at no additional cost as long as subscribed."
- If a future feature has unavoidable per-use costs (e.g., AI compute), it may require add-on, but the current pitch doesn't anticipate this. Cross that bridge if it comes.


