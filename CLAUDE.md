# ActOS — Claude Code Context

This is the **ActOS** codebase. Read this file before doing any work. It defines what the product is, what stack we use, and what conventions to follow.

## Product in one sentence

ActOS is a daily-execution system for ambitious people pursuing 2-3 ambitious goals at once. Plan → Execute → Close is the daily loop. Everything else serves that loop.

It is **not** a todo list, calendar app, habit tracker, project manager, or AI coach. Resist instincts to add features common in those categories.

## Source of truth documents

Before making any non-trivial change, consult these documents (committed in this repo or available in the project knowledge):

- `00-VISION.md` — philosophical anchor
- `01-AUDIENCE.md` — who we build for
- `02-PRODUCT.md` — product brief and positioning
- `03-MODEL.md` — data model and entity rules
- `04-FEATURES.md` — feature catalog with v1/v1.x/v2 priorities
- `05-FLOWS-AND-SCREENS.md` — user journeys
- `06-ROADMAP.md` — scope and timing; what's deliberately deferred
- `07-SCREENS-INVENTORY.md` — every screen with states
- `08-DESIGN-DECISIONS.md` — accumulated UX/architecture decisions with rationale
- `09-DESIGN-SYSTEM.md` — CSS variables, tokens, components
- `10-BEHAVIORS.md` — state transitions, computed values, UI behaviors
- `11-CHANGELOG.md` — running log of significant changes

**When making changes that affect product behavior, add an entry to `11-CHANGELOG.md`. When fixing bugs or trivial polish, don't.**

## Tech stack

- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui components
- Zustand for UI state + remaining client entities (rituals, ideas, dayEntries, sessions until Session 2). TanStack Query for server data (goals, projects, actions).
- TanStack Query 5.83+ for server state. Optimistic updates, verb-specific mutations, cache persisted to localStorage.
- i18next with 4 locales: `en`, `ru`, `de`, `es`
- TipTap for rich text (project descriptions, manifesto admin)
- lucide-react for icons (do not introduce another icon library)
- sonner for toasts
- recharts for charts

**Backend:** Supabase US-region (Postgres + Auth + Storage). Resend for transactional email. Vercel for hosting.

**Domain:** actos.io

- Payments: deferred to post-beta. Beta users get All-In by default via handle_new_user() trigger.

## Working principles

### Mock-to-real swap pattern
Mock implementations of backend services (auth, payments, email verification) live in single files like `mockAuth.ts`. They expose the same interface the real implementation will. To swap to real backend, replace one file. Preserve this pattern — it's how we ship beta on mocks and then transition without rewriting consumers.

### Consumer code talks to hooks, not stores directly
`useAuth()`, `useGoals()`, `useProjects()`, etc. are the public API. Internal Zustand stores are implementation detail.

### Required fields are non-negotiable
Actions require Impact (1-10) and Time (for Done transition). UI must block Save with disabled buttons when missing. Don't relax this — it's why our metrics calculations work.

### Status semantics are strict
Don't invent new statuses. See `03-MODEL.md` § Action statuses. "Planned" is derived from `scheduledDate`, not user-selected.

### Value ≠ Effort
Two parallel metrics. Delegated work: 100% toward Value, 20% toward Effort and Time Invested. This is the signature mechanic. If you encounter logic that conflates them — flag it, don't "fix" it.

### Verb-specific mutations over generic updates
markGoalComplete/dropGoal/reopenGoal are separate hooks, not parameters to useUpdateGoal. Each has its own optimistic update path and error handling.

### Selectors come in pairs
Every computed selector (useGoalProgress, useProjectCost, etc.) ships as a reactive hook for components AND a plain function for callbacks: select*(queryClient, args). Documented in src/lib/selectors.ts.

### Pre-flight reports before code changes
When an agent is asked to make non-trivial changes touching multiple files or cross-cutting concerns, they should first report: which files they plan to touch, what assumptions they're making, what they found that contradicts the prompt, and any open questions. Wait for approval before code edits.

## Type-checking the project

Canonical command:

```
npx tsc --noEmit -p tsconfig.app.json
```

The root `tsconfig.json` has `"files": []` and only `references` the sub-configs — running plain `npx tsc --noEmit` against it compiles nothing and silently reports zero errors. Always pass `-p tsconfig.app.json` when validating app code.

## Code conventions

- TypeScript strict mode. No `any` without explicit justification comment.
- Use shadcn/ui components from `components/ui/`. Don't reinvent.
- Tailwind utility-first. No CSS-in-JS. No styled-components.
- Colors come from CSS variables (`var(--accent)`, `var(--text-secondary)`, `var(--surface-raised)`, etc.). Never hardcode hex values.
- Lucide icons imported by name. Tree-shakeable.
- All user-facing strings go through `useTranslation()`. New strings added to all 4 locales.
- ISO date strings in storage. Format at render time via `date-fns`.
- Z-index hierarchy is enforced (see `09-DESIGN-SYSTEM.md`).
- Page width tiers: Narrow 720px, Medium 1024px, Wide 1280px.

## What not to do

- Don't add features missing from `04-FEATURES.md` without discussing.
- Don't change product copy without confirmation. Tone is deliberate.
- Don't add new dependencies without discussion. Stack is intentionally boring.
- Don't write motivational microcopy. No celebrations, no streaks-as-pressure, no badges.
- Don't add notifications, reminders, or email engagement features.
- Don't add AI features beyond the existing Delegated status mechanic. AI-as-delegate is v2.
- Don't suggest native mobile. v1 is web-responsive.
- Don't break the mock-to-real swap pattern by inlining mock logic into consumers.
- Don't use `console.log` in committed code.
- Don't conflate verb-specific mutations into a generic update. If a new state transition needs its own optimistic update path, error handling, or business rule, create a new verb-specific hook.
- Don't bypass the strangler pattern. Until Session 2 ships, rituals/ideas/dayEntries/sessions live in Zustand. Don't write new entities to Supabase yet — coordinate with the migration plan in 14-BACKEND-PLAN.md.

## When in doubt

Read the source-of-truth documents first. If a requested change conflicts with them, flag it and ask the PM (Stanislav) before implementing. Explicit pushback is preferred over silent compliance.

## Current phase

Beta with 30 users, post-deployment.

✅ Phase 1 — Hygiene (2026-05-11)
✅ Phase 2 — Supabase foundation (2026-05-11)
✅ Phase 3 — Real authentication (2026-05-12)
✅ Phase 5 — Deployment to actos.io (2026-05-12)
✅ Phase 4 Session 1 — Goals/Projects/Actions to Supabase + TanStack Query (2026-05-13)
✅ Performance — TanStack Query cache persisted to localStorage (2026-05-13)

TODO:
- Phase 4 Session 2 — Rituals/Ideas/DayEntries/Sessions migration to Supabase
- i18n keys for new auth/data error messages
- Tech debt cleanup (see docs/15-TECH-DEBT.md)

Payments remain mocked — all beta users get All-In tier via the handle_new_user() trigger. Real Stripe/Paddle comes after beta.
