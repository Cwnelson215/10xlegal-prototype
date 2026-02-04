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
- [Deployment](#deployment)
- [Documentation](#documentation)

## Overview

10X-Legal Tech is a comprehensive legal practice management system built with modern web technologies. It provides a clean, intuitive interface for managing the complexities of legal work while maintaining security and compliance standards.

The platform is designed to serve three main user types:
- **Clients**: Track their cases and documents
- **Lawyers**: Manage cases, deadlines, documents, and team members
- **Legal Officials**: Oversee multiple cases and team operations

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

#### User Profiles
- Secure user authentication
- Profile management
- Role-based access control
- Session management

### Security Features
- Enterprise-grade authentication with JWT tokens
- Secure password handling
- Role-based access control (RBAC)
- Token refresh mechanisms
- Automatic session timeout on unauthorized access

## Technology Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: CSS3 with custom components
- **State Management**: React Context API
- **HTTP Client**: Native Fetch API with custom wrapper
- **Routing**: React Router v6+

### Backend Integration
- **API Communication**: RESTful API with JSON
- **Authentication**: JWT (JSON Web Tokens)
- **Data Format**: JSON
- **File Upload**: FormData for multipart uploads

### Development Tools
- **Package Manager**: npm
- **TypeScript**: For type safety
- **Linting**: ESLint
- **Bootstrap**: CSS framework (available)

## Project Structure

```
10xlegal-prototype/
├── src/
│   ├── api/                    # API integration layer
│   │   ├── config.ts          # API endpoints configuration
│   │   ├── client.ts          # HTTP client with auth handling
│   │   ├── types.ts           # TypeScript interfaces
│   │   ├── index.ts           # API exports
│   │   └── services/          # API service modules
│   │       ├── authService.ts
│   │       ├── casesService.ts
│   │       ├── documentsService.ts
│   │       ├── deadlinesService.ts
│   │       ├── teamService.ts
│   │       ├── userService.ts
│   │       └── index.ts
│   ├── context/               # React context providers
│   │   └── AuthContext.tsx    # Authentication state management
│   ├── home/                  # Dashboard page
│   │   ├── home.tsx
│   │   └── home.css
│   ├── landing/               # Landing page
│   │   ├── landing.tsx
│   │   └── landing.css
│   ├── app.tsx                # Root component
│   ├── app.css                # Global styles
│   └── index.tsx              # Application entry point
├── public/                     # Static assets
├── .env.example               # Environment variables template
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript configuration
├── package.json               # Project dependencies
├── README.md                  # This file
├── API_INTEGRATION_GUIDE.md   # Detailed API documentation
└── ENV_SETUP.md              # Environment setup guide
```

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Backend server running (for full functionality)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd 10xlegal-prototype
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` and set your backend API URL:
```env
VITE_API_URL=http://localhost:3000/api
```

4. **Start the development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Accessing the Application

1. **Landing Page**: `http://localhost:5173/`
   - View platform features
   - See pricing information
   - Access login and registration

2. **Authentication**:
   - Click "Sign In" or "Get Started"
   - Select user role (Client, Lawyer, or Legal Official)
   - Enter credentials
   - Submit

3. **Dashboard**: After authentication
   - View case overview
   - Access quick actions
   - See recent cases and deadlines

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

### Key Features

#### Automatic Token Management
```typescript
// Token automatically stored and sent with requests
const response = await authService.login({
    email: 'user@example.com',
    password: 'password',
    role: 'lawyer'
});
// Token stored in localStorage and Authorization header automatically set
```

#### Error Handling
```typescript
// 401 responses automatically redirect to login
// Network errors are caught and reported
// Type-safe error objects
```

#### Type Safety
```typescript
// Full TypeScript support with interfaces
const cases: Case[] = await casesService.getCases();
const newCase = await casesService.createCase({
    title: 'Case Title',
    // ... required fields
});
```

### Available Services

#### Authentication Service
```typescript
import { authService } from '@/api/services/authService';

// Login
await authService.login({
    email: 'user@example.com',
    password: 'password',
    role: 'lawyer'
});

// Register
await authService.register({
    name: 'John Doe',
    email: 'user@example.com',
    password: 'password',
    role: 'client'
});

// Logout
await authService.logout();

// Verify token
const user = await authService.verifyToken();
```

#### Cases Service
```typescript
import { casesService } from '@/api/services/casesService';

// List cases with pagination
const cases = await casesService.getCases(page, pageSize);

// Get single case
const caseItem = await casesService.getCase(caseId);

// Create case
const newCase = await casesService.createCase({
    title: 'Case Title',
    description: 'Description',
    caseNumber: 'CASE-2024-001',
    clientId: 'client-id'
});

// Update case
await casesService.updateCase(caseId, {
    status: 'active',
    description: 'Updated description'
});

// Delete case
await casesService.deleteCase(caseId);
```

#### Documents Service
```typescript
import { documentsService } from '@/api/services/documentsService';

// Upload document
const doc = await documentsService.uploadDocument(file, caseId);

// List documents
const documents = await documentsService.getDocuments(caseId);

// Download document
const url = documentsService.downloadDocument(docId);

// Delete document
await documentsService.deleteDocument(docId);
```

#### Deadlines Service
```typescript
import { deadlinesService } from '@/api/services/deadlinesService';

// Create deadline
const deadline = await deadlinesService.createDeadline({
    title: 'Filing Deadline',
    dueDate: '2024-02-15',
    caseId: 'case-id',
    assignedTo: 'user-id'
});

// Update deadline status
await deadlinesService.updateDeadline(id, {
    status: 'completed'
});
```

#### Team Service
```typescript
import { teamService } from '@/api/services/teamService';

// Add team member
const member = await teamService.addTeamMember({
    email: 'lawyer@example.com',
    role: 'lawyer'
});

// List team members
const members = await teamService.getTeamMembers();

// Remove team member
await teamService.removeTeamMember(memberId);
```

#### User Service
```typescript
import { userService } from '@/api/services/userService';

// Get current user profile
const profile = await userService.getProfile();

// Update profile
await userService.updateProfile({
    name: 'New Name'
});
```

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

1. **Login/Registration**
   - User enters credentials and selects role
   - Frontend calls `authService.login()` or `authService.register()`
   - Backend validates credentials and returns JWT token
   - Token stored in localStorage

2. **Protected Routes**
   - Dashboard requires authentication
   - Unauthenticated users redirected to landing page
   - Protected routes wrapped in `ProtectedRoute` component

3. **Token Management**
   - Token automatically included in Authorization header
   - Token stored in localStorage for persistence
   - Token cleared on logout or 401 response

4. **Session Persistence**
   - Token loaded from localStorage on app start
   - Valid token restores user session
   - User can refresh page without re-login

### User Roles

- **Client**: Access to own cases and documents
- **Lawyer**: Full access to cases, documents, and team management
- **Legal Official**: Administrative access and oversight

## Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Adding New Features

1. **Add API endpoint** in `src/api/config.ts`
2. **Create TypeScript types** in `src/api/types.ts`
3. **Create service module** in `src/api/services/`
4. **Use service in components** with error handling
5. **Test with backend server**

### Code Organization

- Keep API logic in `src/api/services/`
- Use React Context for state management
- Separate styles into component CSS files
- Maintain TypeScript types in `src/api/types.ts`

## Deployment

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Environment Configuration

Set API URL for your production environment:

```bash
# Option 1: During build
VITE_API_URL=https://api.yourdomain.com/api npm run build

# Option 2: At runtime (in HTML)
<script>
    window.__API_URL__ = 'https://api.yourdomain.com/api';
</script>
```

### Hosting Options

The built application can be deployed to:
- Vercel
- Netlify
- GitHub Pages
- Traditional web hosting (Apache, Nginx)
- Docker containers
- Cloud platforms (AWS, Google Cloud, Azure)

## Documentation

### Key Documents

- **[API_INTEGRATION_GUIDE.md](./API_INTEGRATION_GUIDE.md)** - Comprehensive API documentation with examples
- **[ENV_SETUP.md](./ENV_SETUP.md)** - Environment configuration and troubleshooting guide
- **[API_INTEGRATION_GUIDE.md](./API_INTEGRATION_GUIDE.md)** - Backend server requirements

### TypeScript Types

All TypeScript types are defined in `src/api/types.ts`:
- Authentication types (LoginRequest, RegisterRequest, AuthResponse)
- Entity types (User, Case, Document, Deadline, TeamMember)
- Response types (ApiResponse, PaginatedResponse)
- Error types (ApiError)

## Error Handling

### Common Errors

**401 Unauthorized**
- Session expired
- Invalid token
- Auto-redirects to login page

**404 Not Found**
- Endpoint not implemented on backend
- Check API configuration
- Verify backend is running

**Network Error**
- Backend server not running
- Wrong API URL configuration
- CORS not properly configured

See [ENV_SETUP.md](./ENV_SETUP.md) for troubleshooting guide.

## Contributing

When contributing to this project:

1. Follow the existing code structure
2. Use TypeScript for type safety
3. Test API integration with backend
4. Update documentation as needed
5. Keep components focused and reusable

## License

This project is part of the 10X-Legal Tech platform.

## Support

For issues, questions, or feature requests, please refer to the documentation files or contact the development team.