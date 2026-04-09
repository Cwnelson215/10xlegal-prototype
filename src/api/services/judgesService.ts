import apiClient from '../client';
import { API_ENDPOINTS } from '../config';
import type {
    Judge,
    CreateJudgeRequest,
    UpdateJudgeRequest,
    ApiResponse,
    PaginatedResponse,
} from '../types';

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

    async createJudge(data: CreateJudgeRequest): Promise<Judge> {
        const response = await apiClient.post<ApiResponse<Judge>>(
            API_ENDPOINTS.JUDGES.CREATE,
            data
        );
        return response.data!;
    },

    async updateJudge(id: string, data: UpdateJudgeRequest): Promise<Judge> {
        const response = await apiClient.put<ApiResponse<Judge>>(
            API_ENDPOINTS.JUDGES.UPDATE(id),
            data
        );
        return response.data!;
    },
};
