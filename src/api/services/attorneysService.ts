import apiClient from '../client';
import { API_ENDPOINTS } from '../config';
import type { Attorney, ApiResponse, PaginatedResponse } from '../types';

export const attorneysService = {
    async getAttorneys(type?: 'prosecution' | 'defense', page = 1, pageSize = 100): Promise<PaginatedResponse<Attorney>> {
        const query = new URLSearchParams();
        query.append('page', page.toString());
        query.append('pageSize', pageSize.toString());
        if (type) query.append('type', type);

        return apiClient.get<PaginatedResponse<Attorney>>(
            `${API_ENDPOINTS.ATTORNEYS.LIST}?${query.toString()}`
        );
    },

    async getAttorney(id: string): Promise<Attorney> {
        const response = await apiClient.get<ApiResponse<Attorney>>(
            API_ENDPOINTS.ATTORNEYS.GET(id)
        );
        return response.data!;
    },

    async createAttorney(data: { name: string; type: 'prosecution' | 'defense'; firmId?: string }): Promise<Attorney> {
        const response = await apiClient.post<ApiResponse<Attorney>>(
            API_ENDPOINTS.ATTORNEYS.CREATE,
            data
        );
        return response.data!;
    },
};
