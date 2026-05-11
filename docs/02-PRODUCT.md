# ActOS — Product Overview

> **Document role:** the product brief. What ActOS does, who it's for, how a user experiences it, and what makes it different. Combines product summary, user-flow narrative, and competitive positioning.
>
> **Read alongside:** `00-VISION.md` (philosophical anchor), `01-AUDIENCE.md` (user definition), `03-MODEL.md` (data semantics), `04-FEATURES.md` (feature inventory).
>
> **Audience:** the team (onboarding new contributors), partners and investors (understanding the product quickly), and ourselves (keeping focus during execution).

---

## What ActOS is, in one paragraph

ActOS is a daily-execution system for people pursuing 2-3 ambitious goals at once. Instead of managing tasks ("what's on my list?") or scheduling work ("what's on Friday?"), it asks one question every morning: *what are you doing today for your goals?* The answer becomes the day's plan; the day's plan turns into actions; actions accumulate as honest progress that's measurable in two parallel ways — *Value* (how far the goal moved) and *Effort* (how much you personally spent). The product is built around a single daily loop: Plan → Execute → Close. Everything else serves that loop.

> *You solve sadness with knowledge, and anxiety with action.*

Ambitious people don't lack drive. They have plenty. What they lack is structure that channels their drive toward what they actually committed to — instead of letting it scatter across task lists, calendar slots, and shiny new ideas. ActOS is that structure.

---

## Core positioning

**We are anti-tasks, not anti-work.**

The world doesn't need another tool that helps ambitious people do less. The world needs a tool that helps them do *the right things* — and lets the rest fall away. ActOS is built for people who already work hard and want their hard work to add up.

The competition isn't laziness. It's **busyness**: time spent in task managers, calendar planners, productivity apps, and "system" tweaks that feel like progress but aren't. Less busyness, more business.

Concretely:
- We don't compete with Notion (database/wiki).
- We don't compete with Linear or Asana (project tracking).
- We don't compete with Todoist (task list).
- We don't compete with Sunsama or Motion (calendar planning).
- We don't compete with Habitica or Strides (habit gamification).

We occupy a slot none of those occupy: **the operating system for ambitious individuals working toward goals that take months or years, where the only horizon that actually moves them is today.**

---

## The five differentiators

These are the things ActOS does that no other tool does — or does in a way no other tool does. Every product decision is checked against these.

### 1. Daily action is the unit, not the task

Other tools treat tasks as objects you manage — create, edit, organize, schedule, complete. ActOS treats actions as facts that accumulate. The point of an action isn't "to be in the list" — it's "to have been done today, contributing measurable value to a goal."

This shows up everywhere:
- The default route is `/today`, not `/inbox` or `/tasks`.
- Actions don't have due dates in the calendar sense — they have a `scheduledDate` which only matters because it makes the action visible today.
- Done actions don't disappear; they accumulate visibly as "actions done overall" on goals and projects.
- The Reviews pages (Days, Weeks, Months) are the historical surface — what was actually done, not what's planned.

### 2. Value ≠ Effort

Two parallel measures of progress, on the same Impact scale, with different rules per status:

| Action status | Value (toward goal) | Effort (your workload) | Time Invested |
|---|---|---|---|
| Done | 100% Impact | 100% Impact | 100% Time |
| Delegated | 100% Impact | 20% Impact | 20% Time |
| Dropped | 0 (removed from Cost) | 0 | 0 |
| Cancelled | 0 (removed from Cost) | 0 | 0 |

A delegated action moves the goal forward fully but costs only 20% personal Effort. This is honest accounting that no other tool surfaces. The result: users can see how much they've delegated by the gap between Value and Effort. When Effort is much lower than Value, you've built a system — work is moving without exhausting you.

This isn't about working less. It's about *seeing* what's working. A user grinding alone on a goal sees Effort and Value match. A user with leverage sees them diverge — that divergence is feedback that the system around them is sound.

### 3. Hard limit on active goals (max 2-3)

The product enforces what most users won't enforce themselves: you cannot have more than 3 active goals at a time. This isn't a "best practice" hint — the "+ New goal" button is disabled when 3 active goals exist.

