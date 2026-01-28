/**
 * Deadlines Service
 * API calls for deadline management
 */

import apiClient from '../client';
import { API_ENDPOINTS } from '../config';
import type {
    Deadline,
    CreateDeadlineRequest,
    UpdateDeadlineRequest,
    ApiResponse,
    PaginatedResponse,
} from '../types';

export const deadlinesService = {
    /**
     * Get all deadlines
     */
    async getDeadlines(caseId?: string, page = 1, pageSize = 10): Promise<PaginatedResponse<Deadline>> {
        const query = new URLSearchParams();
        query.append('page', page.toString());
        query.append('pageSize', pageSize.toString());
        
        if (caseId) {
            query.append('caseId', caseId);
        }
        
        return apiClient.get<PaginatedResponse<Deadline>>(
            `${API_ENDPOINTS.DEADLINES.LIST}?${query.toString()}`
        );
    },

    /**
     * Get single deadline
     */
    async getDeadline(id: string): Promise<Deadline> {
        const response = await apiClient.get<ApiResponse<Deadline>>(
            API_ENDPOINTS.DEADLINES.GET(id)
        );
        
        return response.data!;
    },

    /**
     * Create new deadline
     */
    async createDeadline(data: CreateDeadlineRequest): Promise<Deadline> {
        const response = await apiClient.post<ApiResponse<Deadline>>(
            API_ENDPOINTS.DEADLINES.CREATE,
            data
        );
        
        return response.data!;
    },

    /**
     * Update deadline
     */
    async updateDeadline(id: string, data: UpdateDeadlineRequest): Promise<Deadline> {
        const response = await apiClient.put<ApiResponse<Deadline>>(
            API_ENDPOINTS.DEADLINES.UPDATE(id),
            data
        );
        
        return response.data!;
    },

    /**
     * Delete deadline
     */
    async deleteDeadline(id: string): Promise<void> {
        await apiClient.delete<ApiResponse<null>>(
            API_ENDPOINTS.DEADLINES.DELETE(id)
        );
    },
};
