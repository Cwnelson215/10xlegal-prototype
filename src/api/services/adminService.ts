import apiClient from '../client';
import { API_ENDPOINTS } from '../config';
import type {
    DataImportResponse,
    DataImportRecord,
    DataType,
    ImportFormat,
    SystemStats,
    AuditLogEntry,
    User,
    UserRole,
    ApiResponse,
    PaginatedResponse,
} from '../types';

export const adminService = {
    async uploadData(file: File, format: ImportFormat, dataType: DataType): Promise<DataImportResponse> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('format', format);
        formData.append('dataType', dataType);

        return apiClient.post<DataImportResponse>(
            API_ENDPOINTS.ADMIN.UPLOAD_DATA,
            formData,
            true
        );
    },

    async getImportHistory(page = 1, pageSize = 10): Promise<PaginatedResponse<DataImportRecord>> {
        return apiClient.get<PaginatedResponse<DataImportRecord>>(
            `${API_ENDPOINTS.ADMIN.IMPORT_HISTORY}?page=${page}&pageSize=${pageSize}`
        );
    },

    async getUsers(page = 1, pageSize = 10): Promise<PaginatedResponse<User>> {
        return apiClient.get<PaginatedResponse<User>>(
            `${API_ENDPOINTS.ADMIN.USERS}?page=${page}&pageSize=${pageSize}`
        );
    },

    async updateUserRole(userId: string, role: UserRole): Promise<User> {
        const response = await apiClient.patch<ApiResponse<User>>(
            API_ENDPOINTS.ADMIN.UPDATE_USER_ROLE(userId),
            { role }
        );
        return response.data!;
    },

    async getSystemStats(): Promise<SystemStats> {
        return apiClient.get<SystemStats>(API_ENDPOINTS.ADMIN.SYSTEM_STATS);
    },

    async exportData(dataType: DataType, format: 'json' | 'csv'): Promise<Blob> {
        const response = await fetch(
            `${API_ENDPOINTS.ADMIN.EXPORT_DATA}?dataType=${dataType}&format=${format}`,
            { method: 'GET' }
        );
        return response.blob();
    },

    async getAuditLog(page = 1, pageSize = 10): Promise<PaginatedResponse<AuditLogEntry>> {
        return apiClient.get<PaginatedResponse<AuditLogEntry>>(
            `${API_ENDPOINTS.ADMIN.AUDIT_LOG}?page=${page}&pageSize=${pageSize}`
        );
    },
};