This isn't about doing less. It's about not splitting energy across 8 directions when only 2-3 actually get attention. Most ambitious people can name 8 goals; very few make progress on more than 2-3 simultaneously. ActOS removes the temptation by removing the option, so the user's effort lands where it counts.

### 4. Forgiving rituals — total count, not streaks

Rituals (recurring actions like "Read 30 min daily" or "Workout 3x/week") use a consistency multiplier based on **lifetime total Done count**, not consecutive days:

| Total Done | Multiplier |
|---|---|
| 0–6 | ×1.00 |
| 7–13 | ×1.05 |
| 14–29 | ×1.10 |
| 30–59 | ×1.25 |
| 60–119 | ×1.50 |
| 120–359 | ×1.75 |
| 360+ | ×2.00 |

Missed days don't subtract. Skipped days are explicit, also don't subtract. This eliminates the shame mechanic that breaks every habit-tracker — when you miss a day, your progress is preserved, not destroyed. The user keeps showing up because the system rewards persistence, not perfection.

Cap at ×2.0 prevents runaway growth (a 5-year daily ritual won't have ×30 multiplier).

### 5. Workshop tone — sober, not sentimental

Dense, factual, professional. No badges, no streaks-as-pressure, no "you missed 3 days" guilt screens, no celebration animations, no AI life coach, no motivational copy. The visual direction is dense and tool-like (reference: Linear, Plane.so, Obsidian).

The audience is intelligent people doing serious work who find motivational copy patronizing. They want a tool that respects them and stays out of their way. The tone is not "calm down" — it's "get to work, here's clarity."

---

## How a user experiences ActOS

Three views of the user journey, each at a different timescale.

### Day in the life

7:30 AM. Sasha opens ActOS on the laptop. The page shows `/today` in **State A** (not yet planned): a simple card with "What are you doing today?" and a "Start your day →" button. Below it, a "Looking back" card showing yesterday's stats — 3 actions done, 1h 40m invested, mostly on the YouTube channel goal.

Sasha clicks "Start your day." The page becomes Plan today step 1: pick a Day Type. Four colored cards: Execution (today's a normal work day), Recovery (lighter day), Day Off, Sick. Sasha picks Execution. The page advances to step 2.

Step 2 shows three sections: ACTIONS (pick what you'll work on), MAIN TASK (which one matters most), RITUALS TODAY (any to skip?). The ACTIONS picker has all open actions across goals; Sasha checks 4 of them. MAIN TASK gets set to "Outline video #2 series structure" — the one Sasha most wants to make happen. Sasha hits "Start day."

Page returns to `/today`, now in **State B** (planned, in progress). At the top: the Main Task card with the outline action prominently displayed. Below: today's actions list (4 items, one of them flagged as Main Task). Below that: today's rituals (read 30 min, morning pages). A simple inline-add at the bottom: "+ Quick add new action..." in case something comes up.

Throughout the day, Sasha checks off actions. Each click is bidirectional — re-clicking re-opens. Actions move from "remaining" to "done" visibly. The little stats line updates ("2 done · 2 remaining"). No notifications, no toasts about progress — just visual change.

A new task surfaces: a phone call needs scheduling. Sasha quick-adds it without opening the editor. The action appears in today's list with status Backlog (Impact and Time deferred — fill later via row click).

5:30 PM. Sasha clicks "Close day." Page becomes **State C** (recap): big stat tiles showing the day in numbers (4 actions done, 0 rituals skipped, 2h 10m invested, +28 value added, mostly toward YouTube channel goal). Below: a list of what was done, broken by goal. A footer link: "Re-open day" (in case Sasha wants to add more later).

Sasha closes the laptop. Tomorrow morning, the page will reset to State A — fresh, unplanned. Yesterday's recap will be in the "Looking back" card.

### First week

**Day 1.** Setup Wizard (3 screens — welcome, theme, getting started) → user picks "Set up my own goal" → Goal-builder (4 steps: Goal → Success Criteria → Project → Actions). Sasha creates "Run a sub-2h half marathon" with two success criteria, the project "Establish 4×/week training routine", and 3 first actions. Lands on `/today` with the day already planned.

**Day 2-7.** The user iterates. Some patterns:
- They add more goals, hit the 3-goal cap, and have to commit.
- They create projects that feel right at first, then realize some are too vague (e.g. "Improve nutrition" — that's a goal, not a project).
- They miss a day. Nothing punishes them. The next day still shows up clean.
- They delegate something for the first time and watch the Effort bar stay lower than Value. The asymmetry clicks.

By day 7 the system has shape. The Reviews → Weeks page shows the first weekly summary. Patterns become visible: which goals got attention, which didn't, which projects are growing without closing.

### First month

The user has built up enough history that the metrics start telling a story:
- Goals that are progressing visibly vs goals that are stalled.
- Rituals that have built consistency vs rituals that were aspirational.
- Projects that closed (small wins) vs projects that grew (revealing more work than expected — a sign of learning, not failure).

Two things typically happen by week 4:
1. **Drop a goal.** The user realizes one of the 2-3 goals is not what they actually care about, and drops it. ActOS makes this clean — Drop is a Tier 1 confirmation, the goal moves to "Dropped" section, no shame.
2. **Decompose better.** Projects start being right-sized from the start because the user has internalized the "closeable in days, not months" principle. The system has taught them by surfacing growth, not by lecturing.

---

## Canonical example goals

Used in onboarding, empty states, help copy, and any UI that demonstrates "what a goal looks like." All examples are framed as **results, not activities** — describing a future state the user reaches, not work they do.

| Domain | Example goal |
|---|---|
| Business / SaaS | $10k MRR from my side business |
| Creative / audience | Reach 100k YouTube subscribers |
| Fitness | Run a sub-2h half marathon |
| Language | Pass C1 Spanish proficiency exam |
| Skill / portfolio | Ship 12 case studies to my portfolio |
| Health / weight | Reach 75kg and hold it for 3 months |
| Writing | Publish my novel on Amazon |
| Career | Speak at a major industry conference |

**Counter-examples** (these are NOT goals — they're projects or activities):
- ❌ "Build a successful SaaS" — activity. Project candidate: "Ship MVP v1." Goal candidate: "$10k MRR from my SaaS."
- ❌ "Get fit" — vague activity. Project candidate: "Establish 4×/week training routine." Goal candidate: a measurable result like "Run a sub-2h half marathon."
- ❌ "Learn Spanish" — activity. Goal candidate: "Pass C1 Spanish proficiency exam."
- ❌ "Launch personal portfolio site" — that's a project, not a goal. Goal candidate: "Ship 12 case studies to my portfolio."

The canonical set is intentionally diverse across domains — fitness, business, language, creative, career — to set the right pattern (deep ambition + measurable result) without narrowing the audience to any single niche.

**Use these examples consistently.** Don't invent new ones in UI copy unless explicitly approved — the canonical set is the reference.

---

## Jobs-to-be-done

Three jobs ActOS is hired to do. Each comes with explicit boundaries — what falls inside the job and what falls outside its scope.

### Job 1: "Keep me focused on what's actually important."

**Context.** User has too many possibilities. New ideas every week. Multiple ambitions running in parallel. Decision fatigue.

**What ActOS does.** Hard cap on active goals (max 3). Daily question forces a choice ("of all your projects' actions, which are you doing today?"). Visible per-goal progress shows whether commitments are being honored. Distractions go to /ideas (a parking lot, not a commitment) instead of cluttering the goal hierarchy.

**Boundaries.** ActOS gives structure for the user to make choices. It does not make the choices for them — no AI prioritization, no smart-suggestion engines, no "you should focus on X today." The user is the executive; ActOS is the operating system.

### Job 2: "Show me I'm actually moving forward."

**Context.** User has been working hard but is unsure whether the work is meaningful. Fear of "another month gone with nothing to show."

**What ActOS does.** Per-goal progress (Value %) at a glance. Three-axis breakdown (project Impact + ritual consistency + success criteria). Sparklines and per-day activity feeds. Reviews (Days/Weeks/Months) for retrospective. Closed projects accumulate as visible ticks of progress.

**Boundaries.** Honesty over comfort. If a goal hasn't moved in two weeks, the system shows that — no smoothing, no encouraging copy. Activity that doesn't tie to a goal doesn't generate fake progress. The point is to surface reality, not to feel good about the dashboard.

### Job 3: "Help me commit to what I delegated."

**Context.** Modern ambitious people increasingly have resources (money, AI, helpers). Existing tools punish delegation — "it doesn't count if you didn't do it." So users hesitate to delegate, even when it's the right move.

**What ActOS does.** First-class Delegated status. Value counted at 100% (the work is moving), Effort at 20% (you handed off), Time symmetric. The asymmetry is visible — when Effort sits below Value, the user sees they've built leverage. Delegation is honestly counted, so the user delegates more confidently.

**Boundaries.** ActOS tracks delegation; it does not manage delegates. No team features, no assignment workflows, no Slack integrations, no AI execution pipeline (in v1). The Delegated status is bookkeeping that makes leverage visible — not a workflow tool.

---

## What's in v1

Concrete capabilities the user gets when they sign up. All of these work without backend in v1 (LocalStorage, Zustand persist).

**Goal management.** Create active goals (up to 2 on Free tier, up to 3 on All-In). Set type (short-term ~1 month / mid-term ~1 year), target date, success criteria (0-5 checkboxable items). Drop or complete goals.

**Project management.** Closeable projects under goals. Create, edit, close, drop. Project Cost auto-computed from Impact of contained actions.

**Action capture and execution.** Create actions with Impact (1-10 required) and Time estimate. Status flow: Backlog → Planned → Done/Delegated/Dropped/Cancelled. Inline-add for quick capture, full editor (slide-in) for detailed edit. Bidirectional checkbox toggle. Goal-level Backlog (parking actions without yet committing to a project).

**Ritual management.** Recurring actions on schedule (daily, weekdays, weekly, monthly, custom). Per-instance status (Done/Skipped/Missed/Pending). Consistency multiplier accumulating over lifetime.

**Daily flow.** `/today` page with three states (not planned / planned / closed). Plan today wizard (Day Type → ACTIONS / MAIN TASK / RITUALS). Close day full-page recap with stat tiles. Auto-close at midnight rollover.

**Focus sessions.** Pick actions, set timer with optional breaks, execute, summary. Honest record of focused time.

**Ideas.** Capture without commitment. Convert to action or project later. Discard if not pursued.

**Reviews.** Days, Weeks, Months — retrospective summaries with factual aggregates (no evaluation, no celebration).

**Two themes.** Workshop Dark (default) and Workshop Light. Switcher in Settings → Account.

**Light mobile experience.** Responsive, bottom-sheet modals, hamburger drawer. Mobile-native app deferred to post-v1.

---

## What's not in v1 (and why)

Deliberate omissions, each with rationale. Roadmap may bring some back later; many won't.

- **Native mobile app.** Web is responsive; mobile-first native deferred until web-product-market-fit signals are clear.
- **Calendar / time-blocking integration.** Scheduling is the enemy of "today is the only horizon." Will not change.
- **AI execution pipeline.** Delegated status exists; actual AI doing work is post-v1.
- **Reminders / notifications.** Pinging the user breaks the "tool, not coach" stance. Considered post-v1 only if user research shows demand.
- **Templates / goal libraries.** Empty templates would betray the philosophy that the user knows their goals best. Two universal ritual templates allowed (Weekly project audit, Monthly goal review).
- **Sub-actions / nested checklists.** Action ≤ 2 hours is the principle. If a sub-checklist is needed, the action should be split into separate actions.
- **Streaks-as-pressure.** Total-count multiplier is the explicit alternative.
- **Team / sharing / multi-user.** Single-user system in v1. Collaboration is a different product.
- **OAuth (Google).** Email + password only in v1. Google auth deferred to v1.x.
- **Public goal sharing.** Goals are private. Social pressure as a motivator is anti-philosophy.
- **Advanced analytics.** Reviews give factual aggregates; no charts of charts, no AI-derived insights.
- **Backend / cloud sync.** LocalStorage in v1. Backend after product-market-fit.

---

## Business model (current state of thinking)

**Tier 1: Free.** Up to 2 active goals. All current features. 90 days of history. Standard support. Web app (mobile + desktop). JSON data export.

**Tier 2: All-In, $12/mo** (or $120/yr — save 17%). Everything in Free, plus: up to 3 active goals (full philosophy), unlimited history, priority support (48h email), every future feature included automatically, price locked at signup.

The 3-goal cap is the philosophical centerpiece (see 00-VISION). Free gives 2 — useful enough to learn the philosophy. All-In gives 3 — the full intended shape.

In v1, the Free / All-In distinction is UI-only — there's a demo toggle in Settings to test both states. This lets us design and validate the All-In experience before payment integration.

**Why this model.** The product's value is in the daily ritual and clarity, not in unlocked features. Free tier is genuinely useful. All-In is convenience (full history, future features, priority support, price-locked), not "the real product" gated behind a paywall. This positions ActOS against tools that gate basic features behind subscription tiers.

**30-day refund.** If ActOS doesn't fit, email within 30 days of signup for a full refund — no questions, no forms.

**What we're not doing.** Not freemium with crippled free tier. Not enterprise/team plans in v1. No ads — the product is ad-free by design.

---

## Why now

Several converging trends make ActOS timely:

1. **AI productivity tools are everywhere.** Most are anti-thoughtful — they offer to do the work for you, schedule your day, suggest priorities. The market is saturated with tools that promise to remove decisions. ActOS goes the opposite direction: structured help with making your own decisions, well.

2. **Burnout from optimization culture.** A generation of knowledge workers is exhausted from "10x productivity" tools and lifehacks that demanded more energy. They want sober tools that respect them and don't demand emotional engagement.

3. **Delegation becoming normal.** AI assistants, virtual assistants, and freelancer marketplaces have made delegation accessible to individuals, not just executives. But existing tools punish delegation (it "doesn't count" if you didn't do it). ActOS makes delegation honest and first-class.

4. **Goal-anxiety as a recognized pattern.** The "I'm busy but not moving" feeling is now a cultural meme. The cure is not more discipline; it's clarity. *You solve sadness with knowledge, and anxiety with action.* ActOS provides the action and surfaces what came of it.

---

## Risks and bets

Things that could be wrong about our thesis. Worth being explicit.

- **The 2-3 goal cap might feel limiting** to users with 5-7 active threads. We bet the friction is the feature — it forces commitment. If user research shows the cap is the #1 quit reason, we revisit.
- **Workshop tone might alienate** users who actually like motivational copy and dopamine loops. We bet our target audience finds it refreshing. If signups skew toward casual users who churn, we may have miscalibrated audience.
- **Daily-only horizon might be too rigid** for users with weekly/monthly thinking habits. We bet daily-only is the differentiator. Users who really want week-planning will use Sunsama; that's fine.
- **Local-first with no sync** might not be acceptable in 2026 even for a v1. We bet early adopters tolerate it. If retention is killed by lack of sync, we accelerate backend timeline.

---

## Success metrics (internal — what we watch)

Not user-facing. What tells us the product is working:

- **Daily plan completion rate.** Of users who Plan today, what % Close day same day? Healthy: >60%.
- **Goals dropped within first month.** Healthy: 30-50% of users drop at least one — the cap is doing its job.
- **Delegation usage.** % of users with at least one Delegated action by week 2. Healthy: 20%+.
- **Ritual longevity.** % of created rituals still active at day 30. Healthy: 50%+.
- **Day 30 retention.** Standard. Target: significantly above category median.
- **Time-to-first-Close-day.** Healthy: < 24h after signup.
- **Project close rate.** Avg time from project creation to close. Healthy: < 3 weeks. Long-running projects are an anti-pattern we want to surface.

We don't optimize for: daily active users (sober tool, not engagement game), time-in-app (we want users in their work, not in our UI), or feature usage breadth (depth matters more).

---

## Open questions

Things we haven't decided yet:

- **Onboarding for users with no goals yet.** Do we let them start the product without a goal? Currently onboarding requires goal creation. Some users may not have a clear goal on day 1.
- **AI execution pipeline timeline.** Delegated → AI is bookkeeping in v1. When does it become real (an AI that actually does the work)? Probably v2, but the trigger for that move is unclear.
- **Mobile native vs web-responsive.** Current bet: web-responsive is enough for v1. When does that break down?
- **Team features as separate product or expansion.** Some users will want to share goals with a partner / accountability buddy. We've ruled this out for v1, but the v2+ shape is unclear: bolt-on or different product?

These are real open questions, not vague aspirations. Each should resolve as we learn.
