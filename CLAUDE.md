# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Encounter Uploader is a web application for uploading game levels to the Encounter platform. It consists of a Vue 3 frontend and Node.js Express backend proxy server. The application supports multiple level types with different configurations (Olympic levels with varying sectors, and custom 100500 levels).

## Architecture

**Monorepo Structure:**
- `frontend/` - Vue 3 + TypeScript + PrimeVue application
- `server/` - Node.js Express proxy server
- Root package.json manages build scripts

**Frontend Stack:**
- Vue 3 with Composition API and `<script setup>` syntax
- TypeScript (no `any` types allowed)
- PrimeVue 4 for UI components with custom Aura theme
- Pinia for state management with persistence
- Vue Router for navigation
- TailwindCSS v4 for styling
- Vite for build tooling

**Backend:**
- Express.js with session management
- Axios for upstream API communication with retry logic
- CORS and cookie handling for authentication flow

## Common Development Commands

**Frontend Development:**
```bash
cd frontend
npm run dev          # Start dev server on http://127.0.0.1:5173
npm run build        # Build for production (includes TypeScript compilation)
npm run preview      # Preview production build
```

**Server Development:**
```bash
cd server
npm start           # Start server on port 3001
```

**Full Stack Development:**
```bash
# From root directory
docker-compose up --build    # Start both services (frontend on :8099, server on :3001)
```

## Key Architectural Patterns

**Registry-Based Architecture:**
The application uses a registry system for level types, fields, and controls located in `frontend/src/components/level-system/registry/`. New level types are configured through TypeScript configs rather than creating new components.

**State Management:**
- Multiple Pinia stores for different concerns (auth, settings, level data, upload)
- Persistent state using `pinia-plugin-persistedstate`
- Store composition pattern with composables

**Component Structure:**
- Base UI components wrap PrimeVue components for consistency
- Dynamic components generated from registry configurations
- Level upload components share common layout and behavior

**Data Flow:**
1. User configures game settings (`domain`, `gameId`, `levelId`)
2. Selects level type which loads corresponding configuration
3. Fills content in dynamic tables based on field definitions
4. Uses control panel for mass editing operations
5. Uploads data through proxy server to Encounter API

## Important Configuration Files

- `frontend/package.json` - Frontend dependencies and build scripts
- `frontend/vite.config.ts` - Vite configuration with API proxy setup
- `frontend/tailwind.config.js` - TailwindCSS configuration
- `server/package.json` - Server dependencies
- `docker-compose.yml` - Full stack development environment

## Development Guidelines

**Code Style:**
- Use TypeScript strict mode, avoid `any` types
- Follow Vue 3 Composition API patterns with `<script setup>`
- Use PrimeVue components instead of creating custom UI components
- Leverage the registry system for new level types instead of hardcoding

**Adding New Level Types:**
1. Create configuration in `registry/types/`
2. Define required fields in `registry/fields.ts`
3. Configure controls in `registry/controls.ts`
4. No new components needed - use existing `UniversalLevel.vue`

**Authentication:**
- Test credentials: `test/test` (bypasses domain validation)
- Production requires valid Encounter domain and game ID
- Session managed through Express session middleware

**API Integration:**
- All API calls go through `/api/*` proxy routes
- Server handles authentication headers and session management
- Frontend uses axios with automatic retry logic for uploads

## Development Testing

- No automated tests currently configured
- Manual testing through development environment
- Test credentials: `test/test` for bypassing authentication checks

## Current Refactoring Context

The codebase is undergoing a major refactoring to:
- Consolidate Olympic level variants into unified components
- Implement registry-based architecture for extensibility
- Migrate to PrimeVue for consistent UI
- Prepare for adding 20+ new level types

Key refactoring documents:
- `REFACTORING_PLAN.md` - Detailed step-by-step refactoring plan
- `FRONTEND_REFACTORING_FINAL.md` - UI modernization strategy with PrimeVue

When working with this codebase, prioritize the registry-based approach and PrimeVue components over creating new custom implementations.

## User Project rules

You are a Senior Front-End Developer and an Expert in TypeScript, Node.js, Vite, Vue.js, Vue Router, Pinia, VueUse, Telegram Mini Apps and TailwindCSS, with a deep understanding of best practices and performance optimization techniques in these technologies.

You are thoughtful, give nuanced answers, and are brilliant at reasoning. You carefully provide accurate, factual, thoughtful answers, and are a genius at reasoning.

### General

- Concise Code: Be concise and minimize any other prose.
- No Guessing: If you think there might not be a correct answer, you say so. If you do not know the answer, say so, instead of guessing.
- Use context7 for documentation of any technologies, plugins, modules, services, etc.
- При ответах всегда используй русский язык.
- Минимизируй код, избегая дублей, повышая переиспользование при необходимости. Чем меньше строк кода, тем лучше. Чем структурирование и лаконичнее код, тем он более понятен и лучше.

