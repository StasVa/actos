# ActOS — Roadmap

> **Document role:** scope and timing.
> **Read alongside:** `04-FEATURES.md`.

---

## v1 — Goals of the release

**Promise to the user:** *"Set 2–3 goals. See, every day, what moves you toward them. The product is opinionated about how — daily planning, real metrics, no toggles."*

A user who signs up should:
1. Complete onboarding with a working system.
2. Use Today as their daily operational anchor.
3. Use Progress for strategic review.
4. See progress toward their goals visibly.
5. Be able to delegate (mark only).
6. Plan their day and close it (always-on core, no toggles).
7. Capture ideas freely, convert when ready.
8. Review past days and weeks via Reviews/Days and Reviews/Weeks.

If all of the above works smoothly, v1 is done.

---

## v1 — Scope

### In v1

**Always-on core**
- Goals (max 2–3 active, types: short / mid)
- Projects under goals (page-based creation, rich-text description, references)
- Project description Read/Edit modes with TipTap toolbar (Lucide icons)
- Project actions: Mark complete / Drop (cascade) / Delete / Split / Close-and-continue / Move to Goal
- Actions (one-time) with required Impact 1-10 and required Time when Log Time on
- Status timestamps (plannedAt, completedAt, delegatedAt, droppedAt, cancelledAt)
- Status timestamp click → /reviews/days/{date} navigation
- Past date scheduling triggers Done conversion with confirmation
- Planned status as derived from scheduledDate (not explicit user choice)
- Rituals (recurring) with full status set
- Ritual Skipped status
- Ritual consistency-based Impact growth (×1.00 → ×2.00)
- System ritual templates (Weekly project audit, Monthly goal review)
- Value ≠ Effort calculation (parallel metrics: Value tracks goal progress, Effort tracks personal workload with 20% delegation discount)
- Project Cost & Goal Cost recalculation on Drop/Cancel
- Delegation with full /delegated page (Active/Returned tabs, color-coded return date pill, direct create flow, aggregate counts)
- Main Task of the day with Star icon (canonical indicator across app, rich card display, bidirectional checkbox toggle)
- Visualizing progress (per-goal, per-period)
- Goal page features
- Goals page (/goals) with rich cards
- Progress page (/progress) with Hero, Time Investment (per-goal nested), Recently Closed Projects/Goals, Recently Closed Actions, Currently Delegated
- Project growth signal
- Impact (sober counter, no badges)
- 2-hour principle taught in onboarding
- Ideas with capture/convert/discard lifecycle
- Project cards with rich content (Value/Effort, ACTIONS breakdown, TIME, STARTED)

**Always-on Core**
- Plan and review your days (Plan today full-page two-step wizard, Close day full-page recap; NOT modals; NOT auto-opened)
- Time tracking (per-action time required for Done; per-ritual time required at creation; delegated × 0.2 discount)

**First-run experience**
- Setup Wizard (3 ceremonial screens: Welcome → Theme → Getting started → setup pause).
- Branch: Sample data path OR Goal-builder path.
- Goal-builder: 4-step flow (Goal → Success Criteria → Project → Actions → Today).
- No-goals mode: when goals = 0 (cleared sample, dropped all), goal-builder takes over the entire UI until a goal exists.
- Outputs: a working system.

