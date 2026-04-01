import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OverviewTab } from '../OverviewTab';
import { createElement } from 'react';
import type { CaseRecord } from '../../types';

const mockCases: CaseRecord[] = [
    {
        id: 'c1', title: '', description: '', status: 'active', caseNumber: '001', clientId: '', lawyerId: '',
        court: 'Salt Lake', prosecutionAttorney: '', prosecutionFirm: '', defenseAttorney: '', defenseFirm: '',
        charge: 'Theft', courtDate: '2026-01-15', districtNumber: '', filingDate: '2025-06-01',
        dispositionDate: '2026-01-10', convictionOutcome: 'Guilty', convictionDate: '', ruling: 'Guilty',
        sentence: '', caseType: '', offenseCode: '', sentenceDate: '', judgmentDescription: '', sentenceDescription: '', charges: [],
        createdAt: '', updatedAt: '',
    },
];

describe('OverviewTab', () => {
    it('renders summary stats and chart headings', () => {
        render(createElement(OverviewTab, { cases: mockCases }));
        expect(screen.getByText('Total Cases')).toBeInTheDocument();
        expect(screen.getByText('Conviction Distribution')).toBeInTheDocument();
        expect(screen.getByText('Cases by Court')).toBeInTheDocument();
        expect(screen.getByText('Cases Over Time')).toBeInTheDocument();
        expect(screen.getByText('Charge Distribution')).toBeInTheDocument();
        expect(screen.getByText('Case Status')).toBeInTheDocument();
        expect(screen.getByText('Ruling Distribution')).toBeInTheDocument();
    });
});
