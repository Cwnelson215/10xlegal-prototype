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

export interface LawyerVerificationInfo {
    stateBarAssociation: string;
    barNumber: string;
}

export interface LegalOfficialVerificationInfo {
    governmentAgency: string;
    officialId: string;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    lawyerInfo?: LawyerVerificationInfo;
    legalOfficialInfo?: LegalOfficialVerificationInfo;
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
    lawyerInfo?: LawyerVerificationInfo;
    legalOfficialInfo?: LegalOfficialVerificationInfo;
    verificationStatus?: 'pending' | 'verified' | 'rejected';
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
    county: string;
    judge: string;
    prosecutionAttorney: string;
    prosecutionFirm: string;
    defenseAttorney: string;
    defenseFirm: string;
    charge: string;
    courtDate: string;
    ruling: string;
    sentence: string;
    judgeId?: string;
    prosecutionAttorneyId?: string;
    defenseAttorneyId?: string;
    prosecutionFirmId?: string;
    defenseFirmId?: string;
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
    caseNumber: string;
    assignedTo: string;
    status: 'pending' | 'completed' | 'overdue';
    clientId: string;
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

// Entity Types
export interface Judge {
    id: string;
    name: string;
    caseCount: number;
    counties: string[];
    rulingDistribution?: Record<string, number>;
    createdAt: string;
    updatedAt: string;
}

export interface Attorney {
    id: string;
    name: string;
    type: 'prosecution' | 'defense';
    firmId: string | null;
    firmName: string | null;
    caseCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface LawFirm {
    id: string;
    name: string;
    type: 'prosecution' | 'defense';
    attorneyCount: number;
    caseCount: number;
    attorneys?: Attorney[];
    createdAt: string;
    updatedAt: string;
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

// US States for bar association selection
export const US_STATES = [
    { abbreviation: 'AL', name: 'Alabama' },
    { abbreviation: 'AK', name: 'Alaska' },
    { abbreviation: 'AZ', name: 'Arizona' },
    { abbreviation: 'AR', name: 'Arkansas' },
    { abbreviation: 'CA', name: 'California' },
    { abbreviation: 'CO', name: 'Colorado' },
    { abbreviation: 'CT', name: 'Connecticut' },
    { abbreviation: 'DE', name: 'Delaware' },
    { abbreviation: 'DC', name: 'District of Columbia' },
    { abbreviation: 'FL', name: 'Florida' },
    { abbreviation: 'GA', name: 'Georgia' },
    { abbreviation: 'HI', name: 'Hawaii' },
    { abbreviation: 'ID', name: 'Idaho' },
    { abbreviation: 'IL', name: 'Illinois' },
    { abbreviation: 'IN', name: 'Indiana' },
    { abbreviation: 'IA', name: 'Iowa' },
    { abbreviation: 'KS', name: 'Kansas' },
    { abbreviation: 'KY', name: 'Kentucky' },
    { abbreviation: 'LA', name: 'Louisiana' },
    { abbreviation: 'ME', name: 'Maine' },
    { abbreviation: 'MD', name: 'Maryland' },
    { abbreviation: 'MA', name: 'Massachusetts' },
    { abbreviation: 'MI', name: 'Michigan' },
    { abbreviation: 'MN', name: 'Minnesota' },
    { abbreviation: 'MS', name: 'Mississippi' },
    { abbreviation: 'MO', name: 'Missouri' },
    { abbreviation: 'MT', name: 'Montana' },
    { abbreviation: 'NE', name: 'Nebraska' },
    { abbreviation: 'NV', name: 'Nevada' },
    { abbreviation: 'NH', name: 'New Hampshire' },
    { abbreviation: 'NJ', name: 'New Jersey' },
    { abbreviation: 'NM', name: 'New Mexico' },
    { abbreviation: 'NY', name: 'New York' },
    { abbreviation: 'NC', name: 'North Carolina' },
    { abbreviation: 'ND', name: 'North Dakota' },
    { abbreviation: 'OH', name: 'Ohio' },
    { abbreviation: 'OK', name: 'Oklahoma' },
    { abbreviation: 'OR', name: 'Oregon' },
    { abbreviation: 'PA', name: 'Pennsylvania' },
    { abbreviation: 'RI', name: 'Rhode Island' },
    { abbreviation: 'SC', name: 'South Carolina' },
    { abbreviation: 'SD', name: 'South Dakota' },
    { abbreviation: 'TN', name: 'Tennessee' },
    { abbreviation: 'TX', name: 'Texas' },
    { abbreviation: 'UT', name: 'Utah' },
    { abbreviation: 'VT', name: 'Vermont' },
    { abbreviation: 'VA', name: 'Virginia' },
    { abbreviation: 'WA', name: 'Washington' },
    { abbreviation: 'WV', name: 'West Virginia' },
    { abbreviation: 'WI', name: 'Wisconsin' },
    { abbreviation: 'WY', name: 'Wyoming' },
] as const;
