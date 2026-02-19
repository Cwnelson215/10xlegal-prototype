import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDeadlineData } from '../useDeadlineData';
import { AuthProvider } from '../../context/AuthContext';
import type { ReactNode } from 'react';
import { createElement } from 'react';

function wrapper({ children }: { children: ReactNode }) {
    return createElement(AuthProvider, null, children);
}

describe('useDeadlineData', () => {
    it('loads deadlines from API', async () => {
        const { result } = renderHook(() => useDeadlineData(), { wrapper });

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.allDeadlines).toHaveLength(1);
        expect(result.current.deadlines).toHaveLength(1);
        expect(result.current.errorMessage).toBe('');
    });

    it('returns deadline data with expected fields', async () => {
        const { result } = renderHook(() => useDeadlineData(), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        const first = result.current.allDeadlines[0]!;
        expect(first.title).toBe('Filing Deadline');
        expect(first.caseNumber).toBe('21-CR-10001');
        expect(first.status).toBe('pending');
    });
});
