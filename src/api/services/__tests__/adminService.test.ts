import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/mocks/server';
import { adminService } from '../adminService';
import apiClient from '../../client';

describe('adminService', () => {
    beforeEach(() => {
        localStorage.clear();
        apiClient.clearToken();
    });

    describe('uploadData', () => {
        it('uploads data and returns import response', async () => {
            server.use(
                http.post('/api/admin/upload', () => {
                    return HttpResponse.json({ success: true, data: { importId: 'imp-1', format: 'xlsx', totalRows: 10, importedRows: 10, failedRows: 0, errors: [], results: [], createdAt: '' } });
                })
            );

            const result = await adminService.uploadData({ cases: [{ a: 1 }] }, 'xlsx', 'test.xlsx');
            expect(result.importId).toBe('imp-1');
        });
    });

    describe('getImportHistory', () => {
        it('returns paginated import history', async () => {
            server.use(
                http.get('/api/admin/imports', () => {
                    return HttpResponse.json({ data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 });
                })
            );

            const result = await adminService.getImportHistory();
            expect(result.data).toEqual([]);
        });
    });

    describe('getUsers', () => {
        it('returns paginated users', async () => {
            server.use(
                http.get('/api/admin/users', () => {
                    return HttpResponse.json({ data: [{ id: 'u1', name: 'User', email: 'u@e.com', role: 'client', createdAt: '', updatedAt: '' }], total: 1, page: 1, pageSize: 10, totalPages: 1 });
                })
            );

            const result = await adminService.getUsers();
            expect(result.data).toHaveLength(1);
        });
    });

    describe('updateUserRole', () => {
        it('updates user role', async () => {
            server.use(
                http.patch('/api/admin/users/:id/role', () => {
                    return HttpResponse.json({ success: true, data: { id: 'u1', name: 'User', email: 'u@e.com', role: 'admin', createdAt: '', updatedAt: '' } });
                })
            );

            const result = await adminService.updateUserRole('u1', 'admin');
            expect(result.role).toBe('admin');
        });
    });

    describe('getSystemStats', () => {
        it('returns system stats', async () => {
            server.use(
                http.get('/api/admin/stats', () => {
                    return HttpResponse.json({ success: true, data: { totalCases: 100, totalUsers: 10, totalAttorneys: 20, totalFirms: 5, totalDeadlines: 30, casesByStatus: { active: 50 }, usersByRole: { client: 5 } } });
                })
            );

            const result = await adminService.getSystemStats();
            expect(result.totalCases).toBe(100);
        });
    });

    describe('getAuditLog', () => {
        it('returns paginated audit log', async () => {
            server.use(
                http.get('/api/admin/audit-log', () => {
                    return HttpResponse.json({ data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 });
                })
            );

            const result = await adminService.getAuditLog();
            expect(result.data).toEqual([]);
        });
    });

    describe('truncateData', () => {
        it('truncates data', async () => {
            server.use(
                http.post('/api/admin/truncate', () => {
                    return HttpResponse.json({ success: true, data: { message: 'Truncated', tablesCleared: ['cases'], truncatedAt: '' } });
                })
            );

            const result = await adminService.truncateData();
            expect(result.message).toBe('Truncated');
        });
    });
});
