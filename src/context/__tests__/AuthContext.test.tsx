import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
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

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
    });

    it('login sets user and isAuthenticated', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        await act(async () => {
            await result.current.login('test@example.com', 'password123', 'legal-official');
        });

        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user?.name).toBe('Test User');
        expect(result.current.user?.role).toBe('legal-official');
    });

    it('logout clears user', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        await act(async () => {
            await result.current.login('test@example.com', 'password123', 'legal-official');
        });

        expect(result.current.isAuthenticated).toBe(true);

        await act(async () => {
            await result.current.logout();
        });

        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
    });
});
