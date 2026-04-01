import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import { useDeadlineData } from '../useDeadlineData';
import { useAuth } from '../../context/AuthContext';
import { AuthProvider } from '../../context/AuthContext';
import type { ReactNode } from 'react';
import { createElement } from 'react';

function wrapper({ children }: { children: ReactNode }) {
    return createElement(AuthProvider, null, children);
}

describe('useDeadlineData', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('loads deadlines from API', async () => {
        const { result } = renderHook(() => useDeadlineData(), { wrapper });
        expect(result.current.isLoading).toBe(true);
        await waitFor(() => { expect(result.current.isLoading).toBe(false); });
        expect(result.current.allDeadlines).toHaveLength(1);
        expect(result.current.deadlines).toHaveLength(1);
        expect(result.current.errorMessage).toBe('');
    });

    it('returns deadline data with expected fields', async () => {
        const { result } = renderHook(() => useDeadlineData(), { wrapper });
        await waitFor(() => { expect(result.current.isLoading).toBe(false); });
        const firstDeadline = result.current.allDeadlines[0]!;
        expect(firstDeadline.title).toBe('Filing Deadline');
        expect(firstDeadline.dueDate).toBe('2026-07-01');
    });

    it('sets error message on API failure', async () => {
        server.use(
            http.get('/api/deadlines', () => {
                return HttpResponse.error();
            })
        );
        const { result } = renderHook(() => useDeadlineData(), { wrapper });
        await waitFor(() => { expect(result.current.isLoading).toBe(false); });
        expect(result.current.errorMessage).toBeTruthy();
        expect(result.current.allDeadlines).toHaveLength(0);
    });

    it('filters deadlines for client role (falls back to all)', async () => {
        server.use(
            http.post('/api/auth/login', () => {
                return HttpResponse.json({
                    success: true,
                    data: {
                        token: 'tok',
                        refreshToken: 'ref',
                        user: { id: 'no-match', name: 'Client', email: 'c@e.com', role: 'client', createdAt: '', updatedAt: '' },
                    },
                });
            })
        );
        const { result } = renderHook(() => ({ ...useDeadlineData(), auth: useAuth() }), { wrapper });
        await waitFor(() => { expect(result.current.auth.isLoading).toBe(false); });
        await act(async () => {
            await result.current.auth.login('c@e.com', 'pass', 'client');
        });
        await waitFor(() => { expect(result.current.isLoading).toBe(false); });
        // clientId doesn't match, falls back to all
        expect(result.current.deadlines).toHaveLength(1);
    });

    it('filters deadlines for lawyer role (falls back to all)', async () => {
        server.use(
            http.post('/api/auth/login', () => {
                return HttpResponse.json({
                    success: true,
                    data: {
                        token: 'tok',
                        refreshToken: 'ref',
                        user: { id: 'u-l', name: 'Unknown Lawyer', email: 'l@e.com', role: 'lawyer', createdAt: '', updatedAt: '' },
                    },
                });
            })
        );
        const { result } = renderHook(() => ({ ...useDeadlineData(), auth: useAuth() }), { wrapper });
        await waitFor(() => { expect(result.current.auth.isLoading).toBe(false); });
        await act(async () => {
            await result.current.auth.login('l@e.com', 'pass', 'lawyer');
        });
        await waitFor(() => { expect(result.current.isLoading).toBe(false); });
        expect(result.current.deadlines).toHaveLength(1);
    });

    it('returns all deadlines for legal-official role', async () => {
        localStorage.setItem('authToken', 'valid-token');
        const { result } = renderHook(() => useDeadlineData(), { wrapper });
        await waitFor(() => { expect(result.current.isLoading).toBe(false); });
        expect(result.current.deadlines).toHaveLength(1);
    });
});
