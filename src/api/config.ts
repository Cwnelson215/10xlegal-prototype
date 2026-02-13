/**
 * API Configuration
 * Define endpoints for backend communication as relative paths.
 * The API client (client.ts) prepends the base URL automatically.
 */

export const API_ENDPOINTS = {
    // Authentication endpoints
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        LOGOUT: '/auth/logout',
        REFRESH_TOKEN: '/auth/refresh-token',
        VERIFY_TOKEN: '/auth/verify-token',
    },

    // User endpoints
    USERS: {
        GET_PROFILE: '/users/profile',
        UPDATE_PROFILE: '/users/profile',
        GET_USER: (id: string) => `/users/${id}`,
    },

    // Cases endpoints
    CASES: {
        LIST: '/cases',
        CREATE: '/cases',
        GET: (id: string) => `/cases/${id}`,
        UPDATE: (id: string) => `/cases/${id}`,
        DELETE: (id: string) => `/cases/${id}`,
    },

    // Documents endpoints
    DOCUMENTS: {
        LIST: '/documents',
        UPLOAD: '/documents/upload',
        GET: (id: string) => `/documents/${id}`,
        DELETE: (id: string) => `/documents/${id}`,
        DOWNLOAD: (id: string) => `/documents/${id}/download`,
    },

    // Deadlines endpoints
    DEADLINES: {
        LIST: '/deadlines',
        CREATE: '/deadlines',
        GET: (id: string) => `/deadlines/${id}`,
        UPDATE: (id: string) => `/deadlines/${id}`,
        DELETE: (id: string) => `/deadlines/${id}`,
    },

    // Team endpoints
    TEAM: {
        LIST: '/team',
        ADD_MEMBER: '/team/members',
        GET_MEMBER: (id: string) => `/team/members/${id}`,
        UPDATE_MEMBER: (id: string) => `/team/members/${id}`,
        REMOVE_MEMBER: (id: string) => `/team/members/${id}`,
    },
};
