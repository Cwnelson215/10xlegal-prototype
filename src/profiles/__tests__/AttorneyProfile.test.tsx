import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import { AttorneyProfile } from '../AttorneyProfile';
import { createElement } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';

function renderWithRoute(id: string) {
    return render(
        createElement(AuthProvider, null,
            createElement(MemoryRouter, { initialEntries: [`/attorneys/${id}`] },
                createElement(Routes, null,
                    createElement(Route, { path: '/attorneys/:id', element: createElement(AttorneyProfile) })
                )
            )
        )
    );
}

describe('AttorneyProfile', () => {
    it('renders loading state then attorney data', async () => {
        server.use(
            http.get('/api/attorneys/:id', () => {
                return HttpResponse.json({ success: true, data: { id: 'att-1', name: 'John Doe', type: 'prosecution', firmId: null, firmName: null, caseCount: 2, createdAt: '', updatedAt: '' } });
            })
        );
        renderWithRoute('att-1');
        expect(screen.getByText('Loading...')).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });
        expect(screen.getByText(/Prosecution Attorney/)).toBeInTheDocument();
    });

    it('renders error state on failure', async () => {
        server.use(
            http.get('/api/attorneys/:id', () => {
                return HttpResponse.json({ message: 'Not found' }, { status: 404 });
            })
        );
        renderWithRoute('nonexistent');
        await waitFor(() => {
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });
    });

    it('renders cases table when attorney has cases', async () => {
        server.use(
            http.get('/api/attorneys/:id', () => {
                return HttpResponse.json({ success: true, data: { id: 'att-1', name: 'Test Prosecutor', type: 'prosecution', firmId: null, firmName: null, caseCount: 1, createdAt: '', updatedAt: '' } });
            })
        );
        renderWithRoute('att-1');
        await waitFor(() => {
            expect(screen.getByText('Test Prosecutor')).toBeInTheDocument();
        });
        // case-1 has prosecutionAttorneyId: 'att-1'
        await waitFor(() => {
            expect(screen.getByText('21-CR-10001')).toBeInTheDocument();
        });
    });
});
