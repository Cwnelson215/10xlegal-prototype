# CLAUDE.md - Project Guide

## Project Overview

10X-Legal Tech is a prototype case tracking dashboard populated with publicly available data.

## Tech Stack

- **React 19** with **TypeScript 5.9** (strict mode)
- **Vite 7** for build/dev server
- **Bootstrap 5** for styling
- **React Router DOM 7** for routing
- **React Context API** for state management (no Redux)
- **JWT** for authentication (stored in localStorage)

## Project Structure

```
src/
├── api/              # HTTP client, config, types
│   └── services/     # Modular API services (auth, cases, documents, deadlines, team, user)
├── context/          # React Context providers (AuthContext)
├── home/             # Dashboard page (home.tsx, home.css)
├── landing/          # Login/register page (landing.tsx, landing.css)
├── app.tsx           # Root component with routing
└── index.tsx         # Entry point
```

## Commands

- `npm run dev` — Start Vite dev server (port 5173)

## Environment

- `VITE_API_URL` — Backend API base URL (default: `http://localhost:3000/api`)
- Can also be set at runtime via `window.__API_URL__`

## Key Patterns

- **API services** live in `src/api/services/` — one file per resource, all exported from `src/api/index.ts`
- **API client** (`src/api/client.ts`) wraps fetch with automatic JWT token injection and 401 redirect handling
- **Endpoints** are configured centrally in `src/api/config.ts`
- **Types** for all API requests/responses are in `src/api/types.ts`
- **Auth state** is managed via `AuthContext` in `src/context/AuthContext.tsx`
- Components use separate `.css` files for styling (co-located with their `.tsx` files)

## TypeScript Config

- Strict mode enabled
- `noUncheckedIndexedAccess: true` and `exactOptionalPropertyTypes: true`
- Target: ESNext, module: ESNext, JSX: react-jsx
- Source maps enabled

## Current State

Full-stack application with Express/SQLite backend. The API service layer is fully typed and structured. Three user roles: client, lawyer, legal-official.
