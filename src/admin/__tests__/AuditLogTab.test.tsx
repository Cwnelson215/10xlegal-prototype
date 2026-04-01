import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuditLogTab } from '../AuditLogTab';
import { createElement } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';

describe('AuditLogTab', () => {
    it('renders loading then audit log', async () => {
        server.use(
            http.get('/api/admin/audit-log', () => {
                return HttpResponse.json({
                    data: [
                        { id: 'log-1', action: 'LOGIN', userId: 'u1', userName: 'Alice', details: 'User logged in', createdAt: '2026-01-01T00:00:00Z' },
                    ],
                    total: 1, page: 1, pageSize: 10, totalPages: 1,
                });
            })
        );

        render(createElement(AuditLogTab));
        await waitFor(() => {
            expect(screen.getByText('Audit Log')).toBeInTheDocument();
        });
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('LOGIN')).toBeInTheDocument();
        expect(screen.getByText('User logged in')).toBeInTheDocument();
    });

    it('shows no activity message when empty', async () => {
        server.use(
            http.get('/api/admin/audit-log', () => {
                return HttpResponse.json({ data: [], total: 0, page: 1, pageSize: 10, totalPages: 1 });
            })
        );

        render(createElement(AuditLogTab));
        await waitFor(() => {
            expect(screen.getByText('No activity recorded')).toBeInTheDocument();
        });
    });
});
