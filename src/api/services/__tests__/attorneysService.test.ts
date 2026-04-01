import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/mocks/server';
import { attorneysService } from '../attorneysService';
import apiClient from '../../client';

describe('attorneysService', () => {
    beforeEach(() => {
        localStorage.clear();
        apiClient.clearToken();
    });

    describe('getAttorneys', () => {
        it('returns paginated attorneys', async () => {
            const result = await attorneysService.getAttorneys();
            expect(result.data).toBeDefined();
            expect(result.page).toBe(1);
        });

        it('passes type filter', async () => {
            let capturedUrl = '';
            server.use(
                http.get('/api/attorneys', ({ request }) => {
                    capturedUrl = request.url;
                    return HttpResponse.json({ data: [], total: 0, page: 1, pageSize: 100, totalPages: 0 });
                })
            );

            await attorneysService.getAttorneys('prosecution');
            expect(capturedUrl).toContain('type=prosecution');
        });
    });

    describe('getAttorney', () => {
        it('returns a single attorney', async () => {
            server.use(
                http.get('/api/attorneys/:id', () => {
                    return HttpResponse.json({ success: true, data: { id: 'att-1', name: 'John Doe', type: 'prosecution', firmId: null, firmName: null, caseCount: 5, createdAt: '', updatedAt: '' } });
                })
            );

            const result = await attorneysService.getAttorney('att-1');
            expect(result.name).toBe('John Doe');
        });
    });
});
