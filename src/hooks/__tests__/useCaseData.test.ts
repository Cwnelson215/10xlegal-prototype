import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCaseData } from '../useCaseData';
import { AuthProvider } from '../../context/AuthContext';
import type { ReactNode } from 'react';
import { createElement } from 'react';

function wrapper({ children }: { children: ReactNode }) {
    return createElement(AuthProvider, null, children);
}

describe('useCaseData', () => {
    it('loads cases from API', async () => {
        const { result } = renderHook(() => useCaseData(), { wrapper });

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.allCases).toHaveLength(2);
        expect(result.current.cases).toHaveLength(2);
        expect(result.current.errorMessage).toBe('');
    });

    it('returns case data with expected fields', async () => {
        const { result } = renderHook(() => useCaseData(), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        const firstCase = result.current.allCases[0]!;
        expect(firstCase.caseNumber).toBe('21-CR-10001');
        expect(firstCase.county).toBe('Salt Lake');
        expect(firstCase.judge).toBe('Hon. Test Judge');
        expect(firstCase.judgeId).toBe('judge-1');
    });
});
