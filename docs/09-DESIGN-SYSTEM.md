# ActOS — Design System

> **Document role:** complete visual specification — design tokens, components, patterns. Source of truth for all UI implementation.
> **Read alongside:** `08-DESIGN-DECISIONS.md` (which decisions led to these specs), `07-SCREENS-INVENTORY.md` (which components appear on which screens).

---

## 1 — Foundation

### 1.1 Design philosophy

**Direction**: Workshop. Dense, precise, professional workspace. Reference points: Obsidian, Linear, Plane.so, Notion, ClickUp. Available in two themes — **dark** (default) and **light** — driven by token swap; visual character preserved across both.

**Principles**:
- Hairlines and selective surface tone shifts, not box-shadows. Applies to both themes.
- Density is intentional — workspace, not editorial.
- Typography is functional — no display fonts, no decorative text treatments.
- Color is muted — accent used sparingly for emphasis and interaction.
- Tone is sober — no celebrations, badges, motivational copy, or emoji.
- The same product in a bright room — light theme is a parallel token set, NOT a different aesthetic.

### 1.2 Color tokens

All colors as CSS variables. Use these everywhere; never hardcode hex values. Tokens defined in two parallel sets: `[data-theme="dark"]` (and `:root` as alias) and `[data-theme="light"]`. Both sets define identical variable names — no extras, no omissions.

#### Dark theme (default)

**Surfaces**:
- `--surface-base` — `#0F0F12` — page background.
- `--surface-raised` — `#16161A` — cards, panels, modals.
- `--surface-hover` — `#1C1C22` — hover states, active row backgrounds.
- `--surface-elevated` — `#1A1A20` — popovers, dropdowns, tooltips, modals.

**Text**:
- `--text-primary` — `#E8E8EA` — main body text, titles.
- `--text-secondary` — `#9A9AA0` — secondary content (breadcrumbs, metadata).
- `--text-tertiary` — `#5A5A60` — supplementary labels, timestamps, hints.

**Borders**:
- `--border-subtle` — `#222228` — hairline dividers, default card borders.
- `--border-default` — `#2A2A32` — input borders, focus rings.

**Accent**:
- `--accent` — `#4A6AFF` — primary action color, focus rings, active states, links. **Same value in both themes** — anchor color of the product.

**Goal colors**:
- `--goal-1` — `#4A8AAA` — teal.
- `--goal-2` — `#D4884A` — orange.
- `--goal-3` — `#9A7AAA` — purple.

**State indicators**:
- `--state-active` — `#6B9A5A` — green, "active" state dot.
- `--state-stalled` — `#9A9AA0` — grey, "stalled" state dot (matches text-secondary).

**Status colors**:
- `--status-done` — `#6B9A5A` — done check, completed marker.
- `--status-delegated` — `#7A8090` — delegated arrow.
- `--status-dropped` — `#A07060` — dropped warning tint.
- `--status-cancelled` — same as dropped.
- `--text-warning` — `#C49A60` — muted amber for overdue indicators, "OVERDUE" badges.

**Backdrop**:
- `--backdrop` — `rgba(0, 0, 0, 0.5)` — modal backdrop overlay.

#### Light theme

Cool gray, hairline-driven. Reference points: macOS Light, Linear Light. NOT warm off-white, NOT pure white.

**Surfaces**:
- `--surface-base` — `#FAFAFB` — page background.
- `--surface-raised` — `#FFFFFF` — cards, panels, modals.
- `--surface-hover` — `#F1F2F4` — hover states, active row backgrounds.
- `--surface-elevated` — `#FFFFFF` — popovers, dropdowns, tooltips.

**Text**:
- `--text-primary` — `#1A1A1F`.
- `--text-secondary` — `#5A5A63`.
- `--text-tertiary` — `#8A8A93`.

**Borders** (slightly darker than `--surface-hover` so hairlines read against page):
- `--border-subtle` — `#E6E7EA`.
- `--border-default` — `#D4D6DB`.

**Accent**:
- `--accent` — `#4A6AFF` — unchanged, deep electric blue still works on white.

**Goal colors** (same hue family as dark, lower luminance for contrast on white):
- `--goal-1` — `#3A7090` — teal.
- `--goal-2` — `#B86F30` — orange.
- `--goal-3` — `#7A5A8E` — purple.

**State indicators**:
- `--state-active` — `#4F8244` — green dot.
- `--state-stalled` — `#8A8A93` — matches text-tertiary.

**Status colors**:
- `--status-done` — `#4F8244`.
- `--status-delegated` — `#5C6573`.
- `--status-dropped` — `#8A4A38`.
- `--status-cancelled` — same as dropped.
- `--text-warning` — `#A06A2C` — muted amber.

**Backdrop**:
- `--backdrop` — `rgba(20, 22, 28, 0.35)` — lighter than dark theme; pure black at 0.5 reads too heavy on a light page.

#### Theme application

- Theme is applied by setting `document.documentElement.dataset.theme` to `'light'` or `'dark'`.
- Inline script in `<head>` resolves the theme before paint to avoid flash on reload — reads `actos.theme` from LocalStorage, resolves `'system'` against `prefers-color-scheme`, sets the attribute synchronously before CSS loads.
- Components NEVER target `[data-theme="light"]` or `[data-theme="dark"]` directly. Components use tokens; tokens are themed.
- Sonner toaster `theme` prop is wired to the active theme so toast variants render correctly in both modes.

### 1.3 Typography

**Font families**:
- **Inter** — UI body and titles. Weights used: 400 (regular), 500 (medium).
- **JetBrains Mono** — numbers, metadata, code, timestamps. Weight 400 always.
- Both fonts use **tabular figures** (`font-variant-numeric: tabular-nums`) for numeric content.

**Sizes** (in pixels):

| Size | Use |
|------|-----|
| 32-36px | Page titles (Goal page, Project page, Today date) |
| 24-28px | Section titles, page-level headers (`Inter 24px medium`) |
| 18-20px | Sub-headings, modal titles, goal card titles |
| 16-18px | Card titles, action row titles (`Inter 15-16px medium`) |
| 14-15px | Body text, action row titles in lists |
| 13-14px | UI controls (buttons, inputs, dropdowns) |
| 12-13px | Metadata, breadcrumbs, secondary text |
| 11-12px | Mono labels (uppercase), counts, time values |
| 10-11px | Section headings (mono uppercase) |
| 9-10px | Tiny pills, badges |

**Letter spacing**:
- Body text: default (0).
- Mono uppercase labels: `letter-spacing: 0.06em` to `0.08em` depending on size (smaller = wider tracking).
- Headings: default.

**Line height**:
- Body: 1.5-1.6.
- Headings: 1.2-1.3.
- Mono labels: 1.

### 1.4 Spacing

Spacing scale based on multiples of 4px:

| Token | Pixels | Use |
|-------|--------|-----|
| `xs` | 4px | Inline gap between tightly-related elements |
| `sm` | 8px | Default small gap, label-to-content |
| `md` | 12px | Group internal padding |
| `base` | 16px | Standard spacing between elements |
| `lg` | 24px | Section padding, card internal padding |
| `xl` | 32px | Section separation |
| `2xl` | 40px | Major page section breaks |

### 1.5 Borders, radii, shadows

**Border widths**:
- 1px — default for all borders, dividers.
- 2px — focus rings, active state indicators (left border on rows, etc.).
- 3px — goal color stripes on cards and rows.

**Border radii**:
- 2px — small pills, badges, small bars.
- 4px — buttons, inputs, dropdowns, default UI elements.
- 6px — cards, modals, larger surfaces.

**Shadows**: NONE. We use surface tone shifts and hairlines instead.

### 1.6 Iconography

**No icon library** in v1 — use Unicode characters for semantic markers:
- `✓` — checkmark, done.
- `→` — delegation, navigation arrow.
- `●` — dot, state indicator, color marker.
- `▾` — dropdown arrow.
- `└` — nested item indicator.
- `⌕` — magnifying glass (search).
- `⌘` — Mac command symbol.
- `+` — create / add.
- `×` — close / dismiss.
- `↗` — external link (references).

If specific icons are needed (image upload, file attach), use a minimal set (e.g., Lucide icons, sized at 14-16px in `--text-secondary` color).

### 1.7 Z-index hierarchy

Layered UI elements use a fixed z-index scale to ensure correct stacking. When implementing new overlay components, place them in the appropriate tier — never use ad-hoc z-index values like `z-[99]` or `z-[9999]`.

| Layer | Z-index | Used by |
|-------|---------|---------|
| Base content | 0–10 | Sidebar, page content, cards |
| Sticky elements | 20–30 | Sticky headers, sticky filter rows |
| Slide-in panels (Sheet) | 90 | Action editor, Goal editor, Ritual editor (panel chrome) |
| Popovers/dropdowns inside panels | 100 | Status dropdown inside Action editor, date pickers, parent selectors |
| Tooltips | 150 | Hover tooltips on sparklines, indicators, etc. |
| Modals | 200 | Confirmation modals (Tier 1, Tier 2), entity create modals (Action / Goal / Ritual / Idea), Sign out confirmation, demo "Pro coming soon" modal |
| Command Palette | 250 | ⌘K palette |
| Toasts | 300 | Sonner toast notifications |

**Critical rule**: dropdowns/popovers triggered from inside a slide-in panel MUST have higher z-index than the panel itself, otherwise they render below and appear invisible. Use `z-100` for in-panel dropdowns.

When fixing a "dropdown doesn't open" or "popover invisible" bug, check the z-index relative to its container first — most often the issue is layering, not click handlers.

---

## 2 — Layout architecture

### 2.1 Sidebar

**Widths**:
- Expanded: 220px.
- Collapsed: 64px (icon-only mode).

**Layout**:
- `var(--surface-raised)` background.
- 1px right border `var(--border-subtle)`.
- Padding: 16px (expanded) / 12px (collapsed).
- Smooth 200ms transition on width change.

**Structure** (top to bottom):
1. **Header row**: "ActOS" logo (Inter 16px medium) + collapse toggle button on right (lucide PanelLeftClose / PanelLeftOpen, 16px var(--text-tertiary), hover bg surface-hover, 4px radius). In collapsed mode: logo truncates to "A" mark.
2. **Group 1 — Search**: Search nav item (lucide Search icon) with ⌘K pill on right (JetBrains Mono 11px var(--text-secondary), surface-elevated bg, 1px border-subtle, padding 2px 6px, radius 3px). In collapsed mode: pill hidden.
3. **Divider**: 1px `var(--border-subtle)`, 16px vertical margin.
4. **Group 2 — Execution**: Today (Sun) / Progress (TrendingUp) / Actions (CheckSquare) / Delegated (Send) / Rituals (Repeat).
5. **Divider**.
6. **Group 3 — Strategy & Capture**: Goals (Target) / Projects (FolderOpen) / Ideas (Lightbulb) / Sessions (Timer).
7. **Divider**.
8. **Group 4 — Reviews** (FLAT, not collapsible):
   - "REVIEWS" section header (mono 11px uppercase letter-spacing 0.06em var(--text-tertiary), padding 8px 12px). Not clickable. Hidden in collapsed mode.
   - Days (CalendarDays) / Weeks (CalendarRange) / Months (Calendar) — top-level nav items, NOT indented.
9. **Spacer** (flex-grow).
10. **Bottom area** (in this order):
    - Lifetime counters: "X projects closed · Y actions done" (mono 11px var(--text-tertiary)). Hidden in collapsed mode.
    - 8px gap + 1px var(--border-subtle) divider + 8px gap.
    - Bottom row (flex, justify-between, padding 8px 12px):
      - Left: SidebarUserTrigger (see § 3.32) — clickable user identity (avatar + name + email). Opens UserMenuPopover (§ 3.31) with Settings, Subscription, Admin (conditional), Sign out.
      - Right: "?" Shortcuts icon button (32x32, lucide HelpCircle, opens Shortcuts modal). Hidden in collapsed sidebar mode.

**Nav item style** (expanded):
- Padding: 8px 12px.
- Display: flex align-center, gap 12px.
- Icon left: 16px var(--text-secondary), var(--text-primary) on hover/active.
- Label right: Inter 14px medium var(--text-secondary) (default), var(--text-primary) (hover, active).
- Active route: 2px left border `var(--accent)`, `var(--surface-hover)` background.
- Hover: `var(--surface-hover)` background.

**Nav item style** (collapsed):
- Only icon, centered horizontally.
- Padding: 12px (40x40 tap target).
- Hover: tooltip with label appears to the right (250ms delay, using existing Tooltip component).
- Active route: 2px left border accent + surface-hover bg.

**Collapse persistence**:
- Stored in LocalStorage as `sidebarCollapsed: boolean`. Default: false (expanded).
- Cmd+\ keyboard shortcut also toggles.
- **Auto-collapse on first load** when viewport width < 1100px AND `sidebarCollapsed` is undefined in LocalStorage. After auto-collapse, treated as user-set value (persists). User can toggle freely after.

