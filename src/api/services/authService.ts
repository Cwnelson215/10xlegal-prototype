/**
 * Authentication Service
 * API calls for authentication operations
 */

import apiClient from '../client';
import { API_ENDPOINTS } from '../config';
import { mockAuth } from './mockAuth';
import type {
    LoginRequest,
    RegisterRequest,
    AuthResponse,
    ApiResponse,
    User,
} from '../types';

export const authService = {
    /**
     * Login user — falls back to mock auth when backend is unavailable
     */
    async login(credentials: LoginRequest): Promise<AuthResponse> {
        try {
            const response = await apiClient.post<ApiResponse<AuthResponse>>(
                API_ENDPOINTS.AUTH.LOGIN,
                credentials
            );

            if (response.data?.token) {
                apiClient.setToken(response.data.token);
            }

            return response.data!;
        } catch (err) {
            // Only fall back to mock auth on network errors (backend unavailable)
            if (err instanceof Error && err.message.startsWith('Network error')) {
                const result = mockAuth.login(credentials);
                apiClient.setToken(result.token);
                mockAuth.saveUser(result.user);
                return result;
            }
            throw err;
        }
    },

    /**
     * Register new user — falls back to mock auth when backend is unavailable
     */
    async register(data: RegisterRequest): Promise<AuthResponse> {
        try {
            const response = await apiClient.post<ApiResponse<AuthResponse>>(
                API_ENDPOINTS.AUTH.REGISTER,
                data
            );

            if (response.data?.token) {
                apiClient.setToken(response.data.token);
            }

            return response.data!;
        } catch (err) {
            // Only fall back to mock auth on network errors (backend unavailable)
            if (err instanceof Error && err.message.startsWith('Network error')) {
                const result = mockAuth.register(data);
                apiClient.setToken(result.token);
                mockAuth.saveUser(result.user);
                return result;
            }
            throw err;
        }
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
            mockAuth.clearUser();
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
     * Verify current token — falls back to mock stored user
     */
    async verifyToken(): Promise<User> {
        try {
            const response = await apiClient.get<ApiResponse<User>>(
                API_ENDPOINTS.AUTH.VERIFY_TOKEN
            );
            return response.data!;
        } catch (err) {
            // Only fall back to mock on network errors
            if (err instanceof Error && err.message.startsWith('Network error')) {
                const user = mockAuth.verifyToken();
                if (user) return user;
            }
            throw err;
        }
    },

    /**
     * Clear stored token
     */
    clearToken(): void {
        apiClient.clearToken();
        mockAuth.clearUser();
    },

    /**
     * Set token (for restoring session)
     */
    setToken(token: string): void {
        apiClient.setToken(token);
    },
};
