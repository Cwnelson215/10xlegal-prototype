# CLAUDE.md - Project Guide

## Project Overview

10X-Legal Tech is a prototype case tracking dashboard populated with publicly available data.

## Tech Stack

### Frontend
- **React 19** with **TypeScript 5.9** (strict mode)
- **Vite 7** for build/dev server
- **Bootstrap 5** for styling
- **React Router DOM 7** for routing
- **React Context API** for state management (no Redux)
- **Vitest** for testing

### Backend
- **Express 5** (Node.js)
- **PostgreSQL** (AWS RDS) via `pg` pool
- **Pino** for logging
- **Zod** for request validation
- **bcryptjs** for password hashing
- **JWT** (`jsonwebtoken`) for authentication
- **multer** for file uploads

### Infrastructure
- **Pulumi** (TypeScript) for AWS — standalone program at `infra/index.ts` provisions VPC, ALB, ECS Fargate cluster + service, RDS PostgreSQL, ECR, IAM, CloudWatch, and Secrets Manager. No external/platform stack dependency.
- **Docker** + **docker-compose** for local full-stack dev and the production backend image

## Project Structure

```
├── src/                        # Frontend
│   ├── api/                    # HTTP client, config, types
│   │   └── services/           # Modular API services (auth, cases, documents, deadlines, team, user)
│   ├── admin/                  # Admin dashboard pages
│   ├── analytics/              # Analytics views and charts
│   │   └── charts/             # Chart components
│   ├── cases/                  # Case management pages
│   ├── context/                # React Context providers (AuthContext)
│   ├── home/                   # Dashboard page
│   ├── hooks/                  # Custom React hooks
│   ├── landing/                # Login/register page
│   ├── profiles/               # User profile pages
│   ├── test/                   # Test utilities and mocks
│   │   └── mocks/
│   ├── types/                  # Shared TypeScript types
│   ├── app.tsx                 # Root component with routing
│   └── index.tsx               # Entry point
├── server/src/                 # Backend
│   ├── db/                     # Database connection and schema
│   ├── routes/                 # Express route handlers
│   ├── middleware/              # Auth, error handling, validation
│   ├── utils/                  # Shared utilities
│   ├── validation/             # Zod schemas
│   └── __tests__/              # Server tests
├── infra/                      # Standalone Pulumi AWS program (index.ts)
├── Pulumi.yaml                 # Pulumi project (main: infra)
├── Pulumi.dev.yaml.example     # Stack config template — copy to Pulumi.dev.yaml (gitignored)
├── .env.example                # Env template — copy to .env (gitignored)
└── docker-compose.yml          # Local full-stack development
```

## Commands

### Frontend
- `npm run dev` — Start Vite dev server (port 5173)
- `npm run build` — Production build
- `npm run test` — Run frontend tests

### Backend (from `server/`)
- `npm run dev` — Start Express server with hot reload (tsx watch)
- `npm run start` — Start Express server for production
- `npm run test` — Run server tests (vitest)

## Environment

`.env` is **gitignored**. Copy `.env.example` to `.env` and edit. The example covers both frontend and backend variables.

### Frontend
- `VITE_API_URL` — Backend API base URL (default: `/api`, proxied to backend in dev)
- `window.__API_URL__` — Runtime override, settable from `index.html` after build

### Backend
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` — PostgreSQL connection
- `DATABASE_URL` — Alternative single connection string (overrides `DB_*`)
- `DB_POOL_MAX` — Pool size (default: 20)
- `JWT_SECRET` — Required in production; dev fallback is `INSECURE-DEV-ONLY-CHANGE-ME`
- `PORT` — Server port (default: 3000)
- `FRONTEND_URL` — Frontend origin for CORS (default: `http://localhost:5173`)
- `NODE_ENV` — `development` or `production`

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

## Database

PostgreSQL. Connection via `pg` pool in `server/src/db/connection.ts`. Schema defined in `server/src/db/schema.ts` and **auto-created on backend startup** via `runSchema()` called from `server/src/index.ts` — no separate migration runner.

Tables: `users`, `refresh_tokens`, `law_firms`, `attorneys`, `judges`, `cases`, `case_attorneys`, `documents`, `deadlines`, `import_history`, `audit_log`.

Four user roles: client, lawyer, legal-official, admin.

## Deployment

Full deployment guide is in `README.md`. Quick reference:

- **Local dev (full stack):** `cp .env.example .env && docker compose up` — frontend on `:80`, backend on `:3000`, postgres on `:5432`.
- **AWS deploy:** `pulumi stack init dev`, copy `Pulumi.dev.yaml.example` → `Pulumi.dev.yaml`, set `frontendUrl` and `--secret jwtSecret`, then `pulumi up` from the repo root. The Pulumi program owns its own VPC/RDS/ECR/cluster — nothing external is required.
- **CI/CD:** `.github/workflows/ci.yml` runs tests on PRs and deploys on push to `main`. Requires `PULUMI_STACK` and `VITE_API_URL` GitHub variables, plus `AWS_*` and `PULUMI_ACCESS_TOKEN` secrets.

## Current State

Prototype handoff-ready. Personal credentials, domain references, and developer-account dependencies have been stripped. The API service layer is fully typed and structured. Admin dashboard, analytics, case management, and authentication features are implemented. Frontend test suite has 180 tests passing across 30 files.