**Icon mapping (lucide)**:
| Item | Icon |
|------|------|
| Search | Search |
| Today | Sun |
| Progress | TrendingUp |
| Actions | CheckSquare |
| Delegated | Send |
| Rituals | Repeat |
| Goals | Target |
| Projects | FolderOpen |
| Ideas | Lightbulb |
| Sessions | Timer |
| Days | CalendarDays |
| Weeks | CalendarRange |
| Months | Calendar |
| Settings | Settings |

**Mobile (<= 768px)**: drawer-style. Hamburger button in top-left opens sidebar as overlay (always full expanded width when open). Collapse toggle hidden on mobile.

### 2.2 Main content area

**Margin-left**: 220px (sidebar expanded) / 64px (sidebar collapsed). Smooth 200ms transition.

**Page width tiers** — every content page declares ONE of three tiers (max-width of main content column, centered):

- **Narrow (720px)**: Settings, Auth pages, 404.
- **Medium (1024px)**: Today, /actions, /delegated, /goals, /projects, /rituals, /ideas, /sessions, /reviews/* (lists + drill-downs), Goal page, Project page, Session pages.
- **Wide (1280px)**: /progress (multi-column hero needs space).

Container: `margin: 0 auto`, `max-width: {tier}`, padding 32px desktop / 24px tablet / 16px mobile.

**Unified page header pattern** (used on every list page — /actions, /projects, /delegated, /goals, /rituals, /ideas, /sessions, /reviews/*, /progress):

Vertical structure, top to bottom:

1. **Title row** (flex justify-between, align-items: center, gap 16px):
   - Left: page title (Inter 24-32px medium desktop, 20-24px mobile, var(--text-primary)). **Single word**: "Actions", "Projects", "Delegated", "Goals", "Rituals", "Ideas", "Sessions", "Days", "Weeks", "Months", "Progress", "Today". No "All" prefix anywhere.
   - Right: primary CTA button (Tier A) per page label — see table below. Review pages (/reviews/*) and dashboard pages (/progress, /today specific states) have NO button on the right.

2. **Meta line** (margin-top 8px): mono 11px uppercase letter-spacing 0.06em var(--text-tertiary) tabular-nums. Aggregate counts joined by " · ". Wraps to a second line via flex-wrap if it overflows on narrow viewports — do NOT shrink font size on mobile.

3. **Divider** (margin-top 16px): 1px `var(--border-subtle)`, full width.

4. **Filter bar** (margin-top 16px): see "Filter bar" section in 2.4 below.

**Per-page CTA labels and meta strings**:

| Page | CTA button | Meta string |
|------|-----------|-------------|
| /actions | "+ New action" | "{N} ACTIONS · {N} ACTIVE · {N} DONE · {N} DELEGATED" |
| /projects | "+ New project" | "{N} PROJECTS · {N} ACTIVE · {N} NEAR DONE · {N} STALLED · {N} CLOSED" |
| /delegated | "+ Delegate" | "{N} ACTIVE · {N} OVERDUE · {N} DUE TODAY" (overdue colored var(--text-warning) when >0; due today colored var(--accent) when >0) |
| /goals | "+ New goal" (disabled with tooltip if 3 active goals) | "{N} GOALS · {N} ACTIVE · {N} COMPLETED" |
| /rituals | "+ New ritual" | "{N} RITUALS · {N} ACTIVE · {N} ARCHIVED" |
| /ideas | "+ New idea" | "{N} CAPTURED · {N} CONVERTED · {N} DISCARDED" |
| /sessions | "+ Start session" | "{N} SESSIONS · {H}H TRACKED" |
| /reviews/days | (none) | "{N} DAYS TRACKED" |
| /reviews/weeks | (none) | "{N} WEEKS TRACKED" |
| /reviews/months | (none) | "{N} MONTHS TRACKED" |
| /progress | (none) | "{N} GOALS · {N} ACTIVE PROJECTS · {N} ACTIONS DONE ALL-TIME" |

**Mobile rules** (≤ 768px):
- Title and CTA button stay on the same row. Button keeps full label — do NOT collapse to icon-only "+" on mobile. Both fit comfortably at 375px because titles are single words and labels are short.
- Meta line wraps to multiple lines as needed; do not shrink it.
- No per-page custom layouts (no sub-stat plaque rows, no inline "Sort:" elements outside the filter bar).

### 2.3 Removed pattern — master-detail

Master-detail two-column layout has been removed from the system. /ideas previously used it; it has been refactored to the full-width list pattern (see 2.4). No page in v1 currently uses master-detail.

### 2.4 Full-width list pages

**Used on**: /actions, /delegated, /ideas, /sessions.

**Layout**:
- Full main area width.
- Single column of rows.
- Unified header (2.2) above; filter bar above list; list below.

**Filter bar** (used on every list page):

Desktop (≥ 769px):
- Single horizontal row, flex, gap 8px, align-items: center.
- Left: filter dropdowns in spec order per page (e.g., STATUS / GOAL / DATE on /actions).
- Right (margin-left: auto): "Sort: {value} ▾" dropdown.
- Each filter trigger: standard compact dropdown component (3.3).
- Active filter (non-default value): border var(--accent), value weight 500.

Mobile (≤ 768px):
- Single horizontal row that **horizontal-scrolls** if it overflows: `overflow-x: auto`, hide scrollbar via `&::-webkit-scrollbar { display: none }`, `scrollbar-width: none`, `-webkit-overflow-scrolling: touch`.
- Sort dropdown is the LAST item in the scroll row, NOT moved to a separate row.
- Do NOT wrap filters to a second row on mobile. Horizontal scroll preserves the single-row visual hierarchy.
- Each filter trigger keeps its compact size; tap target meets 44px minimum via vertical padding.

**Filter content per page** (left-to-right order, all single-select with default value "All" or equivalent):

| Page | Filters |
|------|---------|
| /actions | STATUS / GOAL / DATE / Sort |
| /projects | GOAL / STATE / Sort |
| /delegated | DELEGATE / GOAL / DATE / Sort (within Active or Returned tab) |
| /goals | STATE / TYPE / Sort |
| /rituals | STATE / GOAL / Sort |
| /ideas | STATUS / GOAL / DATE / Sort |
| /sessions | MODE / DATE / Sort |
| /reviews/days | DAY TYPE / GOAL / DATE / Sort |
| /reviews/weeks | GOAL / DATE / Sort |
| /reviews/months | GOAL / DATE / Sort |

### 2.5 Grid pages

**Used on**: /goals, /projects, /rituals.

**Layout**:
- `grid-template-columns: repeat(2, minmax(0, 1fr))` on desktop.
- 24px gap.
- Each grid cell: `min-width: 0; overflow: hidden` to prevent content bleeding.

**Mobile**: single column (1 card per row).

### 2.6 Slide-in panels

**Used for**: editing existing entities (Action, Goal, Ritual editors in EDIT mode), Session detail panel.

**Form factor**: slide-in from right edge of viewport.

**Layout**:
- Width: 480px desktop.
- Mobile: bottom sheet, full-width, ~85-90% viewport height.
- Background: `var(--surface-elevated)`.
- 1px left border `var(--border-subtle)`.
- Padding: 24px 32px.
- Internal scroll for long content.

**Open animation**: 200ms slide-in from right (or up on mobile).

**Close**: X icon top-right, Esc key, click backdrop.

**Used because**: editing happens in context of a list — sidebar relationship preserved, autosave on blur.

### 2.7 Modals

**Used for**: 
- **Entity creation** (Action, Goal, Ritual, Idea editors in CREATE mode).
- **Confirmations** (Tier 1, Tier 2).
- **Command Palette**.
- **Sign out confirmation**.
- **Demo confirmations** (Pro upgrade coming soon, etc.).

**NOT used for** (recent changes):
- ~~Plan today~~ — now full-page state on /today.
- ~~Close day~~ — now full-page recap state on /today.
- ~~Combined modal~~ (close yesterday + plan today) — removed; user navigates between Today states naturally.

**Layout**:
- Centered on viewport.
- Max width: 640px (entity creation), 640px (Command Palette), 480px (Confirmation).
- Background: `var(--surface-elevated)`.
- 1px border `var(--border-subtle)`, 6px radius.
- Padding: 24-32px (varies by modal).
- Backdrop: rgba(0, 0, 0, 0.5).

**Mobile**: bottom sheet form factor for all modals; slides from bottom; 90vh max height; swipe down dismisses (with discard guard for filled forms).

**Entity creation modals** specifically:
- Width 640px desktop allows wider field layouts (2-column for Estimates, Parent picker).
- Discard guard on close if any field filled: small inline confirmation "You have unsaved changes. Discard?" — Discard / Keep editing buttons.
- Footer: Cancel link + Create button (Tier A primary, **never disabled** — on submit attempt with missing required fields, inline errors appear and focus jumps to first error). The previous "disabled until valid" pattern was replaced because it hid the reason for non-submittability behind hover. See `08-DESIGN-DECISIONS.md` "Create modal — restructured for clarity" for full rationale.

**Create modal layout — Action create specific**:

The "+ New action" create modal (640px desktop, bottom sheet mobile) follows this field order top-to-bottom:

1. **Title** — prominent text input, no label (placeholder "Action title").
2. **ESTIMATES** section: Impact (1-10) + Time (min) side-by-side.
3. **PARENT** section: single row with two compact pill triggers: `[● Goal ▾] [Project ▾]`. 32px tall pills, 1px var(--border-default) border, click opens popover. Goal popover lists active goals; Project popover lists projects under selected goal + "— Goal-level backlog —" option.
4. **SCHEDULED DATE** section (optional): Today / Tomorrow chips + "Pick another date" calendar trigger.
5. **+ Add notes** link (collapsed by default) — click to expand textarea inline. Once expanded, stays expanded for the session.

State dropdown is NOT in the create modal — status auto-derives from scheduledDate (no date = Backlog, date set = Planned, past date triggers existing Done-confirmation flow).

Required-field markers: small `*` (Inter 12px var(--text-tertiary)) after section labels for required fields. Title input has no label so no marker; placeholder doubles as cue.

This layout pattern is specific to the Action create modal. The slide-in edit panel for existing actions retains its full field set including State dropdown.

**Create modal layout — Ritual create** (sibling pattern to Action create):

The "New ritual" create modal (640px desktop, bottom sheet mobile) follows this field order top-to-bottom:

1. **Title** — prominent text input, no label (placeholder "Ritual title").
2. **ESTIMATES** section: Base Impact (1-10) + Time (min) side-by-side. Both required.
3. **PARENT** section: single row with two compact pill triggers `[● Goal ▾] [Project ▾]` (same compact pill pattern as Action create). Project pill includes "— Goal-level ritual —" option in its popover.
4. **SCHEDULE** section: full-width dropdown (Daily / Weekdays / Weekly / Monthly / Custom). When Weekly is selected: day-of-week chip multi-select appears below. When Monthly: day-of-month selector. The Schedule field is more complex than other fields and gets a full dropdown rather than a compact pill.
5. **+ Add notes** link (collapsed by default) — click to expand textarea inline.

NO Time-of-day field. Notifications/reminders are out of v1 scope; time-of-day will be reconsidered post-v1.

Required-field markers: small `*` after section labels for required fields. Title input has no label so no marker; placeholder doubles as cue.

This layout is specific to the Ritual create modal. The slide-in edit panel for existing rituals retains its full field set.



### 2.8 Editor mode — Create vs Edit

System decision: entity editors use different form factors based on mode.

| Entity | Create mode | Edit mode |
|--------|-------------|-----------|
| Action | Modal (640px) | Slide-in (480px) |
| Goal | Modal | Slide-in |
| Ritual | Modal | Slide-in |
| Project | Full-page (navigate to /projects/{newId} draft) | Inline on Project page |
| Idea | Modal (640px) | Slide-in (480px) |

**Rationale**:
- Creation deserves focus — modal with backdrop directs attention to new entity.
- Editing deserves context — slide-in preserves list context and supports autosave.
- Project is heavyweight enough to warrant its own page.
- Idea was previously master-detail — refactored to standard list + modal/slide-in pattern for consistency with Action/Goal/Ritual.

**Same fields in both modes** for Action / Goal / Ritual — only container differs.
- Backdrop: `rgba(0, 0, 0, 0.5)`.
- Mobile: bottom sheet form factor or full-width on small screens.

---

## 3 — Reusable components

### 3.1 Buttons

**Tier A — Primary**:
- Background: `var(--accent)`.
- Text: white.
- Padding: 8px 16px (default), 10px 20px (large).
- Border-radius: 4px.
- Inter 13-14px medium.
- Hover: slightly lighter accent.
- Disabled: muted text + `var(--surface-hover)` background.

**Tier B — Secondary**:
- Background: transparent.
- Text: `var(--text-primary)`.
- Border: 1px solid `var(--border-default)`.
- Padding: 8px 16px.
- Border-radius: 4px.
- Inter 13px medium.
- Hover: `var(--surface-hover)` background, border `var(--accent)`.

**Tier C — Tertiary (link)**:
- Background: transparent.
- Text: `var(--text-secondary)`.
- No border.
- Padding: 4px 8px (tap target preserved).
- Inter 13px regular.
- Hover: `var(--text-primary)`.

### 3.2 Inputs

**Text input**:
- Background: `var(--surface-raised)`.
- Border: 1px `var(--border-subtle)`.
- Padding: 8px 12px.
- Border-radius: 4px.
- Inter 13-14px text-primary.
- Placeholder: `var(--text-tertiary)`.
- Focus: border `var(--accent)`.

**Search input** (when used — most replaced by ⌘K):
- Same as text input.
- Magnifying glass `⌕` 16px in left, 12px gap.

**Textarea**:
- Same styling as text input.
- Min-height 80px.
- Resize: vertical only.

**Number input**:
- Same styling as text input.
- HTML attributes: `type="number"`, `min`, `max`, `step` set per use case.
- Native browser spinner arrows (`::-webkit-inner-spin-button`, `::-webkit-outer-spin-button`) hidden globally via CSS:
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
- Validation behavior on blur:
  - Out-of-range values clamp to min/max with brief border flash (border `var(--text-warning)` for 600ms).
  - Decimals round to integers (where step=1).
  - Empty required field: keep empty, show inline error below.
- Validation on keydown:
  - Allow only digits 0-9, Backspace, Delete, Tab, Enter, Arrow keys.
  - Block letters, symbols, multiple decimals.
- Range conventions:
  - Impact: 1-10, step 1.
  - Time (minutes): 1-600, step 5.

### 3.3 Filter dropdown

**Trigger button** (compact):
- Inline-flex, align-center, gap 6px.
- Padding: 6px 10px.
- Background: transparent.
- Border: 1px `var(--border-subtle)`.
- Border-radius: 4px.
- Content: "LABEL: value ▾".
  - Label: mono 10px uppercase letter-spacing 0.06em `var(--text-tertiary)`.
  - Value: Inter 13px `var(--text-primary)`.
  - ▾ arrow: 10px `var(--text-tertiary)`.

**Hover state**:
- Background `var(--surface-hover)`.
- Border `var(--border-default)`.

**Active state** (filter has non-default value):
- Border `var(--accent)`.
- Value text: weight 500.

**Popover**:
- Background `var(--surface-elevated)`.
- Border 1px `var(--border-subtle)`.
- Border-radius: 4px.
- Padding: 4px 0.
- Min-width: matches trigger or 160px (whichever is larger).
- Z-index: 50.

**Option rows in popover**:
- Padding: 6px 12px.
- Inter 13px `var(--text-primary)`.
- Hover: `var(--surface-hover)` background.
- Active (selected): `var(--surface-hover)` background + ✓ on right + `var(--accent)` color on text.
- For Goal options: 8px goal color dot before name.

### 3.4 MeasureBar (Value / Effort bar)

3-column flex layout:

```
[Label]  [Bar container with fill inside]  [Value]
56px     flex-grow (min-width: 0)           36px
```

**Label**:
- JetBrains Mono 10px uppercase letter-spacing 0.06em.
- Color: `var(--text-tertiary)`.
- Width: 56px fixed, text-align: left.
- Common labels: "VALUE" / "EFFORT" / "TIME". (Previously "OUTCOME" — renamed.)

**Bar container**:
- Position: relative.
- Height: 6-8px.
- Width: flex-grow (min-width: 0).
- Background: `var(--surface-hover)`.
- Border-radius: 2px.
- Overflow: hidden.

**Bar fill** (inside container):
- Position: absolute.
- Width: `${percentage}%`.
- Height: 100%.
- Background: provided color (goal color).
- Border-radius: 2px.

**Value**:
- JetBrains Mono 11-12px tabular-nums.
- Color: `var(--text-secondary)`.
- Width: 36px fixed, text-align: right.

**DOM order**: label → bar → value. Never value first.

### 3.5 Sparkline

**Used for**: 30-day activity charts on goal columns, goal cards, time investment rows.

**Pattern**: horizontal series of vertical bars.

**Specs**:
- Width: container width.
- Height: 24-32px max bar.
- One bar per day for the period (typically 30 days).
- Bar width: container_width / days, with small gap between.
- Bar height: proportional to data value, scaled to max in dataset.
- Color: provided (typically goal color).
- Empty days: bar height 0 or very small minimum (1-2px) to maintain visual rhythm.
- Border-radius: 1px on bars.

**Hover interaction**:
- Tooltip on hover showing date + value details.
- Tooltip example: "MAY 3 — 2 actions: ✓ Outline structure · ✓ Test mic".

**Unified scale (for comparative use)**:
- When sparklines compare goals (Time Investment on Progress page), all use the **same Y-axis max** based on highest value across all goals' periods.

### 3.6 ConsistencyCalendar (ritual)

**Used on**: ritual cards in /rituals.

**Pattern**: grid of small cells, each = one day in the period.

**Specs**:
- 12-12 cells per row (2 weeks × 7 days, or similar grouping).
- Cell size: 12px square.
- Gap: 2px between cells.
- Color states:
  - Done: filled with goal color.
  - Skipped: filled with `var(--text-tertiary)`.
  - Missed: empty (just `var(--surface-hover)` background).
  - Pending: subtle outline.
- Hover: tooltip with date and status.

### 3.7 FrequencyChart (ritual)

**Used on**: ritual cards in /rituals.

**Pattern**: 12-week bar chart showing weekly completion counts.

**Specs**:
- 12 bars (one per week).
- Bar width: container_width / 12 with small gap.
- Height: proportional, max ~32px.
- Color: goal color.
- Y-axis max: highest single-week count for that ritual or "max: N" annotation.
- Hover tooltip: "Week of May 1 — 6 of 7 done".

### 3.8 GoalCard / GoalColumn

**Goal column on Hero (Progress page)** — see `08-DESIGN-DECISIONS.md` "Goal column on Hero" for full composition.

**Goal card on /goals page** — rich content, see `08-DESIGN-DECISIONS.md` "Goals page" for full composition.

**Common elements**:
- Goal color stripe at left edge (3px wide, full card height).
- Header with goal color dot + title + state indicator + "..." menu.
- Big progress number with PROGRESS · VALUE label.
- MeasureBar rows (Value, Effort).
- Hover: card-level `var(--surface-hover)` tint.
- Click body → navigate to /goals/:id.

### 3.9 ProjectCard

**Used on**: Active Projects (Progress page), /projects, Goal page Active Projects section.

**Specs**:
- Min-height: ~120px.
- Padding: 16px.
- Background: `var(--surface-raised)`.
- Border: 1px `var(--border-subtle)`, 6px radius.
- Goal color stripe at left edge (3px).

**Content**:
- Top: goal color dot + parent goal name (mono 10px uppercase) + state indicator dot + "..." menu.
- Title: Inter 15-16px medium.
- Mini progress bar (6px height, goal color, full width).
- Bottom: action counts ("5/7 actions") + last activity ("Last: today").

**Click body** → navigate to /projects/:id.

### 3.10 ActionRow (unified pattern)

**Used everywhere actions appear**: Today zone TODAY'S ACTIONS list, drill-down sub-groups, /actions, Project page actions list, Plan today step 2 Available pane (compact 48px row).

**Specs**:
- Height: 52-56px (52 desktop, 56 mobile for touch targets).
- Internal padding: 12px vertical, 16px horizontal.
- Goal color stripe at left edge (3px wide, full row height).

**Layout — flex align-center, gap 12px**:

Left side:
- Checkbox (18-20px desktop, 44px tap target on mobile).
- Two-line content:
  - Top line: title (Inter 14-15px medium `var(--text-primary)`). Star icon (lucide Star, 12px var(--accent), filled) inline before title when row is Main Task for current day.
  - Bottom line: meta (mono 12px tabular-nums `var(--text-secondary)`).
    - Format: "{Goal} · {Project} · {Time}" (Goal name and project name in full).
    - Time as "30m" or "1h 30m".
    - For Delegated state: appended "→ {Delegate}".

Right side group:
- **Impact pill** (prominent, goal-tinted) — see 3.24 ImpactPill.
- 12px gap from preceding content.

**Removed elements** (vs old spec):
- Date pill ("TODAY", "MAY 12") on right — removed for Today's Actions list. Original scheduledDate not surfaced (anti-deferral framing per vision).
- "OVERDUE" indicators — removed from action rows (reserved for /delegated only).

**States**:
- Hover: `var(--surface-hover)` background, cursor pointer.
- Selected: `var(--surface-elevated)` background + 2px left border `var(--accent)` (replaces stripe).
- Terminal (Done): line-through title, var(--text-secondary) for title, dimmed Impact pill.
- Terminal (Dropped, Cancelled): same as Done plus var(--text-tertiary) for meta.

**Bidirectional checkbox toggle** in functional list views (Today, /actions, Project page, Main Task card):
- Click checkbox on Active action → marks Done with validation (Impact + Time required).
- Click checkbox on Done action → re-opens (status = Planned, scheduledDate = today, all metrics revert). Toast: "Action re-opened".
- Click checkbox on Delegated/Dropped/Cancelled → no action, tooltip "Re-open via the editor".
- Reviews drill-down lists preserve click-to-edit pattern (no toggle, opens editor).

**Click body** (anywhere except checkbox): opens Action editor.

### 3.10b DelegatedRow (variation)

**Used on**: /delegated page Active and Returned tabs, and /progress Currently Delegated section.

**Desktop layout** (≥ 769px) — three-column flex:
- Height: 56-60px.
- 3px goal color stripe on left, full row height.
- No checkbox (delegated actions can't be marked done from list — go through Action editor).
- Title (Inter 15px medium var(--text-primary)).
- Meta line: "→ {delegate} · {parent goal} · {parent project}" (mono 12px var(--text-secondary)). Arrow "→" var(--text-tertiary), delegate name var(--text-primary).
- Right side cluster: ColorCodedDatePill (see 3.25) + ImpactPill (3.24), gap 12px. Date pill uses full format "return 2026-04-30 · 8d ago" with background fill.
- Returned tab: date pill replaced with "returned {relative}" pill (var(--state-active) tint or neutral).

**Mobile layout** (≤ 768px) — vertical two-row stack to prevent the date pill from crushing the title:
- Row height: auto, minimum 72px. Padding 12px 16px. 3px goal stripe unchanged.
- **Top row** (flex justify-between, align-items: center, gap 8px):
  - Left: title (Inter 15px medium var(--text-primary)). `flex: 1; min-width: 0;` to allow shrinking. Should fit ~25-30 characters at 375px before ellipsis. NO aggressive truncation.
  - Right: ImpactPill only (compact: padding 3px 8px, mono 11px, ~32px min-width).
- **Bottom row** (single line, mono 12px var(--text-secondary), gap 8px between segments separated by " · "):
  - Format: `→ {delegate} · {return-status}`
  - {return-status} renders INLINE in the meta line, NOT as a right-side pill. Color coding preserved (overdue var(--text-warning), due today var(--accent), on track var(--text-tertiary), no date italic var(--text-tertiary)) but NO background fill on mobile — color alone carries the state.
  - Shortened format strings on mobile:
    - Overdue: "{N}d overdue" (e.g., "8d overdue").
    - Due today: "due today".
    - On track future: "in {N}d" for ≤ 7 days, "{Mon D}" (e.g., "May 10") for 8+ days.
    - No date: "no return date" italic.
  - Parent goal and parent project DROPPED from meta on mobile — recoverable via tapping into Action editor.
  - The "→" arrow may be dropped if it crowds; just delegate name + " · " + return-status.
- Full absolute date moves to the long-press / hover tooltip.
- Returned tab: bottom row format becomes `→ {delegate} · returned {relative}`.

**Click body** (any viewport): opens Action editor (delegated context).

### 3.11 RitualRow (Today zone variant)

**Used on**: Today zone TODAY'S RITUALS list, Plan today step 2 RITUALS TODAY section.

**Specs match ActionRow** (52-56px, two-line, goal stripe, checkbox).

**Layout — flex align-center, gap 12px**:

Left side:
- Checkbox (same as ActionRow).
- Two-line content:
  - Top line: ritual title (Inter 14-15px medium var(--text-primary)).
  - Bottom line (mono 12px var(--text-secondary)): "Daily · {totalCompletions} done" or similar. NO streak count — the model uses total lifetime count, not consecutive-day streaks (no shame mechanic).
    - For brand-new rituals (totalCompletions = 0): "Daily · brand new".
    - Schedule label first ("Daily" / "3x/week" / etc.).

Right side group (gap 12px):
- **MultiplierPill** (goal-tinted, mirrors ImpactPill pattern): padding 4px 10px, var(--surface-hover) bg with goal color at 15% opacity, 4px radius, Inter 13px medium tabular, full goal color text. Format "×1.50".
- **RitualSkipToggle** (see 3.26): single button "Skip" / "Restore".

**Done state**:
- Checkbox checked.
- Title strikethrough, var(--text-secondary).
- Meta line appended: "· ✓ Done at HH:MM".
- Skip button replaced with "Re-open" link (Tier C var(--text-tertiary)).
- MultiplierPill remains visible.

**Skipped state** (toggle Skip clicked):
- Row faded (opacity 0.5).
- Skip button → "Restore".

**Hover**: var(--surface-hover) bg + cursor pointer (clarifies clickability).

**Click body** (not checkbox or Skip button): opens Ritual editor (slide-in).

### 3.11b RitualCard (rituals page)

**Used on**: /rituals page (different from RitualRow on Today zone).

**Specs**:
- Min-height: ~280px.
- Padding: 24px.
- Background: `var(--surface-raised)`.
- Border: 1px `var(--border-subtle)`, 6px radius.
- Goal color stripe at left edge (3px).

**Content** (top to bottom):
- Header: parent goal label (mono 10px uppercase + dot) + "..." menu.
- Title: Inter 16px medium.
- Schedule indicator: mono 11px uppercase ("DAILY", "WEEKLY · MONDAYS").
- Big multiplier: "×1.10" (Inter 24px tabular).
- Completions count: "24 completions" (mono 12px text-secondary).
- "LAST 30 DAYS · CONSISTENCY" label.
- ConsistencyCalendar (12px cells).
- "12 WEEKS · FREQUENCY" label + "max: N" right-aligned.
- FrequencyChart.
- Footer: "Last done: yesterday" + action button ("Mark today done" or "Not due today").

### 3.12 GhostCard / Ghost row

**Pattern**: dashed border + "+" character + descriptive text.

**Specs**:
- Background: transparent.
- Border: 1px dashed `var(--border-default)`.
- Border-radius: 6px (cards) or 4px (rows).
- Min-height: matches sibling cards or rows for grid uniformity.
- Centered content vertically and horizontally.

**Content** (varies by use):
- "+" character: JetBrains Mono 16-24px `var(--text-tertiary)`.
- 8px gap.
- Description: Inter 13px `var(--text-secondary)`.
- Optional sub-text: mono 11px uppercase `var(--text-tertiary)`.

**Hover state**:
- Border becomes solid `var(--accent)`.
- "+" becomes `var(--text-secondary)` or `var(--text-primary)`.
- Description text becomes `var(--text-primary)`.
- Background: subtle `var(--surface-hover)`.

**Used in**:
- "+ Add ritual" on /rituals (in card grid).
- "+ Add goal" placeholder on Progress hero (when fewer than 3 active goals — empty slot).
- "+ Add action to this day" in Reviews drill-down.

### 3.13 Tooltip

**Pattern**: small popover on hover.

**Specs**:
- Background: `var(--surface-elevated)`.
- Border: 1px `var(--border-default)`.
- Padding: 8px 12px.
- Border-radius: 4px.
- Inter 12px `var(--text-primary)`.
- No shadow.
- Z-index: 100.
- 250ms delay before appearing.

**Used for**: sparkline bars, state indicator dots, consistency calendar cells, abbreviated content, button hints.

### 3.14 Confirmation modal — Tier 1 (simple)

**Specs**:
- Centered, max-width 480px.
- Background: `var(--surface-elevated)`.
- Border: 1px `var(--border-subtle)`, 6px radius.
- Padding: 24px.
- Backdrop: `rgba(0, 0, 0, 0.5)`.

**Content**:
- Title: Inter 18px medium (e.g., "Drop this project?").
- Body: 2-3 sentences explaining consequence (Inter 14px `var(--text-secondary)`).
- Action bar (flex justify-end, gap 12px):
  - "Cancel" (Tier C link).
  - "Confirm" (Tier B button, can be styled with `var(--text-warning)` for destructive emphasis).

**Closes on**: Esc, backdrop click, Cancel.

**Used for**: Drop entities, Cancel/Drop action, Discard idea, Archive ritual, Re-open dropped entity.

### 3.15 Confirmation modal — Tier 2 (name-typing)

**Same shell as Tier 1** plus verification field.

**Content**:
- Title: "Permanently delete {entity}?".
- Body: warning text + "Type '{entity name}' to confirm permanent deletion."
- Verification text input: placeholder is the entity name.
- Action bar:
  - "Cancel" (Tier C link).
  - "Permanently delete" (Tier A button with `var(--text-warning)` or dropped color, **disabled** until input matches name exactly).

**Used for**: Delete goal, Delete project, Delete account.

### 3.16 Toast notification (sonner)

**Library**: sonner (https://sonner.emilkowal.ski).

**Position**: bottom-right.

**Style** (custom theme):
- Background: `var(--surface-elevated)`.
- Border: 1px `var(--border-subtle)`, 6px radius.
- Padding: 12px 16px.
- Inter 13-14px.
- Color: `var(--text-primary)`.
- Variant colors:
  - Success: subtle accent border.
  - Warning: `var(--text-warning)` accent.
  - Error: `var(--status-dropped)` accent.
- Auto-dismiss: 3 seconds.
- Manual close: × icon on hover.

**Use cases**: see `08-DESIGN-DECISIONS.md` "Toast notifications" section.

### 3.17 Slide-in panel (editor pattern — EDIT mode)

**Used for**: editing existing entities (Action, Goal, Ritual editors in EDIT mode); Session detail panel.

For CREATE mode, see Section 2.7 Modals.

**Specs**:
- Position: fixed right edge.
- Width: 480px desktop, full-width mobile.
- Height: 100vh.
- Background: `var(--surface-elevated)`.
- Border-left: 1px `var(--border-subtle)`.
- Padding: 24px 32px.
- Z-index: 90.
- Internal scroll if content overflows.

**Header**:
- Flex justify-between align-center.
- Left: title or breadcrumb.
- Right: X close icon (24px tap target).

**Open animation**: 200ms slide from right.

**Close**: X click, Esc key, click backdrop, or trigger-based dismiss.

**Autosave**: edit mode autosaves on blur (not explicit Save button). 

**Mobile**: bottom sheet behavior:
- Slides from bottom.
- 85-95% viewport height.
- Handle indicator at top (small horizontal bar).
- Swipe down to dismiss.

**Z-index correction**: slide-in panels use z-index 90. Popovers and dropdowns triggered from inside a slide-in panel must use z-index 100 to render above the panel. Common bug: popover with default z-50 disappears below the panel and looks broken.

### 3.18 DatePickerChips

**Used in**: Action editor SCHEDULED DATE section, Delegation block EXPECTED RETURN field.

**Pattern**: two preset chips ("Today", "Tomorrow") + secondary "Pick another date" link revealing inline calendar.

**Default state — chips row (flex, 8px gap)**:
- "Today" chip
- "Tomorrow" chip
- 12px gap separator
- "Pick another date" link (Tier C with calendar icon prefix)
- If date already set: "Clear" link (Tier C, var(--text-tertiary)) on far right

**Chip styling** (matches PRESET button):
- Inline-flex, padding 6px 12px.
- Background: `var(--surface-raised)` default, `var(--accent)` when selected.
- Border: 1px `var(--border-subtle)` default, none when selected.
- Border-radius: 4px.
- Inter 13px `var(--text-primary)` default, white when selected.
- Hover (default): `var(--surface-hover)` background, border `var(--border-default)`.

**"Pick another date" link**:
- Inline-flex, gap 6px.
- Calendar icon (lucide Calendar, 12px) + label.
- Inter 13px `var(--text-secondary)`.
- Hover: `var(--text-primary)`.

**Inline calendar** (when "Pick another date" clicked):
- shadcn Calendar component / react-day-picker.
- 1px `var(--border-subtle)`, 4px radius, padding 8px.
- Selected date: `var(--accent)` bg, white text.
- Today: subtle indicator (text `var(--accent)`, no fill).
- Past dates: `var(--text-tertiary)`, still clickable (for retroactive scheduling).
- Hover: `var(--surface-hover)`.

**On date pick from calendar**:
- Calendar collapses.
- Chips row replaced with summary: "May 15 (in 9 days)" + "Change" link.
- If picked date is today/tomorrow: shown as chip selection rather than custom date display.

**Past date behavior**:
- If picked date < today: trigger Tier 1 confirmation modal "Schedule for past date?" (see 10-BEHAVIORS.md for full flow).
- On confirm: status auto-derives to Done with completedAt = picked date.

### 3.19 StatusDropdown

**Used in**: Action editor STATE section.

**Trigger button**:
- Tier B styling: var(--surface-raised) bg, 1px var(--border-default) border, 4px radius.
- Padding: 8px 12px.
- Width: 280px or container width.
- Display: status dot/pill (matching status color) + status label + ▾ caret on right.
- Hover: border var(--accent).

**Dropdown options** (in this order):
- Backlog
- Done
- Delegated
- Dropped
- Cancelled

**"Planned" is NOT in the dropdown** — it's a derived state, set automatically when scheduledDate is provided via DatePickerChips. The trigger button shows "Planned" with the date when this derivation is active.

**Z-index**: 100 (above slide-in panel z=90). Critical — without this, dropdown renders behind editor and appears broken.

**Option rows in popover**:
- Padding: 8px 12px.
- Inter 13px `var(--text-primary)`.
- Status dot/pill on left, label after.
- Hover: `var(--surface-hover)`.
- Selected: `var(--accent)` text + ✓ on right.

**Goal-level Backlog constraint**:
- When action's parent is a Goal (no project): dropdown locked. Other options visible but disabled with tooltip "Assign to a Project to plan or complete this action."

**Status transitions trigger validation**:
- → Done: requires Impact and Time. Block transition with inline error if missing.
- → Delegated: requires delegate name. Reveal Delegation block.
- → Dropped/Cancelled: Tier 1 confirmation modal before applying.
- → Backlog: clear current scheduledDate (action returns to Backlog from any state).
- Re-open from terminal: clear current terminal timestamp, keep history of plannedAt/delegatedAt.

### 3.20 StatTile

**Used in**: Accomplishments section of Day/Week/Month drill-downs.

**Pattern**: stat card showing big number + label + optional comparison line.

**Layout** (column flex):
- Big number: Inter 28-32px tabular var(--text-primary). Format with sign for value added ("+18") or plain count ("7").
- Label: mono 10px uppercase letter-spacing 0.06em var(--text-tertiary). Examples: "VALUE ADDED", "ACTIONS DONE", "RITUALS DONE", "TIME INVESTED", "SESSIONS", "PROJECTS CLOSED", "GOALS CLOSED".
- Comparison line (optional, on Week/Month tiles only): mono 11px tabular. "+3 vs last week" / "-2 vs last month" / "0 vs last week".
  - Positive: var(--state-active).
  - Negative: var(--text-warning).
  - Zero: var(--text-secondary).

**Container styling**:
- Padding: 16px 20px.
- Background: var(--surface-raised).
- Border: 1px var(--border-subtle).
- Border-radius: 6px.
- Min-width: 160px desktop, 140px mobile.

**Grid layout**:
- 4-5 tiles per row on desktop.
- 2 tiles per row on mobile.

**Conditional rendering**:
- Value / Actions / Rituals tiles always shown (even if 0).
- Time tile shown when data exists.
- Sessions tile shown only if count > 0.
- Projects/Goals Closed tiles shown only if count > 0 (don't show "0 PROJECTS CLOSED" — feels negative).

### 3.21 SessionRow

**Used in**: /sessions list page, Session sections of Day/Week/Month drill-downs, Project/Goal pages.

**Compact two-line layout**:

Top line (flex justify-between):
- Left: time started ("Today, 2:30 PM" / "Yesterday, 9:15 AM" / "Mon May 4, 10:00 AM") in Inter 14px medium var(--text-primary).
- Right: status pill + duration: "[COMPLETED] · 50m" or "[ABORTED] · 23m of 50m planned" (mono 11px uppercase, surface-hover bg, 2px 8px padding).
  - COMPLETED pill: var(--state-active) tint.
  - ABORTED pill: var(--text-warning) tint.

Sub-line (mono 12px var(--text-secondary)):
- Mode info: "Pomodoro · 25min × 3/4 cycles" (for pomodoro/custom) or "Continuous · 75min focused" (for continuous).

Stats line (mono 12px var(--text-secondary)):
- "+{value} value · {N} done · {M} dropped" (numbers in var(--text-primary)).
- Skip parts with 0 count.

**Behavior**:
- Padding: 14px 20px.
- 1px var(--border-subtle) bottom border.
- Hover: var(--surface-hover).
- Click: opens Session detail panel (slide-in from right).

**Variant on Project/Goal pages**:
- Add sub-line below stats: "from this {project|goal}: {X} planned, {Y} done" (mono 11px var(--text-tertiary)).

### 3.22 SessionTimer

**Used in**: /sessions/active page only.

**Layout** (centered on viewport):

Phase label (above timer):
- Format: "WORK · CYCLE 2/4" or "BREAK · 5MIN".
- Mono 11px uppercase letter-spacing 0.06em var(--text-tertiary).

Timer number:
- JetBrains Mono, tabular-nums.
- Size: 96px desktop, 72px mobile.
- Color: var(--text-primary) during work, var(--text-secondary) during break.
- Format: MM:SS, live countdown.

Progress ring or bar (below timer):
- SVG circle or simple horizontal bar.
- Width: similar to timer text width.
- Fill: var(--accent) during work, var(--text-secondary) during break.
- Animates from 0% to 100% over cycle duration.

**During pause**:
- Timer text dimmed (opacity 0.5).
- Phase label changes to "PAUSED".
- Progress ring/bar animation paused.

**On cycle end**:
- Brief background flash (var(--accent) opacity 0.2 for 300ms, fades).
- Audio cue (if opt-in on).
- Modal/banner appears: "Work block done · time for a break" with explicit "Continue to break" button.

### 3.23 FAB (Floating Action Button)

**Used in**: /actions page on mobile (only).

**Pattern**: floating circular button for primary action.

**Specs**:
- Position: fixed, bottom-right of viewport.
- Offset: 16px from edges.
- Size: 56px circle.
- Background: var(--accent).
- Icon: "+" character, 24px white.
- Z-index: 50 (above content, below modals).
- Subtle shadow (one of the rare allowed shadow exceptions because FAB is a conventional pattern).

**Click**: opens action creation modal (bottom sheet on mobile).

**Not used**: on desktop (header "+ New action" button is sufficient); on other pages (would conflict with their primary actions).

### 3.24 ImpactPill / ValuePill

**All pills use FIXED width, not min-width.** This is critical for right-edge alignment in pill columns. Each pill has one width value used everywhere it appears (no per-list overrides). Widths are sized to fit the longest legitimate value of the pill type. Applies to ImpactPill, TimePill, MultiplierPill — see specs below.

**Used in**: ActionRow right side (Today's Actions, /actions, Project page), DelegatedRow right side, Plan today picker rows, Recently Closed actions on /progress, anywhere prominent Value display is needed.

**Pattern**: colored inline pill showing Impact value, tinted by parent goal color.

**Specs (prominent variant — used on row right side)**:
- Inline-flex, padding 4px 10px.
- Background: parent goal color at ~15% opacity (use color-mix or rgba).
- Border-radius: 4px.
- Text: full goal color (saturated).
- Inter 13px medium tabular-nums.
- Format: "I9" / "I8" / "I7" / etc.
- Width: 40px FIXED (not min-width). Sized to fit "I10" centered without clipping. Padding may need slight adjustment if 40px clips — bump to 44px in that case. Goal: every ImpactPill column edge aligns vertically across rows.
- Text-align: center.

**Specs (compact variant — used in compact picker rows, action editor, etc.)**:
- Same colors, smaller dimensions.
- Padding: 3px 8px.
- Mono 11px medium tabular.
- Width: 34px FIXED.

**Variations by format**:
- **"I5" format** preferred where pill represents intrinsic Impact rating (action rows, picker, editor).
- **"+5" format** preferred where pill represents value contribution (e.g., "+5 value added" in Recently Closed).

**Decision: no dimming by Impact value**. All Impact values use full saturation (don't dim I3 vs I9). Goal-color tint already differentiates by goal; varying intensity by Impact adds noise.

**Active session banner** (separate, not a pill): when active session is running and user navigates away from /sessions/active, a sticky banner appears at top of main content area.

Banner specs:
- Background: var(--surface-elevated).
- Border-bottom: 1px var(--border-subtle).
- Padding: 8px 16px.
- Position: sticky top, full width of main content area.
- Z-index: 40 (below modals, above content).
- Content: "● Session in progress · {time} left of {phase}" (left) + "Return →" link (right, var(--accent)).
- Updates live every second while session in_progress.
- Disappears when session ends.

### 3.24b MultiplierPill (for ritual rows)

**Used in**: RitualRow right side (Today zone, Plan today step 2 RITUALS section, /admin/components reference).

**Pattern**: mirrors ImpactPill visual pattern but shows ritual multiplier.

**Specs**:
- Inline-flex, padding 4px 10px.
- Background: parent goal color at ~15% opacity.
- Border-radius: 4px.
- Inter 13px medium tabular-nums.
- Text: full goal color.
- Format: "×1.00" / "×1.25" / "×1.50" / "×1.75" / "×2.00".
- Width: 56px FIXED. Sized to fit "×2.00" (the maximum multiplier value) centered.

### 3.24c TimePill (NEW — neutral time display)

**Used in**: ALL row right-side clusters where Impact-equivalent pill (ImpactPill/MultiplierPill) is paired with time. Specifically: ActionRow on /today, /actions, Project page, Recently Closed Actions on /progress; RitualRow on /today, /rituals page; Plan today step 2 panes; Sessions Builder action picker rows. Anywhere a row needs to surface estimated time as a scannable visual unit alongside an Impact-equivalent pill.

**Pattern**: neutral pill (NOT goal-tinted) — Time is a universal axis, not goal-specific, so it stays neutral while ImpactPill/MultiplierPill carry the colored semantic.

**Specs**:
- Inline-flex, padding 4px 10px, border-radius 4px.
- Background: `var(--surface-hover)` (subtle neutral tone, doesn't compete for attention with goal-tinted pills).
- Text: `var(--text-secondary)`, mono 12px tabular-nums.
- Width: **64px FIXED** (NOT min-width). Sized to fit "1h 30m" (longest typical format). For edge cases beyond ~9h, the pill clips gracefully — those values are rare in practice (the 2-hour principle from MODEL discourages long single actions). All TimePills across the app share this fixed width so right-edge alignment is automatic.
- No icon, no label — just the formatted time value.

**Format strings** (use existing time formatter):
- "5m" / "20m" / "45m" — minutes only.
- "1h" / "2h" / "3h" — round hours.
- "1h 30m" / "2h 30m" — hours plus residual minutes.

**Companion to ImpactPill / MultiplierPill**: when both pills are shown in the same right-side cluster:
- ImpactPill or MultiplierPill comes first (left).
- Gap 8px.
- TimePill comes second (right).
- Gap 12px from preceding row content.

**Time-relative text** (e.g., "today" / "2d ago" / "yesterday") in Recently Closed and similar archival lists: rendered as Inter 12px `var(--text-tertiary)` in a fixed-width column (~80px right-aligned), placed AFTER TimePill with 12px gap. This keeps three-column right-edge alignment clean.

**Where TimePill does NOT replace inline text**:
- Meta line text (second/third line of a row describing parent context) keeps time as inline text if it appears there at all. But: if a row has both a TimePill in the right cluster AND time text in the meta line, remove the duplicate from the meta line.
- /delegated rows use ColorCodedDatePill for date, no separate TimePill — delegation has different time semantics (return date, not estimate).

### 3.25 ColorCodedDatePill (delegated return date)

**Used in**: DelegatedRow on /delegated, Currently Delegated section on /progress, and User detail in /admin.

**Pattern**: shows delegated action's expected return date with color coding by state. The ONLY place "overdue" framing exists in the app.

**Two presentations**:
- **Desktop (≥ 769px)**: rendered as a right-side pill with background fill, full date format.
- **Mobile (≤ 768px)**: rendered INLINE in the DelegatedRow meta line (see 3.10b), color-coded but with NO background fill, shortened format.

**State variants — desktop pill format**:

OVERDUE (expectedReturnDate < today):
- Padding: 3px 8px.
- Background: var(--text-warning) at ~8% opacity.
- Border-radius: 3px.
- Text: var(--text-warning), mono 12px tabular.
- Format: "return {date} · {N}d ago" — example: "return 2026-04-30 · 7d ago".

DUE TODAY (expectedReturnDate = today):
- Same padding/radius.
- Background: var(--accent) at ~8% opacity.
- Text: var(--accent), mono 12px tabular.
- Format: "return today".

ON TRACK (expectedReturnDate > today):
- No padding/background (no pill shape).
- Text: var(--text-tertiary), mono 12px tabular.
- Format: "return {date}" (8+ days out) or "return in {N}d · {date}" (2-7 days out) or "return tomorrow · {date}".

NO RETURN DATE:
- Italic mono 12px var(--text-tertiary).
- Format: "no return date".

**State variants — mobile inline format** (no background fill, color only):

| State | Format |
|-------|--------|
| Overdue | "{N}d overdue" — e.g., "8d overdue" (var(--text-warning)) |
| Due today | "due today" (var(--accent)) |
| On track ≤ 7 days | "in {N}d" — e.g., "in 3d" (var(--text-tertiary)) |
| On track ≥ 8 days | "{Mon D}" — e.g., "May 10" (var(--text-tertiary)) |
| No date | "no return date" italic (var(--text-tertiary)) |

**Tooltip on hover/long-press** (both desktop and mobile):
- Overdue: "Overdue by {N} days. Expected return {date}".
- Due today: "Expected return today ({date})".
- Future: "Expected return in {N} days ({date})".
- No date: "No expected return date set".

### 3.26 DayTypeIndicator

**Used in**: Today page header (State B/C), Plan today step 1 large cards, Plan today step 2 compact dropdown, Looking Back card, Reviews drill-downs, /admin/components reference.

**Three variants**:

**Variant 1 — Compact inline indicator** (used in Today header, Looking Back, drill-downs):
- Layout: lucide icon (12px) + 6px gap + label.
- Label: mono 11px uppercase letter-spacing 0.06em.
- Color: var(--text-secondary) for icon and label.
- Format example: "⚡ EXECUTION DAY" / "🌱 RECOVERY DAY" / "☀ DAY OFF" / "🌡 SICK DAY" (icons rendered via lucide, not emoji).

**Variant 2 — Large colored card** (used on Plan today step 1):
- Min-height ~140px, padding 24px.
- Background: var(--surface-raised), 1px var(--border-subtle), 6px radius.
- Cursor: pointer.
- Layout (vertical flex, gap 12px, align-items: flex-start):
  - Top: 40px circle filled with day-type accent color at ~12% opacity, lucide icon centered (20px) in full saturated accent color.
  - Middle: card title (Inter 18px medium var(--text-primary)).
  - Bottom: card description (Inter 13px var(--text-secondary), one short line).
- Hover: background → var(--surface-hover); border → 1px solid (card's accent color at full saturation), 150ms ease-out transition.
- No persistent selected state — selection auto-advances away from step 1.

Per-card colors and copy:

| Day Type | Accent token | Lucide icon | Title | Description |
|----------|--------------|-------------|-------|-------------|
| Execution | `var(--state-active)` (green) | Zap | "Execution" | "Full work day — normal expectations." |
| Recovery | `var(--goal-3)` (purple) | Leaf | "Recovery" | "Light day, intentional rest." |
| Day Off | `var(--state-stalled)` (gray) | Sun | "Day Off" | "No work, fully off." |
| Sick | `var(--status-dropped)` (amber-red) | Thermometer | "Sick" | "Illness — expectations suspended." |

Card click behavior — auto-advance:
- Execution / Recovery: commit dayType to local state, advance to Plan today step 2.
- Day Off / Sick: commit DayEntry immediately (isPlanned=true, dayType set, no plannedActionIds, no plannedRitualIds), navigate to /today State B.

Mobile (≤ 768px): cards in 2x2 grid (`grid-template-columns: repeat(2, 1fr)`, gap 12px). Card min-height stays 140px.

**Variant 3 — Compact dropdown** (used on Plan today step 2 to allow changing day type):
- Trigger: padding 6px 10px, 1px var(--border-subtle), 4px radius, transparent bg, hover var(--surface-hover) bg.
- Trigger content: small colored dot (8px, day-type accent color) + label (Inter 13px var(--text-primary)) + ▾ arrow (mono 10px var(--text-tertiary)).
- Examples: "● Execution ▾" with green dot, "● Recovery ▾" with purple dot.
- Click → popover lists all four day types with colored dots before each label, hover var(--surface-hover) row bg, ✓ next to current selection.
- Changing to Day Off / Sick from step 2: confirmation "Switch to {dayType}? Your planned actions and main task will be discarded." On confirm: dayType updates, plannedActionIds cleared, mainTaskActionId cleared, commit DayEntry, navigate to State B.
- Changing between Execution ↔ Recovery: no confirmation, just update dayType field, stay on step 2.

**Removed from previous spec**: the previous "card variant" used inside the (now-removed) Plan today MODAL — that pattern is gone along with the modal. The new step-1 large cards and step-2 compact dropdown replace it.

### 3.27 MainTaskCard

**Used in**: Today zone State B (most prominently), Plan today step 2 MAIN TASK section.

**Pattern**: emphasized action display with Star icon as canonical Main Task indicator.

**Two states**:

**FILLED STATE** (mainTaskActionId set):

Card styling:
- Background: var(--surface-raised).
- Border: 1px var(--accent) (visually emphasized vs other cards which use border-subtle).
- Border-radius: 6px.
- Padding: 16px 20px.
- 3px goal color stripe on left edge (full card height).

Content layout (flex align-center, gap 12px):
- Checkbox (18-20px desktop, 44px tap target on mobile).
- Lucide Star icon (14px, var(--accent), filled).
- Action title (Inter 16px medium var(--text-primary)).
- Meta line below title: parent breadcrumb (mono 12px var(--text-secondary)) — "Launch YouTube channel · Shoot video #1".
- Right side group (gap 12px): ImpactPill + Time + × clear button (var(--text-tertiary), hover var(--text-primary)).

Click affordances:
- Checkbox: bidirectional toggle (mark done with validation, click again re-opens).
- × button: Tier 1 confirmation "Clear Main Task? You can pick another from today's actions." On confirm → mainTaskActionId = null, transitions to UNSELECTED state.
- Click body (anywhere except checkbox/×): opens Action editor.

**DONE STATE** (filled state + action.status = done):

Card styling unchanged (border still accent, preserves emphasis as the day's win).

Content modifications:
- Checkbox: shows checked state.
- Star icon: still filled var(--accent).
- Title: var(--text-secondary), strikethrough.
- Meta line below title (replacing parent breadcrumb): "Done at HH:MM · Launch YouTube channel · Shoot video #1" (mono 12px var(--text-tertiary)).
- Right side: timestamp shown more prominently. × button still available.
- Optional "✓ Day's win" badge (mono 11px uppercase var(--accent)) — subtle celebration.

**UNSELECTED PLACEHOLDER STATE** (mainTaskActionId = null, day still planned):

Same dimensions as filled card.

Styling:
- Background: transparent.
- Border: 1px dashed var(--border-default).
- Border-radius: 6px.
- Padding: 16px 20px.
- Hover: dashed border becomes var(--accent).

Content (centered):
- Star icon (16px var(--text-tertiary)) + 8px gap + "Pick a Main Task" (Inter 14px var(--text-tertiary)).
- Click → opens compact dropdown of today's planned actions (those in plannedActionIds with status NOT IN done/dropped/cancelled).
- Each dropdown item: action title + parent breadcrumb (compact format).
- Click item → mainTaskActionId set, card transitions to FILLED state.

Empty case (no planned actions):
- Placeholder text: "No actions planned · add some first" (var(--text-tertiary)).
- Click is no-op.

**Cross-reference**: when an action is mainTaskActionId, that same action ALSO appears in TODAY'S ACTIONS list below MainTaskCard. The list row shows Star icon inline before title. Marking done from either place updates the same action (synced).

### 3.28 RitualSkipToggle

**Used in**: Today zone TODAY'S RITUALS list, Plan today step 2 RITUALS TODAY section.

**Pattern**: single button toggle (NOT dual Keep/Skip).

**Default state** (ritual is "happens today"):
- Button label: "Skip".
- Tier C link styling, var(--text-tertiary).
- Inter 13px.

**Skipped state** (after click):
- Row faded (opacity 0.5).
- Button label: "Restore".
- Tier C link styling, var(--accent).
- Click → unfaded.

**Behavior**:
- Click Skip → ritual ID added to DayEntry.skippedRitualIds, row visually faded.
- Click Restore → ritual ID removed from skippedRitualIds, row returns to normal opacity.
- Toggle is per-day (resets next day).

**Why single button**: default = "ritual happens today" (per ritual schedule). Skip is the explicit opt-out. No need for "Keep" — keeping is the default. Removes a click and reduces UI clutter.

### 3.29 ActionPicker (two-pane picker)

**Used in**: Plan today step 2 ACTIONS section, Session Builder ACTIONS section.

**Pattern**: two-pane picker for selecting and ordering actions, with inline-add at bottom of Available pane.

**LEFT PANE — "Available" (60% width on desktop)**:

1. **Filter dropdowns** at top of pane: GOAL / PROJECT / Status (Backlog / Planned / All).
   - Use the standard FilterDropdown component (custom, NOT native `<select>`).
   - Same visual style as filter dropdowns on list pages.

2. **"ALREADY SCHEDULED" sub-section** (optional, top of action list): pre-checked actions where context has scheduledDate=today set before today.

3. **Action list**: 48px rows (taller than the previous 40px to comfortably fit two pills + checkbox + two-line content).
   - Layout (left to right): 3px goal stripe + checkbox + two-line content (flex: 1, min-width: 0) + right cluster.
   - Top line: title (Inter 14px medium var(--text-primary)).
   - Bottom line: parent breadcrumb (mono 11px var(--text-secondary)) — `{Goal} · {Project}`. NO impact, NO time inline.
   - Right cluster (gap 8px between pills, gap 12px from preceding content):
     - **ImpactPill** (prominent variant, see § 3.24): goal-tinted, format "I8" / "I4".
     - **TimePill** (see § 3.24c): neutral var(--surface-hover) bg, format "20m" / "1h 30m".

4. **Bidirectional checkbox toggle**: click adds to Selected pane, click again removes. Sync with Selected pane in real-time. Rows already in Selected: dimmed (opacity 0.5) with checkbox checked in Available pane.

5. **Inline-add input** at bottom of pane (sticky to pane scroll bottom):
   - Two-line layout, ~64px min-height, 1px dashed var(--border-default), 6px radius, 10px 12px padding.
   - Hover: dashed border → var(--accent).
   - **Line 1**: "+" (mono 14px var(--text-tertiary)) + 8px gap + transparent input "Quick add new action..." (Inter 14px var(--text-primary)).
   - **Line 2**: inline text reading `in {goal-color-dot} {GoalTrigger} · {ProjectTrigger}`. The "in" word and "·" separator are plain Inter 13px var(--text-secondary). GoalTrigger and ProjectTrigger are **inline text buttons** (NOT boxed dropdowns):
     - Inter 13px var(--text-primary).
     - 1px dotted underline var(--text-tertiary).
     - Hover: underline → var(--accent).
     - Focus: 2px outline ring at var(--accent), 2px offset.
     - No background, no border, no chevron.
     - Truncate at 200px max-width; full name in tooltip.
   - Click GoalTrigger or ProjectTrigger → popover (existing FilterDropdown or compatible primitive). Popover anchored below trigger, 8px offset, width max(trigger, 240px). Mobile: bottom sheet per BEHAVIORS § 10.11.
   - Goal popover: active goals only. Project popover: active projects under currently-selected goal only.
   - **Smart default**: if user has 1 active goal and that goal has 1 active project, both triggers pre-filled with those values on first render. No separate "Change" affordance — triggers are always clickable.
   - **Session persistence**: after creating an action with goal X / project Y, next inline-add invocation pre-fills the same. On fresh page load: smart default OR most recent action's parent within last 24h OR placeholder text "Pick goal" / "Pick project".
   - Type title + Enter → action created with status=Backlog (or Planned with scheduledDate=today in Plan today context), parent set from triggers, Impact and Time empty (filled later).
   - Action appears immediately in both Selected pane and Available pane (with checked checkbox).
   - Toast: "Action created and added to today".

**RIGHT PANE — "Selected" (40% width on desktop)**:

- Heading: "SELECTED · {N}".
- Empty state: dashed border placeholder ("No actions selected. Pick from the list.").
- Selected actions: numbered (1./2./3.), drag-reorderable rows.
- Each row: drag handle (#) + number + title + parent breadcrumb + TimePill on right + × remove button (var(--text-tertiary), hover var(--text-primary)).
- ImpactPill is NOT shown in the Selected pane (the selection itself is what matters there; pane is focused on order and total time).
- × remove syncs with Available pane (un-checks checkbox).
- Aggregate below list: "Estimated time: {H}h {M}m" (mono 12px var(--text-secondary)) — plain text, NOT a pill (it's a sum across rows).

**REMOVED from previous spec**: Quick Start preset cards (Heavy Lift / Quick Moves) — removed from Plan today step 2 to focus the pane on browsing and picking. The Big Frog / Easy Wins terminology may resurface later as Sort options ("Sort: Heavy lift first" / "Sort: Quick wins first"), but is not surfaced as separate UI cards in v1.

**Mobile**: stacked vertically. Available pane on top, Selected pane below. Each pane is full width, scrolls independently.

**Validation**: submit can be clicked even with 0 selected actions (parent flow's responsibility to decide). On Plan today step 2: "Start day" can commit DayEntry with empty plannedActionIds — the user might want to mark dayType only and add actions ad-hoc later.

### 3.30 TierBadge

**Used in**: User menu popover (Subscription row), /settings/subscription current plan card and comparison cards, /admin/components reference.

**Pattern**: small mono pill indicating subscription tier (Free / Pro).

**Specs**:
- Inline-flex, padding 2px 6px, border-radius 3px.
- Mono 10px uppercase letter-spacing 0.06em.

**FREE variant** (default for all users):
- Text: "FREE", color `var(--text-tertiary)`.
- Background: transparent.
- Border: 1px solid `var(--border-subtle)`.

**PRO variant** (paid users):
- Text: "PRO", color `var(--accent)`.
- Background: `var(--accent)` at ~10% opacity.
- Border: 1px solid `var(--accent)`.

### 3.31 UserMenuPopover

**Used in**: Sidebar bottom area (anchored to user identity trigger), /admin/components reference.

**Pattern**: popover anchored above the sidebar user identity trigger. Contains identity header + Settings + Subscription + Sign out.

**Specs**:
- Background: `var(--surface-elevated)`.
- Border: 1px `var(--border-subtle)`.
- Border-radius: 6px.
- Padding: 4px 0 (vertical only — items have own horizontal padding).
- Min-width: 240px.
- Z-index: 100 (above sidebar, below modals).
- Shadow: NONE (surface elevation is the differentiator).
- Position: bottom edge of popover aligned with top edge of trigger (opens upward into available space). When sidebar is collapsed, anchor to right of trigger instead.

**Content** (top to bottom):
1. **Identity header** (read-only): padding 12px 14px, avatar (32px) + 10px gap + two-line text (display name Inter 13px medium + email Inter 11px var(--text-tertiary)). 1px var(--border-subtle) bottom border.
2. **Settings** menu item: padding 8px 14px, lucide Settings icon + label "Settings". Click → /settings, close popover.
3. **Subscription** menu item: same row spec, lucide Sparkles icon + label "Subscription". Right side of row: subtle "All-In" pill if user is All-In (Inter 11px medium, var(--accent) color, no background); nothing if Free. Click → /settings/subscription, close popover.
4. **Admin** menu item (CONDITIONAL — only shown when "Show admin tools" toggle in Settings is ON): same row spec, lucide Wrench icon + label "Admin". Click → /admin/components, close popover.
5. 1px var(--border-subtle) divider with 4px vertical margin.
6. **Sign out** menu item: same row spec, lucide LogOut icon + label "Sign out". Click → Tier 1 confirmation modal "Sign out of ActOS?". On confirm: clear session, redirect to /signin.

**Dismissal**: click outside / Esc / item click → close.

### 3.32 SidebarUserTrigger

**Used in**: Sidebar bottom area only.

**Pattern**: clickable button containing avatar + user identity, opens UserMenuPopover (3.31).

**Expanded sidebar specs**:
- Layout: flex row, gap 10px, align-items: center, flex: 1.
- Padding: 6px 8px.
- Border-radius: 4px.
- Background: transparent. Hover var(--surface-hover). Active (popover open) var(--surface-hover).
- 150ms ease-out transition.
- Content: avatar circle (32px, initials on hashed color background) + two-line text (display name Inter 13px medium var(--text-primary) ellipsis + email Inter 11px var(--text-tertiary) ellipsis).

**Collapsed sidebar specs**: only avatar visible (centered in collapsed sidebar width). Click opens popover anchored to the right.

**Companion in same row**: small "?" Shortcuts icon button (32x32px, lucide HelpCircle 16px, opens existing Shortcuts modal). Hidden in collapsed sidebar (Shortcuts accessible via ⌘K instead).

---

### 3.33 ThemeToggle

**Used in**: Settings → Account section only.

**Pattern**: 3-segment control for choosing between System / Light / Dark.

**Specs**:
- Container: 1px `var(--border-default)` border, 4px radius, 32px tall.
- Three segments equal width (each ~80px on desktop, equal-flex on mobile).
- 1px vertical divider between segments using `var(--border-subtle)`.
- Labels: "System", "Light", "Dark" — Inter 13px.
- Active segment: `var(--surface-hover)` background, `var(--text-primary)` text, weight 500.
- Inactive segments: transparent background, `var(--text-secondary)` text, weight 400.
- Hover on inactive: `var(--text-primary)`.
- 150ms ease-out transition on background and text color.
- No icons.

**Behavior**: clicking a segment immediately applies the theme — no save button, no toast. The change is its own confirmation. Persistence and resolution logic specified in 10-BEHAVIORS § 11.8.

**Helper text**: a single line of Inter 12px `var(--text-tertiary)` placed above the control: "Defaults to your system setting."

**Active segment indication**: shows the user's stored choice (`'system'` / `'light'` / `'dark'`), NOT the resolved theme. If user picked System and OS is dark, the System segment is highlighted, not Dark.

---

### 3.34 InfoPopover

**Used in**: metric-explanation surfaces only — Impact field next to label in Action/Ritual create modals (L1); VALUE/EFFORT row on Goal page (`/goals/:id`) hero and Project page (`/projects/:id`) hero (L2). Deliberately NOT used on list views (`/today`, `/progress`, `/goals` cards, project list cards) — see DESIGN-DECISIONS "Metric explanation strategy" for rationale.

**Pattern**: small info icon trigger + popover with explanatory text. Used to explain Impact, Value, Effort terminology without taking permanent UI space.

**Trigger specs**:
- Icon: lucide `Info`. Plain icon — no surrounding circle, no border, no background.
- Size: 12px (compact, used at L2 next to inline metrics) or 14px (slightly larger, used at L1 next to form labels).
- Default color: `var(--text-tertiary)`.
- Hover color: `var(--text-secondary)`.
- Cursor pointer.
- Inline-flex, vertically aligned with the text it sits next to.
- Click and hover both open the popover. Touch: tap to open.

**Popover specs**:
- Background: `var(--surface-elevated)`.
- Border: 1px `var(--border-subtle)`, 6px radius.
- Padding: 12px (L1, smaller content) or 16px (L2, more content).
- Max-width: 280px (L1) or 320px (L2).
- Body: Inter 13px `var(--text-primary)`, line-height 1.5.
- Bold labels inside body: Inter 13px medium.
- Auto-flip placement (Radix `side="top"` with `avoidCollisions`).
- Esc / click-outside / re-click-trigger closes.

**Content rules**:
- L1 (form-field tooltips): one sentence. Don't reference downstream metrics. User is creating a task — explain only the field they're filling.
- L2 (metric bars): two short paragraphs. Define both terms (e.g., Value AND Effort) together because their meaning depends on the contrast.
- No links, no buttons, no scroll inside popover. If content needs more depth → that's L4 territory (separate page, deferred).

**Single source-of-truth component**: one InfoPopover component used in all locations. Different copy per location, same chrome.

---

## 4 — Patterns

### 4.1 Creation affordance pattern

**Visual signature**: dashed border + "+" character.

**Used as a system signal**: any time the user sees dashed border + "+", they know it's a place to create something new.

**Forms**:
- **Ghost card** in a grid (large, full card dimensions).
- **Inline-add row** below a list (full width, 48-56px height).

**Hover behavior**: dashed becomes solid accent; "+" and text become primary color.

### 4.2 Inline-add input

**Used in**: Today zone (sticky bottom on mobile), Project page actions list (per status group on desktop), Reviews drill-down "+ Add action to this day".

**Removed from**: /actions list page (replaced by header "+ New action" button + creation modal).

**Specs**:
- Height: 48px.
- Width: 100% of container.
- Background: transparent.
- Border: 1px dashed `var(--border-default)`.
- Border-radius: 4px.
- Padding: 0 16px.

**Content** (flex):
- "+" character: JetBrains Mono 16px `var(--text-tertiary)`.
- 12px gap.
- Input field: Inter 13px `var(--text-primary)`, transparent background, no border.
- Placeholder: "Add an action..." in `var(--text-tertiary)`.
- Right side (small): "⏎" hint or similar (visible on focus).

**Behavior**:
- Click anywhere on row → input focuses.
- Type title, press Enter → action created.
- Action editor does NOT open (fast capture).
- Input clears, ready for next entry.

**Hover**: dashed border → `var(--accent)`.

### 4.3 Removed pattern — Capture input

The dashed-border capture input previously used at the top of /ideas has been removed. Idea creation now goes through the standard "+ New idea" header button → Idea creation modal (matching all other entity creation flows).

### 4.4 Status pill

**Used on**: action rows (right side, top line) for date or status.

**Specs**:
- Inline element.
- Padding: 2px 8px.
- Background: `var(--surface-hover)` (default) or status-color tinted.
- Border-radius: 2px.
- Mono 10-11px uppercase letter-spacing 0.06em.
- Color: `var(--text-secondary)` (default) or status semantic color.

**Examples**: "TODAY", "TOMORROW", "MAY 12", "DELEGATED", "OVERDUE 5d", "DONE", "DROPPED".

### 4.5 State indicator dot

**Used on**: goal columns, goal cards, project cards.

**Specs**:
- 8px diameter circle.
- Color:
  - `var(--state-active)` if entity had Done activity within last 7 days.
  - `var(--state-stalled)` otherwise.
- Hover: tooltip with "Active" or "Stalled" + last activity date.

**Position**: typically top-right of entity card/column header, before "..." menu.

### 4.6 Breadcrumb

**Used in**: Goal page header, drill-down headers.

**Specs**:
- Inline-flex, gap 8px.
- Mono 11px uppercase letter-spacing 0.06em `var(--text-tertiary)`.
- "← " prefix character.
- Hover on link: `var(--text-secondary)`.
- Click → navigate to parent.

### 4.7 Empty states

Two distinct states:
- **True empty** (entity list has zero items, no filters applied) — full empty state with headline + description + primary CTA.
- **Filtered empty** (list has items but current filters yield zero) — minimal inline message with "Clear filters" link, NOT a full empty state.

**True empty — component spec**:
- Centered in page content container, vertical flex, gap 12px, align-items: center.
- Padding-top: 80px (NOT vertically centered in viewport — that floats too low on tall screens).
- Max-width: 480px, text-align: center.

Content (top to bottom):
1. Headline: Inter 18px medium var(--text-primary). Short factual prompt.
2. Description: Inter 14px regular var(--text-secondary), line-height 1.5. 1-2 sentences explaining what lives on the page.
3. Primary CTA: Tier A button. 16px gap above the button.
4. Optional conditional hint: Inter 12px var(--text-tertiary), shown only when relevant prerequisite missing.

**Tone rules** (strict): factual, no motivational copy, no exclamation marks, no emoji, no illustrations or icons above headline, no box shadows.

**Per-page true empty copy**:

| Page | Headline | Description | CTA | Conditional hint |
|------|----------|-------------|-----|------------------|
| /actions | "No actions yet." | "Actions are the concrete next steps under your projects. Capture them here as you think of them, then mark them done as you complete them." | "+ New action" | "You'll need a goal and project first." (only if no active goals/projects) |
| /delegated | "Nothing delegated yet." | "When you delegate an action to someone, it appears here with the expected return date so you can track what's outstanding." | "+ Delegate" | — |
| /rituals | "No rituals yet." | "Rituals are recurring actions you commit to — daily reading, weekly review, anything you want to do consistently. They build a multiplier on your effort over time." | "+ New ritual" | — |
| /goals | "No goals yet." | "Goals are the top of the hierarchy — the outcomes you're working toward. You can have up to 3 active goals at a time." | "+ New goal" | — |
| /projects | "No projects yet." | "Projects sit under goals and group related actions. Create one for each concrete piece of work you're moving forward." | "+ New project" | "You'll need a goal first." (only if no active goals) |
| /ideas | "No ideas yet." | "Capture rough thoughts here before they become actions or projects. Ideas wait until you decide what to do with them." | "+ New idea" | — |
| /sessions | "No sessions yet." | "Sessions are timed focus blocks where you commit to a specific list of actions. Use Pomodoro, continuous, or custom timing." | "+ Start a session" | "You'll need at least one action in Backlog or Planned." (only if no eligible actions) |

**Review pages — plain inline message** (no CTA, no description block, no button):

Review pages are read-only archives — there's nothing to "create" from here. Use Inter 14px var(--text-secondary), centered, padding-top 80px:

| Page | Copy |
|------|------|
| /reviews/days | "No days tracked yet. Days appear here once you plan or close them." |
| /reviews/weeks | "No weeks tracked yet. Weeks appear here once you have day activity." |
| /reviews/months | "No months tracked yet. Months appear here once you have day activity." |

**Filtered empty state** (separate from true empty, applies to ALL list pages including review pages):
- Inter 14px var(--text-secondary), centered, padding 48px 24px (smaller padding than true empty).
- Copy: "No items match these filters."
- Below copy: Tier C link "Clear filters" (Inter 13px var(--text-secondary), hover var(--text-primary), no border) that resets all dropdowns to defaults.

### 4.8 Loading states

**Pattern**: subtle skeleton placeholders matching the layout that's loading.

**Specs**:
- Background: gradient pulse `var(--surface-hover)` → `var(--surface-elevated)` → `var(--surface-hover)`.
- 1.5s animation duration.
- Border-radius matches the actual element.
- No spinner / loader icons.

**For LocalStorage prototype**: hydration is fast, skeleton may flash briefly or be skipped entirely. No persistent loading required.

### 4.9 Hover states

**Universal rules**:
- Cards / rows: `var(--surface-hover)` background, cursor pointer.
- Buttons: lighter accent or border change (per Tier A/B/C specs).
- Links: color change to `var(--text-primary)`.
- Icons: color change to `var(--text-secondary)` or `var(--text-primary)`.

**Transitions**: 150ms ease-out for all hover transitions.

### 4.10 Multi-line list rows

**Used in**: /actions, /delegated, /reviews/days, Today zone, drill-down sub-groups.

**Specs**: see `3.10 ActionRow` for exact specs (52-56px height, two-line layout, etc.).

**Goal color stripe at left edge**: 3px wide, full row height, in goal color. Provides visual goal context without text.

---

## 5 — Pages (layouts)

### 5.1 Today

Medium tier (1024px). Three states, all rendered at the /today URL (no separate routes — state derived from DayEntry data):

- **STATE A — Not planned** (no DayEntry, OR DayEntry.isPlanned = false): single CTA card "What are you doing today?" with "Start your day →" button.
- **STATE B — Planned, in progress** (DayEntry.isPlanned = true AND DayEntry.isClosed = false): the existing Today zone — MainTaskCard + TODAY'S ACTIONS list + inline-add + TODAY'S RITUALS list + Close day button. LOOKING BACK section below.
- **STATE C — Closed, recap** (DayEntry.isClosed = true): full-page recap (see "Plan today" and "Close day" below).

**Plan today flow** (full-page, replaces State A content while planning, two-step wizard):

Step 1 — Day Type selection:
- Vertically centered composition. Heading "What kind of day is it?" (Inter 24-28px medium primary text). Optional sub-line "Pick one to start planning." (Inter 14px var(--text-secondary)).
- Four large colored Day Type cards (see § 3.26 variant 2): Execution (green) / Recovery (purple) / Day Off (gray) / Sick (amber-red). Click auto-advances; Day Off / Sick commit DayEntry directly and skip to State B.
- "Cancel" link top-right.

Step 2 — Plan details (only for Execution / Recovery):
- Compact Day Type dropdown at top (see § 3.26 variant 3) for changing dayType without leaving step 2.
- Sections vertically with 32px gap: ACTIONS (two-pane picker via § 3.29), MAIN TASK, RITUALS TODAY (with MultiplierPill + TimePill rows).
- Each section has bigger heading (Inter 18-20px medium primary): "Pick what you'll work on today." / "What single thing makes today a win?" / "Mark anything you want to skip."
- Footer: "Cancel" link left, "Start day" button right (Tier A).

NO auto-open behavior (user must click "Start your day →"). NO Quick Start preset cards.

**Close day flow** (full-page recap, State C):

Triggered by "Close day" button in State B, OR automatically at midnight (DayEntry.isClosed = true, closedAt = previous 23:59:59).

Layout:
- Page header: "Day closed" (Inter 32-36px medium) + date + DayTypeIndicator compact + conditional greeting "Solid work today." (only when total focused time ≥ 2 hours).
- 1px var(--border-subtle) divider.
- Stat tiles row (5 tiles when sessions exist, 4 when not): VALUE ADDED / ACTIONS DONE / RITUALS DONE / SESSIONS (only when ≥1 session today) / TIME INVESTED. Each tile: var(--surface-raised) bg, 1px var(--border-subtle), 6px radius, padding 16px 20px. Mobile: 2 per row.
- PROJECTS section (only if any actions today touched projects).
- GOALS section (only if any goal progress).
- ACTIONS DONE list.
- RITUALS section (Done / Skipped / Missed groups).
- NO REFLECTION section anywhere — reflection field has been REMOVED from the data model.
- Footer: "Re-open day" link left (Tier C), "View in Days →" link right (var(--accent)).

LOOKING BACK section (most recent active day) below TODAY zone in States A/B (NOT in State C since C IS the recap).

### 5.2 Progress

Wide tier (1280px). See `08-DESIGN-DECISIONS.md` "Progress page" for layout. Sections (top to bottom): Hero (3 goal columns), Time Investment (per-goal with project nesting), Recently Closed Projects & Goals, Recently Closed Actions, Currently Delegated.

### 5.3 Goals

Medium tier. See `08-DESIGN-DECISIONS.md` "Goals page" for layout. Sections: Active (single grid), Completed, Dropped.

### 5.4 Goal page

Medium tier. See `08-DESIGN-DECISIONS.md` "Goal page" for layout. Includes hero stats, success criteria, projects, rituals, activity, ideas.

### 5.5 Projects

Medium tier. See `08-DESIGN-DECISIONS.md` "Project page" for layout (decisions for project detail). Project list page (/projects) follows similar sectioned grid pattern as /goals.

### 5.6 Project page

Medium tier. See `08-DESIGN-DECISIONS.md` "Project page" for layout. Two-column on desktop: title + hero stats + description + actions (left); metadata right rail in stack layout — Status / Parent Goal / Created / Age / Time invested / Last activity, label-on-top + value-below per field, dividers between. Single column on mobile (rail stacks below main content).

### 5.7 Actions

Medium tier. Action rows with goal stripes (see ActionRow 3.10). Filters above. Bidirectional checkbox toggle (mark done ↔ re-open). FAB on mobile. See `07-SCREENS-INVENTORY.md` Section 4.5.

### 5.8 Delegated

Medium tier. Sidebar nav item with lucide Send icon (in Execution group). Header (unified pattern, see 2.2): title "Delegated" + "+ Delegate" button (opens Action create modal pre-filled with Delegated status). Aggregate counts meta line "{N} ACTIVE · {N} OVERDUE · {N} DUE TODAY" (color-coded when > 0). Tabs: Active / Returned. Filters: DELEGATE / GOAL / DATE / Sort. DelegatedRow pattern (3.10b — desktop pill, mobile inline) with ColorCodedDatePill (3.25). See `07-SCREENS-INVENTORY.md` Section 4.6.

### 5.9 Rituals

Card grid with stats row above and pending today list. Ghost "+ Add ritual" card. See `07-SCREENS-INVENTORY.md` Section 4.7.

### 5.10 Ideas

Full-width list pattern (matches /actions). Unified header (title "Ideas" + "+ New idea" button + meta line). Filters: STATUS / GOAL / DATE / Sort. Rows use the standard ActionRow pattern (3px goal stripe, two-line content) with status pill on right (CAPTURED / CONVERTED / DISCARDED) instead of impact pill — no checkbox. Click row → Idea editor slide-in (480px desktop / bottom sheet mobile). "+ New idea" → Idea creation modal (640px / bottom sheet). Master-detail layout has been removed. See `07-SCREENS-INVENTORY.md` Section 4.8.

### 5.11 Reviews / Days

List page + drill-down. See `08-DESIGN-DECISIONS.md` "Reviews / Days" for layouts.

### 5.12 Onboarding

See `08-DESIGN-DECISIONS.md` "Onboarding" for layout.

### 5.13 Auth screens

`/auth` (combined sign in / sign up), `/auth/verify` (6-digit code prompt after signup), `/auth/reset` (forgot password placeholder). All share the same chrome: ActOS logo centered 48px from top + form card max-width 400px vertically centered + `← Back to homepage` link bottom-left.

Sign in / sign up modes toggle via bottom link. URL hash `/auth#signup` deep-links to sign up mode. 7 elements switch between modes: heading, sub-line, fields (Name appears in signup), Forgot password link, submit button, footer toggle, terms note. Email field persists across toggle; password clears.

Social section: separator `or` + Google + Apple buttons (full-width, 44-48px). Click currently shows "Coming soon" modal — real OAuth in v1.x.

Auth verify (`/auth/verify`): 6 single-character inputs (56×56px desktop, 48×48 mobile), `inputMode="numeric"`, auto-advance focus, paste-aware, auto-submit on 6th digit. Verify button explicit fallback. Resend with 30s cooldown. Change email link returns to `/auth#signup`. Error states inline below inputs.

See `08-DESIGN-DECISIONS.md` § "Auth flow" for full spec.

### 5.14 Landing (`/`)

Public site root. Two-screen experience:
- Screen 1 (above the fold): top bar (Logo + nav) + compressed hero (headline two hard-break lines, sub-line, primary CTA) + product demo frame (16:10, orange-tinted shadow). Sticky top bar with backdrop blur after 80px scroll. Subtle radial orange glow behind hero. Scroll hint chevron at bottom.
- Screen 2: FAQ section (heading + manifesto link standalone + 5 accordion items) + footer.

Footer has language switcher (dropdown with native names, opens upward).

See `08-DESIGN-DECISIONS.md` § "Public site (landing, manifesto, pricing)" → Landing.

### 5.15 Manifesto (`/manifesto`)

Medium-style essay layout. Article container max-width 720px centered.

- Byline: 48px circle avatar (initials `SV` placeholder, swap to `<img>` later) + author name `Stanislav Vasilevschii` + role + date.
- Title: Inter 56px / 36px medium, left-aligned (Medium convention).
- Deck: 24px / 18px secondary.
- Body: Inter 19px / 17px, line-height 1.7. H2s 28px medium with 64px top margin. Drop cap on first paragraph. Pull quote with 3px orange left border + 24px left padding. Bullet lists, italic/bold inline.
- Closing CTA section below body: `Stop scheduling. Start moving.` line + orange button + reassurance.

Content read from `actos.cms.manifesto.{locale}` LocalStorage if exists (from admin editor), else from i18n keys.

### 5.16 Pricing (`/pricing`)

One-screen page. Container max-width 960px for cards.

- Hero heading 48px / 32px medium, sub-line 18px secondary.
- 2 cards side-by-side, 24px gap, equal heights, 48px padding inside each.
- Free card: outline-style. `FREE` badge mono 11px tertiary, `$0` 56px + `forever` inline secondary, tagline 15px, 6 features with check icons, outline button full-width.
- All-In card: 1px `var(--goal-2)` border emphasized. `RECOMMENDED` pill (24px height, orange bg, `var(--surface-base)` text, mono 11px) absolutely positioned `top: -12px; right: 32px` (partially outside border). `ALL-IN` badge in orange, `$12 /mo`, annual sub-line `or $120/yr — save 17%` 13px tertiary, tagline 15px, 6 features, filled orange button.
- Refund line below cards: max-width 640px centered, Inter 14px. `30-day refund.` bold + body.
- Pricing FAQ: heading `Common questions.`, accordion with 4 items.

### 5.17 Admin: manifesto editor (`/admin/manifesto`)

Founder-only WYSIWYG editor for manifesto content. Desktop only.

- Sticky header: ActOS logo + `Cancel` + `Save` orange button.
- Tabs row: `[EN] [RU] [DE] [ES]` left + `Last saved` timestamp right.
- Split view: editor left + live preview right (each 50% viewport width minus margins).
- Editor: TipTap-based, toolbar with B / I / H1 / H2 / paragraph / blockquote / bullet list / hr / link. Title input separate from body. Deck input separate from body. Editor body matches public manifesto typography.
- Preview: renders manifesto exactly as public page (byline, title, deck, body).
- Storage: `actos.cms.manifesto.{locale}` per locale.
- Gated by `isAdmin: true` flag.
- Mobile shows "desktop-only" message.

See `08-DESIGN-DECISIONS.md` § "Manifesto admin editor".

### 5.18 Settings

Narrow tier (720px). Sections: Account (display name, email, **Theme**, demo subscription tier toggle, "Show admin tools" dev toggle), Data (export, import, reset). Subscription section has been REMOVED from /settings — it's now its own page at /settings/subscription. Sign out button has been REMOVED — it lives in the user menu popover (§ 3.31).

**Theme row**: ThemeToggle component (§ 3.33) placed after display name / email rows and before destructive actions. Helper text "Defaults to your system setting." above the control. Always visible — not behind any toggle, not in a collapsed section.

### 5.19 Subscription page

URL: `/settings/subscription`. Narrow tier (720px).

Header: breadcrumb "← SETTINGS" (mono uppercase, clickable) + title "Subscription" + sub-line "Manage your plan." + 1px divider.

**Status line at top** (Inter 14-15px, var(--text-secondary)): "You're on Free." or "Your plan: All-In · Active · Next billing {date}".

**Free card**: var(--surface-raised) bg, 1px var(--border-subtle), padding 24px. Plain treatment. Title "Free plan" + features list. Status pill ("Active · No payment") if current.

**All-In card**: var(--surface-raised) bg, **1px var(--accent) border** (emphasized vs Free), padding 24px. Title "Go All-In — $12/mo" with sub-line "Everything we ever build." in var(--accent) color. Features list with ✓ icons. CTA button "Go All-In" (Tier A primary).

**Annual option**: small note below All-In card (Inter 13px, var(--text-tertiary)): "Save 17% with annual — $120/yr (vs. $144 monthly). [Switch to annual]" — text link to demo modal in v1.

**Lifetime card** (optional, defer if Stripe SKU not configured): smaller card below, var(--surface-raised) bg, no accent border. Title "All-In Lifetime — $200 once" + sub-line "For believers. Pay once, never billed again, every feature ever. Limited availability." CTA "Go Lifetime" (Tier A).

**On Free**: All-In card → CTA "Go All-In" (demo modal). Free card → "Current plan" disabled.
**On All-In**: Free card → CTA "Downgrade to Free" (Tier 2 confirmation requiring "DOWNGRADE" typed). All-In card → "Manage subscription" (demo modal).

Mobile: cards stack vertically.

Demo data only in v1 — real Stripe integration deferred. Demo modals say: "All-In payment is coming soon. We'll email you when it's ready." for upgrade attempts; "Subscription management is coming soon." for manage attempts.

### 5.20 Admin components page (dev tool)

URL: `/admin/components`. Wide tier (1280px). Visual smoke test rendering every component in every state for QA. Single long scrollable page, NO tabs/sidebar inside.

Gated behind "Show admin tools" toggle in /settings → Account (default OFF). When OFF: URL works directly (acceptable for LocalStorage prototype) but no nav link. When ON: "Admin" link appears in user menu popover between Subscription and Sign out (lucide Wrench icon).

Page header sticky with backdrop blur: title "Components" + sub-line + data source toggle (Live data / Mock data, Mock as default).

Sections in order: Atoms (color tokens, typography, spacing) → Buttons → Inputs → Pills (ImpactPill / TimePill / MultiplierPill / ColorCodedDatePill / status pills / TierBadge) → Rows (ActionRow / DelegatedRow / IdeaRow / RitualRow) → Cards (Goal / Project / Ritual / Day Type) → Headers and meta → Filter bar → Empty states → Modals → Slide-in editors → Toasts → Avatar and user menu → Sidebar → Day Type cards → Goal column on Progress hero.

Footer: "Last updated: {date}" + "Coverage: {N} components / {N} states."

Page is for developer/QA use only — never surfaced to end users.

---

## 6 — Editors (slide-in panels)

See `08-DESIGN-DECISIONS.md` for full specs of each:
- Action editor
- Project editor
- Goal editor
- Ritual editor
- Idea editor (slide-in for edit mode, modal for create mode — see 2.8)

All slide-in editors share the slide-in panel pattern (3.17).

---

## 7 — Tone & copywriting

### Voice principles

- **Factual, not motivational.** "You closed 3 projects this month" not "Great job — you crushed 3 projects!"
- **No emoji** in product copy. Unicode characters as semantic markers acceptable.
- **No badges, achievements, streaks-as-pressure.** Visible progress is enough.
- **Concise.** No filler words.
- **Respectful of user's intelligence.** No condescending explanations.

### Section heading conventions

- **Mono uppercase** for section labels (e.g., "TODAY", "ACTIONS", "RITUALS", "ENERGY").
- Letter-spacing 0.06em-0.08em for tighter headings to wider tracking on smaller sizes.
- Color: `var(--text-tertiary)` typically.

### Empty state copy patterns

Per-page empty state copy is specified in 4.7 (Empty states). General principles:

- Headline format: "No {entities} yet." or "Nothing {action verb} yet."
- Description: 1-2 sentences explaining what the page is for. No motivational copy.
- Filtered-empty: "No items match these filters." with "Clear filters" link.
- Review pages: passive informational message, no CTA, since these are read-only archives.

### Action button copy

- Primary actions: verb + noun. "Plan day", "Close day", "Create new action", "Save action".
- Confirmations: state consequence factually. "This cannot be undone."
- Cancel: just "Cancel" (no "Nevermind" or apologetic copy).

### Tone failures to avoid

- "Welcome to your productivity journey!" — too marketing.
- "You've been crushing it!" — patronizing.
- "Keep up the streak!" — pressure mechanic.
- "Don't break the chain!" — pressure mechanic.
- "Sorry, this is permanent..." — apologetic when not warranted.
- Emoji in product copy (separate from semantic Unicode markers).

---

## 8 — Anti-patterns (what we never do)

- ❌ Box shadows for depth (use surface tone shifts and hairlines).
- ❌ Bright/saturated accent colors used widely (accent is for emphasis only).
- ❌ Animations beyond functional purpose (no decorative animations).
- ❌ Streaks, achievements, badges, gamification.
- ❌ Motivational copy ("You can do it!", "Crush your goals!").
- ❌ Emoji in product UI.
- ❌ Pop-up modals for non-critical hints (use inline guidance instead).
- ❌ Auto-completing fields the user didn't fill (suggestions yes, auto-fill no).
- ❌ Hiding optional features from settings/UI when toggled off (use "+ enable tracking" hints instead — discoverability).
- ❌ Punishing users for missed days (no streak resets, no shame-banners).
- ❌ Pretending the system is intelligent ("Looks like you're feeling productive!" — no).
- ❌ Dark patterns to drive engagement (no notification spam, no daily check-in pressure).
- ❌ Box shadows in light theme to "compensate" for less surface contrast (use `--border-subtle` hairlines and `--surface-raised` against `--surface-base` instead — same approach as dark theme).
- ❌ Component-level theme overrides (`[data-theme="light"] .my-component { ... }`) — fix the token, not the component. Tokens are the single source of truth.
- ❌ Hardcoded hex values anywhere in components — must come from a CSS variable so themes can swap.
