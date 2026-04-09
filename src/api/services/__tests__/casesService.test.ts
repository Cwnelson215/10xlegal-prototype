import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/mocks/server';
import { casesService } from '../casesService';
import apiClient from '../../client';

describe('casesService', () => {
    beforeEach(() => {
        localStorage.clear();
        apiClient.clearToken();
    });

    describe('getCases', () => {
        it('returns paginated cases', async () => {
            const result = await casesService.getCases(1, 10);
            expect(result.data).toHaveLength(2);
            expect(result.data[0]!.caseNumber).toBe('21-CR-10001');
        });
    });

    describe('getCase', () => {
        it('returns a single case by id', async () => {
            const result = await casesService.getCase('case-1');
            expect(result.caseNumber).toBe('21-CR-10001');
        });

        it('throws on not found', async () => {
            await expect(casesService.getCase('nonexistent')).rejects.toBeDefined();
        });
    });

    describe('createCase', () => {
        it('creates a case', async () => {
            server.use(
                http.post('/api/cases', () => {
                    return HttpResponse.json({
                        success: true,
                        data: { id: 'new-case', title: 'New Case', caseNumber: 'NEW-001', description: '', status: 'pending', clientId: 'c1', lawyerId: '', court: '', prosecutionAttorneys: [], defenseAttorneys: [], prosecutionFirm: '', defenseFirm: '', charge: '', courtDate: '', districtNumber: '', filingDate: '', dispositionDate: '', convictionOutcome: '', convictionDate: '', ruling: '', sentence: '', caseType: '', offenseCode: '', sentenceDate: '', judgmentDescription: '', sentenceDescription: '', charges: [], createdAt: '', updatedAt: '' },
                    });
                })
            );

            const result = await casesService.createCase({ title: 'New Case', description: '', caseNumber: 'NEW-001', clientId: 'c1' });
            expect(result.id).toBe('new-case');
        });
    });

    describe('updateCase', () => {
        it('updates a case', async () => {
            server.use(
                http.put('/api/cases/:id', () => {
                    return HttpResponse.json({
                        success: true,
                        data: { id: 'case-1', title: 'Updated', caseNumber: '21-CR-10001', description: '', status: 'active', clientId: '', lawyerId: '', court: '', prosecutionAttorneys: [], defenseAttorneys: [], prosecutionFirm: '', defenseFirm: '', charge: '', courtDate: '', districtNumber: '', filingDate: '', dispositionDate: '', convictionOutcome: '', convictionDate: '', ruling: '', sentence: '', caseType: '', offenseCode: '', sentenceDate: '', judgmentDescription: '', sentenceDescription: '', charges: [], createdAt: '', updatedAt: '' },
                    });
                })
            );

            const result = await casesService.updateCase('case-1', { title: 'Updated' });
            expect(result.title).toBe('Updated');
        });
    });

    describe('deleteCase', () => {
        it('deletes a case without error', async () => {
            server.use(
                http.delete('/api/cases/:id', () => {
                    return HttpResponse.json({ success: true, data: null });
                })
            );

            await expect(casesService.deleteCase('case-1')).resolves.toBeUndefined();
        });
    });
});
