# ActOS — Tech Stack

> **Document role:** the authoritative source of truth for technical stack choices. Every "what should we use for X?" question is answered here.
> **Read alongside:** `13-ARCHITECTURE.md` (how things connect), `14-BACKEND-PLAN.md` (migration timeline).
> **Audience:** the team, future contributors, anyone evaluating the technical foundation.
> **Last updated:** 2026-05-11

---

## TL;DR

**Boring stack on purpose.** Every choice optimizes for "I can hire/onboard quickly + I won't be stuck on a niche framework in 18 months." No experimental tech in v1. Innovation goes into the product, not the infrastructure.

```
Frontend:   Vite + React + TypeScript + Tailwind + shadcn/ui
State:      Zustand (client) + TanStack Query (server)
i18n:       i18next (4 locales)
Rich text:  TipTap
Backend:    Supabase (US-region) — Postgres + Auth + Storage + Edge Functions
Email:      Resend
Payments:   Deferred. Stripe or Paddle TBD pending US LLC decision.
Hosting:    Vercel (frontend) + Supabase (backend)
Monitoring: Sentry (errors) + PostHog (analytics)
Repo:       GitHub private (actos)
Dev tools:  Cursor IDE + Claude Code CLI
Domain:     actos.io
```

---

## Frontend

### Framework — React 18 + TypeScript + Vite 5

Inherited from Lovable export. We keep it.

**Why React.** Largest talent pool, mature ecosystem, shadcn/ui depends on it. We're not making a moonshot here.

**Why Vite, not Next.js.** Vite is a build tool, not a framework. We don't need SSR for a single-page authenticated product — every meaningful route requires auth, so SSG/SSR has marginal SEO value. Marketing pages (`/`, `/manifesto`, `/pricing`) are simple enough to render client-side and ship via Vercel's CDN cache. Next.js would add complexity for no benefit at the current scale.

**Why TypeScript strict.** Saves us from runtime errors that would otherwise be caught in QA. Cost: occasional friction. Worth it.

**Vite version 5.4.x.** Stay on 5.x until post-beta; 6.x has breaking changes and the audit-fix-induced upgrade is scheduled separately. See `FRONTEND-AUDIT.md`.

### Styling — Tailwind 3 + shadcn/ui

**Tailwind 3.4.x.** Utility-first. No CSS-in-JS, no styled-components in v1. CSS variables drive theming (see `09-DESIGN-SYSTEM.md`). Never hardcode hex values.

**shadcn/ui.** 49 components installed. NOT a dependency — components are copied into `src/components/ui/` and editable. This is shadcn's whole point. When we need to deviate from defaults (and we will), we edit the component, not fight a closed library.

**Why not Material UI / Chakra / Mantine.** All are valid choices. shadcn won because the design language in `09-DESIGN-SYSTEM.md` is custom (Workshop dark/light, specific spacing scale, custom variable naming) — having components as raw editable files matches our design system better than overriding a closed theming API.

### State management

Three layers of state, each with its own tool. Don't mix them up.

**Client state — Zustand 5.** Single store in `src/store/useStore.ts`. Persists to LocalStorage via `persist` middleware. This is the **interim** solution; LocalStorage migrates to Supabase post-Phase-2 (see backend plan).

**Server state — TanStack Query 5.83.** Already installed via Lovable, barely used. Will host all server-data caching, refetching, optimistic updates once Supabase lands. Why not just useEffect + fetch — because TanStack handles caching, stale-while-revalidate, retries, and Suspense out of the box. We'd rebuild it badly otherwise.

**Form state — React Hook Form 7 + Zod 3.** Zod for schema validation. RHF for the form lifecycle. Won't change.

**Why not Redux Toolkit.** Zustand is 1/10th the boilerplate, fits our scale, single-developer phase. RTK is overkill until team grows past 3 engineers.

### Routing — React Router DOM 6

Inherited. Stays. Updated to 6.30.3 after audit-fix (XSS patch).

### Internationalization — i18next + react-i18next

4 locales: English, Russian, German, Spanish. ~2,064 keys per locale.

**Why i18next not react-intl.** i18next has better tooling, language detection, namespace support. Lovable picked it; we keep it.

**Locale files:** `src/i18n/locales/{en,ru,de,es}.json`. Browser-detected on first visit, persisted to LocalStorage (`actos.i18n.language`).

