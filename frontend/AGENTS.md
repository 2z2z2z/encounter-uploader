# Repository Guidelines

## Project Structure & Module Organization
The frontend is built with Vite, Vue 3, and TypeScript. Application code lives in `src`: `components/` for UI, `composables/` for shared hooks, `services/` for API clients, `store/` for Pinia modules, and `utils/` for helpers. Routing is under `src/router/`, typed models in `src/types/`, and PrimeVue assets in `src/assets/`. Static files and HTML shell live in `public/`. Sample payloads for manual QA reside in `test-configs/` and `test-configs-v2/`.

## Build, Test, and Development Commands
Run `npm install` once per checkout. Use `npm run dev` for hot-reload local development (defaults to `http://localhost:5173`). `npm run build` performs a type-checked production bundle via `vue-tsc` and `vite build`. `npm run preview` serves the built assets for smoke testing. `npm run lint` auto-formats and fixes lint issues; prefer `npm run lint:check` in CI scripts to fail fast without writes.

## Coding Style & Naming Conventions
Use TypeScript everywhere outside of Vue templates. Follow Composition API patterns and keep Vue SFC script blocks in `<script setup lang="ts">`. Stick to two-space indentation, `PascalCase` component names, and `camelCase` composables, stores, and utilities. Template refs and Pinia stores should end with `Ref` and `Store` respectively (e.g., `encounterStore`). Rely on the shared ESLint flat config; run the fixer before committing.

## Testing Guidelines
No automated test harness ships yet; linting and manual flows are the gatekeepers. Validate uploads locally by loading the JSON fixtures in `test-configs*/`. When adding logic-heavy utilities or stores, include unit scaffolding so Vitest can be introduced easily (co-locate future specs as `*.spec.ts` in the same folder). Document exploratory steps in PR notes until automated coverage lands.

## Commit & Pull Request Guidelines
Keep commit messages short, present-tense summaries (`encounter: add uploader wizard`). Group related changes and avoid mixed refactors and features. Every PR should include: concise description, screenshots/GIFs for UI changes, links to tracking issues, and notes on manual scenarios exercised. Ensure `npm run build` and `npm run lint:check` pass before requesting review.

## Configuration Tips
Copy `.env` to `.env.local` for personal overrides; never commit secrets. Update API base URLs and feature toggles through env vars instead of hard-coded constants. Docker deployments read the same values during `npm run build`, so keep variable names stable.
