/**
 * Cases Service
 * API calls for case management
 */

import apiClient from '../client';
import { API_ENDPOINTS } from '../config';
import type {
    Case,
    CreateCaseRequest,
    UpdateCaseRequest,
    ApiResponse,
    PaginatedResponse,
} from '../types';

export const casesService = {
    /**
     * Get all cases
     */
    async getCases(page = 1, pageSize = 10): Promise<PaginatedResponse<Case>> {
        return apiClient.get<PaginatedResponse<Case>>(
            `${API_ENDPOINTS.CASES.LIST}?page=${page}&pageSize=${pageSize}`
        );
    },

    /**
     * Get single case
     */
    async getCase(id: string): Promise<Case> {
        const response = await apiClient.get<ApiResponse<Case>>(
            API_ENDPOINTS.CASES.GET(id)
        );
        
        return response.data!;
    },

    /**
     * Create new case
     */
    async createCase(data: CreateCaseRequest): Promise<Case> {
        const response = await apiClient.post<ApiResponse<Case>>(
            API_ENDPOINTS.CASES.CREATE,
            data
        );
        
        return response.data!;
    },

    /**
     * Update case
     */
    async updateCase(id: string, data: UpdateCaseRequest): Promise<Case> {
        const response = await apiClient.put<ApiResponse<Case>>(
            API_ENDPOINTS.CASES.UPDATE(id),
            data
        );
        
        return response.data!;
    },

    /**
     * Delete case
     */
    async deleteCase(id: string): Promise<void> {
        await apiClient.delete<ApiResponse<null>>(
            API_ENDPOINTS.CASES.DELETE(id)
        );
    },

    async assignJudge(caseId: string, judgeId: string): Promise<Case> {
        const response = await apiClient.put<ApiResponse<Case>>(
            API_ENDPOINTS.CASES.ASSIGN_JUDGE(caseId),
            { judgeId }
        );
        return response.data!;
    },
};
