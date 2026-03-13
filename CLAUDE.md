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
- **Pulumi** for AWS infrastructure (ECS Fargate, ALB, RDS, ECR)
- **Docker** for containerization

## Project Structure

```
├── src/                        # Frontend
│   ├── api/                    # HTTP client, config, types
│   │   └── services/           # Modular API services (auth, cases, documents, deadlines, team, user)
│   ├── admin/                  # Admin dashboard pages
│   ├── analytics/              # Analytics views and charts
│   │   └── charts/             # Chart components
│   ├── calendar/               # Calendar feature
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
├── infra/                      # Pulumi AWS infrastructure
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

### Frontend
- `VITE_API_URL` — Backend API base URL (default: `http://localhost:3000/api`)
- Can also be set at runtime via `window.__API_URL__`

### Backend
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` — PostgreSQL connection
- `DATABASE_URL` — Alternative single connection string
- `JWT_SECRET` — Secret for signing JWT tokens
- `PORT` — Server port (default: 3000)
- `FRONTEND_URL` — Frontend origin for CORS
- `NODE_ENV` — Environment (development/production)

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

PostgreSQL on AWS RDS. Connection via `pg` pool configured in `server/src/db/connection.ts`. Schema defined in `server/src/db/schema.ts`.

Tables: users, refresh_tokens, law_firms, attorneys, cases, documents, deadlines, import_history, audit_log

Four user roles: client, lawyer, legal-official, admin.

## Current State

Full-stack application with Express/PostgreSQL backend deployed on AWS (ECS Fargate + RDS) via Pulumi. The API service layer is fully typed and structured. Admin dashboard, analytics, calendar, and case management features are implemented.
