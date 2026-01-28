/**
 * API Types
 * TypeScript interfaces for API requests and responses
 */

export type UserRole = 'client' | 'lawyer' | 'legal-official';

// Authentication Types
export interface LoginRequest {
    email: string;
    password: string;
    role: UserRole;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    role: UserRole;
}

export interface AuthResponse {
    token: string;
    refreshToken: string;
    user: User;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    createdAt: string;
    updatedAt: string;
}

// Case Types
export interface Case {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'active' | 'on-hold' | 'closed';
    caseNumber: string;
    clientId: string;
    lawyerId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCaseRequest {
    title: string;
    description: string;
    caseNumber: string;
    clientId: string;
    lawyerId?: string;
}

export interface UpdateCaseRequest {
    title?: string;
    description?: string;
    status?: string;
    lawyerId?: string;
}

// Document Types
export interface Document {
    id: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    url: string;
    caseId: string;
    uploadedBy: string;
    uploadedAt: string;
    version: number;
}

export interface DocumentUploadRequest {
    file: File;
    caseId: string;
    fileName?: string;
}

// Deadline Types
export interface Deadline {
    id: string;
    title: string;
    description: string;
    dueDate: string;
    caseId: string;
    assignedTo: string;
    status: 'pending' | 'completed' | 'overdue';
    createdAt: string;
    updatedAt: string;
}

export interface CreateDeadlineRequest {
    title: string;
    description: string;
    dueDate: string;
    caseId: string;
    assignedTo: string;
}

export interface UpdateDeadlineRequest {
    title?: string;
    description?: string;
    dueDate?: string;
    status?: string;
    assignedTo?: string;
}

// Team Types
export interface TeamMember {
    id: string;
    userId: string;
    name: string;
    email: string;
    role: UserRole;
    joinedAt: string;
}

export interface AddTeamMemberRequest {
    email: string;
    role: UserRole;
}

// API Response Types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

// Error Types
export interface ApiError {
    status: number;
    message: string;
    errors?: Record<string, string[]>;
}