**Daily flow**
- Today page (3 states: not planned / planned / closed-recap)
- Looking Back card (most recent active day, skips Day Off / Sick / inactive)
- Plan today flow: full-page two-step wizard. Step 1 = Day Type selection (4 large colored cards: Execution green / Recovery purple / Day Off gray / Sick amber-red, click auto-advances). Step 2 = Actions picker (no Quick Start cards) + Main Task + Rituals + "Start day" button.
- Close day flow: full-page recap with stat tiles, conditional greeting "Solid work today." (≥2h focused), "Re-open day" + "View in Days" footer. NO reflection field.
- Auto-close at midnight rollover (DayEntry.isClosed=true, closedAt=23:59:59 previous day, missed rituals marked).
- Day Type indicator with lucide icons (Zap / Leaf / Sun / Thermometer).
- Action editor with required field validation (create=modal, edit=slide-in).
- Bidirectional checkbox toggle in functional list views (Today, /actions, Project page, Main Task card).
- Quick Add via ⌘K.
- Inline-add inputs (Today's Actions section, Project page, Plan today step 2 Available pane).

**Periodic views**
- Reviews / Days (list + drill-down with retroactive add/edit)
- Reviews / Weeks (list + drill-down with day navigation)
- Reviews / Months (list + drill-down with week navigation)

**Sessions (focus timer)**
- Sessions list page (/sessions) with history
- Session Builder (/sessions/new) with mode presets, duration config, action picker
- Active session view (/sessions/active) with timer, progress ring, current action card
- Session detail panel (slide-in, reused everywhere)
- Session Summary view (full-page) at end of every session
- Sessions integration in Day/Week/Month drill-downs
- Sessions on Project/Goal pages
- Navigation guard during active session
- Single-device LocalStorage scope

**Search and navigation**
- ⌘K Command Palette
- Search nav item in sidebar
- Sidebar with lucide icons + collapse toggle (220px ↔ 64px, Cmd+\ shortcut)
- Sidebar groups: Search / Execution (Today, Progress, Actions, Delegated, Rituals) / Strategy & Capture (Goals, Projects, Ideas, Sessions) / REVIEWS (Days, Weeks, Months — flat, not collapsible)
- Auto-collapse sidebar on first load when viewport < 1100px

**Cross-cutting**
- Email + password auth
- LocalStorage persistence (Zustand persist middleware)
- Single-user
- Web (responsive, mobile-friendly browser)
- Page width tier system: Narrow (720px) / Medium (1024px) / Wide (1280px) — every page declares one
- Mobile patterns: drawer sidebar < 768px, bottom-sheet modals, 44px touch targets, multi-column stacking, FAB on /actions, sticky inline-add on Today
- Color-coded return date pill on /delegated (overdue/due today/on track) — only place "overdue" framing exists in app
- Settings (Account / Data only — no Tracking section)
- Confirmation modals (Tier 1 / Tier 2)
- Toast notifications (sonner)
- Z-index hierarchy enforced

### Not in v1

- Mobile native app
- AI execution pipeline (status only)
- OAuth (Google) — v1.x
- Calendar / time-blocking integration
- Reminders / notifications
- Templates / goal libraries (beyond 2 universal ritual templates)
- Imports / exports (data export shell in v1, full export v1.x)
- Sub-actions / nested checklists
- Streaks-as-pressure mechanics
- Team / sharing / multi-user
- Theme customization beyond Light / Dark / System (Workshop Light shipped in M8; high-contrast variant exploratory in v1.x)
- Public goal sharing
- Rest days for rituals (Skipped status covers this)
- Advanced analytics
- Backend (LocalStorage in v1)

---

## Milestones

### M0 — Foundations
- Repo, deployment, basic data model
- Goal / Project / Action CRUD
- Database schema for v1 entities

### M1 — Core flow end-to-end
- Onboarding (all 6 steps)
- Today / Progress / Goals pages
- Action editor with required field validation
- Status flow with timestamps
- Delegation status

### M2 — Rituals
- Ritual creation, scheduling
- Daily instance generation
- Skipped status
- Consistency view

### M3 — Value ≠ Effort
- Both metrics computed correctly across all action states
- Time Invested with delegated × 0.2 discount
- Per-goal progress visualization
- Goal page hero with three axes

### M4 — Daily flow always-on
- Plan today: full-page two-step wizard with Day Type colored cards. NOT a modal. NOT auto-opened.
- Close day: full-page recap with stat tiles + conditional greeting. NOT a modal.
- Auto-close at midnight rollover with missed rituals marked.
- Combined modal REMOVED (no longer needed).
- Reflection field REMOVED from data model.
- Time tracking always on, required for Done transition.
- Settings simplified (Account / Data only — no Tracking toggles, no Subscription section).

### M5 — Ideas and Reviews
- Ideas page (full-width list + slide-in editor + create modal)
- Capture / convert / discard / restore
- Reviews / Days list + drill-down
- Reviews / Weeks list + drill-down
- Reviews / Months list + drill-down
- Retroactive add/edit
- Status timestamp drill-down navigation

### M6 — Sessions (focus timer)
- Sessions data model + list page
- Session Builder (mode presets, duration, action picker)
- Active session view (timer, progress ring, current action card)
- Audio cues, focus mode
- Sessions integration in drill-downs
- Sessions on Project/Goal pages

### M7 — Search and Polish
- Command Palette (⌘K)
- Sidebar with collapsible Reviews
- Tone pass on copy
- Empty-state design (true empty + filtered empty patterns; per-page copy for /actions, /delegated, /rituals, /goals, /projects, /ideas, /sessions; plain inline messages for /reviews/*)
- Unified page header pattern across all list pages (single-word titles, CTA always visible on mobile, meta line, horizontal-scroll filter bar on mobile)
- Onboarding final copy
- Settings page

### M7.5 — Identity, subscription, admin tooling
- Sidebar bottom area redesign: clickable user identity trigger + UserMenuPopover containing Settings / Subscription / Admin (conditional) / Sign out.
- "?" Shortcuts as separate icon button on bottom row.
- Subscription page (/settings/subscription) with current plan card + Free/Pro comparison cards. Demo data only — payment integration deferred.
- user.subscription object added to model (`tier: free | all-in` + billing fields).
- All-In badge — subtle accent-color pill in user menu popover header (Inter 11px, no background).
- Demo controls in /settings → Account: subscription tier toggle + "Show admin tools" toggle.
- /admin/components page — visual smoke test rendering every component in every state. Sticky header with backdrop blur + data source toggle (Live / Mock).
- Mock data fixtures for /admin/components — uses the canonical sample-data-fixture (3 goals, 9 projects, 68 actions, 4 rituals, 5 ideas, 20 sessions, 60 day entries) with `isSample: true` flagging.

### M8 — Pre-backend theming (in progress)
- ✅ Add Workshop Light theme (cool gray, parallel token set, all components verified on /admin/components)
- ✅ `data-theme` attribute mechanism on `<html>` with inline pre-paint script (no flash on reload)
- ✅ Theme switcher in Settings → Account (System / Light / Dark segmented control, immediate apply, persists to LocalStorage as `actos.theme`)
- ✅ System mode follows `prefers-color-scheme` and reacts live to OS-level changes
- ✅ Sonner toast theme wired to active theme
- ✅ All token-based — no component-level overrides, no hardcoded hex values
- 🟡 High-contrast variant for accessibility — exploratory, may slip to v1.x

### M9 — Release
- Beta with small group
- Iterate
- Public release

---

## v1.x — Soon after v1

- Google OAuth
- Email verification
- Custom recurring schedules ("every 3 days", "Mon/Wed/Fri")
- Actual time logging
- Mobile-optimized layout improvements
- Lifetime stats area in Settings → Account
- Data export (JSON)
- Notifications (opt-in, gentle)
- Sessions multi-device sync (cloud)

---

## v2 — Major next stage

### AI as delegate (the big one)
- Context-passing infrastructure
- Result review UX
- Cost / quota model
- Quality guardrails

### Other v2 candidates
- Mobile native app (likely React Native)
- Goal templates (community contributions?)
- Lightweight collaboration (share read-only goal view)
- Calendar integration (read-only sync)

---

## Open questions

### Product
- Default configuration on onboarding (likely all off, opt-in)
- Hero copy for landing page
- Naming polish ("ActOS" is internal working name)
- Project closure ritual (small moment without celebration)
- Mobile FAB for quick add

### Business
- Pricing model (free / freemium / paid-only)
- Free tier limits
- Launch channel
- Beta access strategy

### Technical
- Backend stack (TBD when transitioning from LocalStorage)
- Hosting / deployment (Vercel/Supabase common stack assumed)
- Data migration (export/import flow for beta testers)
- File storage (S3 vs Cloudflare R2)
- Theme implementation: ✅ shipped via `data-theme` attribute on `<html>` + parallel CSS variable sets + pre-paint inline script. Switcher in Settings → Account. Default: system preference.

---

## What "done" looks like for v1

A real user who:
- Signed up.
- Completed onboarding.
- Used the product for 2 weeks.
- Closed at least one project.
- Voluntarily came back to set their second goal.

When this happens reliably with 5–10 users, v1 has shipped.

---

## What we will resist

The temptation to add "just one more thing." When scope-creep pressure arises, refer to deliberately-deferred lists in this document and `04-FEATURES.md`.

The product wins by being **narrow and good**, not broad and average.
