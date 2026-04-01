import { describe, it, expect } from 'vitest';
import { API_ENDPOINTS } from '../config';

describe('API_ENDPOINTS', () => {
    it('defines auth endpoints', () => {
        expect(API_ENDPOINTS.AUTH.LOGIN).toBe('/auth/login');
        expect(API_ENDPOINTS.AUTH.REGISTER).toBe('/auth/register');
        expect(API_ENDPOINTS.AUTH.LOGOUT).toBe('/auth/logout');
        expect(API_ENDPOINTS.AUTH.REFRESH_TOKEN).toBe('/auth/refresh-token');
        expect(API_ENDPOINTS.AUTH.VERIFY_TOKEN).toBe('/auth/verify-token');
    });

    it('defines user endpoints with parameterized paths', () => {
        expect(API_ENDPOINTS.USERS.GET_PROFILE).toBe('/users/profile');
        expect(API_ENDPOINTS.USERS.UPDATE_PROFILE).toBe('/users/profile');
        expect(API_ENDPOINTS.USERS.GET_USER('abc')).toBe('/users/abc');
    });

    it('defines cases endpoints with parameterized paths', () => {
        expect(API_ENDPOINTS.CASES.LIST).toBe('/cases');
        expect(API_ENDPOINTS.CASES.CREATE).toBe('/cases');
        expect(API_ENDPOINTS.CASES.GET('123')).toBe('/cases/123');
        expect(API_ENDPOINTS.CASES.UPDATE('123')).toBe('/cases/123');
        expect(API_ENDPOINTS.CASES.DELETE('123')).toBe('/cases/123');
    });

    it('defines documents endpoints with parameterized paths', () => {
        expect(API_ENDPOINTS.DOCUMENTS.LIST).toBe('/documents');
        expect(API_ENDPOINTS.DOCUMENTS.UPLOAD).toBe('/documents/upload');
        expect(API_ENDPOINTS.DOCUMENTS.GET('d1')).toBe('/documents/d1');
        expect(API_ENDPOINTS.DOCUMENTS.DELETE('d1')).toBe('/documents/d1');
        expect(API_ENDPOINTS.DOCUMENTS.DOWNLOAD('d1')).toBe('/documents/d1/download');
    });

    it('defines deadlines endpoints with parameterized paths', () => {
        expect(API_ENDPOINTS.DEADLINES.LIST).toBe('/deadlines');
        expect(API_ENDPOINTS.DEADLINES.CREATE).toBe('/deadlines');
        expect(API_ENDPOINTS.DEADLINES.GET('dl1')).toBe('/deadlines/dl1');
        expect(API_ENDPOINTS.DEADLINES.UPDATE('dl1')).toBe('/deadlines/dl1');
        expect(API_ENDPOINTS.DEADLINES.DELETE('dl1')).toBe('/deadlines/dl1');
    });

    it('defines attorneys and firms endpoints', () => {
        expect(API_ENDPOINTS.ATTORNEYS.LIST).toBe('/attorneys');
        expect(API_ENDPOINTS.ATTORNEYS.GET('a1')).toBe('/attorneys/a1');
        expect(API_ENDPOINTS.FIRMS.LIST).toBe('/firms');
        expect(API_ENDPOINTS.FIRMS.GET('f1')).toBe('/firms/f1');
    });

    it('defines admin endpoints with parameterized paths', () => {
        expect(API_ENDPOINTS.ADMIN.UPLOAD_DATA).toBe('/admin/upload');
        expect(API_ENDPOINTS.ADMIN.IMPORT_HISTORY).toBe('/admin/imports');
        expect(API_ENDPOINTS.ADMIN.USERS).toBe('/admin/users');
        expect(API_ENDPOINTS.ADMIN.UPDATE_USER_ROLE('u1')).toBe('/admin/users/u1/role');
        expect(API_ENDPOINTS.ADMIN.SYSTEM_STATS).toBe('/admin/stats');
        expect(API_ENDPOINTS.ADMIN.EXPORT_DATA).toBe('/admin/export');
        expect(API_ENDPOINTS.ADMIN.AUDIT_LOG).toBe('/admin/audit-log');
        expect(API_ENDPOINTS.ADMIN.TRUNCATE_DATA).toBe('/admin/truncate');
    });
});
