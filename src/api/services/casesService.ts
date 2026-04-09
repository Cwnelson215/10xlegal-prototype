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

/** Normalize case data to ensure attorney arrays exist (handles old API responses) */
function normalizeCase(c: any): Case {
    if (!c) return c;
    if (!c.prosecutionAttorneys) {
        c.prosecutionAttorneys = c.prosecutionAttorneyId
            ? [{ id: c.prosecutionAttorneyId, name: c.prosecutionAttorney || '' }]
            : [];
    }
    if (!c.defenseAttorneys) {
        c.defenseAttorneys = c.defenseAttorneyId
            ? [{ id: c.defenseAttorneyId, name: c.defenseAttorney || '' }]
            : [];
    }
    return c as Case;
}

export const casesService = {
    /**
     * Get all cases
     */
    async getCases(page = 1, pageSize = 10): Promise<PaginatedResponse<Case>> {
        const result = await apiClient.get<PaginatedResponse<Case>>(
            `${API_ENDPOINTS.CASES.LIST}?page=${page}&pageSize=${pageSize}`
        );
        result.data = result.data.map(normalizeCase);
        return result;
    },

    /**
     * Get single case
     */
    async getCase(id: string): Promise<Case> {
        const response = await apiClient.get<ApiResponse<Case>>(
            API_ENDPOINTS.CASES.GET(id)
        );
        return normalizeCase(response.data!);
    },

    /**
     * Create new case
     */
    async createCase(data: CreateCaseRequest): Promise<Case> {
        const response = await apiClient.post<ApiResponse<Case>>(
            API_ENDPOINTS.CASES.CREATE,
            data
        );
        return normalizeCase(response.data!);
    },

    /**
     * Update case
     */
    async updateCase(id: string, data: UpdateCaseRequest): Promise<Case> {
        const response = await apiClient.put<ApiResponse<Case>>(
            API_ENDPOINTS.CASES.UPDATE(id),
            data
        );
        return normalizeCase(response.data!);
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
        return normalizeCase(response.data!);
    },

    async assignAttorney(caseId: string, side: 'prosecution' | 'defense', attorneyId: string): Promise<Case> {
        const response = await apiClient.put<ApiResponse<Case>>(
            API_ENDPOINTS.CASES.ASSIGN_ATTORNEY(caseId),
            { side, attorneyId }
        );
        return normalizeCase(response.data!);
    },

    async removeAttorney(caseId: string, attorneyId: string): Promise<Case> {
        const response = await apiClient.delete<ApiResponse<Case>>(
            API_ENDPOINTS.CASES.REMOVE_ATTORNEY(caseId, attorneyId)
        );
        return normalizeCase(response.data!);
    },
};
