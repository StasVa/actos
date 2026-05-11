# ActOS

Daily-execution system for ambitious people pursuing 2-3 goals at once.

ActOS asks one question every morning: *what are you doing today for your goals?* The answer becomes the day's plan; the plan turns into actions; actions accumulate as honest progress measured in two parallel axes — Value (how far the goal moved) and Effort (how much you personally spent).

## Documentation

Product and design docs live in `docs/`:

- `00-VISION.md` — philosophical anchor
- `01-AUDIENCE.md` — who we build for
- `02-PRODUCT.md` — product brief
- `03-MODEL.md` — data model
- `04-FEATURES.md` — feature catalog
- `05-FLOWS-AND-SCREENS.md` — user journeys
- `06-ROADMAP.md` — scope and timing
- `07-SCREENS-INVENTORY.md` — every screen
- `08-DESIGN-DECISIONS.md` — UX/architecture decisions
- `09-DESIGN-SYSTEM.md` — design tokens
- `10-BEHAVIORS.md` — state transitions
- `11-CHANGELOG.md` — significant changes
- `FRONTEND-AUDIT.md` — codebase audit baseline

## Stack

React 18 + TypeScript + Vite + Tailwind + shadcn/ui · Zustand · TanStack Query · i18next · TipTap · React Router · lucide-react · sonner · recharts

Backend (planned): Supabase (Auth + Postgres + Storage + Edge Functions) · Resend · Vercel

## Local development

Prerequisites: Node.js 18+, npm.

```bash
npm install
npm run dev
```

Dev server runs on http://localhost:5174

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run preview` — preview production build locally
- `npm run lint` — ESLint
- `npm run test` — run tests
- `npm run test:watch` — watch mode

## AI agent context

This project includes context files for AI coding assistants:
- `.cursorrules` — read by Cursor
- `CLAUDE.md` — read by Claude Code CLI

Both contain product philosophy, stack, conventions, and what not to do.
