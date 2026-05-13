# ActOS — Changelog

> **Document role:** running log of significant product changes by date.
> **Read alongside:** `06-ROADMAP.md` (planned scope), `08-DESIGN-DECISIONS.md` (rationale).

---

## How to use this document

One entry per significant change. Most recent first. Each entry has:
- Date (YYYY-MM-DD).
- Milestone tag in brackets (e.g. `[M8]`, `[M7.5]`).
- Short title.
- Bullet list of what changed (5-10 lines).
- Optional pointer to the documents where details live.

Trivial fixes, copy tweaks, and visual polish do not earn an entry.

---

## 2026-05-13 [Backend] — Phase 4 Session 1: Goals, Projects, Actions on Supabase

Goals, projects, and actions now live in Supabase Postgres, fetched via TanStack Query. Strangler migration: rituals/ideas/day entries/sessions remain in Zustand-LocalStorage until Session 2.

- **New data layer:** `src/lib/queries/{useGoals,useProjects,useActions}.ts` with verb-specific mutation hooks (markComplete, drop, reopen, delete) — each with optimistic updates and rollback on error.
- **Selector pairs:** `src/lib/selectors.ts` exports each computed selector as a reactive hook (component bodies) and a plain function (callbacks/non-React).
- **Row mappers:** `src/lib/rowMappers.ts` bridges Supabase snake_case rows ↔ camelCase app types. `null` clears column, `undefined` no-touch, value updates.
- **Cross-mutation cascade:** `useDeleteGoalMutation` and `useDropGoalMutation` honor DB CASCADE/SET NULL semantics — snapshots captured in both TanStack cache AND Zustand state for correct rollback.
- **Strangler bridge:** `src/lib/storeQueryRef.ts` lets Zustand-resident code (captureIdea) read TanStack-resident goals. Marked for deletion in Session 2.
- **Zustand store reduced:** 1,171 → 693 lines (−478 net).
- **Verified:** cross-device sync, cascade behavior (action orphans to goal-level on project delete via SET NULL), zero console errors.
- Details: 14-BACKEND-PLAN.md Phase 4, 13-ARCHITECTURE.md Layer 3.

---

## 2026-05-13 [Perf] — Persist TanStack Query cache to localStorage

Page reload no longer shows blank screen while data hydrates. Cache restores from `localStorage` instantly, then background refetch reconciles with Supabase.

