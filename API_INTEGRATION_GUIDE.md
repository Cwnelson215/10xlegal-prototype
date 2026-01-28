# API Integration Guide

## Overview

The frontend has been configured with a complete API client infrastructure for communicating with a backend server. This guide explains how to set up and use the API services.

## Configuration

### Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

```env
REACT_APP_API_URL=http://localhost:3000/api
```

For production:
```env
REACT_APP_API_URL=https://api.yourdomain.com/api
```

## API Structure

### Directory Structure

```
src/
├── api/
│   ├── config.ts              # API endpoints configuration
│   ├── client.ts              # HTTP client with auth handling
│   ├── types.ts               # TypeScript interfaces
│   ├── index.ts               # Main API exports
│   └── services/
│       ├── authService.ts     # Authentication API calls
│       ├── casesService.ts    # Cases management API calls
│       ├── documentsService.ts # Documents management API calls
│       ├── deadlinesService.ts # Deadlines management API calls
│       ├── teamService.ts     # Team management API calls
│       ├── userService.ts     # User profile API calls
│       └── index.ts           # Services exports
├── context/
│   └── AuthContext.tsx        # Auth state management (uses API)
```

## Available Services

### 1. Authentication Service (`authService`)

```typescript
import { authService } from '@/api/services/authService';

// Login
const authResponse = await authService.login({
    email: 'user@example.com',
    password: 'password',
    role: 'lawyer'
});

// Register
const authResponse = await authService.register({
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

### 2. Cases Service (`casesService`)

```typescript
import { casesService } from '@/api/services/casesService';

// Get all cases
const cases = await casesService.getCases(page, pageSize);

// Get single case
const caseItem = await casesService.getCase(caseId);

// Create case
const newCase = await casesService.createCase({
    title: 'Case Title',
    description: 'Case Description',
    caseNumber: 'CASE-2024-001',
    clientId: 'client-id'
});

// Update case
const updated = await casesService.updateCase(caseId, {
    status: 'active',
    description: 'Updated description'
});

// Delete case
await casesService.deleteCase(caseId);
```

### 3. Documents Service (`documentsService`)

```typescript
import { documentsService } from '@/api/services/documentsService';

// Get all documents
const documents = await documentsService.getDocuments(caseId, page, pageSize);

// Get single document
const document = await documentsService.getDocument(docId);

// Upload document
const uploaded = await documentsService.uploadDocument(file, caseId);

// Delete document
await documentsService.deleteDocument(docId);

// Get download URL
const downloadUrl = documentsService.downloadDocument(docId);
```

### 4. Deadlines Service (`deadlinesService`)

```typescript
import { deadlinesService } from '@/api/services/deadlinesService';

// Get all deadlines
const deadlines = await deadlinesService.getDeadlines(caseId, page, pageSize);

// Get single deadline
const deadline = await deadlinesService.getDeadline(deadlineId);

// Create deadline
const newDeadline = await deadlinesService.createDeadline({
    title: 'Filing Deadline',
    description: 'File response by this date',
    dueDate: '2024-02-15',
    caseId: 'case-id',
    assignedTo: 'user-id'
});

// Update deadline
const updated = await deadlinesService.updateDeadline(deadlineId, {
    status: 'completed'
});

// Delete deadline
await deadlinesService.deleteDeadline(deadlineId);
```

### 5. Team Service (`teamService`)

```typescript
import { teamService } from '@/api/services/teamService';

// Get all team members
const members = await teamService.getTeamMembers(page, pageSize);

// Get single member
const member = await teamService.getTeamMember(memberId);

// Add team member
const newMember = await teamService.addTeamMember({
    email: 'lawyer@example.com',
    role: 'lawyer'
});

// Update team member
const updated = await teamService.updateTeamMember(memberId, {
    role: 'legal-official'
});

// Remove team member
await teamService.removeTeamMember(memberId);
```

### 6. User Service (`userService`)

```typescript
import { userService } from '@/api/services/userService';

// Get profile
const profile = await userService.getProfile();

// Update profile
const updated = await userService.updateProfile({
    name: 'New Name'
});

// Get user by ID
const user = await userService.getUser(userId);
```

## Using API in Components

### With React Hooks

```typescript
import { useAuth } from '@/context/AuthContext';
import { casesService } from '@/api/services/casesService';
import { useEffect, useState } from 'react';

export function MyCases() {
    const { user, isAuthenticated } = useAuth();
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchCases = async () => {
            try {
                setLoading(true);
                const result = await casesService.getCases();
                setCases(result.data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load cases');
            } finally {
                setLoading(false);
            }
        };

        fetchCases();
    }, [isAuthenticated]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            {cases.map(c => (
                <div key={c.id}>{c.title}</div>
            ))}
        </div>
    );
}
```

## API Endpoints Summary

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout
- `POST /auth/refresh-token` - Refresh JWT token
- `GET /auth/verify-token` - Verify current token

### Cases
- `GET /cases` - List all cases
- `POST /cases` - Create new case
- `GET /cases/{id}` - Get case details
- `PUT /cases/{id}` - Update case
- `DELETE /cases/{id}` - Delete case

### Documents
- `GET /documents` - List documents
- `POST /documents/upload` - Upload document
- `GET /documents/{id}` - Get document details
- `DELETE /documents/{id}` - Delete document
- `GET /documents/{id}/download` - Download document

### Deadlines
- `GET /deadlines` - List deadlines
- `POST /deadlines` - Create deadline
- `GET /deadlines/{id}` - Get deadline
- `PUT /deadlines/{id}` - Update deadline
- `DELETE /deadlines/{id}` - Delete deadline

### Team
- `GET /team` - List team members
- `POST /team/members` - Add team member
- `GET /team/members/{id}` - Get member details
- `PUT /team/members/{id}` - Update member
- `DELETE /team/members/{id}` - Remove member

### Users
- `GET /users/profile` - Get current user profile
- `PUT /users/profile` - Update profile
- `GET /users/{id}` - Get user details

## Error Handling

The API client automatically handles errors:

```typescript
try {
    const data = await casesService.getCase(caseId);
} catch (error) {
    if (error instanceof Error) {
        console.error('Error:', error.message);
    }
}
```

On 401 (unauthorized), the client automatically:
1. Clears the stored token
2. Redirects to login page
3. Shows error message

## Authentication Token Management

Tokens are automatically:
- Stored in localStorage when user logs in
- Sent with all API requests in Authorization header
- Cleared on logout or 401 response

To manually set/clear tokens:

```typescript
import apiClient from '@/api/client';

// Set token
apiClient.setToken('your-token');

// Clear token
apiClient.clearToken();
```

## Backend Server Setup Requirements

Your backend should:

1. Accept requests at the configured `REACT_APP_API_URL`
2. Implement all endpoints listed above
3. Accept/send JSON data (except file uploads which use FormData)
4. Return responses in format:
```json
{
    "success": true,
    "data": { /* response data */ },
    "message": "Success message"
}
```
5. Handle authentication with Bearer tokens in Authorization header
6. Return 401 for expired/invalid tokens
7. Support CORS for your frontend domain

## Testing the API

Start your backend server on `http://localhost:3000`, then update `.env`:
```env
REACT_APP_API_URL=http://localhost:3000/api
```

The authentication flow will test the full API integration:
1. Go to landing page
2. Click "Get Started" or "Sign In"
3. Enter test credentials and role
4. Submit - this will call the API
5. On success, redirect to dashboard
