import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/mocks/server';
import { deadlinesService } from '../deadlinesService';
import apiClient from '../../client';

describe('deadlinesService', () => {
    beforeEach(() => {
        localStorage.clear();
        apiClient.clearToken();
    });

    describe('getDeadlines', () => {
        it('returns paginated deadlines', async () => {
            const result = await deadlinesService.getDeadlines(undefined, 1, 10);
            expect(result.data).toHaveLength(1);
            expect(result.data[0]!.title).toBe('Filing Deadline');
        });

        it('accepts caseId filter', async () => {
            let capturedUrl = '';
            server.use(
                http.get('/api/deadlines', ({ request }) => {
                    capturedUrl = request.url;
                    return HttpResponse.json({ data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 });
                })
            );

            await deadlinesService.getDeadlines('case-1', 1, 10);
            expect(capturedUrl).toContain('caseId=case-1');
        });
    });

    describe('getDeadline', () => {
        it('returns a single deadline', async () => {
            server.use(
                http.get('/api/deadlines/:id', () => {
                    return HttpResponse.json({ success: true, data: { id: 'dl-1', title: 'Test Deadline', description: '', dueDate: '2026-07-01', caseId: 'case-1', caseNumber: '21-CR-10001', assignedTo: '', status: 'pending', clientId: '', createdAt: '', updatedAt: '' } });
                })
            );

            const result = await deadlinesService.getDeadline('dl-1');
            expect(result.title).toBe('Test Deadline');
        });
    });

    describe('createDeadline', () => {
        it('creates a deadline', async () => {
            server.use(
                http.post('/api/deadlines', () => {
                    return HttpResponse.json({ success: true, data: { id: 'dl-new', title: 'New DL', description: '', dueDate: '2026-08-01', caseId: 'case-1', caseNumber: '', assignedTo: '', status: 'pending', clientId: '', createdAt: '', updatedAt: '' } });
                })
            );

            const result = await deadlinesService.createDeadline({ title: 'New DL', description: '', dueDate: '2026-08-01', caseId: 'case-1', assignedTo: '' });
            expect(result.id).toBe('dl-new');
        });
    });

    describe('updateDeadline', () => {
        it('updates a deadline', async () => {
            server.use(
                http.put('/api/deadlines/:id', () => {
                    return HttpResponse.json({ success: true, data: { id: 'dl-1', title: 'Updated', description: '', dueDate: '2026-08-01', caseId: 'case-1', caseNumber: '', assignedTo: '', status: 'completed', clientId: '', createdAt: '', updatedAt: '' } });
                })
            );

            const result = await deadlinesService.updateDeadline('dl-1', { status: 'completed' });
            expect(result.title).toBe('Updated');
        });
    });

    describe('deleteDeadline', () => {
        it('deletes a deadline', async () => {
            server.use(
                http.delete('/api/deadlines/:id', () => {
                    return HttpResponse.json({ success: true, data: null });
                })
            );

            await expect(deadlinesService.deleteDeadline('dl-1')).resolves.toBeUndefined();
        });
    });
});
