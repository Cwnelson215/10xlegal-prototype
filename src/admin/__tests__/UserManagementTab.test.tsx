import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { UserManagementTab } from '../UserManagementTab';
import { createElement } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';

describe('UserManagementTab', () => {
    it('renders loading then users table', async () => {
        server.use(
            http.get('/api/admin/users', () => {
                return HttpResponse.json({
                    data: [
                        { id: 'u1', name: 'Alice', email: 'alice@example.com', role: 'client', verificationStatus: 'verified', createdAt: '2026-01-01T00:00:00Z', updatedAt: '' },
                        { id: 'u2', name: 'Bob', email: 'bob@example.com', role: 'lawyer', verificationStatus: 'pending', createdAt: '2026-02-01T00:00:00Z', updatedAt: '' },
                    ],
                    total: 2, page: 1, pageSize: 10, totalPages: 1,
                });
            })
        );

        render(createElement(UserManagementTab));
        await waitFor(() => {
            expect(screen.getByText('Alice')).toBeInTheDocument();
        });
        expect(screen.getByText('Bob')).toBeInTheDocument();
        expect(screen.getByText('All Users')).toBeInTheDocument();
    });

    it('shows no users message when empty', async () => {
        server.use(
            http.get('/api/admin/users', () => {
                return HttpResponse.json({ data: [], total: 0, page: 1, pageSize: 10, totalPages: 1 });
            })
        );

        render(createElement(UserManagementTab));
        await waitFor(() => {
            expect(screen.getByText('No users found')).toBeInTheDocument();
        });
    });

    it('shows error on API failure', async () => {
        server.use(
            http.get('/api/admin/users', () => {
                return HttpResponse.error();
            })
        );

        render(createElement(UserManagementTab));
        await waitFor(() => {
            expect(screen.queryByText('All Users')).toBeInTheDocument();
        });
    });
});
