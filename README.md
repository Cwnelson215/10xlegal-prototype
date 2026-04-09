# 10X-Legal Tech - Legal Practice Management Platform

A modern, full-featured web application designed to streamline legal practice management. 10X-Legal Tech provides lawyers, law firms, and legal professionals with an integrated platform to manage cases, documents, deadlines, and teams efficiently.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Integration](#api-integration)
- [Authentication](#authentication)
- [Development](#development)
- [Infrastructure & Deployment](#infrastructure--deployment)

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

## Getting Started

### Prerequisites
- Node.js 18+
- npm
- PostgreSQL (or use Docker Compose for local development)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd 10xlegal-prototype
```

2. **Install frontend dependencies**
```bash
npm install
```

3. **Install backend dependencies**
```bash
cd server && npm install && cd ..
```

4. **Configure environment variables**

Frontend (`.env`):
```env
VITE_API_URL=http://localhost:3000/api
```

Backend (`server/.env`):
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=10xlegal
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
PORT=3000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

5. **Start with Docker Compose** (recommended for local dev)
```bash
docker compose up
```

Or start individually:

```bash
# Start backend
cd server && npm run dev

# Start frontend (in another terminal)
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:3000`.

### Accessing the Application

1. **Landing Page**: `http://localhost:5173/` — View platform features, access login and registration
2. **Authentication**: Select user role, enter credentials, submit
3. **Dashboard**: After authentication — view cases, deadlines, and quick actions

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

## Infrastructure & Deployment

### Production Deployment

The application is deployed on AWS using Pulumi (infrastructure as code):

- **ECS Fargate** — Containerized backend service (with optional Fargate Spot)
- **Application Load Balancer** — HTTPS traffic routing
- **RDS PostgreSQL** — Managed database
- **ECR** — Docker image registry
- **Scheduled scaling** — Optional scale up/down by time of day

Infrastructure configuration lives in `infra/` and is managed with `pulumi up`.

### Local Development with Docker

```bash
docker compose up
```

This starts the full stack (frontend, backend, PostgreSQL) locally.

### Build for Production

```bash
npm run build
```

Creates an optimized production build in the `dist/` directory.

## Contributing

When contributing to this project:

1. Follow the existing code structure
2. Use TypeScript for type safety
3. Test API integration with backend
4. Update documentation as needed
5. Keep components focused and reusable

## License

This project is part of the 10X-Legal Tech platform.
