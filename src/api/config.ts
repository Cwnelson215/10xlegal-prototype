/**
 * API Configuration
 * Define base URL and endpoints for backend communication
 */

const getApiBaseUrl = (): string => {
    if (typeof window !== 'undefined' && (window as any).__API_URL) {
        return (window as any).__API_URL;
    }
    
    // For Vite, import.meta.env is only available at build time
    // So we use a string that Vite will replace during build
    const envUrl = '__VITE_API_URL__';
    if (envUrl && envUrl !== '__VITE_API_URL__') {
        return envUrl;
    }
    
    return 'http://localhost:3000/api';
};

const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
    // Authentication endpoints
    AUTH: {
        LOGIN: `${API_BASE_URL}/auth/login`,
        REGISTER: `${API_BASE_URL}/auth/register`,
        LOGOUT: `${API_BASE_URL}/auth/logout`,
        REFRESH_TOKEN: `${API_BASE_URL}/auth/refresh-token`,
        VERIFY_TOKEN: `${API_BASE_URL}/auth/verify-token`,
    },
    
    // User endpoints
    USERS: {
        GET_PROFILE: `${API_BASE_URL}/users/profile`,
        UPDATE_PROFILE: `${API_BASE_URL}/users/profile`,
        GET_USER: (id: string) => `${API_BASE_URL}/users/${id}`,
    },
    
    // Cases endpoints
    CASES: {
        LIST: `${API_BASE_URL}/cases`,
        CREATE: `${API_BASE_URL}/cases`,
        GET: (id: string) => `${API_BASE_URL}/cases/${id}`,
        UPDATE: (id: string) => `${API_BASE_URL}/cases/${id}`,
        DELETE: (id: string) => `${API_BASE_URL}/cases/${id}`,
    },
    
    // Documents endpoints
    DOCUMENTS: {
        LIST: `${API_BASE_URL}/documents`,
        UPLOAD: `${API_BASE_URL}/documents/upload`,
        GET: (id: string) => `${API_BASE_URL}/documents/${id}`,
        DELETE: (id: string) => `${API_BASE_URL}/documents/${id}`,
        DOWNLOAD: (id: string) => `${API_BASE_URL}/documents/${id}/download`,
    },
    
    // Deadlines endpoints
    DEADLINES: {
        LIST: `${API_BASE_URL}/deadlines`,
        CREATE: `${API_BASE_URL}/deadlines`,
        GET: (id: string) => `${API_BASE_URL}/deadlines/${id}`,
        UPDATE: (id: string) => `${API_BASE_URL}/deadlines/${id}`,
        DELETE: (id: string) => `${API_BASE_URL}/deadlines/${id}`,
    },
    
    // Team endpoints
    TEAM: {
        LIST: `${API_BASE_URL}/team`,
        ADD_MEMBER: `${API_BASE_URL}/team/members`,
        GET_MEMBER: (id: string) => `${API_BASE_URL}/team/members/${id}`,
        UPDATE_MEMBER: (id: string) => `${API_BASE_URL}/team/members/${id}`,
        REMOVE_MEMBER: (id: string) => `${API_BASE_URL}/team/members/${id}`,
    },
};

export const API_BASE_URL_VALUE = API_BASE_URL;
