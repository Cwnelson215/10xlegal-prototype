import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import { AttorneysList } from '../AttorneysList';
import { createElement } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';

const mockAttorneys = [
    { id: 'att-1', name: 'Alice Smith', type: 'prosecution', firmId: null, firmName: null, caseCount: 10, createdAt: '', updatedAt: '' },
    { id: 'att-2', name: 'Bob Jones', type: 'defense', firmId: null, firmName: null, caseCount: 5, createdAt: '', updatedAt: '' },
    { id: 'att-3', name: 'Charlie Brown', type: 'prosecution', firmId: null, firmName: null, caseCount: 3, createdAt: '', updatedAt: '' },
];

function renderAttorneysList() {
    server.use(
        http.get('/api/attorneys', () => {
            return HttpResponse.json({ data: mockAttorneys, total: 3, page: 1, pageSize: 1000, totalPages: 1 });
        })
    );
    return render(
        createElement(AuthProvider, null,
            createElement(MemoryRouter, null,
                createElement(AttorneysList)
            )
        )
    );
}

describe('AttorneysList', () => {
    it('renders loading then attorneys list', async () => {
        renderAttorneysList();
        expect(screen.getByText('Loading attorneys...')).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        });
        expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    });

    it('renders search and filter inputs', async () => {
        renderAttorneysList();
        await waitFor(() => {
            expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        });
        expect(screen.getByPlaceholderText('Search by name')).toBeInTheDocument();
        expect(screen.getByLabelText('Type')).toBeInTheDocument();
    });

    it('filters by name search', async () => {
        renderAttorneysList();
        await waitFor(() => {
            expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        });
        fireEvent.change(screen.getByPlaceholderText('Search by name'), { target: { value: 'Bob' } });
        expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
        expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    });

    it('filters by type', async () => {
        renderAttorneysList();
        await waitFor(() => {
            expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        });
        fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'defense' } });
        expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
        expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    });

    it('shows no match message when filter yields nothing', async () => {
        renderAttorneysList();
        await waitFor(() => {
            expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        });
        fireEvent.change(screen.getByPlaceholderText('Search by name'), { target: { value: 'zzzzz' } });
        expect(screen.getByText('No attorneys match the search criteria.')).toBeInTheDocument();
    });

    it('renders error state', async () => {
        server.use(
            http.get('/api/attorneys', () => {
                return HttpResponse.error();
            })
        );
        render(
            createElement(AuthProvider, null,
                createElement(MemoryRouter, null,
                    createElement(AttorneysList)
                )
            )
        );
        await waitFor(() => {
            expect(screen.queryByText('Loading attorneys...')).not.toBeInTheDocument();
        });
    });
});
