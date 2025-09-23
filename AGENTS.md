# Repository Guidelines

## Project Structure & Module Organization
The repo is split into a Vue 3 frontend and an Express proxy.
- `frontend/` holds the Vite + TypeScript application. Core code lives in `src/` (components, composables, services, store, utils) with static assets in `public/` and Tailwind setup in `index.css`.
- `server/` contains `index.js`, an Express session-aware proxy to Encounter APIs. Treat it as the single entry point; add helpers as co-located modules when the file grows.
- `docs/` stores product context and refactoring notes referenced during planning.
Keep new automation, scripts, or tooling near the layer they serve; cross-cutting docs belong in `docs/`.

## Build, Test, and Development Commands
Run `npm install` once at the repo root to hydrate workspaces.
- `npm --prefix frontend run dev` starts Vite on localhost:5173 with hot reload.
- `npm --prefix frontend run build` performs a type check via `vue-tsc` then emits production bundles to `frontend/dist`.
- `npm --prefix frontend run lint:check` runs ESLint with the Vue + TypeScript ruleset; fix on-save issues with `lint`.
- `npm run start:server` (root alias for `npm --prefix server start`) launches the proxy on port 3001; ensure `.env` supplies Encounter credentials.
Pair frontend dev with the proxy to avoid CORS issues.

## Coding Style & Naming Conventions
Use two-space indentation, trailing commas, and single quotes as seen in existing Vue files.
Keep components in PascalCase (`LevelPreview.vue`), composables as `useX`, Pinia stores as `useXStore`, and utilities in camelCase.
Prefer typed APIs; export shared types from `frontend/src/types`.
ESLint and Tailwind provide formatting hints—do not introduce Prettier without discussion.

## Testing Guidelines
Automated tests are not yet in place.
When adding them, mirror Vue Test Utils + Vitest patterns, co-locating specs beside the component (`ComponentName.spec.ts`).
Hook new checks into `npm --prefix frontend run test` once introduced, and target smoke coverage for level upload flows.
Until then, create manual smoke scripts under `docs/` after changes touching production paths.

## Commit & Pull Request Guidelines
Follow the short, present-tense messages used in history (`levels modal fix`, `refactoring plan upd`).
Start with a lowercase verb, <= 60 characters, and group related changes per commit.
Pull requests need: summary of behavior changes, manual test notes, linked issues or Jira IDs, and screenshots or Looms for UI tweaks.
Request review from both frontend and backend owners when touching shared contracts.

## Security & Configuration Tips
Keep secrets in `.env` files excluded from Git.
Rotate the Express `SESSION_SECRET` for staged/production deploys.
Never log Encounter tokens; rely on proxy-side retries instead of exposing credentials in the browser.
Document any new required env vars inside `docs/refactoring.md` and reference them in PRs.
