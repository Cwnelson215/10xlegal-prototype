import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import { AuthProvider, useAuth } from '../AuthContext';
import type { ReactNode } from 'react';
import { createElement } from 'react';

function wrapper({ children }: { children: ReactNode }) {
    return createElement(AuthProvider, null, children);
}

describe('AuthContext', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('starts unauthenticated when no token stored', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => { expect(result.current.isLoading).toBe(false); });
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
    });

    it('login sets user and isAuthenticated', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => { expect(result.current.isLoading).toBe(false); });
        await act(async () => {
            await result.current.login('test@example.com', 'password123', 'legal-official');
        });
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user?.id).toBe('user-1');
    });

    it('logout clears user', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => { expect(result.current.isLoading).toBe(false); });
        await act(async () => {
            await result.current.login('test@example.com', 'password123', 'legal-official');
        });
        expect(result.current.isAuthenticated).toBe(true);
        await act(async () => { await result.current.logout(); });
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
    });

    it('login sets error on failure', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => { expect(result.current.isLoading).toBe(false); });
        await act(async () => {
            try {
                await result.current.login('wrong@example.com', 'wrong', 'client');
            } catch {
                // expected
            }
        });
        expect(result.current.error).toBeTruthy();
        expect(result.current.isAuthenticated).toBe(false);
    });

    it('clearError clears the error state', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => { expect(result.current.isLoading).toBe(false); });
        await act(async () => {
            try {
                await result.current.login('wrong@example.com', 'wrong', 'client');
            } catch { /* expected */ }
        });
        expect(result.current.error).toBeTruthy();
        act(() => { result.current.clearError(); });
        expect(result.current.error).toBeNull();
    });

    it('restores session from stored token on mount', async () => {
        localStorage.setItem('authToken', 'valid-token');
        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => { expect(result.current.isLoading).toBe(false); });
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user?.email).toBe('test@example.com');
    });

    it('clears stale token if verify fails', async () => {
        localStorage.setItem('authToken', 'stale-token');
        server.use(
            http.get('/api/auth/verify-token', () => {
                return HttpResponse.json({ message: 'Invalid' }, { status: 401 });
            })
        );
        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => { expect(result.current.isLoading).toBe(false); });
        expect(result.current.isAuthenticated).toBe(false);
    });

    it('register sets user and isAuthenticated', async () => {
        server.use(
            http.post('/api/auth/register', () => {
                return HttpResponse.json({
                    success: true,
                    data: {
                        token: 'new-token',
                        refreshToken: 'new-refresh',
                        user: { id: 'u2', name: 'New User', email: 'new@example.com', role: 'client', createdAt: '', updatedAt: '' },
                    },
                });
            })
        );
        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => { expect(result.current.isLoading).toBe(false); });
        await act(async () => {
            await result.current.register({ name: 'New User', email: 'new@example.com', password: 'pass', role: 'client' });
        });
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user?.name).toBe('New User');
    });

    it('register sets error on failure', async () => {
        server.use(
            http.post('/api/auth/register', () => {
                return HttpResponse.json({ message: 'Email taken', errors: { email: ['already exists'] } }, { status: 400 });
            })
        );
        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => { expect(result.current.isLoading).toBe(false); });
        await act(async () => {
            try {
                await result.current.register({ name: 'User', email: 'taken@example.com', password: 'pass', role: 'client' });
            } catch { /* expected */ }
        });
        expect(result.current.error).toBeTruthy();
    });

    it('useAuth throws outside provider', () => {
        expect(() => {
            renderHook(() => useAuth());
        }).toThrow('useAuth must be used within an AuthProvider');
    });

    it('logout clears user even if server fails', async () => {
        server.use(
            http.post('/api/auth/logout', () => {
                return HttpResponse.error();
            })
        );
        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => { expect(result.current.isLoading).toBe(false); });
        await act(async () => {
            await result.current.login('test@example.com', 'password123', 'legal-official');
        });
        await act(async () => { await result.current.logout(); });
        expect(result.current.isAuthenticated).toBe(false);
    });

    it('handles API error with errors record', async () => {
        server.use(
            http.post('/api/auth/login', () => {
                return HttpResponse.json({ message: 'Validation failed', errors: { email: ['Invalid format'] } }, { status: 400 });
            })
        );
        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => { expect(result.current.isLoading).toBe(false); });
        await act(async () => {
            try {
                await result.current.login('bad', 'bad', 'client');
            } catch { /* expected */ }
        });
        expect(result.current.error).toContain('Invalid format');
    });
});
