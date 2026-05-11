# ActOS — Flows & Screens

> **Document role:** maps user journeys and the screens that serve them.
> **Read alongside:** `03-MODEL.md`, `04-FEATURES.md`, `07-SCREENS-INVENTORY.md`.

---

## Screen inventory (v1)

| Screen                  | Purpose                                                |
|-------------------------|--------------------------------------------------------|
| Setup Wizard            | First-run ceremonial setup (3 screens)                 |
| Goal-builder            | 4-step flow for creating a goal (Goal → Criteria → Project → Actions) |
| Today                   | Operational focus — what's happening today             |
| Progress                | Strategic overview — where am I in my goals            |
| Goals                   | List of all goals with rich state info                 |
| Goal page               | Full page for one goal                                 |
| Projects                | List of all projects                                   |
| Project page            | Full page for one project (creation + editing)         |
| Actions                 | Full archive of all actions                            |
| Delegated               | Active delegations                                     |
| Rituals                 | All rituals with consistency views                     |
| Ideas                   | Capture and conversion (full-width list + slide-in editor) |
| Sessions                | Focus session history                                  |
| Reviews / Days          | Per-day archive                                        |
| Day drill-down          | Detailed view of one day                               |
| Reviews / Weeks         | Per-week archive                                       |
| Week drill-down         | Detailed view of one week                              |
| Reviews / Months        | Per-month archive                                      |
| Month drill-down        | Detailed view of one month                             |
| Action editor           | Modal (create) / slide-in (edit) for any action        |
| Goal editor             | Modal (create) / slide-in (edit) for any goal          |
| Ritual editor           | Modal (create) / slide-in (edit) for any ritual        |
| Idea editor             | Modal (create) / slide-in (edit) for any idea          |
| Plan today flow         | Full-page two-step wizard on /today (replaces State A) |
| Close day recap         | Full-page recap on /today (State C)                    |
| Command Palette         | Global search and commands (⌘K)                        |
| Settings                | Configure account, data, demo controls                 |
| Subscription page       | Manage plan (/settings/subscription)                   |
| Admin components        | Dev visual smoke test (/admin/components)              |
| Landing                 | Public landing page (/)                                |
| Manifesto               | Founder essay (/manifesto)                             |
| Pricing                 | Pricing cards + refund + FAQ (/pricing)                |
| Auth                    | Combined sign in / sign up (/auth, /auth#signup)       |
| Auth verify             | 6-digit code prompt after signup (/auth/verify)        |
| Auth reset              | Forgot password (/auth/reset)                          |
| Admin: manifesto editor | Founder WYSIWYG editor for manifesto (/admin/manifesto) |

(No Project editor — Projects use page-based creation/editing. No Plan today modal, Close day modal, or Combined modal — these are full-page in-place takeovers of /today, not modal dialogs.)

---

## Flow 1: First-time experience (Setup Wizard + branch)

**Trigger:** user creates account.

**Goal:** user lands in a working state — either with sample data to explore or with their own first goal in place.

### Stage A — Setup Wizard (3 ceremonial screens)

Always runs once on first sign-in. Tracked via `actos.setup.completed: true` in LocalStorage. No skip option (under 60 seconds).

1. **Welcome** — "Welcome, {firstName}." + "Let's set this up." + Continue. Logo, no decoration.
2. **Theme** — three tiles (System / Light / Dark) with SVG mini-mockups in real product tokens. Dark pre-selected by default. Hover transitions the whole wizard theme live. Continue enabled from start.
3. **Getting started** — choose between "Show me how it works" (sample data) or "Set up my own goal" (goal-builder).
4. **Setup pause** — 1.2s progress-line animation, then redirect.

The wizard is full-screen, ceremonial, deliberately different from the rest of the product. See `08-DESIGN-DECISIONS.md` → Onboarding.

### Stage B — Branch outcomes

**"Show me how it works":**
- Workspace seeded with sample data (3 goals, 9 projects, 68 actions, 4 rituals, 5 ideas, 60 day entries — all flagged `isSample: true`).
- Coachmark dismissals pre-set so first-encounter callouts don't fire on top of sample data.
- Redirect to `/today`. Persistent banner at top: "You're exploring a sample workspace. [Clear and start fresh →]".
- User explores. Once they click Clear and confirm, sample data deleted → app enters no-goals mode → goal-builder takes over.

**"Set up my own goal":**
- Redirect to goal-builder (full-page, 4 steps). Same UI as no-goals mode invocation.

### Stage C — Goal-builder (4 steps)

The same flow regardless of entry point. Step counter "STEP N OF 4".

1. **Goal** — title (required) + color + "+ Examples" expandable showing 5 canonical goal examples. Single description paragraph. NO Skip button when goals = 0 (required to exit no-goals mode).
2. **Success Criteria** — 0–5 concrete signs of done. Empty state with "+ Add criterion" link. Skippable via "Skip — add later".
3. **Project** — title (required) + textarea description ("What's this project about? Optional.") with hint "Detailed editor with images, links, and references is available on the project page." Skippable.
4. **Actions** — pre-rendered 2 action rows with concrete placeholders (e.g. "Read Stripe API docs"). Inline explainer block above the form explaining IMPACT and TIME fields. "+ Add another" up to N. Add actions / Skip.

**Stage D — Land on /today** with planned day (or unplanned, depending on what was added).

---

## Flow 2: A normal day

User opens app → /today.

Lands in State A (or B/C depending on day state). NO modal auto-opens. User explicitly clicks "Start your day →" when ready to plan.

If yesterday wasn't closed, midnight rollover already auto-closed it (DayEntry.isClosed=true with closedAt=previous 23:59:59). Today opens fresh.

Throughout day: mark done via checkbox, add new actions via inline-add or ⌘K.

End of day: click "Close day" → State C recap (or auto-trigger at midnight).

---

## Flow 3: Planning the day in detail

**Trigger:** click "Start your day →" on Today State A.

/today swaps to Plan today flow (full-page in-place takeover, sidebar stays visible). NOT a modal.

**Step 1 — Day Type selection** (full-page centered composition):
- Heading "What kind of day is it?" (Inter 24-28px medium primary text).
- Sub-line "Pick one to start planning."
- 4 large colored cards (~140px min-height each):
  - Execution (var(--state-active) green, lucide Zap, "Full work day — normal expectations.")
  - Recovery (var(--goal-3) purple, lucide Leaf, "Light day, intentional rest.")
  - Day Off (var(--state-stalled) gray, lucide Sun, "No work, fully off.")
  - Sick (var(--status-dropped) amber-red, lucide Thermometer, "Illness — expectations suspended.")
- Click auto-advances:
  - Execution / Recovery → step 2.
  - Day Off / Sick → DayEntry committed silently (isPlanned=true, dayType set, no plannedActionIds, no plannedRitualIds), navigate to Today State B.
- 2x2 grid on mobile.
- NO "Continue" button.

**Step 2 — Plan details** (Execution / Recovery only):

Compact Day Type dropdown at top (allows changing without leaving step 2).

Sections vertically with 32px gap:

1. **ACTIONS · {N selected}** with heading sub-line "Pick what you'll work on today." (Inter 18-20px medium primary).
   - Two-pane ActionPicker (Available 60% + Selected 40% on desktop, stacked on mobile).
   - Available pane: filter dropdowns (custom, NOT native selects) → ALREADY SCHEDULED sub-section → action list (48px rows with ImpactPill + TimePill on right) → inline-add at bottom.
   - Selected pane: numbered drag-reorderable rows with TimePill + × remove + "Estimated time: {sum}" aggregate.
   - NO Quick Start preset cards (Heavy Lift / Quick Moves removed in earlier iteration).

2. **MAIN TASK** with heading sub-line "What single thing makes today a win?" (Inter 18-20px).
   - Optional dropdown "Pick from selected actions ▾". Can be skipped.

3. **RITUALS TODAY · {N}** with heading sub-line "Mark anything you want to skip." (Inter 18-20px).
   - Each row: title + meta + MultiplierPill + TimePill + Skip toggle.

Footer: "Cancel" link (Tier C left) + "Start day" button (Tier A right). NOT "Plan day".

Validation: NO required minimum — submit can be clicked even with 0 selected actions.

Submit ("Start day") → DayEntry committed, /today swaps to State B. Toast "Day started."

**Today page State B layout (planned)**:
- Page header.
- Day Type indicator with icon (subtle).
- TODAY zone:
  - Main Task card (rich, var(--accent) border, Star icon).
  - TODAY'S ACTIONS list with prominent goal-tinted Impact pills.
  - "+ Add action..." inline-add.
  - TODAY'S RITUALS list (with MultiplierPill + Skip/Restore toggle).
  - Close day button.
- LOOKING BACK section below.

**Evening:** click "Close day" → Today swaps to State C (full-page recap).

**State C — Close day recap layout**:
- Page header: "Day closed" (Inter 32-36px) + date + DayTypeIndicator + conditional greeting "Solid work today." (only when total focused time ≥ 2 hours).
- 1px var(--border-subtle) divider.
- Stat tiles: VALUE ADDED / ACTIONS DONE / RITUALS DONE / SESSIONS (conditional, only when ≥1 session today) / TIME INVESTED.
- Conditional sections: PROJECTS / GOALS / ACTIONS DONE / RITUALS (Done/Skipped/Missed).
- NO REFLECTION section — reflection field has been removed from the model.
- Footer: "Re-open day" link left (Tier 1 confirmation) + "View in Days →" link right → /reviews/days/{today's-date}. NO submit button.

**Auto-close at midnight:** browser detects local date rollover → DayEntry.isClosed=true, closedAt=previous 23:59:59. Missed rituals marked. No notification.

**State A (not planned)**:
- TODAY zone shows single CTA card: "What are you doing today?" + "Start your day →" button.
- If pre-scheduled actions exist: sub-line "{N} actions already scheduled for today".
- LOOKING BACK section below.

---

## Flow 4: REMOVED — Combined Close yesterday + Plan today

This flow has been REMOVED. With auto-open Plan today removed and Close day as full-page state, user navigates between Today states naturally:
- Yesterday wasn't closed → midnight rollover auto-closes it (DayEntry.isClosed=true, closedAt=23:59:59 previous day, missed rituals marked).
- User opens app today → /today is in State A (fresh, unplanned).
- Yesterday's recap accessible via Looking Back card or /reviews/days drill-down.

---

## Flow 5: Adding an action

**Triggers (CREATE mode → centered modal 640px):**
- "+ New action" header button on /actions or "+ Delegate" on /delegated: opens Action editor as modal.
- ⌘K → Create new action: opens modal.
- "+ Add action to this day" in Reviews drill-down: opens modal with retroactive defaults.
- Convert idea to action: opens modal pre-filled.
- "+ Quick add new action..." inline-add inside Plan today step 2 Available pane: creates action without opening editor (auto-selected to today's plan).

**Triggers (EDIT mode → slide-in 480px):**
- Click any existing action row in lists.

**Triggers (inline commit, no editor):**
- Inline-add input (Today's Actions, Project page actions list): type title, press Enter → action created with status=Backlog (or Planned with scheduledDate=today on Today zone), no editor opens.

**Field order in editor (top to bottom):**
1. Title
2. STATE: Status dropdown + timestamp line + scheduled date picker (when Planned) + delegation block (when Delegated)
3. PARENT: Goal → Project picker
4. ESTIMATES: Impact (required, 1-10), Time (required for Done transition, 1-600 min)
5. NOTES

**Validation:**
- Create button disabled until title + Impact + parent set.
- Status transition to Done requires Impact + Time.
- Discard guard on close if any field filled (create modal).

**Bidirectional mark done:**
- Click checkbox on any action in functional list views (Today, /actions, Project page, Main Task card): toggles status. Active → Done (with validation), Done → Planned (re-opens, action stays on today, all metrics revert).
- Reviews drill-downs preserve click-to-edit pattern (no toggle in archival views).

---

## Flow 6: Capturing and converting an idea

**Capture:** click "+ New idea" header button on /ideas → opens Idea creation modal (640px desktop / bottom sheet mobile). Fill title (required) + goal (defaults to primary or first active) + optional note → click Create. Idea is created with status=captured.

**Capture via Command Palette:** ⌘K → "Capture idea" command opens the same Idea creation modal.

**Edit:** click idea row on /ideas → Idea editor opens as slide-in panel (480px desktop / bottom sheet mobile). Edit title, note, parent goal, references, attachments. Autosave on blur.

**Convert to Action:** open idea (slide-in), click "Convert to action" → Action create modal opens pre-filled (title, note, goal). Pick parent project. Save → action created, idea status → converted_to_action.

**Convert to Project:** open idea, click "Convert to project" → navigate to /projects/{newId} with description and title pre-filled (page-based creation flow). Save → project created under idea's goal, idea status → converted_to_project.

**Discard:** click "Discard" → Tier 1 confirmation → idea status → discarded.

**Restore:** open a discarded idea → click "Restore" → idea status → captured (no confirmation).

---

## Flow 7: Project growth surfaces

**Trigger:** project age > 30 days OR action count grew significantly.

Project page shows non-blocking banner: "This project has grown — 12 actions over 30 days. Want to split or close-and-continue?"

Options: Split / Close-and-continue / Keep as is.

---

## Flow 8: Delegating an action

**From scratch:** click "+ Delegate" on /delegated → opens Action editor modal pre-filled with Delegated status. Fill title + delegate name + parent → save.

**From existing action:** open Action editor → change status to Delegated → Delegation block appears.

Delegation block: Delegate name (required, autocomplete from previous delegates), Expected return date (optional), Note (optional).

When delegate name filled → status = Delegated, delegatedAt = now.

Action moves to Delegated state. Value registers full Impact, Effort registers 20%, Time Invested registers 20% of Time. Appears in /delegated Active tab.

**On /delegated page:**
- Aggregate counts row: ACTIVE / OVERDUE / DUE TODAY (color-coded when > 0).
- Tabs: Active (default) / Returned (history of delegations now Done).
- Filters: DELEGATE / GOAL / DATE RANGE.
- Each row: title + meta "→ {delegate} · {parent}" + color-coded return date pill (overdue var(--text-warning), due today var(--accent), on track var(--text-tertiary)) + Impact pill.
- Date pill shows relative context ("return 2026-04-30 · 7d ago" / "return today" / "return in 3d · 2026-05-10"). Tooltip on hover for clean context.
- Click row → Action editor (delegated context).

**When delegate returns work:** user marks Done → action transitions to Done, removed from Active tab, appears in Returned tab. Reflects in goal/project progress at full Impact.

---

## Flow 9: Overdue actions

**Trigger:** Action with status=Planned, scheduledDate < today, not Done.

UI: visual indicator (soft red dot) + inline options: Move (date picker) / Cancel.

System never auto-reschedules.

---

## Flow 10: Reviewing past days

**Entry points:**
- /reviews/days from sidebar
- "View full review →" link on Looking Back card on Today (most recent active day)
- ⌘K → Days search

**On /reviews/days:** list sorted descending, filters (Day Type / Goal / Date Range), click → drill-down.

**Drill-down sections (top to bottom):** Accomplishments (stat tiles) → Goals Closed → Projects Closed → Value Added (per-goal breakdown) → Time Invested (per-project nested under goals; includes 20% delegated) → Sessions (chronological) → Main Task → Actions (sub-groups: Done / Delegated / Dropped / Cancelled / Not completed) → Rituals (Done/Skipped/Missed). REFLECTION section REMOVED — reflection field removed from model.

Click action row → Action editor (retroactive edit).

"+ Add action to this day" → Action editor with retroactive add defaults.

---

## Flow 11: Reviewing past weeks and months

**Entry points:**
- /reviews/weeks or /reviews/months from sidebar
- ⌘K → Weeks / Months search

**On list pages:** sorted descending, filters (Date Range / Goal). Each row: title + day type distribution + stats summary (with Value, Sessions, Time) + per-goal effort. Click → drill-down.

**Week drill-down (/reviews/weeks/{yearWeek}):**

ISO 8601 week format (e.g., 2026-W19).

Sections (in order):
1. Accomplishments (stat tiles with comparisons to previous week)
2. Goals Closed (conditional)
3. Projects Closed (conditional)
4. Value Added (per-goal with %)
5. Time Invested (per-goal with per-project nesting)
6. Sessions (aggregate stats + grouped by day)
7. Days (7 day rows, click → Day drill-down)
8. Top Contributing Actions
9. Rituals (per-ritual week consistency)

(REFLECTIONS section REMOVED — reflection field removed from model.)

**Month drill-down (/reviews/months/{yearMonth}):**

ISO format YYYY-MM (e.g., 2026-05).

Sections (in order):
1. Accomplishments (with comparisons to previous month)
2. Goals Closed (conditional)
3. Projects Closed (conditional)
4. Value Added (per-goal)
5. Time Invested (per-goal with per-project nesting)
6. Sessions (aggregate + per-week breakdown)
7. Weeks (PRIMARY navigation pivot — list of weeks intersecting month)
8. Top Contributing Actions
9. Rituals (per-ritual month consistency)

(REFLECTIONS section REMOVED — reflection field removed from model.)

---

## Flow 12: Running a focus session

**Entry:** /sessions → "+ Start a session" button.

**Builder (/sessions/new):**
1. Pick mode: Pomodoro / Continuous / Custom.
2. Configure duration: total session time + breaks toggle + frequency.
3. Pick actions: filter by Goal/Project, add to selected list, drag-reorder.
4. Click "Start session" → /sessions/active.

**Active session (/sessions/active):**
- Big timer counts down.
- Current action card shows first planned action.
- Mark done / Drop buttons commit through normal store actions (full transitions).
- Pause / Skip break / Restart cycle / Abort controls.
- Audio + visual flash on cycle end. Explicit "Continue" between work and break.
- If all actions done before timer ends: empty state with "+ Add action" / "End session" buttons inside card.
- Navigation away triggers guard modal: Cancel / Continue (banner appears on other pages) / End session.

**Session end:**
- Final cycle complete OR user clicks End session OR Abort.
- Auto-navigate to /sessions/{id}/summary.
- Summary shows: accomplishments tiles, actions list with status pills, time breakdown.
- "Done" → /today. "View on /sessions" → /sessions list.

**History:**
- /sessions list shows all past sessions sorted descending.
- Click session row → detail panel (slide-in).
- Sessions also visible in Day/Week/Month drill-downs and on Project/Goal pages.

---

## Flow 13: Using Command Palette

**Trigger:** ⌘K OR click "Search" in sidebar.

**Default state (empty):** Recently Viewed (last 5) / Quick Actions / Navigation.

**Typing state:** live-filtered grouped results — Goals / Projects / Actions / Rituals / Ideas / Days / Commands / Navigation.

Up/Down navigate, Enter execute, Esc close.

---

## Flow 14: Creating a goal

**Trigger:** "+ New goal" button on /goals OR "+ Add goal" placeholder on Progress hero.

Goal editor opens as slide-in. Fields: Title, Type, Description, Success Criteria (max 5), Target date.

**Constraint:** if 3 active goals exist, button disabled with tooltip.

Save → goal created, color auto-assigned.

---

## Flow 15: Creating a project

**Trigger:** "+ New project" affordance on /projects OR "+ Add project" on Goal page OR ⌘K.

Page-based creation (NOT slide-in):

1. New project UUID generated immediately, draft created (isDraft=true).
2. Navigate to /projects/{newId}.
3. Page loads with empty fields, title field auto-focused.
4. Title placeholder "Untitled project".
5. Description shows empty state.
6. Actions list shows empty state with inline-add.
7. References section visible with empty state.

**Promotion to real:** title entered, action added, reference added, OR description content added → isDraft=false, project appears in lists, toast.

**Abandoning draft:**
- Empty draft, navigate away → silent delete, no toast.
- Draft with content but no title, navigate away → soft prompt "Save 'Untitled project'?" with Save / Discard / Cancel.

**Contextual goal default:**
- From Goal page: pre-set to that goal.
- From /projects or ⌘K: default to primary active goal.

**Inline editing on Project page:**
- Title: click → edit inline.
- Goal: click badge → dropdown of active goals.
- Status: click → toggle (Active/Completed/Dropped) with Tier 1 confirmation for destructive.
- Description: rich-text Read/Edit modes.
- References: structured list.
- Actions: inline-add and click-to-edit.

All edits autosave.

No slide-in editor for Projects. Quick metadata edits via inline UI on the Project page.

---

## Flow 16: Marking a ritual instance done or skipped

**During Plan today step 2:** each scheduled ritual shown with single Skip toggle (no Keep button — default is "happens today"). Click Skip → ritual faded with "Restore" button. Click Restore → unfaded.

**On Today zone (State B):**
- Click checkbox → ritual instance Done, multiplier recomputed.
- Click "Skip" → ritual instance Skipped, faded; click "Restore" to undo.

**Missed:** day passes without Done or Skipped → instance auto-marked Missed.

Missed and Skipped don't affect multiplier (only Done increments).

---

## Flow 17: Status timestamp click → drill-down

**Trigger:** in Action editor, user clicks the date portion of a status timestamp line.

Examples:
- "Completed today" → clickable "today"
- "Completed May 3 (3 days ago)" → clickable "May 3"
- "Delegated to Maria · 2 days ago" → clickable "2 days ago"
- "Dropped on May 3" → clickable "May 3"

**Behavior:**
- Click → editor panel closes.
- Navigate to /reviews/days/{yyyy-mm-dd}.
- Drill-down opens with the action visible in appropriate sub-group (Done / Delegated / Dropped / Cancelled).
- Browser back returns to previous page (with editor closed).

---

## Flow 18: First visit to public site (logged out)

1. User lands on `/` from any source (direct, referral, ad, search).
2. Hero is visible above the fold: headline `Stop scheduling. / Start moving.` + sub-line + orange CTA `Open ActOS`.
3. Product demo below hero loops a Today page mockup (or static screenshot if MP4 not loaded).
4. Scroll hint chevron pulses at bottom.
5. User can:
   - Click orange CTA → `/auth#signup` (signup mode).
   - Click top-right `Sign in` → `/auth` (signin mode).
   - Click `Manifesto` in nav → `/manifesto`.
   - Click `Pricing` in nav → `/pricing`.
   - Scroll to FAQ section, expand questions, or click `Why tasks and issues stop you moving toward goals.` → `/manifesto`.
   - Switch language in footer dropdown — all 4 locales available, persists to LocalStorage.

## Flow 19: Sign up (new user)

1. User clicks `Open ActOS` on landing → arrives at `/auth#signup`. URL hash forces sign up mode.
2. Sees heading `Let's get you set up.`, Name + Email + Password fields, Google + Apple buttons, terms note, toggle to sign in at bottom.
3. Fills form, clicks `Create account`. Button enters loading state.
4. 400ms simulated delay. LocalStorage `actos.auth.pendingSignup` set with name, email, password (mock), code (6-digit), 10-min expiry, 5 attempts remaining.
5. Dev mode shows toast `[DEV] Code: 123456`. Console logs same.
6. Navigate (replace history) to `/auth/verify`.
7. User sees heading `Check your email.` + sub-line with their email + 6 single-character inputs.
8. User types 6 digits (auto-advance focus, paste-aware). On 6th digit, auto-submit.
9. Correct code: create `actos.auth.user` with `emailVerified: true`. Clear pending. Navigate (replace) to `/setup`.
10. Wrong code: decrement attempts, show inline error `Incorrect code. N attempts remaining.`, clear inputs, focus first.
11. After 5 wrong: `Too many attempts. Request a new code.` — Verify button disabled, Resend available.
12. Code expired (>10 min): `Code expired. Resend a new one.` Resend enabled.
13. Resend has 30-second cooldown. Click → generates new code, restarts cooldown.
14. User can `Change email` link → returns to `/auth#signup`, pending cleared.
15. User can close tab — pending state persists. Next visit to `/`, `/auth` → redirects to `/auth/verify` to resume.
16. Stale pending (>24h) auto-cleared on next visit.
17. After redirect to `/setup`, setup wizard runs as normal. User's name pre-filled from auth state.

## Flow 20: Sign in (returning user)

1. User clicks top-right `Sign in` on landing → arrives at `/auth` (signin mode default).
2. Sees heading `Welcome back.`, Email + Password fields, Forgot password link, Google + Apple buttons, toggle to sign up.
3. Fills email + password, clicks `Sign in`. Button enters loading state.
4. 300-400ms simulated delay.
5. Mock: any valid email+password creates/restores `actos.auth.user` with `emailVerified: true` (returning users assumed verified).
6. Navigate (replace history) to `next` query param if present, otherwise `/today`.
7. No verification step. No setup wizard.

Forgot password sub-flow:
- Click `Forgot password?` → `/auth/reset`. Single Email field + `Send reset link` button.
- Submit: show in-card success state — `If that email is registered, we've sent a reset link.` (Privacy pattern — don't reveal whether email exists.)
- Mock: any valid email triggers success. No actual email sent.
- Back link returns to `/auth`.

## Flow 21: Edit manifesto via admin (founder only)

1. Founder toggles `isAdmin: true` via Settings → Account → `[Toggle admin (debug)]` button.
2. Navigate to `/admin/manifesto` directly (no nav link — direct URL only).
3. Editor loads. First-time per locale: imports current content from i18n keys into TipTap document. Subsequent: loads from `actos.cms.manifesto.{locale}` LocalStorage.
4. Top: sticky header with logo + Cancel + Save.
5. Below: tabs row `[EN] [RU] [DE] [ES]` + last-saved timestamp.
6. Below: split view. Left: TipTap WYSIWYG editor (matches public manifesto typography). Right: live preview of the rendered article.
7. Founder edits paragraphs, headings, blockquote, list items. Toolbar provides Bold/Italic/H1/H2/quote/list/hr/link.
8. Click Save → writes current locale's content to `actos.cms.manifesto.{locale}` in LocalStorage. Timestamp updates. Button disables (clean state).
9. Switch tabs with unsaved changes → confirm dialog.
10. Public `/manifesto` page reads from LocalStorage first (if entry exists), falls back to i18n keys.
11. Mobile: shows "desktop-only" message.

---

## Visual hierarchy principles

1. **Today is the operational focus.** Clean, minimal, day-at-hand.
2. **Progress is the strategic overview.** Hero, Active Projects, Time Investment.
3. **Goals are the ambition layer.** Always accessible.
4. **Action over abstraction.** Concrete next actions are foreground.
5. **Sober, not festive.** No confetti, no celebration animations.
6. **Empty states teach.** Short factual prompts with examples.
7. **Optional features are visible when off.** Inline "+ enable tracking" hints.
8. **Surfaces, not pop-ups.** Inline guidance, never modal interruptions.
9. **Heavyweight entities (Goals, Projects) navigate to full pages.** Lightweight (Actions, Rituals) open in slide-in panels. Projects: page-based even for creation.

---

## Key user actions (mental model)

- **Plan today** — daily morning, auto-opens on first Today load.
- **Close day** — daily evening when user clicks Close day.
- **Set a goal** — rare, deliberate.
- **Open a project** — a few times per week.
- **Add an action** — daily, multiple times.
- **Mark done / delegated / dropped / cancelled** — daily, multiple times.
- **Mark a ritual done or skipped** — daily.
- **Capture an idea** — frequent, low-friction.
- **Convert an idea** — occasional, deliberate.
- **Search/navigate via ⌘K** — frequent for power users.
- **Review the day** — occasional, looking back over what got done.
- **Review the week** — periodic, for trends.
- **Click status timestamp** — to navigate from Action to its drill-down day.
- **Split or close-and-continue a project** — occasional, prompted by growth signal.
