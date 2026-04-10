# 10X-Legal Tech - Legal Practice Management Platform

A modern, full-featured web application designed to streamline legal practice management. 10X-Legal Tech provides lawyers, law firms, and legal professionals with an integrated platform to manage cases, documents, deadlines, and teams efficiently.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick Start (Local Development with Docker)](#quick-start-local-development-with-docker)
- [Local Development Without Docker](#local-development-without-docker)
- [Running Tests](#running-tests)
- [Environment Variables](#environment-variables)
- [Deploying the Backend to AWS](#deploying-the-backend-to-aws)
- [Deploying the Frontend](#deploying-the-frontend)
- [Continuous Deployment with GitHub Actions](#continuous-deployment-with-github-actions)
- [What the Pulumi Program Creates](#what-the-pulumi-program-creates)
- [API Integration](#api-integration)
- [Authentication](#authentication)
- [Development](#development)

## Overview

10X-Legal Tech is a comprehensive legal practice management system built with modern web technologies. It provides a clean, intuitive interface for managing the complexities of legal work while maintaining security and compliance standards.

The platform is designed to serve four user types:
- **Clients**: Track their cases and documents
- **Lawyers**: Manage cases, deadlines, documents, and team members
- **Legal Officials**: Oversee multiple cases and team operations
- **Admins**: System administration, user management, and analytics

## Features

### Core Features

#### Dashboard
- Real-time overview of active cases, pending documents, and upcoming deadlines
- Quick action buttons for common tasks
- Role-based information display

#### Case Management
- Create and track legal cases
- Manage case status and details
- Assign lawyers to cases
- Track case progress with detailed timelines

#### Document Management
- Upload and version control documents
- Secure document storage
- Easy access and download capabilities
- Document organization by case

#### Deadline Tracking
- Set and track important deadlines
- Automatic deadline reminders
- Priority indicators for urgent deadlines
- Status tracking for completed deadlines

#### Team Collaboration
- Add team members with different roles
- Assign tasks and responsibilities
- Collaborate on cases and documents
- Team member management

#### Analytics
- Case and workload analytics
- Interactive charts and visualizations
- Performance tracking

#### Admin Dashboard
- User management
- System oversight
- Import history and audit logs

#### User Profiles
- Secure user authentication
- Profile management
- Role-based access control
- Session management

### Security Features
- Enterprise-grade authentication with JWT tokens
- Secure password hashing with bcryptjs
- Role-based access control (RBAC)
- Token refresh mechanisms
- Request rate limiting
- Automatic session timeout on unauthorized access

## Technology Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Styling**: Bootstrap 5, CSS3 with custom components
- **State Management**: React Context API
- **HTTP Client**: Native Fetch API with custom wrapper
- **Routing**: React Router v7
- **Testing**: Vitest

### Backend
- **Runtime**: Node.js with Express 5
- **Database**: PostgreSQL (AWS RDS)
- **Authentication**: JWT with refresh tokens
- **Validation**: Zod
- **Logging**: Pino
- **File Uploads**: Multer
- **Testing**: Vitest

### Infrastructure
- **Cloud**: AWS (ECS Fargate, RDS, ALB, ECR)
- **IaC**: Pulumi (TypeScript)
- **Containerization**: Docker

### Development Tools
- **Package Manager**: npm
- **TypeScript**: Strict mode for type safety
- **Linting**: ESLint

## Project Structure

```
10xlegal-prototype/
├── src/                          # Frontend source
│   ├── api/                      # API integration layer
│   │   ├── config.ts             # API endpoints configuration
│   │   ├── client.ts             # HTTP client with auth handling
│   │   ├── types.ts              # TypeScript interfaces
│   │   ├── index.ts              # API exports
│   │   └── services/             # API service modules
│   │       ├── authService.ts
│   │       ├── casesService.ts
│   │       ├── documentsService.ts
│   │       ├── deadlinesService.ts
│   │       ├── teamService.ts
│   │       ├── userService.ts
│   │       └── index.ts
│   ├── admin/                    # Admin dashboard
│   ├── analytics/                # Analytics views
│   │   └── charts/               # Chart components
│   ├── cases/                    # Case management pages
│   ├── context/                  # React context providers
│   │   └── AuthContext.tsx       # Authentication state management
│   ├── home/                     # Dashboard page
│   ├── hooks/                    # Custom React hooks
│   ├── landing/                  # Landing/login page
│   ├── profiles/                 # User profile pages
│   ├── test/                     # Test utilities and mocks
│   ├── types/                    # Shared TypeScript types
│   ├── app.tsx                   # Root component
│   ├── app.css                   # Global styles
│   └── index.tsx                 # Application entry point
├── server/                       # Backend
│   └── src/
│       ├── db/                   # Database connection and schema
│       ├── routes/               # Express route handlers
│       ├── middleware/            # Auth, error handling, validation
│       ├── utils/                # Shared utilities
│       ├── validation/           # Zod request schemas
│       └── __tests__/            # Server tests
├── infra/                        # Pulumi AWS infrastructure
├── docker-compose.yml            # Local full-stack development
├── Dockerfile                    # Production container
├── vite.config.ts                # Vite configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Project dependencies
```

## Prerequisites

You will need:

- **Node.js 22+** and **npm**
- **Docker Desktop** (required for the quick-start path; recommended for everything else)
- **Git**

For deploying to AWS you will additionally need:

- An **AWS account** with permission to create VPCs, ECS services, RDS instances, ALBs, IAM roles, and Secrets Manager secrets
- The **AWS CLI**, configured with credentials (`aws configure`)
- The **Pulumi CLI** (`brew install pulumi/tap/pulumi` or download from [pulumi.com](https://www.pulumi.com/docs/install/))
- A **Pulumi account** (the free individual tier is sufficient — sign up at [app.pulumi.com](https://app.pulumi.com))

## Quick Start (Local Development with Docker)

This is the fastest way to get the full stack running on your laptop. It brings up the frontend, backend, and a PostgreSQL database in three containers.

```bash
git clone <repository-url>
cd 10xlegal-prototype
cp .env.example .env
docker compose up --build
```

When the logs settle, open **http://localhost** in a browser. The first time you load it, register a user, then sign in.

What's running:

| Service  | Port  | Notes                                                 |
|----------|-------|-------------------------------------------------------|
| frontend | 80    | React app served by nginx, with `/api` proxied to backend |
| backend  | 3000  | Express API. Schema auto-creates on first boot.       |
| postgres | 5432  | PostgreSQL 16. Data persists in a Docker volume.      |

The backend creates all database tables automatically the first time it starts (see `server/src/db/schema.ts`). There is no separate migration command.

To shut everything down and wipe the database:

```bash
docker compose down -v
```

## Local Development Without Docker

Use this if you want hot-reload on both frontend and backend.

1. **Install dependencies**

   ```bash
   npm install                    # frontend
   cd server && npm install && cd ..
   ```

2. **Start a Postgres database** — either install Postgres locally or run one in Docker:

   ```bash
   docker run -d --name 10xlegal-pg \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=10xlegal \
     -p 5432:5432 \
     postgres:16-alpine
   ```

3. **Configure environment variables** — copy `.env.example` to both `.env` (repo root, used by the frontend) and `server/.env` (used by the backend):

   ```bash
   cp .env.example .env
   cp .env.example server/.env
   ```

4. **Start the backend** (terminal 1):

   ```bash
   cd server && npm run dev
   ```

5. **Start the frontend** (terminal 2):

   ```bash
   npm run dev
   ```

The frontend runs at `http://localhost:5173` and proxies `/api` requests to the backend at `http://localhost:3000`.

## Running Tests

**Frontend tests** (Vitest with jsdom):

```bash
npm test
```

**Backend tests** (Vitest, requires a Postgres instance):

```bash
cd server
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/10xlegal_test npm test
```

The backend tests need an empty database they can create and drop tables in. Either run them against a local Postgres using a separate test database, or rely on the GitHub Actions workflow which provisions one automatically.

## Environment Variables

### Frontend

| Variable          | Required | Description                                                                 |
|-------------------|----------|-----------------------------------------------------------------------------|
| `VITE_API_URL`    | No       | Backend API base URL. Defaults to `/api` (relative, works with the dev proxy). For a production build pointing at a remote backend, set the full URL. |
| `window.__API_URL__` | No    | Runtime override (set in `index.html` after build). Useful when one built bundle needs to point at different backends per environment. See `src/api/client.ts`. |

### Backend

| Variable        | Required           | Default                  | Description                                       |
|-----------------|--------------------|--------------------------|---------------------------------------------------|
| `PORT`          | No                 | `3000`                   | Server port                                       |
| `NODE_ENV`      | No                 | `development`            | Set to `production` in deployed environments      |
| `JWT_SECRET`    | **Yes (in production)** | dev fallback string | Used to sign JWTs. Generate with `openssl rand -hex 32` |
| `FRONTEND_URL`  | No                 | `http://localhost:5173`  | CORS allow-origin                                 |
| `DATABASE_URL`  | No                 | —                        | Full Postgres connection string. If set, the `DB_*` vars are ignored. |
| `DB_HOST`       | No                 | `localhost`              |                                                   |
| `DB_PORT`       | No                 | `5432`                   |                                                   |
| `DB_NAME`       | No                 | `10xlegal`               |                                                   |
| `DB_USER`       | No                 | `postgres`               |                                                   |
| `DB_PASSWORD`   | No                 | `postgres`               |                                                   |
| `DB_POOL_MAX`   | No                 | `20`                     | pg pool size                                      |

## Deploying the Backend to AWS

The `infra/` directory contains a standalone Pulumi program that provisions every AWS resource the backend needs. After running it once, you have a working VPC, RDS database, ECS cluster, ALB, ECR repository, and Fargate service. There are no external prerequisites beyond an AWS account.

### One-time setup

```bash
# 1. Log in to Pulumi (this creates a state backend on app.pulumi.com)
pulumi login

# 2. Configure AWS credentials if you haven't already
aws configure

# 3. From the repo root, initialize a new Pulumi stack
pulumi stack init dev

# 4. Copy the example stack config and edit if you want
cp Pulumi.dev.yaml.example Pulumi.dev.yaml

# 5. Set required config values
pulumi config set aws:region us-east-1
pulumi config set 10xlegal-server:frontendUrl http://localhost:5173
pulumi config set --secret 10xlegal-server:jwtSecret "$(openssl rand -hex 32)"

# 6. Install Pulumi program dependencies
cd infra && npm install && cd ..
```

### First deploy

```bash
# Provision all AWS resources. Takes ~10 minutes (RDS is the slow part).
pulumi up
```

On the first run, the ECS service will fail-loop because the `:latest` Docker image hasn't been pushed yet. That's expected — keep going.

```bash
# Read outputs from the new stack
ECR_URL=$(pulumi stack output ecrRepositoryUrl)
CLUSTER_NAME=$(pulumi stack output clusterName)
SERVICE_NAME=$(pulumi stack output serviceName)
APP_URL=$(pulumi stack output appUrl)
AWS_REGION=$(aws configure get region)

# Authenticate Docker to ECR
aws ecr get-login-password --region "$AWS_REGION" \
  | docker login --username AWS --password-stdin "$ECR_URL"

# Build and push the backend image
docker build -f server/Dockerfile -t "$ECR_URL:latest" .
docker push "$ECR_URL:latest"

# Force ECS to pick up the new image
aws ecs update-service \
  --cluster "$CLUSTER_NAME" \
  --service "$SERVICE_NAME" \
  --force-new-deployment

# After ~1 minute, hit the health endpoint
curl "$APP_URL/health"
```

`appUrl` is the public DNS name of the load balancer. Point your domain at it (CNAME or Route53 alias) once you're ready.

### Subsequent deploys

For routine code updates, you only need to rebuild the image and force a redeploy:

```bash
docker build -f server/Dockerfile -t "$ECR_URL:latest" .
docker push "$ECR_URL:latest"
aws ecs update-service --cluster "$CLUSTER_NAME" --service "$SERVICE_NAME" --force-new-deployment
```

If you change anything in `infra/index.ts`, run `pulumi up` again.

### Enabling HTTPS

By default the ALB only listens on HTTP. To enable HTTPS:

1. Request or import a certificate in **AWS Certificate Manager** in the same region as your stack.
2. Set the certificate ARN as a Pulumi config value:

   ```bash
   pulumi config set 10xlegal-server:certificateArn arn:aws:acm:us-east-1:000000000000:certificate/xxxxxxxx
   pulumi up
   ```

3. The HTTP listener will now redirect to HTTPS, and the HTTPS listener will serve your traffic.
4. Point your domain DNS at the ALB DNS name (`pulumi stack output albDnsName`). Access the app via your domain — not the raw `*.elb.amazonaws.com` address, since that won't match your certificate.

### Tearing it down

```bash
pulumi destroy
```

This removes every resource the stack created. RDS deletion can take several minutes.

## Deploying the Frontend

The frontend is a static React bundle and can be hosted anywhere that serves static files. Three common options:

### Option A — Static hosting (recommended)

Build the bundle pointing it at your deployed backend:

```bash
VITE_API_URL=https://api.example.com/api npm run build
```

Then upload the contents of `dist/` to whichever static host you prefer:

- **Amazon S3 + CloudFront** — best fit if everything else is in AWS
- **Netlify**, **Vercel**, **Cloudflare Pages** — drag-and-drop or git-connected
- **GitHub Pages** — already wired up in `.github/workflows/ci.yml` (see next section)

### Option B — Same Docker container as local dev

`Dockerfile.frontend` builds the React app and serves it with nginx. You can deploy this image to any container host (ECS, Cloud Run, Fly.io, a VPS). Inject `VITE_API_URL` at build time:

```bash
docker build -f Dockerfile.frontend --build-arg VITE_API_URL=https://api.example.com/api -t 10xlegal-frontend .
```

### Option C — Runtime override

If you want one built bundle that can point at different backends per environment, set `window.__API_URL__` from a small `<script>` injected into `index.html` at deploy time. The API client checks this first — see `src/api/client.ts`.

## Continuous Deployment with GitHub Actions

The workflow in `.github/workflows/ci.yml` runs tests on every PR and deploys on every push to `main`. The deploy jobs are off by default until you configure GitHub repo settings.

In **Settings → Secrets and variables → Actions**:

**Variables:**
- `PULUMI_STACK` — full stack name, e.g. `your-org/dev`
- `VITE_API_URL` — backend URL the built frontend should call
- `AWS_REGION` (optional) — defaults to `us-east-1`

**Secrets:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `PULUMI_ACCESS_TOKEN` — from [app.pulumi.com](https://app.pulumi.com/account/tokens)

The `deploy-backend` job runs `pulumi up`, then builds and pushes the Docker image to the ECR repo Pulumi just created, then forces an ECS redeployment. The `deploy-frontend` job builds the React app and publishes it to GitHub Pages (you must enable Pages in repo settings first).

## What the Pulumi Program Creates

Running `pulumi up` provisions a self-contained slice of AWS infrastructure:

- **VPC** with two public and two private subnets across two availability zones, plus an internet gateway. No NAT gateway (cost optimization — ECS tasks run in public subnets with public IPs).
- **Security groups** for the ALB, the app, and the database. Only the app SG can reach the database; only the ALB can reach the app.
- **RDS PostgreSQL** instance (default `db.t4g.micro`, 20 GB encrypted gp3 storage, single-AZ, 7-day backups). The master password is generated by Pulumi and stored in AWS Secrets Manager.
- **ECR repository** for backend Docker images, with a lifecycle rule that keeps the last 10.
- **ECS cluster** running a single Fargate task by default. CPU, memory, and task count are all configurable.
- **Application Load Balancer** with an HTTP listener (and an HTTPS listener if you set `certificateArn`).
- **CloudWatch log group** with 14-day retention.
- **IAM roles** for the task execution role (with Secrets Manager read access for `DB_PASSWORD`) and the task role.

**Approximate resting cost:** about **$35–40/month** (ALB ~$16, Fargate task ~$9, RDS ~$12, everything else negligible).

**Prototype-grade defaults to harden before production use:**

- `skipFinalSnapshot: true` and `deletionProtection: false` on RDS — `pulumi destroy` will wipe data without warning
- Single-AZ RDS — no failover
- No WAF in front of the ALB
- 14-day CloudWatch log retention
- `JWT_SECRET` is passed as a plain task-definition env var rather than a Secrets Manager entry (the DB password already uses Secrets Manager — moving the JWT secret there is a small change in `infra/index.ts`)

These are intentional choices for a prototype that should be cheap and easy to spin up and tear down. Tighten them before exposing the system to real users or real data.

## API Integration

### Architecture

The API integration is organized in a service-oriented architecture with clear separation of concerns:

**Three-Layer Structure**:
1. **API Client Layer** (`src/api/client.ts`)
   - Handles HTTP requests
   - Manages authentication tokens
   - Processes responses
   - Handles errors and 401 redirects

2. **Service Layer** (`src/api/services/`)
   - Specific API endpoints for each resource
   - Type-safe function signatures
   - Business logic for API calls
   - Request/response transformation

3. **Context Layer** (`src/context/AuthContext.tsx`)
   - Global state management
   - User authentication state
   - Async operation handling
   - Error state management

### API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | User login |
| POST | `/auth/register` | User registration |
| POST | `/auth/logout` | User logout |
| GET | `/auth/verify-token` | Verify JWT token |
| POST | `/auth/refresh-token` | Refresh JWT token |
| GET | `/cases` | List all cases |
| POST | `/cases` | Create new case |
| GET | `/cases/{id}` | Get case details |
| PUT | `/cases/{id}` | Update case |
| DELETE | `/cases/{id}` | Delete case |
| GET | `/documents` | List documents |
| POST | `/documents/upload` | Upload document |
| GET | `/documents/{id}` | Get document |
| DELETE | `/documents/{id}` | Delete document |
| GET | `/deadlines` | List deadlines |
| POST | `/deadlines` | Create deadline |
| PUT | `/deadlines/{id}` | Update deadline |
| GET | `/team` | List team members |
| POST | `/team/members` | Add team member |
| DELETE | `/team/members/{id}` | Remove team member |
| GET | `/users/profile` | Get user profile |
| PUT | `/users/profile` | Update profile |

## Authentication

### How Authentication Works

1. **Login/Registration** — User enters credentials and selects role. Backend validates and returns JWT + refresh token. Token stored in localStorage.
2. **Protected Routes** — Dashboard requires authentication. Unauthenticated users redirected to landing page via `ProtectedRoute` component.
3. **Token Management** — Token automatically included in Authorization header. Cleared on logout or 401 response.
4. **Session Persistence** — Token loaded from localStorage on app start. Valid token restores user session.

### User Roles

- **Client**: Access to own cases and documents
- **Lawyer**: Full access to cases, documents, and team management
- **Legal Official**: Administrative access and oversight
- **Admin**: System administration, user management, analytics

## Development

### Available Scripts

**Frontend:**
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Lint code
npm run test       # Run tests
```

**Backend (from `server/`):**
```bash
npm run dev        # Start with hot reload (tsx watch)
npm run start      # Start for production
npm run test       # Run tests
```

### Adding New Features

1. **Add API endpoint** in `src/api/config.ts`
2. **Create TypeScript types** in `src/api/types.ts`
3. **Create service module** in `src/api/services/`
4. **Add backend route** in `server/src/routes/`
5. **Add validation schema** in `server/src/validation/`
6. **Use service in components** with error handling

## Contributing

When contributing to this project:

1. Follow the existing code structure
2. Use TypeScript for type safety
3. Test API integration with backend
4. Update documentation as needed
5. Keep components focused and reusable

## License

This project is part of the 10X-Legal Tech platform.
