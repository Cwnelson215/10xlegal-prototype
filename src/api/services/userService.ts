/**
 * User Service
 * API calls for user profile management
 */

import apiClient from '../client';
import { API_ENDPOINTS } from '../config';
import type {
    User,
    ApiResponse,
} from '../types';

export const userService = {
    /**
     * Get user profile
     */
    async getProfile(): Promise<User> {
        const response = await apiClient.get<ApiResponse<User>>(
            API_ENDPOINTS.USERS.GET_PROFILE
        );
        
        return response.data!;
    },

    /**
     * Update user profile
     */
    async updateProfile(data: Partial<User>): Promise<User> {
        const response = await apiClient.put<ApiResponse<User>>(
            API_ENDPOINTS.USERS.UPDATE_PROFILE,
            data
        );
        
        return response.data!;
    },

    /**
     * Get user by ID
     */
    async getUser(id: string): Promise<User> {
        const response = await apiClient.get<ApiResponse<User>>(
            API_ENDPOINTS.USERS.GET_USER(id)
        );
        
        return response.data!;
    },
};
