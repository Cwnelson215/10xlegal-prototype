import apiClient from '../client';
import { API_ENDPOINTS } from '../config';
import type { Judge, ApiResponse, PaginatedResponse } from '../types';

export const judgesService = {
    async getJudges(page = 1, pageSize = 100): Promise<PaginatedResponse<Judge>> {
        return apiClient.get<PaginatedResponse<Judge>>(
            `${API_ENDPOINTS.JUDGES.LIST}?page=${page}&pageSize=${pageSize}`
        );
    },

    async getJudge(id: string): Promise<Judge> {
        const response = await apiClient.get<ApiResponse<Judge>>(
            API_ENDPOINTS.JUDGES.GET(id)
        );
        return response.data!;
    },
};
