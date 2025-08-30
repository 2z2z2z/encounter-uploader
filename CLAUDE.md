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
npm run dev          # Start dev server on http://localhost:5173
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