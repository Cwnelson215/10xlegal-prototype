import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import { useCaseData } from '../useCaseData';
import { useAuth } from '../../context/AuthContext';
import { AuthProvider } from '../../context/AuthContext';
import type { ReactNode } from 'react';
import { createElement } from 'react';

function wrapper({ children }: { children: ReactNode }) {
    return createElement(AuthProvider, null, children);
}

describe('useCaseData', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('loads cases from API', async () => {
        const { result } = renderHook(() => useCaseData(), { wrapper });
        expect(result.current.isLoading).toBe(true);
        await waitFor(() => { expect(result.current.isLoading).toBe(false); });
        expect(result.current.allCases).toHaveLength(2);
        expect(result.current.cases).toHaveLength(2);
        expect(result.current.errorMessage).toBe('');
    });

    it('returns case data with expected fields', async () => {
        const { result } = renderHook(() => useCaseData(), { wrapper });
        await waitFor(() => { expect(result.current.isLoading).toBe(false); });
        const firstCase = result.current.allCases[0]!;
        expect(firstCase.caseNumber).toBe('21-CR-10001');
        expect(firstCase.court).toBe('Salt Lake');
    });

    it('sets error message on API failure', async () => {
        server.use(
            http.get('/api/cases', () => {
                return HttpResponse.error();
            })
        );
        const { result } = renderHook(() => useCaseData(), { wrapper });
        await waitFor(() => { expect(result.current.isLoading).toBe(false); });
        expect(result.current.errorMessage).toBeTruthy();
        expect(result.current.allCases).toHaveLength(0);
    });

    it('filters cases for client role (falls back to all when no match)', async () => {
        // Login as a client user
        server.use(
            http.post('/api/auth/login', () => {
                return HttpResponse.json({
                    success: true,
                    data: {
                        token: 'tok',
                        refreshToken: 'ref',
                        user: { id: 'no-match', name: 'Client User', email: 'c@e.com', role: 'client', createdAt: '', updatedAt: '' },
                    },
                });
            })
        );
        const { result } = renderHook(() => ({ ...useCaseData(), auth: useAuth() }), { wrapper });
        await waitFor(() => { expect(result.current.auth.isLoading).toBe(false); });
        await act(async () => {
            await result.current.auth.login('c@e.com', 'pass', 'client');
        });
        await waitFor(() => { expect(result.current.isLoading).toBe(false); });
        // clientId doesn't match any case, falls back to all
        expect(result.current.cases).toHaveLength(2);
    });

    it('filters cases for lawyer role (falls back to all when no match)', async () => {
        server.use(
            http.post('/api/auth/login', () => {
                return HttpResponse.json({
                    success: true,
                    data: {
                        token: 'tok',
                        refreshToken: 'ref',
                        user: { id: 'u-lawyer', name: 'Unknown Lawyer', email: 'l@e.com', role: 'lawyer', createdAt: '', updatedAt: '' },
                    },
                });
            })
        );
        const { result } = renderHook(() => ({ ...useCaseData(), auth: useAuth() }), { wrapper });
        await waitFor(() => { expect(result.current.auth.isLoading).toBe(false); });
        await act(async () => {
            await result.current.auth.login('l@e.com', 'pass', 'lawyer');
        });
        await waitFor(() => { expect(result.current.isLoading).toBe(false); });
        // Name doesn't match any case attorney, falls back to all
        expect(result.current.cases).toHaveLength(2);
    });

    it('returns all cases for legal-official role', async () => {
        // legal-official mock user is the default verify-token response
        localStorage.setItem('authToken', 'valid-token');
        const { result } = renderHook(() => useCaseData(), { wrapper });
        await waitFor(() => { expect(result.current.isLoading).toBe(false); });
        expect(result.current.cases).toHaveLength(2);
    });
});
