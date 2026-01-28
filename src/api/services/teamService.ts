/**
 * Team Service
 * API calls for team management
 */

import apiClient from '../client';
import { API_ENDPOINTS } from '../config';
import type {
    TeamMember,
    AddTeamMemberRequest,
    ApiResponse,
    PaginatedResponse,
} from '../types';

export const teamService = {
    /**
     * Get all team members
     */
    async getTeamMembers(page = 1, pageSize = 10): Promise<PaginatedResponse<TeamMember>> {
        return apiClient.get<PaginatedResponse<TeamMember>>(
            `${API_ENDPOINTS.TEAM.LIST}?page=${page}&pageSize=${pageSize}`
        );
    },

    /**
     * Get single team member
     */
    async getTeamMember(id: string): Promise<TeamMember> {
        const response = await apiClient.get<ApiResponse<TeamMember>>(
            API_ENDPOINTS.TEAM.GET_MEMBER(id)
        );
        
        return response.data!;
    },

    /**
     * Add team member
     */
    async addTeamMember(data: AddTeamMemberRequest): Promise<TeamMember> {
        const response = await apiClient.post<ApiResponse<TeamMember>>(
            API_ENDPOINTS.TEAM.ADD_MEMBER,
            data
        );
        
        return response.data!;
    },

    /**
     * Update team member
     */
    async updateTeamMember(id: string, data: Partial<TeamMember>): Promise<TeamMember> {
        const response = await apiClient.put<ApiResponse<TeamMember>>(
            API_ENDPOINTS.TEAM.UPDATE_MEMBER(id),
            data
        );
        
        return response.data!;
    },

    /**
     * Remove team member
     */
    async removeTeamMember(id: string): Promise<void> {
        await apiClient.delete<ApiResponse<null>>(
            API_ENDPOINTS.TEAM.REMOVE_MEMBER(id)
        );
    },
};
