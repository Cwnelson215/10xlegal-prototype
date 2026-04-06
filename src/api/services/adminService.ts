import apiClient from '../client';
import { API_ENDPOINTS } from '../config';
import type {
    DataImportResponse,
    DataImportRecord,
    DataType,
    ImportFormat,
    SystemStats,
    AuditLogEntry,
    TruncateResponse,
    User,
    UserRole,
    ApiResponse,
    PaginatedResponse,
} from '../types';


export const adminService = {
    async uploadData(sheets: Partial<Record<DataType, Record<string, unknown>[]>>, format: ImportFormat, fileName: string): Promise<DataImportResponse> {
        const response = await apiClient.post<ApiResponse<DataImportResponse>>(
            API_ENDPOINTS.ADMIN.UPLOAD_DATA,
            { sheets, format, fileName }
        );
        return response.data!;
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

    async updateUserRole(userId: string, role: UserRole, adminPassword?: string): Promise<User> {
        const body: { role: UserRole; adminPassword?: string } = { role };
        if (adminPassword) {
            body.adminPassword = adminPassword;
        }
        const response = await apiClient.patch<ApiResponse<User>>(
            API_ENDPOINTS.ADMIN.UPDATE_USER_ROLE(userId),
            body
        );
        return response.data!;
    },

    async hasAdminPassword(): Promise<boolean> {
        const response = await apiClient.get<ApiResponse<{ hasAdminPassword: boolean }>>(
            API_ENDPOINTS.ADMIN.HAS_ADMIN_PASSWORD
        );
        return response.data!.hasAdminPassword;
    },

    async setAdminPassword(password: string): Promise<void> {
        await apiClient.post<ApiResponse<{ message: string }>>(
            API_ENDPOINTS.ADMIN.SET_ADMIN_PASSWORD,
            { password }
        );
    },

    async getDataExport(dataType: DataType, format: 'json' | 'csv'): Promise<Blob> {
        const response = await fetch(
            `${API_ENDPOINTS.ADMIN.EXPORT_DATA}?dataType=${dataType}&format=${format}`,
            { method: 'GET' }
        );
        return response.blob();
    },

    async getSystemStats(): Promise<SystemStats> {
        const response = await apiClient.get<ApiResponse<SystemStats>>(API_ENDPOINTS.ADMIN.SYSTEM_STATS);
        return response.data!;
    },

    async getAuditLog(page = 1, pageSize = 10): Promise<PaginatedResponse<AuditLogEntry>> {
        return apiClient.get<PaginatedResponse<AuditLogEntry>>(
            `${API_ENDPOINTS.ADMIN.AUDIT_LOG}?page=${page}&pageSize=${pageSize}`
        );
    },

    async truncateData(): Promise<TruncateResponse> {
        const response = await apiClient.post<ApiResponse<TruncateResponse>>(
            API_ENDPOINTS.ADMIN.TRUNCATE_DATA,
            {}
        );
        return response.data!;
    },
};
