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
        expect(firstCase.court).toBe('Salt Lake');
        expect(firstCase.charge).toBe('Test Charge');
        expect(firstCase.courtDate).toBe('2026-06-15');
        expect(firstCase.districtNumber).toBe('3');
        expect(firstCase.filingDate).toBe('2026-01-10');
        expect(firstCase.prosecutionAttorney).toBe('Test Prosecutor');
        expect(firstCase.defenseAttorney).toBe('Test Defender');
        expect(firstCase.prosecutionFirm).toBe('Test Prosecution Firm');
        expect(firstCase.defenseFirm).toBe('Test Defense Firm');
        expect(firstCase.ruling).toBe('Pending');
        expect(firstCase.convictionOutcome).toBe('N/A');
        expect(firstCase.convictionDate).toBe('N/A');

        const secondCase = result.current.allCases[1]!;
        expect(secondCase.caseNumber).toBe('21-CR-10002');
        expect(secondCase.court).toBe('Utah');
        expect(secondCase.status).toBe('closed');
        expect(secondCase.ruling).toBe('Guilty');
        expect(secondCase.convictionOutcome).toBe('Guilty');
        expect(secondCase.convictionDate).toBe('2026-05-12');
        expect(secondCase.sentence).toBe('30 days');
    });
});
