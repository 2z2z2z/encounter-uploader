# Repository Guidelines

## Project Structure & Module Organization
- `frontend/` - Vue 3 + Vite SPA; feature code lives under `src/components`, `src/entities`, `src/services`, `src/store`, and `src/utils`, static assets in `public/`, JSON fixtures in `test-configs/`.
- `server/` - Express proxy (`index.js`) for login and admin upload endpoints; reads port and session secret from environment variables.
- `docs/` - design notes and level planning references; refresh entries whenever gameplay flows change.
- `en-uploader-example.gs` - Google Apps Script sample kept in sync with payloads.

## Build, Test, and Development Commands
- `npm install --prefix frontend` / `npm install --prefix server` - install module dependencies.
- `npm --prefix frontend run dev` - start dev server on port 5173.
- `npm run start:server` - launch the proxy on port 3001.
- `npm run build:frontend` - type-check and emit the production bundle in `frontend/dist`.
- `docker compose up --build` - run the Nginx and proxy stack at `http://127.0.0.1:8099` for E2E checks.

## Coding Style & Naming Conventions
- Prefer TypeScript; share interfaces in `src/types` and domain models in `src/entities`.
- Vue SFCs belong in `src/components`; use PascalCase filenames and template refs, and place composables in `src/composables` with the `useX` pattern.
- Run `npm --prefix frontend run lint` before committing; ESLint enforces Vue casing, TypeScript safety, and flags unused variables.
- Keep two-space indentation, Tailwind utilities for layout, and scoped styles for component CSS.

## Testing Guidelines
- No automated suite yet; exercise the affected flow through the dev server with the proxy running.
- Use `frontend/test-configs/*.json` to rehearse complex uploads without live data.
- Capture repro steps and logs in pull requests, especially when touching proxy logic.

## Commit & Pull Request Guidelines
- Keep commit subjects short (<=72 chars) and focused on one change (`structure reorganization`, `fix login retry logging`).
- Pull requests should list scope, local verification commands or fixtures, and linked tickets when available.
- Include UI screenshots for visible tweaks and proxy response logs for backend work; request reviews from owners.

## Communication
- Communicate with automation agents and reviewers in Russian; mirror user language in comments and threads.

## Environment & Configuration
- Store shared keys in the root `.env` and module overrides in `frontend/.env` or `server/.env`; never commit production secrets.
- Configure `SESSION_SECRET`, domain hosts, and `VITE_` variables before non-local runs.
- Update `docs/` whenever environment expectations or feature flags change.
