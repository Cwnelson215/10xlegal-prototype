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
        ASSIGN_JUDGE: (id: string) => `/cases/${id}/judge`,
        ASSIGN_ATTORNEY: (id: string) => `/cases/${id}/attorneys`,
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

    // Attorneys endpoints
    ATTORNEYS: {
        LIST: '/attorneys',
        CREATE: '/attorneys',
        GET: (id: string) => `/attorneys/${id}`,
    },

    // Judges endpoints
    JUDGES: {
        LIST: '/judges',
        CREATE: '/judges',
        GET: (id: string) => `/judges/${id}`,
    },

    // Firms endpoints
    FIRMS: {
        LIST: '/firms',
        GET: (id: string) => `/firms/${id}`,
    },


    // Admin endpoints
    ADMIN: {
        UPLOAD_DATA: '/admin/upload',
        IMPORT_HISTORY: '/admin/imports',
        USERS: '/admin/users',
        UPDATE_USER_ROLE: (id: string) => `/admin/users/${id}/role`,
        SYSTEM_STATS: '/admin/stats',
        EXPORT_DATA: '/admin/export',
        AUDIT_LOG: '/admin/audit-log',
        TRUNCATE_DATA: '/admin/truncate',
        HAS_ADMIN_PASSWORD: '/admin/has-admin-password',
        SET_ADMIN_PASSWORD: '/admin/admin-password',
    },
};