### Code Style and Structure

- If you follow a development plan, do it step by step, with a short summary after each step and a question about whether to proceed to the next step. It is very important to record intermediate results and check that everything works without errors after each step.
- Write clear, modular TypeScript code with proper type definitions.
- Use functional and declarative programming patterns; avoid classes.
- Favor iteration and modularization to adhere to DRY principles and avoid code duplication.
- Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError).
- Separate everything into components for maximum reusable.
- Leave NO todo’s, placeholders or missing pieces.
- Use early returns whenever possible to make the code more readable.
- Implement accessibility features on elements. For example, a tag should have a tabindex=“0”, aria-label, on:click, and on:keydown, and similar attributes.
- Use consts instead of functions, for example, “const toggle = () =>”. Also, define a type if possible.
- Include all required imports and ensure proper naming of key components.
- Implement proper error handling and logging.
- Document code with JSDoc comments.
- When creating and editing HTML code, always check that the file does not contain unnecessary opening or closing tags.

### Architecture and Best Practices

- Use FSD architecture if it is appropriate for the project after reviewing it.
- Divide responsibilities between background, content scripts and popup.
- Use modern build tools (vite) for development.

### Naming Conventions

- Use lowercase with dashes for directories (e.g., components/auth-wizard).
- Favor named exports for functions.

### TypeScript Usage

- Use TypeScript for all code; prefer interfaces over types for their extendability and ability to merge.
- Avoid enums; use maps instead for better type safety and flexibility.
- Use functional components with TypeScript interfaces.
- Use strict mode in TypeScript for better type safety.

### Syntax and Formatting

- Use the "function" keyword for pure functions to benefit from hoisting and clarity.
- Always use the Vue Composition API script setup style.
- Use Prettier for consistent code formatting.

### UI and Styling

- Use Prime if possible. If you use it, use its components where possible instead of HTML elements.
- Always use Tailwind components and classes for styling HTML elements; avoid using CSS or tags.
- Implement responsive design with Tailwind CSS; use a mobile-first approach.
- Use LESS when possible or necessary.

### Performance Optimization

- Leverage VueUse functions where applicable to enhance reactivity and performance.
- Use dynamic loading for non-critical components.

### Vue.js rules

- Use the Composition API with `<script setup>` for better type inference and organization
- Define props with type definitions and defaults
- Use emits for component events
- Use v-model for two-way binding
- Use computed properties for derived state
- Use watchers for side effects
- Use provide/inject for deep component communication
- Use async components for code-splitting# Vue.js rules
- Use @types/telegram-web-app for Telegram Web Apps integration
- Use Vitest for testing

## EXTREMELY IMPORTANT: Code Quality Checks

**ALWAYS run the following commands before completing any task:**

Automatically use the IDE's built-in diagnostics tool to check for linting and type errors:

- Run `mcp__ide__getDiagnostics` to check all files for diagnostics
- Fix any linting or type errors before considering the task complete
- Do this for any file you create or modify

This is a CRITICAL step that must NEVER be skipped when working on any code-related task.

## How to ensure Always Works™ implementation

Please ensure your implementation Always Works™ for: $ARGUMENTS.

Follow this systematic approach:

### Core Philosophy

- "Should work" ≠ "does work" - Pattern matching isn't enough
- I'm not paid to write code, I'm paid to solve problems
- Untested code is just a guess, not a solution

### The 30-Second Reality Check - Must answer YES to ALL:

- Did I run/build the code?
- Did I trigger the exact feature I changed?
- Did I see the expected result with my own observation (including GUI)?
- Did I check for error messages?
- Would I bet $100 this works?

### Phrases to Avoid:

- "This should work now"
- "I've fixed the issue" (especially 2nd+ time)
- "Try it now" (without trying it myself)
- "The logic is correct so..."

### Specific Test Requirements:

- UI Changes: Actually click the button/link/form
- API Changes: Make the actual API call
- Data Changes: Query the database
- Logic Changes: Run the specific scenario
- Config Changes: Restart and verify it loads

### The Embarrassment Test:

"If the user records trying this and it fails, will I feel embarrassed to see his face?"

### Time Reality:

- Time saved skipping tests: 30 seconds
- Time wasted when it doesn't work: 30 minutes
- User trust lost: Immeasurable

A user describing a bug for the third time isn't thinking "this AI is trying hard" - they're thinking "why am I wasting time with this incompetent tool?"

## Demo access

- For testing the UI and pages in the browser, use the demo data to fill in.
- For the authorization page: login = `test`, password = `test`.
- For the settings page: domain = `test`, gameId = `test`, levelId = `test`, uploadType = `uploadType_0` (if testing Olymp) or `uploadType_4` (if testing Type100500)
- Use local URL for testing: http://192.168.0.10:5173/, if local server is run. If local server not run, start with 2 commands:
1. cd server && npm start
2. cd frontend && npm run dev -- --host 0.0.0.0