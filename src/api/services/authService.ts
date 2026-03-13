/**
 * Authentication Service
 * API calls for authentication operations
 */

import apiClient from '../client';
import { API_ENDPOINTS } from '../config';
import type {
    LoginRequest,
    RegisterRequest,
    AuthResponse,
    ApiResponse,
    User,
} from '../types';

export const authService = {
    /**
     * Login user
     */
    async login(credentials: LoginRequest): Promise<AuthResponse> {
        const response = await apiClient.post<ApiResponse<AuthResponse>>(
            API_ENDPOINTS.AUTH.LOGIN,
            credentials
        );

        if (response.data?.token) {
            apiClient.setToken(response.data.token);
        }

        return response.data!;
    },

    /**
     * Register new user
     */
    async register(data: RegisterRequest): Promise<AuthResponse> {
        const response = await apiClient.post<ApiResponse<AuthResponse>>(
            API_ENDPOINTS.AUTH.REGISTER,
            data
        );

        if (response.data?.token) {
            apiClient.setToken(response.data.token);
        }

        return response.data!;
    },

    /**
     * Logout user
     */
    async logout(): Promise<void> {
        try {
            await apiClient.post<ApiResponse<null>>(
                API_ENDPOINTS.AUTH.LOGOUT,
                {}
            );
        } catch {
            // Backend unavailable — clear locally
        } finally {
            apiClient.clearToken();
        }
    },

    /**
     * Refresh authentication token
     */
    async refreshToken(refreshToken: string): Promise<AuthResponse> {
        const response = await apiClient.post<ApiResponse<AuthResponse>>(
            API_ENDPOINTS.AUTH.REFRESH_TOKEN,
            { refreshToken }
        );

        if (response.data?.token) {
            apiClient.setToken(response.data.token);
        }

        return response.data!;
    },

    /**
     * Verify current token
     */
    async verifyToken(): Promise<User> {
        const response = await apiClient.get<ApiResponse<User>>(
            API_ENDPOINTS.AUTH.VERIFY_TOKEN
        );
        return response.data!;
    },

    /**
     * Clear stored token
     */
    clearToken(): void {
        apiClient.clearToken();
    },

    /**
     * Set token (for restoring session)
     */
    setToken(token: string): void {
        apiClient.setToken(token);
    },
};
