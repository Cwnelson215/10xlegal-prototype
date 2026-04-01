import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ImportHistoryTab } from '../ImportHistoryTab';
import { createElement } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';

describe('ImportHistoryTab', () => {
    it('renders loading then history table', async () => {
        server.use(
            http.get('/api/admin/imports', () => {
                return HttpResponse.json({
                    data: [
                        { id: 'imp-1', dataType: 'cases', format: 'xlsx', fileName: 'cases.xlsx', totalRows: 100, importedRows: 95, failedRows: 5, status: 'partial', errors: [], importedBy: 'admin', createdAt: '2026-01-01T00:00:00Z' },
                    ],
                    total: 1, page: 1, pageSize: 10, totalPages: 1,
                });
            })
        );

        render(createElement(ImportHistoryTab));
        await waitFor(() => {
            expect(screen.getByText('Import History')).toBeInTheDocument();
        });
        expect(screen.getByText('cases.xlsx')).toBeInTheDocument();
        expect(screen.getByText('95/100')).toBeInTheDocument();
    });

    it('shows no imports message when empty', async () => {
        server.use(
            http.get('/api/admin/imports', () => {
                return HttpResponse.json({ data: [], total: 0, page: 1, pageSize: 10, totalPages: 1 });
            })
        );

        render(createElement(ImportHistoryTab));
        await waitFor(() => {
            expect(screen.getByText('No imports yet')).toBeInTheDocument();
        });
    });
});
