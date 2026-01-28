/**
 * Documents Service
 * API calls for document management
 */

import apiClient from '../client';
import { API_ENDPOINTS } from '../config';
import type {
    Document,
    DocumentUploadRequest,
    ApiResponse,
    PaginatedResponse,
} from '../types';

export const documentsService = {
    /**
     * Get all documents
     */
    async getDocuments(caseId?: string, page = 1, pageSize = 10): Promise<PaginatedResponse<Document>> {
        const query = new URLSearchParams();
        query.append('page', page.toString());
        query.append('pageSize', pageSize.toString());
        
        if (caseId) {
            query.append('caseId', caseId);
        }
        
        return apiClient.get<PaginatedResponse<Document>>(
            `${API_ENDPOINTS.DOCUMENTS.LIST}?${query.toString()}`
        );
    },

    /**
     * Get single document
     */
    async getDocument(id: string): Promise<Document> {
        const response = await apiClient.get<ApiResponse<Document>>(
            API_ENDPOINTS.DOCUMENTS.GET(id)
        );
        
        return response.data!;
    },

    /**
     * Upload document
     */
    async uploadDocument(file: File, caseId: string): Promise<Document> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('caseId', caseId);

        const response = await apiClient.post<ApiResponse<Document>>(
            API_ENDPOINTS.DOCUMENTS.UPLOAD,
            formData,
            true // isFormData
        );
        
        return response.data!;
    },

    /**
     * Delete document
     */
    async deleteDocument(id: string): Promise<void> {
        await apiClient.delete<ApiResponse<null>>(
            API_ENDPOINTS.DOCUMENTS.DELETE(id)
        );
    },

    /**
     * Download document
     */
    downloadDocument(id: string): string {
        return API_ENDPOINTS.DOCUMENTS.DOWNLOAD(id);
    },
};