### Rich text — TipTap 3

For project descriptions and the manifesto admin editor. Uses ProseMirror under the hood.

Extensions installed: starter-kit, image, link, placeholder, underline.

Storage format: TipTap JSON. NOT HTML. This matters because it round-trips cleanly through Postgres (`jsonb` column).

### Icons — lucide-react

The ONLY icon library. Tree-shakeable, imported by name. Don't install Heroicons, Tabler, FontAwesome, anything else.

### Notifications — sonner

Toasts. Single system. shadcn's Toaster was removed in Phase 1 (duplicate). All `toast.*` calls go through sonner.

### Charts — recharts

For sparklines and basic charts. Inherited. Stays.

### Other UI primitives

- `cmdk` — command palette (Cmd+K)
- `vaul` — mobile bottom sheets
- `embla-carousel-react` — landing carousels
- `input-otp` — 6-digit verification code UI
- `react-day-picker` — date picker (used in scheduling)
- `react-resizable-panels` — split-pane layouts

### Date handling — date-fns 3

ISO strings in storage. Format at render time. Use `date-fns`, not Moment, not Day.js, not Luxon.

---

## Backend

### Platform — Supabase (US-region)

**Decision date:** 2026-05-11.

**Region:** US-East or US-West (TBD at provisioning, decision is cosmetic — pick whichever has better latency from where we test). NOT EU (Frankfurt) — product targets US market, EU residency would have cost us free tier and added complexity for no gain.

**Why Supabase, not raw Postgres / Firebase / Convex / PlanetScale.**

- **Postgres (real, not "compatible"):** we can run SQL, write migrations, leverage relational integrity. ActOS data model is relational by nature (Goal → Project → Action).
- **Auth in-box:** email/password ready today, Google/Apple deferred but trivial when needed.
- **Row Level Security:** critical for single-user-per-account product. Without RLS we'd manually check `user_id == auth.uid()` in every query, which is fragile. RLS makes it a database invariant.
- **Storage S3-compatible:** for TipTap-embedded images in project descriptions. Already on the data model (`02-PRODUCT.md` mentions S3/R2 as open question — Supabase Storage answers it).
- **Edge Functions (Deno):** for Stripe webhooks and email triggers without standing up a separate Node server.
- **Realtime subscriptions:** for multi-device sync later. We won't use this in v1 (single user, deferred per roadmap), but the path is there.
- **TypeScript type generation:** `supabase gen types typescript` produces typed clients from schema. Massive DX win in Cursor.

**Vendor lock-in honest disclosure.** Supabase Auth is the stickiest part. If we ever migrate auth out (to Clerk / WorkOS / something custom), we'd need to either keep Supabase running as auth-only or do a user migration. Our defense: `useAuth()` hook is the only public auth API in the codebase, so consumer code doesn't directly depend on `@supabase/supabase-js`. Migrating auth would touch one file (`src/lib/useAuth.tsx`) plus a migration script.

Postgres, Storage, and Edge Functions are not locked-in — they're open standards we can lift-and-shift if needed.

### Email — Resend

For transactional email: verification codes, password resets, future notifications.

**Why Resend, not Postmark / SendGrid / SES.** Best DX for React stack (React Email templates), $0 free tier covers 3000 emails/month (way more than we need for 30 beta users), US-based, simple API.

Will be wired via Supabase Edge Function, not directly from the client. Client never has Resend API keys.

### Payments — TBD (Stripe vs Paddle)

**Deferred.** All beta users get `subscription.tier = 'all-in'` automatically by default. Payment integration ships after beta validates the product.

**Decision point:** US LLC status. Stas is registering or evaluating a US LLC.

- **With US LLC:** Stripe (standard, best conversion, supports Stripe Tax for US sales tax).
- **Without US LLC:** Paddle or LemonSqueezy as Merchant of Record. They handle VAT/sales tax compliance globally; we receive net payouts.

Either way, the integration touches one boundary: Supabase Edge Function receives webhook → updates `users.subscription` row. Client-side checkout button just opens a Stripe/Paddle checkout link.

### Monitoring — Sentry

For runtime errors. Free tier covers our beta. Will be wired in `main.tsx` with the Sentry React SDK.

