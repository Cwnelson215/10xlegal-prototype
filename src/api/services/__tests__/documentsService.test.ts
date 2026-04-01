import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/mocks/server';
import { documentsService } from '../documentsService';
import apiClient from '../../client';

describe('documentsService', () => {
    beforeEach(() => {
        localStorage.clear();
        apiClient.clearToken();
    });

    describe('getDocuments', () => {
        it('returns paginated documents', async () => {
            server.use(
                http.get('/api/documents', () => {
                    return HttpResponse.json({ data: [{ id: 'doc-1', fileName: 'test.pdf', fileSize: 1024, fileType: 'pdf', url: '', caseId: 'case-1', uploadedBy: '', uploadedAt: '', version: 1 }], total: 1, page: 1, pageSize: 10, totalPages: 1 });
                })
            );

            const result = await documentsService.getDocuments(undefined, 1, 10);
            expect(result.data).toHaveLength(1);
            expect(result.data[0]!.fileName).toBe('test.pdf');
        });

        it('passes caseId filter', async () => {
            let capturedUrl = '';
            server.use(
                http.get('/api/documents', ({ request }) => {
                    capturedUrl = request.url;
                    return HttpResponse.json({ data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 });
                })
            );

            await documentsService.getDocuments('case-1', 1, 10);
            expect(capturedUrl).toContain('caseId=case-1');
        });
    });

    describe('getDocument', () => {
        it('returns a single document', async () => {
            server.use(
                http.get('/api/documents/:id', () => {
                    return HttpResponse.json({ success: true, data: { id: 'doc-1', fileName: 'test.pdf', fileSize: 1024, fileType: 'pdf', url: '', caseId: 'case-1', uploadedBy: '', uploadedAt: '', version: 1 } });
                })
            );

            const result = await documentsService.getDocument('doc-1');
            expect(result.fileName).toBe('test.pdf');
        });
    });

    describe('uploadDocument', () => {
        it('uploads a document with FormData', async () => {
            server.use(
                http.post('/api/documents/upload', () => {
                    return HttpResponse.json({ success: true, data: { id: 'doc-new', fileName: 'upload.pdf', fileSize: 2048, fileType: 'pdf', url: '', caseId: 'case-1', uploadedBy: '', uploadedAt: '', version: 1 } });
                })
            );

            const file = new File(['content'], 'upload.pdf', { type: 'application/pdf' });
            const result = await documentsService.uploadDocument(file, 'case-1');
            expect(result.id).toBe('doc-new');
        });
    });

    describe('deleteDocument', () => {
        it('deletes a document', async () => {
            server.use(
                http.delete('/api/documents/:id', () => {
                    return HttpResponse.json({ success: true, data: null });
                })
            );

            await expect(documentsService.deleteDocument('doc-1')).resolves.toBeUndefined();
        });
    });

    describe('downloadDocument', () => {
        it('returns the download URL path', () => {
            const url = documentsService.downloadDocument('doc-1');
            expect(url).toBe('/documents/doc-1/download');
        });
    });
});
