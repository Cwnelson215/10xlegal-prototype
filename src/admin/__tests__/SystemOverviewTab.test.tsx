import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { SystemOverviewTab } from '../SystemOverviewTab';
import { createElement } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';

describe('SystemOverviewTab', () => {
    it('renders loading then stats', async () => {
        server.use(
            http.get('/api/admin/stats', () => {
                return HttpResponse.json({
                    success: true,
                    data: {
                        totalCases: 500,
                        totalUsers: 50,
                        totalAttorneys: 100,
                        totalFirms: 20,
                        totalDeadlines: 75,
                        casesByStatus: { active: 200, closed: 300 },
                        usersByRole: { client: 30, lawyer: 20 },
                    },
                });
            })
        );

        render(createElement(SystemOverviewTab));
        await waitFor(() => {
            expect(screen.getByText('500')).toBeInTheDocument();
        });
        expect(screen.getByText('50')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
        expect(screen.getByText('Cases by Status')).toBeInTheDocument();
        expect(screen.getByText('Users by Role')).toBeInTheDocument();
    });

    it('renders truncate danger zone', async () => {
        server.use(
            http.get('/api/admin/stats', () => {
                return HttpResponse.json({
                    success: true,
                    data: {
                        totalCases: 10, totalUsers: 5, totalAttorneys: 3, totalFirms: 1, totalDeadlines: 2,
                        casesByStatus: {}, usersByRole: {},
                    },
                });
            })
        );

        render(createElement(SystemOverviewTab));
        await waitFor(() => {
            expect(screen.getByText('Danger Zone')).toBeInTheDocument();
        });
        expect(screen.getAllByText('Truncate All Data').length).toBeGreaterThanOrEqual(1);
    });

    it('shows confirmation when truncate clicked', async () => {
        server.use(
            http.get('/api/admin/stats', () => {
                return HttpResponse.json({
                    success: true,
                    data: {
                        totalCases: 10, totalUsers: 5, totalAttorneys: 3, totalFirms: 1, totalDeadlines: 2,
                        casesByStatus: {}, usersByRole: {},
                    },
                });
            })
        );

        render(createElement(SystemOverviewTab));
        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Truncate All Data' })).toBeInTheDocument();
        });
        fireEvent.click(screen.getByRole('button', { name: 'Truncate All Data' }));
        expect(screen.getByText(/Are you sure/)).toBeInTheDocument();
        expect(screen.getByText('Yes, Truncate Everything')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('renders error state on API failure', async () => {
        server.use(
            http.get('/api/admin/stats', () => {
                return HttpResponse.json({ message: 'Server error' }, { status: 500 });
            })
        );

        render(createElement(SystemOverviewTab));
        await waitFor(() => {
            expect(screen.queryByText('Total Cases')).not.toBeInTheDocument();
        });
    });
});