### Analytics — PostHog (cloud)

For product analytics: events, sessions, feature flags, A/B testing. US-region. Free tier is generous (1M events/month).

**Why PostHog, not Plausible / Mixpanel / Amplitude.** Self-hosted option exists if we ever need it. Feature flags built-in (useful for gradual beta rollout). Session replay available (debugging gold for beta users).

**Consent.** US-only beta means no cookie banner technically required, but we'll add a minimal cookie consent for GDPR safety since some beta users might be in EU.

---

## Hosting and deployment

### Frontend — Vercel

**Hobby plan to start, Pro when needed.** Hobby covers 100GB bandwidth + unlimited preview deployments. Beta on friends won't exceed.

Custom domain `actos.io` via Cloudflare DNS pointing to Vercel.

Preview deployments enabled — every PR gets its own URL. Critical for design review.

### Backend — Supabase

Free tier:
- 500 MB database
- 1 GB file storage
- 50,000 monthly active users
- 2 GB bandwidth/month

Sufficient for 30 beta users. Pro plan ($25/month) when we approach limits.

### DNS — Cloudflare

Cloudflare as DNS provider (free), domain registrar wherever Stas bought `actos.io`.

**Why Cloudflare DNS even though we're not using their CDN.** Best DNS performance, easy TXT record management for Resend domain verification and Supabase custom auth domain (Pro feature, future).

---

## Development tools

### IDE — Cursor

Cursor is the primary IDE. Has built-in AI (Claude-based) for in-line edits and refactoring.

`.cursorrules` file in repo root provides project context for the AI.

### CLI agent — Claude Code

For larger, multi-file tasks. Runs in terminal in the project directory. Reads `CLAUDE.md` for project context.

### Package manager — npm

NOT pnpm, NOT yarn, NOT bun. npm is the default and we don't need the marginal speed gains. `bun.lockb` was deleted in Phase 1.

### Repo — GitHub (private)

`https://github.com/StasVa/actos` — private repository.

Main branch protection rules (to be configured): require PR review for direct pushes, require CI green. Not enforced yet during beta-prep phase; will turn on before public launch.

### CI — Vercel preview deployments + GitHub Actions

- **Vercel** auto-deploys every push: `main` → production, branches → previews.
- **GitHub Actions** for non-deploy CI: lint check, type check, test run on PRs. Set up in Phase 3.

### Database migrations — Supabase CLI

`supabase db diff` and `supabase migration new` for schema changes. Migrations versioned in `supabase/migrations/` directory, committed to repo.

---

## Versions snapshot — 2026-05-11

Key versions after Phase 1 cleanup. These will drift; treat as historical record.

```
node           >= 18
typescript     5.8.3
vite           5.4.21
react          18.3.1
tailwindcss    3.4.17
zustand        5.0.13
@tanstack/react-query  5.83.0
react-router-dom       6.30.3
i18next        26.0.10
@tiptap/react  3.22.5
lucide-react   0.462.0
date-fns       3.6.0
vitest         3.2.4
```

---

## Known technical debt — scheduled for post-beta

- **Vite 5 → 6+ upgrade** (esbuild dev-server vulnerability fix requires major version bump)
- **jsdom 20 → 29 upgrade** (transitive vulnerability fix; affects test env only)
- **Test coverage bootstrap** — currently effectively zero
- **Code-split large pages** (Index.tsx, ActionEditor.tsx, etc. — see `FRONTEND-AUDIT.md`)
- **Replace `any` types** in i18n function signatures and sample seed loader
- **Unify LocalStorage access** behind `src/lib/storage.ts` abstraction (distinguish user-state-to-sync vs UI-preference-local-only)

None of these block the beta. All are documented in `FRONTEND-AUDIT.md`.

---

## Decision log

### 2026-05-11 — Stack baseline locked

Stas and Claude agreed:
- Frontend stack inherited from Lovable export — no changes
- Backend: Supabase US-region
- Email: Resend
- Hosting: Vercel
- Payments deferred (open: Stripe vs Paddle pending LLC decision)
- All beta users get All-In tier automatically (no payment flow in beta)
- Dev port 5174 (avoiding PriorityOS at 5173)

Rationale across all choices: **boring tech that works**. Anything we can't already debug at 11pm without Google is too clever for ActOS v1.
