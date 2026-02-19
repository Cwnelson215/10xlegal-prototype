import apiClient from '../client';
import { API_ENDPOINTS } from '../config';
import type { LawFirm, ApiResponse, PaginatedResponse } from '../types';

export const firmsService = {
    async getFirms(page = 1, pageSize = 100): Promise<PaginatedResponse<LawFirm>> {
        return apiClient.get<PaginatedResponse<LawFirm>>(
            `${API_ENDPOINTS.FIRMS.LIST}?page=${page}&pageSize=${pageSize}`
        );
    },

    async getFirm(id: string): Promise<LawFirm> {
        const response = await apiClient.get<ApiResponse<LawFirm>>(
            API_ENDPOINTS.FIRMS.GET(id)
        );
        return response.data!;
    },
};
