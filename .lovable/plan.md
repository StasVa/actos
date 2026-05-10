## Part 1 — i18n architecture + English string extraction

### Scope reality check
The codebase has ~30 pages and ~60 components with thousands of user-facing strings. A truly exhaustive single-shot extraction across all of them (including rarely-touched admin pages, every error toast, every tooltip) is not realistic in one pass without producing hundreds of risky edits. Part 2 is explicitly an audit/gap pass, so this Part 1 will:

1. Build a complete, production-ready i18n foundation.
2. Extract strings from the **high-traffic surface** comprehensively.
3. Honestly mark the remaining surfaces as "deferred to Part 2" in the completeness summary so the audit pass can target them precisely.

### 1. Infrastructure
- Install `i18next`, `react-i18next`, `i18next-browser-languagedetector`.
- Create `src/i18n/index.ts` with config (EN only, localStorage detection key `actos.i18n.language`, fallback `en`).
- Create `src/i18n/locales/en.json` (sorted alphabetically within domains, 2-space indent).
- Create `src/i18n/format.ts` with `formatDate`, `formatRelative`, `formatTime(minutes)` (locale + i18n keys for "m"/"h" units), `formatNumber`.
- Import `./i18n` in `src/main.tsx` so initialization runs before render. (No provider needed — `react-i18next` works via the default instance once initialized.)

### 2. Extraction targets (Part 1 scope)
Will extract strings in:
- `AppSidebar`, `MobileHeader`, `UserMenu`, `PageHeader`, `LifetimeCounters`
- `pages/Index.tsx` (Today)
- `pages/AllActions.tsx`, `pages/AllDelegated.tsx`, `pages/AllProjects.tsx`, `pages/Goals.tsx`, `pages/Ideas.tsx`, `pages/Rituals.tsx`, `pages/Sessions.tsx`, `pages/Progress.tsx`, `pages/Reviews.tsx`
- `pages/Settings.tsx`, `pages/SettingsSubscription.tsx`, `pages/Setup.tsx`, `pages/GoalBuilder.tsx`
- `components/ActionRow.tsx`, `ActionEditor.tsx`, `RitualEditor.tsx`, `GoalEditor.tsx`, `EditorFooterControls.tsx`, `ConfirmModal.tsx`, `EmptyState.tsx`, `FilterDropdown.tsx`, `SortDropdown.tsx`, `CommandPalette.tsx`, `KeyboardShortcuts.tsx`, `NoGoalsLayout.tsx`, `PlanCloseModals.tsx`, `LockModal.tsx`, `CloseDayRecap.tsx`, `SettingsPanel.tsx`, `RitualPanel.tsx`, `SessionsSection.tsx`, `AccomplishmentsSection.tsx`, `OutcomeAddedSection.tsx`, `TimeInvestmentSection.tsx`
- Sample workspace banner (`Index.tsx` + related)
- Status / common / nav labels used everywhere

### 3. Deferred to Part 2 (will be listed in summary)
- All `src/admin/**` pages (admin console — internal tool, separate audience).
- `pages/SessionBuilder.tsx`, `SessionActive.tsx`, `SessionSummary.tsx` (session flow — high copy density, will defer if scope explodes).
- All `Review*Detail` pages (deep review screens).
- All ARIA labels and `aria-label` attributes (explicitly deferred per prompt).
- Toast strings inside rarely-hit error branches.
- Any `<Tooltip content={...}>` longer-form copy that's not on the main surfaces.

### 4. Settings → Language section
Add a "Language" section to `pages/Settings.tsx` with a disabled `<Select>` containing only "English" and helper text "More languages coming soon."

### 5. Key naming
- Domain prefixes per prompt: `common`, `nav`, `status`, `today`, `actions`, `delegated`, `goals`, `goalBuilder`, `projects`, `ideas`, `rituals`, `sessions`, `reviews`, `progress`, `settings`, `subscription`, `sample`, `signin`, `time`, `confirm`, `empty`, `toast`.
- Plurals: `_one` / `_other`.
- Interpolation: `{{named}}` placeholders.

### 6. Output summary
After completion: total key count, per-domain breakdown, interpolated keys list, plural keys list, deferred-strings list, and the `en.json` path.

### Risks / notes
- Even with the deferred surfaces, this is ~30+ file edits. I'll proceed without further confirmation since the prompt is explicit.
- I'll preserve the existing `formatTime` in `src/lib/format.ts` (already plain numeric output) and add the i18n-aware variant in `src/i18n/format.ts` for new call sites; mass-swapping every `formatTime` call site is deferred to Part 2 to keep diff size sane.
- No visible copy changes — extraction is lossless.