- **Setup:** `src/lib/queryClient.ts` exports `queryClient` and `persister` (via `createSyncStoragePersister`). Storage key `actos-query-cache`, maxAge 24h, buster `actos-v1`.
- **Provider:** `App.tsx` uses `PersistQueryClientProvider` from `@tanstack/react-query-persist-client`.
- **signOut security cleanup:** `queryClient.clear()` + `persister.removeClient()` + `setTimeout(1100ms)` second `removeClient()` to catch the trailing throttled write (persister's persistClient is throttled 1000ms). Without the second remove, cleared cache re-populates with empty state and leaks key presence across sessions.
- Details: 13-ARCHITECTURE.md "TanStack Query cache persistence" section.

---

## 2026-05-13 [Bug] — Production bug fixes after Phase 4 Session 1

Three P0 fixes shipped as atomic commits after Session 1 push to production.

- **SPA fallback:** new `vercel.json` rewrites all non-`/api` paths to `/index.html`. Eliminates 404 on direct URL reload (e.g., `actos.io/today` typed into address bar).
- **Sign out redirect:** `UserMenu.tsx` onClick handler now awaits `signOut()` before `navigate("/")`. Was fire-and-forget — `RedirectIfAuthed` saw `isAuthenticated=true` and bounced to `/today` before `setUser(null)` propagated.
- **Hydration flash:** 5 consumers (`App.tsx` NoGoalsGate + ChromeOnlyOutsideSetup, `Goals.tsx`, `Rituals.tsx`, `AllActions.tsx`) now gate empty-state UI on `!isLoading` to prevent onboarding fallback flash during initial Supabase fetch.

---

## 2026-05-12 [Backend] [Infrastructure] — Phase 3 + Phase 5: Real auth + production deployment

Supabase Auth replaces mock auth; `actos.io` live on Vercel.

- **Phase 3:** `useAuth.tsx` rewritten to call `@supabase/supabase-js` methods. `mockAuth.ts` deleted. 6-digit OTP verification via Resend (sender `noreply@actos.io`). Admin gate reads `is_admin` from `public.users` row.
- **Phase 5:** Vercel project provisioned, `actos.io` DNS via Cloudflare, SSL auto-provisioned via Let's Encrypt. Production env vars set. Smoke test passed end-to-end.
- **Email templates:** Confirm signup, Magic Link, and Reset Password customized in Supabase Auth → Email Templates. OTP-style codes for signup/login (not magic links).
- Details: 14-BACKEND-PLAN.md Phase 3 + Phase 5.

---

## 2026-05-11 [Backend] — Phase 2: Supabase foundation

Empty Supabase project with full schema ready for Phase 3 + 4.

- **Project:** Supabase US-East region (project ref `pszifpidwvcdgecvtyoc`).
- **Schema:** 14 tables (`users`, `goals`, `goal_success_criteria`, `projects`, `project_references`, `actions`, `action_timeline`, `rituals`, `ritual_completions`, `ideas`, `day_entries`, `sessions`, plus 2 admin tables). FKs with ON DELETE CASCADE / SET NULL per design.
- **RLS:** every user-data table has `auth.uid() = user_id` policy.
- **Trigger:** `handle_new_user()` auto-creates `public.users` row + assigns All-In tier for beta users.
- **Types:** generated to `src/lib/supabase.types.ts` (887 lines). Typed client in `src/lib/supabase.ts`.
- **Migration:** `supabase/migrations/20260511000000_initial_schema.sql` committed to repo.
- Details: 14-BACKEND-PLAN.md Phase 2, 13-ARCHITECTURE.md schema section.

---

## 2026-05-11 [Infrastructure] — Lovable export → local repo, Phase 1 hygiene pass, backend plan locked

End of in-Lovable phase. Project moved to a local Cursor + Claude Code workflow against `github.com/StasVa/actos`. Phase 1 (hygiene) shipped in two clean commits.

**Local environment setup:**
- SSH keys generated for GitHub (replaces HTTPS auth used in PriorityOS sister project).
- Repo cloned to `~/Documents/actos`. PriorityOS at `~/Documents/priority-os` stays untouched and parallel.
- `npm install` baseline established; 19 audit vulnerabilities reduced to 5 safe dev-only ones (jsdom + esbuild chains). Remaining 5 require breaking-change major bumps; scheduled post-beta.
- AI agent context files added at repo root: `.cursorrules` (auto-read by Cursor), `CLAUDE.md` (auto-read by Claude Code CLI). Both encode product philosophy, stack, conventions, and explicit do-not list.

**Phase 1 hygiene (committed):**
- `package.json` renamed from `vite_react_shadcn_ts` → `actos`. Version 0.0.0 → 0.1.0. Added `description` and `engines.node>=18`.
- Vite dev port moved from 8080 → 5174 (avoids conflict with PriorityOS on 5173). `strictPort: true` added; `hmr.overlay: false` removed (error overlay restored).
- `lovable-tagger` Vite plugin removed (dev-only Lovable artifact).
- `bun.lockb` deleted (we use npm; prevents rogue `bun install` desync).
- `.lovable/plan.md` folder deleted (internal Lovable i18n planning artifact).
- `Login.tsx` placeholder page deleted; `/login` route now redirects to `/auth` (single auth flow).
- Duplicate shadcn Toaster system removed (kept `sonner` as canonical). Deleted: `components/ui/toaster.tsx`, `hooks/use-toast.ts`, `components/ui/use-toast.ts`. Zero call-site migrations needed.
- `.gitignore` expanded: added `.env*` family, `*.tsbuildinfo`, `coverage/`, OS files.
- `README.md` rewritten from 1-line placeholder to proper project entry point.

**Frontend audit baseline (`FRONTEND-AUDIT.md`):**
- 172 TS/TSX files, 43,467 lines of code. 49 shadcn components, 36 app pages, 8 admin pages.
- Verdict: codebase materially better than typical Lovable export. Mock-to-real swap pattern is real, types align with `03-MODEL.md`, i18n is full not stubbed.
- Zero P0 (beta blockers). 8 P1 (7 closed in Phase 1, 1 deferred). 10 P2 (post-beta).

**Lessons learned (process):**
- Claude Code went out-of-scope once on Phase 1 task — rewrote `vitest.config.ts` despite explicit "stay in scope" instruction. Caught and reverted via `git diff` review before commit. **Mandatory rule: every Claude Code session ends with `git diff` review before commit.**

**Backend stack locked:**
- Hosting: Vercel (frontend) + Supabase US-East (backend).
- Email: Resend (sender: `noreply@actos.io`, apex domain).
- Monitoring: Sentry + PostHog (Phase 5).
- Payments: deferred. All beta users get All-In tier by default via Supabase user-creation trigger.
- Domain: `actos.io` (Namecheap). DNS to be moved to Cloudflare in Phase 2.
- Beta acquisition: open signup, invite-by-link.

**New documents added:**
- `12-TECH-STACK.md`, `13-ARCHITECTURE.md`, `14-BACKEND-PLAN.md`, `FRONTEND-AUDIT.md`.

**Next:** Phase 2 — Supabase foundation. Create project, schema, types, Resend.

---

## 2026-05-11 [Docs] — Knowledge base audit + public site / auth alignment

Full pass through all 12 knowledge files to bring documentation in sync with the work done in this session (public landing system, manifesto page, pricing page, auth flow, inline verification, admin editor, public i18n, language switcher, sample data localization). 9 of 12 files updated.

Changes:
- **02-PRODUCT.md** — Subscription model section updated. Was inconsistent ("Tier 1: Free, up to 3 active goals" vs design decision "2 goals"). Now: Free up to 2 goals / All-In up to 3 goals, $12/mo or $120/yr, full feature lists per tier. Goal management description clarified per-tier.
- **04-FEATURES.md** — Authentication section rewritten (was 2 lines, now full spec with auth flow, mock impl, gated routing). Added new "Public site (marketing)" section: Landing / Manifesto / Pricing / Auth / Public i18n / Admin manifesto editor.
- **05-FLOWS-AND-SCREENS.md** — Added 4 new flows: Flow 18 (First visit to public site), Flow 19 (Sign up new user), Flow 20 (Sign in returning user), Flow 21 (Edit manifesto via admin). Screen inventory at top extended with 7 new public/auth screens.
- **06-ROADMAP.md** — Added M8.6 milestone (Public site + auth). Updated M8.5 to mark sample data localization as done. Updated v1.x section to reflect partial implementations (auth UI built, real backend deferred).
- **07-SCREENS-INVENTORY.md** — Added Section 15 (Public site): 7 detailed screen specs (Landing, Manifesto, Pricing, Auth, Auth verify, Auth reset, Admin manifesto editor).
- **09-DESIGN-SYSTEM.md** — Section 5 (Pages) expanded: 5.13 Auth screens fully spec'd, 5.14 Landing, 5.15 Manifesto, 5.16 Pricing, 5.17 Admin manifesto editor added. Subsequent sections renumbered (Settings → 5.18, Subscription → 5.19, Admin components → 5.20).
- **10-BEHAVIORS.md** — Section 11 (UI behaviors) extended: 11.10 Auth-gated routing, 11.11 Sign up verification, 11.12 Sign in, 11.13 Forgot password, 11.14 Language switcher, 11.15 Manifesto admin.
- 00-VISION, 01-AUDIENCE, 03-MODEL **not changed** — philosophical / audience / data model unaffected by this session's UI work.
- 08-DESIGN-DECISIONS, 11-CHANGELOG already up-to-date from prior batches.

---

## 2026-05-11 [Marketing] — Inline email verification during signup (replaces background banner)

Replaced the deferred "verify your email" banner with inline 6-digit code prompt right after signup. Apple ID / Slack pattern.

- New flow: signup form → `/auth/verify` (6-digit code) → setup wizard → app.
- New page `/auth/verify`: 6 single-char inputs, auto-advance, paste-aware, auto-submit on 6th digit. Resend link with 30s cooldown. Change email link.
- Code expires 10 min. Max 5 wrong attempts before forced resend.
- Tab-close resilience: `actos.auth.pendingSignup` persists in LocalStorage, resumes on next visit. Stale entries (>24h) auto-cleared.
- User is `emailVerified: true` from the moment signup completes — banner no longer needed.
- Mock implementation: code generated client-side, shown in dev toast + console.log for testing. Real email service swap is post-this-batch (Resend / Postmark via real backend).
- Sign in flow unchanged — no verification step (existing users assumed verified).
- Old email verification banner removed from app shell (or scoped to legacy users only).
- 14 new i18n keys × 4 locales for the verification UI.
- Details: DESIGN-DECISIONS § "Auth flow" → "Email verification".

---

## 2026-05-11 [Architecture] — Sample data localization: 4 locales

Sample workspace dataset translated into RU/DE/ES alongside English. Closes a deferred item from the M8.5 i18n batch.

- Per-locale files: `src/data/sample/sampleData.{en,ru,de,es}.ts`. Shared structure: identical IDs, projects-per-goal counts, action counts — only user-visible strings differ.
- Router: `getSampleData(locale)` returns the right dataset; falls back to EN for unknown locales.
- Locale selection at setup time: reads `actos.i18n.language` (browser-detected on first visit, persisted thereafter). No separate setting.
- No re-load on language change: sample data fixes at setup, becomes user data. Switching language later doesn't touch it. If user clears + re-loads sample manually, current language applies.
- Translation only, no cultural adaptation: currencies, service names, reference URLs stay as in EN baseline. Goal/project/action names + descriptions translated.
- Brand names (ActOS, Slack, GitHub, etc.) NOT translated.
- Terminology matches in-product glossary (Impact → Импакт/Wert/Valor, Effort → Затраты/Aufwand/Esfuerzo, etc.).
- Details: DESIGN-DECISIONS § "Internationalization" → updated Open items.

---

## 2026-05-11 [Admin] — Manifesto admin editor at /admin/manifesto

WYSIWYG editor for founder to edit manifesto content without code pushes. Built on TipTap (ProseMirror). Mock LocalStorage storage now; Supabase swap later.

- Route gated: requires authenticated user with `isAdmin: true` flag. Non-admin → redirect to `/today`. Non-authenticated → redirect to `/auth?next=/admin/manifesto`.
- Debug toggle in Settings → Account: `[Toggle admin (debug)]` flips `isAdmin` for testing.
- No nav link — admin route accessed via direct URL only.
- Layout: sticky header (logo + Cancel + Save) → tabs row (4 locales + last-saved timestamp) → split view (WYSIWYG editor left, live preview right).
- Editor stack: `@tiptap/react` + `@tiptap/starter-kit`. Extensions: paragraph, H1, H2, bold, italic, blockquote (renders with orange left border), bullet list, horizontal rule, link, history, placeholder.
- Title and deck are separate single-line inputs (not part of WYSIWYG body) for cleaner structure.
- LocalStorage schema: `actos.cms.manifesto.{locale}` = `{ title, deck, body: TipTapJSON, savedAt }`. One entry per locale.
- Initial load imports current i18n content into editable form (one-time migration). Subsequent edits stored in LocalStorage.
- Public `/manifesto` page reads LocalStorage first, falls back to i18n keys.
- Closing CTA NOT editable — stays in i18n keys (it's structurally part of page chrome, not essay body).
- Desktop-only — mobile shows "desktop-only" message.
- No auto-save, no version history, no collab editing — explicit Save button. All deferred to post-backend phase.
- Details: DESIGN-DECISIONS § "Manifesto admin editor".

---

## 2026-05-11 [Marketing] — Deleted /start route (perf landing variant)

Removed the performance-traffic landing variant we considered building. We consolidated everything into the single `/` minimal landing per the v5 decision (hero + product demo + FAQ + footer). The `/start` route, components, and any sample assets specific to it are deleted. Visiting `/start` now redirects to `/`.

---

## 2026-05-11 [Marketing] — Public site language switcher in footer

Added language switcher to public site footer (landing, manifesto, pricing, auth, auth/reset). Originally decided to omit — but cold visitors auto-detected into wrong locale had no way to switch.

- Initial design used inline ISO codes (`EN · RU · DE · ES`) but switched to dropdown with native names (`English / Русский / Deutsch / Español`) after first iteration revealed ISO codes were unclear for non-technical visitors.
- Trigger button: current language in its own native name + chevron (`Русский ▾`).
- Menu opens upward (footer is at page bottom), shows all 4 languages with checkmark on active.
- Click switches via `i18n.changeLanguage()` + persists to LocalStorage `actos.i18n.language`.
- No page reload — i18next re-renders in place.
- Footer switcher synced with Settings → Language dropdown (same LocalStorage key).
- Also wired up footer site-link translations (`Manifesto`, `Pricing`, `Privacy`, `Terms`) — they were hardcoded English before.
- Does NOT appear on product pages (those keep Settings dropdown only).
- Details: DESIGN-DECISIONS § "Public site i18n".

---

## 2026-05-11 [Marketing] — Public site i18n: 4 languages on landing/manifesto/pricing/auth

Public-facing pages (landing, manifesto, pricing, auth) now fully translated to RU, DE, ES alongside English. 159 new keys added across the four locale files (en/ru/de/es.json). Same i18next architecture as the in-product i18n.

- Hero copy localized (e.g. RU: "Хватит планировать. / Начни действовать. / Операционная система для реальных дел.")
- Manifesto essay translated in full to all 4 languages — RU primary editorial pass, DE/ES parallel.
- Pricing cards, refund line, FAQ translated.
- Auth page: separate keys for sign in vs sign up modes. Form fields, social buttons, terms note all localized.
- Author name `Stanislav Vasilevschii` stays untranslated in all locales (brand-name treatment).
- No language switcher on public pages — locale carries through from product setting (LocalStorage `actos.i18n.language`). Cold visitors get browser-detected default.
- Currency stays in USD (`$0`, `$12`, `$120`) — no localized pricing this batch.
- Details: DESIGN-DECISIONS § "Public site i18n".

---

## 2026-05-11 [Marketing] — Auth flow: combined sign in / sign up, mock implementation

Single `/auth` page handles both modes (sign in default, toggle to sign up). Mock auth via LocalStorage for now; real Supabase Auth integration is a later batch.

- Two modes share one URL. URL hash `/auth#signup` deep-links to sign up mode.
- Landing entry points split: orange CTA `Open ActOS` → `/auth#signup`. Top-right text link `Sign in` → `/auth`. Sign in is for returning users; signup is the primary funnel.
- Sign up form: Name + Email + Password. After submit, redirects (with `replace: true`) to `/setup` wizard.
- Sign in form: Email + Password. After submit, redirects to `/today` or `next` query param.
- Email verification banner appears sticky-top in app after signup until verified. Dismissible per session; non-dismissible after 7 days unverified.
- Google + Apple buttons visible. Click shows "Coming soon" modal (transparency, not faking the flow).
- Forgot password at `/auth/reset` — single email field, mock success state.
- Auth-gated routes: `/`, `/today`, `/goals/*`, `/projects/*`, `/setup`, etc. redirect logged-out users to `/auth?next={path}`. `/manifesto` and `/pricing` are public always.
- Logged-in users hitting `/` or `/auth` redirect to `/today` (no flash of landing).
- `useAuth()` hook is the single source of truth. Mock implementation in `src/lib/mockAuth.ts` (or similar) for clean Supabase swap later.
- Details: DESIGN-DECISIONS § "Auth flow".

---

## 2026-05-11 [Marketing] — Public landing site: landing, manifesto, pricing

Three-page public site launched. Dark theme, minimalist, designed to convert warm and cold traffic from the same single landing (`/`).

- **Landing `/`** — single hero (`Stop scheduling. / Start moving.`) above the fold with product demo below. Subtle radial orange glow behind hero. Below the fold: FAQ section (6 items, item #1 is a link to manifesto, items #2-6 are accordion). No How it works section, no pricing cards, no testimonials. Footer with social icons + sub-row links.
- **Manifesto `/manifesto`** — Medium-style essay layout. Author byline (initials avatar `SV` + name + role + date), title `Tasks won't get you there.`, deck, 5 H2 sections, drop cap on first paragraph, one pull quote with orange left border, closing CTA. Personal first-person voice (Stanislav Vasilevschii as founder).
- **Pricing `/pricing`** — one-screen with 2 cards side-by-side (Free $0/forever, All-In $12/mo with annual sub-line). All-In card has orange border + `RECOMMENDED` pill. Below cards: 30-day refund line. Below refund: small FAQ (4 items about plans, cancellation, price changes, trial).
- Top bar nav on all 3 public pages: `Manifesto · Pricing · Sign in` (active state for current page).
- Footer reused: `Manifesto · Pricing · Privacy · Terms` sub-row + social icons + copyright.
- Product demo on landing — Lovable chose between video file (preferred, TODO placeholder for now), CSS-animated mockup (faithful Today page rendering with checkbox tick animations and Main Task pulse), or static screenshot fallback.
- Details: DESIGN-DECISIONS § "Public site (landing, manifesto, pricing)".

---



The metadata sidebar on Project page restructured from inline 2-column (label left / value right on same line) to stacked layout (label on top / value below, full-width). Applied because Russian and German labels are 1.5–2x English width — inline cramped them with no breathing room. Stack holds across all 4 locales without truncation.

- New container: 280px wide, 24px padding, surface-raised bg, subtle border, rounded.
- Per-field block: label JetBrains Mono 11px uppercase tertiary + value Inter 14px primary. 12px vertical padding per block, 1px subtle divider between.
- Long values (parent goal name, dates) wrap to 2 lines; no truncation, no tooltip needed.
- Field order: Status → Parent Goal → Created → Age → Time invested → Last activity (identity → metadata → engagement).
- Two new fields added: **TIME INVESTED** (sum of action.timeMinutes for done actions, via formatDuration helper) and **LAST ACTIVITY** (relative time via progress.relAgo.*).
- PARENT GOAL value clickable, navigates to /goals/{id} with accent + underline on hover.
- Mobile: rail stacks below main content as single full-width block; same internal structure.
- Details: DESIGN-DECISIONS § "Project page" → Right rail; new keys `projectDetail.sidebar.timeInvested` and `lastActivity` added to all 4 locale files.

---

## 2026-05-10 [Architecture] — Internationalization: 4 languages live (en/ru/de/es)

ActOS now ships in English, Russian, German, and Spanish. Major effort across 5 extraction batches (A → D-extra → 4 visual-QA fix rounds), ~1450 keys total. Settings → Language dropdown lights up all 4 with native names (English, Русский, Deutsch, Español).

- **Stack**: i18next + react-i18next + i18next-browser-languagedetector. Locale files in `src/i18n/locales/{en,ru,de,es}.json`. Persisted under `actos.i18n.language` LocalStorage key.
- **Plural handling**: Russian uses `_one` + `_few` + `_many` (CLDR); en/de/es use `_one` + `_other`. **Never** `_other` for Russian — i18next won't match.
- **Date / time / duration formatting**: centralized via `formatDate(date, opts)` and `formatDuration(minutes)` helpers, all using `Intl.*Format(i18n.language, ...)`. No hardcoded `'en-US'`.
- **Discontinuous strings**: typing-keyword prompts and similar split into Pre / Post fragments to survive locale word-order differences.
- **Trans-component patterns**: inline-count rich text uses `<0>{{count}}</0>` — tag positions preserved across locales.
- **Brand names stay English**: ActOS, All-In, Free. Sample data English by design.
- **Russian glossary highlights** (full table in DESIGN-DECISIONS): "Stalled" → **Застыло** (not Остановлено); "Effort" → **Затраты** (not Усилие); "Captured" → **Зафиксировано** (not Захвачено); "Impact" → **Импакт** (transliteration); "Backlog" → **Бэклог** (calque). Buttons use infinitive verbs; tone is safe-personal (avoid ты/вы distinction where possible).
- **German**: Aufwand/Wert standard; informal `du` voice; `Stockt` for stalled.
- **Spanish**: Esfuerzo/Valor standard; `tú` (informal); `Detenido` for stalled (not "Estancado" — too negative); "completados" for ritual completions (not "cumplimientos").
- **Deferred to post-v1**: number/currency locale formatting beyond date; ARIA labels; admin console; sample-data localization.
- Details: DESIGN-DECISIONS § "Internationalization" — full architecture + glossary + tone rules per locale.

---



Replaces the placeholder Free/Pro tiering with the production subscription model.

- **All-In** is the paid tier name (not "Pro"). "Pro" is generic SaaS — implies amateur opposition, doesn't carry meaning. "All-In" reflects the leap-of-faith pitch: psychological commitment to the product's future, price-locked.
- **Pricing**: $12/mo monthly, $120/yr annual (save 17%), $200 Lifetime one-time (optional, defer if Stripe SKU not ready).
- **Pitch line**: "Go All-In — $12/mo, everything we ever build."
- **Free tier**: all current features; up to 2 active goals (within "max 2-3" philosophy); last 90 days of history; standard support.
- **All-In tier**: 3 active goals (full philosophy bound); unlimited history; priority support (48h email); every future feature included; price locked at signup.
- **History lock UX**: Reviews / Sessions / day entries older than 90 days appear as locked rows for Free users, with reduced opacity + lock icon + click-to-modal. Sparklines truncate at 90 days with "Go All-In for full history" footer. Active entities never lock.
- **Goal cap UX**: Free user creating 3rd goal triggers soft block state inline in goal create modal — Save draft, Go All-In, or Cancel.
- **Graceful downgrade**: All-In with 3 goals → expires → 3 goals stay active, new-goal blocked until reducing to 2 or renewing. 14-day grace before history locks engage. Tier 2 ("DOWNGRADE" typed) confirmation required for explicit downgrade.
- **All-In badge**: subtle pill in user menu popover header only — NOT shown on /today, sidebar, or anywhere else. All-In is a quiet status, not a visual flex.
- **No trial**: Free is the trial, no time limit.
- **No feature gating beyond history + goal cap**: design philosophy choice. We don't sell feature access; we sell long-term retrospective + future commitment.
- v1 ships demo mode (modals say "Coming soon"); real Stripe integration follows.
- Details: MODEL § Common entity fields → subscription; FEATURES "Subscription page"; SCREENS-INVENTORY § 9.4; DESIGN-DECISIONS "Subscription model — Free vs All-In"; ROADMAP v1 features.

---

## 2026-05-09 [Data] — Sample data: project descriptions + references

The sample-data fixture now includes rich project descriptions and references, demonstrating projects as working spaces (not just action containers).

- 9 projects with varied levels of content:
  - **2 very rich** (Stripe billing, training routine): multi-section descriptions with headings, bullet lists, code formatting, plus 4-5 references each.
  - **2 rich with embedded SVG images** (training routine timeline, mileage bar chart): show that descriptions accept images.
  - **3 medium** (Product Hunt, pricing page, B2 textbook): 1-3 paragraphs, 2-3 references each.
  - **2 minimal** (tempo workouts, conversation partner): single paragraph, 0-1 references.
  - **1 stalled** (customer support flow): brief intent, 2 references, visibly low energy.
- Description format: TipTap document JSON, supporting paragraphs, headings, bullet lists, inline code, links, and images.
- Images embedded as data:image/svg+xml URLs (no network needed). Two simple data-visualization SVGs.
- References: structured `{id, url, title}` arrays per project. Manually managed (not auto-extracted from description text).
- Why varied: real workspaces have projects in different states. Closed projects carry history; active main projects have working notes; stalled projects have intent but stopped writing. Sample data should feel like that — not a uniformly polished demo.
- Fixture remains anchored to 2026-05-09; date-shift logic still applies.
- Details: PRODUCT § Canonical example goals (unchanged); MODEL § Project (description + references already spec'd).

---

## 2026-05-09 [UX] — Sample workspace banner with clear-and-start-fresh action

The dismissible banner on /today (sample data path) is replaced with a persistent functional banner that includes a direct cleanup action.

- Banner copy: "You're exploring a sample workspace." with "Clear and start fresh →" link.
- Persistent — no ✕ dismiss. Visible whenever any `isSample: true` entity exists.
- Click "Clear and start fresh" → Tier 1 confirmation modal → on confirm, delete all sample entities, toast confirmation, app enters no-goals mode automatically (since sample data included the only 3 active goals → goal-builder takes over the full screen).
- Settings → Data → "Clear sample data" stays as parallel canonical path. Both work the same way.
- Removed: `actos.coachmark.sample-data-banner: dismissed` LocalStorage flag, ✕ close button, banner copy referencing "Settings → Data" path.
- Rationale: previous dismissible banner could be closed once and never seen again, leaving Settings → Data as the only path to escape sample data. Persistent functional banner makes the path always one click away — and clicking it leads naturally into the user's first real goal via no-goals mode.
- Details: DESIGN-DECISIONS Onboarding → "Sample workspace banner"; SCREENS-INVENTORY § 11.5.

---

## 2026-05-09 [UX] — No-goals mode + Step 4 inline explainer

Two related changes that simplify the "user has no goals" state.

**No-goals mode** replaces the previous empty-states-and-redirects approach:
- When active goals = 0, goal-builder takes over the entire app (no sidebar, no header). Any URL resolves to the builder. Only an account avatar (top-right) for Settings / Sign out.
- Step 1 has no Skip button — user must enter a title to exit the mode. Steps 2-4 keep Skip.
- Triggers: new users on goal-builder path, users who dropped all goals, users who cleared sample data.
- Removes: /today empty state, /projects/rituals/actions "Goals come first" empty states, disabled "+ New X" buttons with tooltip, action-specific redirects.
- Rationale: every non-goal page assumes goals exist for its math. Scattering empty states was band-aiding a routing problem. Treating "no goals" as transient that the user resolves by creating one is cleaner.

**Step 4 inline explainer**:
- Onboarding goal-builder Step 4 (Add actions) now shows an explainer block between description and form: "About these fields: IMPACT (1–10) is how much this task moves your goal... TIME is your estimate in minutes... Both are required so we can calculate the rest automatically."
- First encounter with Impact and Time deserves unmissable explanation, not hover-tooltip.
- The block is onboarding-only. Routine Action create modal uses L1 tooltip (existing).

Details: DESIGN-DECISIONS Onboarding → "No-goals mode" + "Step 4 inline explainer"; SCREENS-INVENTORY § 11.11.

---

## 2026-05-09 [Data] — Sample data replaced with principle-aligned fixture

The dataset seeded on the "Show me how it works" Setup Wizard path is replaced.

- 3 goals, all results-formatted per MODEL § Goal: "$10k MRR from my SaaS", "Sub-2h half marathon", "C1 Spanish proficiency". Previous goals had activity-framed titles ("Launch YouTube channel", "Set up workspace") that contradicted the goal-vs-result framing.
- 9 projects (2 closed, 7 active including 1 stalled) — closeable deliverables under each goal.
- 68 actions across 60 days with full status mix: 43 Done, 10 Backlog, 5 Planned, 5 Delegated (2 overdue), 3 Dropped, 2 Cancelled.
- 4 rituals with multi-week completion histories — Morning pages (~50 done) hits ×1.25 multiplier territory; weekly project audit demonstrates rare-but-valuable cadence.
- 5 ideas, 20 focus sessions, 60 day entries with day-type history.
- 5 coachmark keys pre-dismissed so users on this path don't get first-encounter callouts on top of sample data.
- All entities flagged `isSample: true`; existing Settings → Data → Clear sample data remains the cleanup path.
- Fixture anchored to 2026-05-09; at seed time, all timestamps shift by (today - anchor) offset so dates stay relevant on first load.
- Goal-builder path is unchanged — those users build their own data, no sample seeding.

---

## 2026-05-09 [UX/Copy] — Goal-builder Step 4 concrete placeholders

Replaced generic action placeholders ("First action...", "Another action...", "Time min") with concrete examples that teach action scale.

- Row 1 placeholder: "e.g. Read Stripe API docs".
- Row 2 placeholder: "e.g. Implement webhook handler".
- Row 3+ placeholder: "e.g. Set up test environment".
- TIME column placeholder: "e.g. 30" (was "Time min").
- IMPACT default 5 unchanged.
- Description and layout unchanged.
- Same domain (startup/SaaS) as the canonical goal examples — keeps the placeholder voice consistent.

---

## 2026-05-09 [UX] — Goal-builder refinement: lighter step 1 + new Criteria step + 0-goals fallback

Three connected changes to goal-builder.

- **Step 1 (Goal) compressed**: kept only the first description paragraph. Removed multi-paragraph activity-vs-result contrast and the inline tip line about success criteria. Goal-vs-activity contrast is now taught entirely through the "+ Examples" expandable.
- **New step 2 — Success Criteria**: dedicated step between Goal and Project for 0-5 criteria. Heading "What does 'done' look like?". Empty by default with "+ Add criterion" link. Each criterion is plain text (max 120 chars). Skippable via "Skip — add later" link. Description mentions user can edit anytime on goal page.
- **Step counter changes** from "STEP N OF 3" to "STEP N OF 4" across Goal / Criteria / Project / Actions.
- **Goal-builder runs whenever goals = 0**: clicking "Start your day", attempting to create an action, or creating a ritual when no goals exist now triggers the full-page goal-builder. Plain visit to /today shows empty state with "+ Create your first goal" CTA. Header "+ New X" buttons on /actions, /rituals, etc. are disabled with tooltip "Create a goal first" when goals = 0.
- Same goal-builder UI used both during onboarding and when an established user lands without goals (e.g., after clearing sample data). No "welcome back" greeting — same flow.
- Details: FEATURES "Goal-builder flow"; DESIGN-DECISIONS Onboarding → "Goal-builder is a 4-step flow" + "Goal-builder runs whenever user has 0 active goals"; SCREENS-INVENTORY § 11.7-11.11.

---

## 2026-05-09 [UX/Copy] — Goal-vs-Project framing

Goals are now consistently framed as **results, not activities** across all UI surfaces.

- Onboarding goal step gets extended description block explicitly contrasting goal vs project.
- Title placeholder changed from "Launch personal portfolio site" (a project) to "Get my SaaS to $10k MRR" (a result).
- New "Examples" expandable in onboarding shows 5 canonical examples that fill the input on click.
- Acceptance Criteria mentioned as a tip in onboarding (not a form) — discovery happens on Goal page.
- Project create modal gets parallel framing: "chunk of work that finishes — days or weeks."
- /goals and /projects empty states reinforce the goal=result vs project=deliverable distinction.
- Help section gets canonical "Goals, Projects, Actions" block.
- 8 canonical example goals fixed in PRODUCT § "Canonical example goals" — used everywhere, no inventing new ones.
- MODEL § Goal updated with "A goal is a result, not an activity" as the primary definition.
- Rationale: previous placeholder copy taught the wrong scale. Users would calibrate to "Launch portfolio site"-sized goals → shallow ambitions + vague projects. Results-oriented examples set the right pattern.
- Details: PRODUCT § Canonical example goals; MODEL § Goal; DESIGN-DECISIONS Onboarding → "Goal-vs-Project framing in copy".

---

## 2026-05-09 [UX] — Setup Wizard: Dark default + token-correct mockups

Two refinements to the Setup Wizard.

- Wizard ignores system preference on entry — always renders in Dark. Dark is the canonical Workshop aesthetic; Light is an alternative.
- Screen 1 Theme tile "Dark" is pre-selected by default. Continue is enabled from the start.
- User can click Light or System to change; the entire wizard theme transitions live (300ms CSS variable swap).
- Theme tile mini-mockups use real product tokens via `data-theme` scope per tile: top progress bar `var(--accent)`, bottom bar `var(--goal-1)` teal, three dots `var(--goal-1)` / `--goal-2` / `--goal-3`. No hardcoded generic blues or greens.
- Each tile renders its SVG in the relevant theme's tokens — Light tile shows light tokens, Dark tile shows dark tokens, System tile follows OS preference. This works regardless of the wizard's current theme.
- Standard theme persistence (`actos.theme` LocalStorage) unchanged after Wizard completes.
- Details: DESIGN-DECISIONS "Onboarding" → Setup Wizard visual character.

---

## 2026-05-09 [UX] — Setup Wizard (first-run experience)

Added a new ceremonial 3-screen Setup Wizard before the goal-builder flow. Restructures onboarding from "5 flat steps" to "Setup Wizard + branch."

- Screen 0: Welcome with name from registration, single CTA.
- Screen 1: Theme picker — three tiles with SVG mini-mockups of ActOS UI in each theme. Hover transitions the entire app theme live (300ms CSS variable swap).
- Screen 2: Getting started — choose between "Show me how it works" (sample data) and "Set up my own goal" (goal-builder).
- Screen 3: 1.2s setup pause with progress-line animation, then redirect.
- "Show me how it works" path: seeds workspace with 3 goals / 3 projects / 12 actions / 3 rituals / 4 ideas (same fixtures as /admin/components), each flagged `isSample: true`. Lands on /today with dismissible banner.
- "Set up my own goal" path: redirects to existing goal-builder flow (Goal → Project → Actions → /today). Unchanged.
- Settings → Data: new "Clear sample data" row, only visible if `isSample` entities exist. Tier 1 confirm.
- Setup Wizard runs once per user (`actos.setup.completed`). No skip option — under 60 seconds.
- Visual character deliberately different from rest of product: full-screen canvas, 40-56px headings, 80-120px padding, text-style CTAs (no box buttons), 250ms cross-fade transitions. Apple-device-setup feel.
- Removed: previous "Welcome + Model" step with long Impact/Value/Effort explanation. Concept explanation now via L1 tooltip on Impact field and progressive coachmarks (deferred).
- Details: DESIGN-DECISIONS "Onboarding"; FEATURES "Onboarding"; SCREENS-INVENTORY § 11.

---

## 2026-05-09 [UI] — /progress: Time Investment above Active Projects

Swapped the order: Time Investment now sits directly under Hero, with Active Projects below it.

- New order: Hero → Time Investment → Active Projects → Recently Closed P&G → Recently Closed Actions → Currently Delegated.
- Rationale: Time Investment is a goal-level breakdown — natural continuation of the goal-focused Hero. Active Projects is project-level detail and reads as the next step down the hierarchy.
- No content changes inside any section. Just position swap.
- Details: SCREENS-INVENTORY § 3.1; DESIGN-DECISIONS "Progress page".

---

## 2026-05-09 [UI] — /progress reorder + Active Projects scoped

Active Projects moved up; section order now matches Goals → Projects → Actions hierarchy.

- New section order: Hero → Active Projects → Time Investment → Recently Closed P&G → Recently Closed Actions → Currently Delegated.
- Previously Active Projects sat below Recently Closed (historical archive above current work — wrong).
- Active Projects capped at 6 cards, sorted by recent activity. Stalled mixed in by activity, not separated.
- "View all {N} projects →" link appears below cards if total active > 6, links to /projects with State=Active filter.
- No visual change to project cards.
- Details: SCREENS-INVENTORY § 3.1; DESIGN-DECISIONS "Progress page".

---

## 2026-05-09 [UX] — L2 metric tooltip scoped to detail pages

The info icon next to VALUE/EFFORT bars was appearing on every list view and dashboard (`/today`, `/progress`, `/goals` cards, project cards). Removed from those — kept only on Goal page and Project page heroes.

- Daily surfaces (Today, Progress, Goals list) no longer show the info icon. Bars and percentages stay.
- Goal page and Project page hero retain the info icon — these are deep-dive surfaces where reference material is appropriate, not noise.
- Trigger visual refined: lucide `Info` icon directly, no surrounding circle. 12px, var(--text-tertiary), hover var(--text-secondary).
- L1 (Impact field in create modals) and L3 (onboarding) unchanged.
- Popover content unchanged.
- Rationale: explanation belongs once at the right spot. Repeating it on every card a user scans daily turns help into clutter.
- Details: DESIGN-DECISIONS "Metric explanation strategy"; DESIGN-SYSTEM § 3.34 InfoPopover.

---

## 2026-05-09 [UX] — Metric explanation strategy

Three-layer progressive explanation of Impact / Value / Effort across the app.

- **L1**: Info icon next to IMPACT label in Action and Ritual create modals. One-sentence tooltip explains what Impact is. No mention of Value/Effort at this layer.
- **L2**: Info icon next to VALUE/EFFORT bars on Goal cards, Goal page hero, /progress columns, Project pages. Popover explains both metrics together and frames the asymmetry. Replaces previous italic "Effort discounts delegated work to 20%." caption.
- **L3**: Onboarding step 1 (Welcome + Model) given full content — explains the input/derived split (user enters Impact + Time; everything else calculates) and the Value/Effort relationship as the system-design goal.
- L4 (full "How progress is calculated" page) deferred — not in M8.
- New component: InfoPopover (DESIGN-SYSTEM § 3.34). Single source-of-truth used in all locations.
- Internals deliberately NOT explained at any layer: Goal Cost / Project Cost denominators, multiplier step function, retroactive recalculation, Dropped/Cancelled removing Impact from Cost.
- Details: DESIGN-DECISIONS "Metric explanation strategy" + Onboarding section; DESIGN-SYSTEM § 3.34.

---

## 2026-05-09 [UI] — Ritual create modal aligned with Action

Same restructure principles applied to the "New ritual" modal as the recent Action create modal change.

- Time-of-day field removed entirely (was never displayed or used; reminders out of v1 scope).
- Field order: Title → Estimates → Parent → Schedule → Notes.
- Base Impact and Time now required at create (per MODEL § Ritual). Previous "BASE IMPACT (0-10)" with default 0 was invalid against MODEL spec.
- Parent collapsed into one row of compact pills (Goal + Project) with popover.
- Notes collapsed behind "+ Add notes" link.
- "Create ritual" button never disabled — Enter or click triggers validation, inline errors appear under missing fields.
- Schedule kept as full-width dropdown (needs config sub-fields for Weekly/Monthly).
- Edit slide-in panel UNCHANGED.
- Details: BEHAVIORS § 5.1; DESIGN-SYSTEM § 2.7 "Create modal layout — Ritual create"; DESIGN-DECISIONS Action editor section.

---

## 2026-05-09 [UI] — Action create modal restructured

Six changes to the "+ New action" modal applied together.

- Field order: Title → Estimates → Parent → Date → Notes (Estimates jumped up).
- State dropdown removed — status auto-derives from Scheduled date per MODEL.
- Parent (Goal + Project) collapsed into one row of compact pills, popover on click.
- Notes collapsed behind "+ Add notes" link by default.
- "Create" button never disabled — Enter or click triggers validation, inline errors appear under missing fields, first error gets focus.
- Time estimate now optional at create (was already optional per MODEL, button rule was overstrict).
- Required fields at create: Title + Impact + Parent Goal. Everything else optional.
- Slide-in edit panel UNCHANGED — only the create modal restructured.
- Details: BEHAVIORS § 4.1; DESIGN-SYSTEM § 2.7 "Create modal layout"; DESIGN-DECISIONS Action editor section.

---

## 2026-05-09 [Bug] — Action create flow no longer opens editor

After creating an action via the "+ New action" modal, the slide-in Action editor was opening automatically with the new action loaded. Fixed.

- Post-create now closes the modal and returns user to the list view, no editor.
- Toast still confirms creation.
- Inline-add behavior unchanged (was already silent).
- Applies to all entry points: header "+ New action", Cmd+K create command, etc.
- Details: BEHAVIORS § 4.1 "Post-create navigation".

---

## 2026-05-09 [UI] — Fixed-width pills

ImpactPill, TimePill, MultiplierPill switched from min-width to fixed width.

- ImpactPill: 40px (sized for "I10").
- TimePill: 64px (sized for "1h 30m").
- MultiplierPill: 56px (sized for "×2.00").
- Compact ImpactPill variant: 34px.
- Right-edge pill column now aligns across all rows in lists. No more jitter from "I10" being wider than "I3".
- Format strings unchanged — only width is the change.
- Applied globally — all uses of these pills get fixed width.
- Details: DESIGN-SYSTEM § 3.24, § 3.24b, § 3.24c; DESIGN-DECISIONS Visual direction.

---

## 2026-05-09 [UI] — Inline-add parent pickers

Replaced boxed Goal/Project dropdowns in the ActionPicker inline-add with inline text triggers.

- Plan today step 2 and Session Builder ACTIONS section affected.
- New visual: `in {dot} {Goal} · {Project}` reads as a sentence, with goal/project as dotted-underline inline buttons.
- Click opens a popover (same primitive as FilterDropdown).
- No chevron, no border, no background — strips form-chrome look in favor of Workshop density.
- Smart default and session persistence behavior unchanged.
- Lightweight 48px inline-add (Today zone, Project page) untouched.
- Details: DESIGN-SYSTEM § 3.29 item 5; DESIGN-DECISIONS Today / Plan today section.

---

## 2026-05-09 [Fix] — Reviews sort options expanded

Added sort dropdowns to /reviews/weeks and /reviews/months (none existed) and expanded /reviews/days options.

- All three review pages now share the same six sort options for consistency: Most recent · Oldest · Most actions done · Most time invested · Most value · Most effort.
- Most value: sum of Value contribution in period (Done = 100% Impact, Delegated = 100% Impact).
- Most effort: sum of Effort in period (Done = 100% Impact, Delegated = 20% Impact).
- Persistence: separate LocalStorage keys per page (`actos.reviews.days.sort`, `actos.reviews.weeks.sort`, `actos.reviews.months.sort`).
- Universal tie-breakers and missing-value rules from § 11.9 apply.
- Details: BEHAVIORS § 11.9.

---

## 2026-05-09 [Bug] — /actions Sort dropdown

Fixed broken Sort dropdown on /actions and expanded the option set.

- Sort dropdown was non-interactive (clicking "Sort: Recent first ▾" did nothing). Root cause investigated and fixed.
- Added five new sort options: Oldest first, Highest impact, Lowest impact, Longest first, Shortest first. Total: six options.
- Selection persists in LocalStorage under `actos.actions.sort`.
- Empty `timeEstimate` values sort to the bottom in both directions.
- Universal tie-breakers: `createdAt` desc, then `id`.
- Per-page sort option sets for all list pages documented in BEHAVIORS § 11.9.

---

## 2026-05-08 [M8 partial] — Workshop Light theme

Added a parallel light theme alongside the existing dark theme, with a switcher in Settings.

- New `[data-theme="light"]` token set: cool gray surfaces, hairline-driven (macOS Light / Linear Light reference). Same variable names as dark — no extras, no omissions.
- Goal colors retuned for white surfaces (lower luminance, same hue family). Accent unchanged.
- New `--backdrop` token: dark `rgba(0, 0, 0, 0.5)` / light `rgba(20, 22, 28, 0.35)`.
- Theme controller: LocalStorage `actos.theme` (`'light' | 'dark' | 'system'`), default `'system'`. System mode follows `prefers-color-scheme` live.
- Inline pre-paint script in `<head>` resolves theme before CSS loads — no flash on reload.
- New ThemeToggle component (DESIGN-SYSTEM § 3.33): 3-segment control in Settings → Account.
- Sonner toast theme wired to active theme.
- High-contrast variant deferred to v1.x — M8 not fully closed.
- Details: DESIGN-SYSTEM § 1.2, § 3.33, § 5.14; DESIGN-DECISIONS "Visual direction — Workshop", "Settings"; BEHAVIORS § 11.8.

---

## 2026-04-XX [M7.5] — Identity, subscription, admin tooling

Sidebar bottom area redesign + dedicated subscription page + dev admin tools.

- Sidebar bottom: clickable user identity trigger + UserMenuPopover (Settings / Subscription / Admin conditional / Sign out).
- Subscription page at `/settings/subscription` with current plan card + Free/Pro comparison cards. Demo data only — payment integration deferred.
- `user.subscriptionTier` field (`'free' | 'pro'` — later renamed to `user.subscription.tier` with `'all-in'` replacing `'pro'`); TierBadge component (later replaced by quiet All-In badge).
- "Show admin tools" toggle in Settings → Account (default OFF) — gates `/admin/components`.
- `/admin/components` page: visual smoke test rendering every component in every state. Sticky header with Live / Mock data toggle.
- Mock data fixtures: 3 goals, 3 projects, 12 actions, 3 rituals, 4 ideas, 2 sessions.
- `?` Shortcuts moved to icon button in sidebar bottom row.
- Details: DESIGN-SYSTEM § 3.31, § 3.32, § 5.15, § 5.16; SCREENS-INVENTORY § 9.4, § 9.5; BEHAVIORS § 10.12, § 10.13, § 10.14, § 11.5.
