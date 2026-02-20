/**
 * API Client
 * Core HTTP client for making requests to the backend
 */

import type { ApiError, ApiResponse } from './types';

class ApiClient {
    private baseUrl: string;
    private token: string | null = null;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
        this.loadToken();
    }

    /**
     * Load token from localStorage
     */
    private loadToken() {
        this.token = localStorage.getItem('authToken');
    }

    /**
     * Set authentication token
     */
    setToken(token: string) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    /**
     * Remove authentication token
     */
    clearToken() {
        this.token = null;
        localStorage.removeItem('authToken');
    }

    /**
     * Get headers with authorization
     */
    private getHeaders(isFormData = false): Record<string, string> {
        const headers: Record<string, string> = {};
        
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    /**
     * Make HTTP request
     */
    private async request<T>(
        endpoint: string,
        options: RequestInit & { isFormData?: boolean } = {}
    ): Promise<T> {
        const { isFormData = false, ...fetchOptions } = options;
        
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...fetchOptions,
                headers: {
                    ...this.getHeaders(isFormData),
                    ...fetchOptions.headers,
                },
            });

            // Handle 401: redirect to login unless the request is to an auth endpoint
            // (auth endpoints use 401 for "bad credentials", not "session expired")
            if (response.status === 401 && !endpoint.startsWith('/auth/')) {
                this.clearToken();
                window.location.href = '/';
                throw new Error('Session expired. Please log in again.');
            }

            const contentType = response.headers.get('content-type');
            let data;
            
            if (contentType?.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            if (!response.ok) {
                const error: ApiError = {
                    status: response.status,
                    message: data?.message || `HTTP ${response.status}`,
                    errors: data?.errors,
                };
                throw error;
            }

            return data as T;
        } catch (error) {
            if (error instanceof TypeError) {
                throw new Error(`Network error: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * GET request
     */
    async get<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'GET',
        });
    }

    /**
     * POST request
     */
    async post<T>(endpoint: string, body?: unknown, isFormData = false): Promise<T> {
        const options: RequestInit & { isFormData?: boolean } = {
            method: 'POST',
            isFormData,
        };

        if (body) {
            if (isFormData) {
                options.body = body as BodyInit;
            } else {
                options.body = JSON.stringify(body);
            }
        }

        return this.request<T>(endpoint, options);
    }

    /**
     * PUT request
     */
    async put<T>(endpoint: string, body?: unknown): Promise<T> {
        const options: RequestInit & { isFormData?: boolean } = {
            method: 'PUT',
        };
        if (body) {
            options.body = JSON.stringify(body);
        }
        return this.request<T>(endpoint, options);
    }

    /**
     * PATCH request
     */
    async patch<T>(endpoint: string, body?: unknown): Promise<T> {
        const options: RequestInit & { isFormData?: boolean } = {
            method: 'PATCH',
        };
        if (body) {
            options.body = JSON.stringify(body);
        }
        return this.request<T>(endpoint, options);
    }

    /**
     * DELETE request
     */
    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'DELETE',
        });
    }
}

// Create and export instance
const getApiBaseUrl = (): string => {
    // Runtime override (e.g. set in index.html)
    if (typeof window !== 'undefined' && (window as any).__API_URL__) {
        return (window as any).__API_URL__;
    }

    // Build-time env var (set in CI or .env)
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    // Use relative path so Vite proxy handles it in dev
    return '/api';
};

const apiClient = new ApiClient(getApiBaseUrl());

export default apiClient;
