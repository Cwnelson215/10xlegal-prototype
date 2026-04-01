import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import { CaseDetail } from '../CaseDetail';
import { createElement } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';

function renderWithRoute(caseId: string) {
    return render(
        createElement(AuthProvider, null,
            createElement(MemoryRouter, { initialEntries: [`/cases/${caseId}`] },
                createElement(Routes, null,
                    createElement(Route, { path: '/cases/:id', element: createElement(CaseDetail) })
                )
            )
        )
    );
}

describe('CaseDetail', () => {
    it('renders loading state then case data', async () => {
        renderWithRoute('case-1');
        expect(screen.getByText('Loading case...')).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByRole('heading', { level: 1, name: '21-CR-10001' })).toBeInTheDocument();
        });
        expect(screen.getAllByText('Test Charge').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Salt Lake')).toBeInTheDocument();
    });

    it('renders attorney links', async () => {
        renderWithRoute('case-1');
        await waitFor(() => {
            expect(screen.getByText('Test Prosecutor')).toBeInTheDocument();
        });
        expect(screen.getByText('Test Defender')).toBeInTheDocument();
    });

    it('renders error state on failure', async () => {
        server.use(
            http.get('/api/cases/:id', () => {
                return HttpResponse.json({ message: 'Not found' }, { status: 404 });
            })
        );
        renderWithRoute('nonexistent');
        await waitFor(() => {
            expect(screen.queryByText('Loading case...')).not.toBeInTheDocument();
        });
    });

    it('renders case with closed status details', async () => {
        renderWithRoute('case-2');
        await waitFor(() => {
            expect(screen.getByRole('heading', { level: 1, name: '21-CR-10002' })).toBeInTheDocument();
        });
        expect(screen.getAllByText('Guilty').length).toBeGreaterThanOrEqual(1);
    });
});
