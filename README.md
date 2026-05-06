# Marqo Demo Studio

Standalone side project for visual sales demos.

This repository does not modify `viniciusandrade95/theone`.
It starts with local mock simulation only.
Any future integration with `theone` must happen through an explicit connector or API abstraction.

## Purpose

Marqo Demo Studio is a visual demo control room.
It should make a business feel alive during a commercial demo:

- customer messages arrive
- assistant replies appear
- bookings move through states
- cancellations and no-shows affect KPIs
- a timeline tells a believable story

All demo data must be labeled honestly as simulated.

## Boundaries

- standalone repo only
- no direct imports from `theone`
- no copied secrets
- no production writes
- no external API calls required for local development
- future backend integration must go through connector abstractions

## Current stage

PR-00 bootstraps:

- Next.js App Router
- TypeScript
- Tailwind CSS
- ESLint
- Prettier
- Vitest
- Playwright placeholder config
- initial landing and placeholder routes
- local env parsing helpers
- fixture-backed session playback baseline
- basic domain and utility tests

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run test:watch
npm run build
```

## Routes

- `/`
- `/demo-lab`
- `/demo-session/[sessionId]`

## Environment

Copy `.env.example` if needed.
At this stage the app uses only local-safe values and local simulation assumptions.

## Docs

- `docs/PROJECT_VISION.md`
- `docs/ROADMAP.md`
- `docs/ARCHITECTURE.md`
- `docs/SAFETY_RULES.md`
