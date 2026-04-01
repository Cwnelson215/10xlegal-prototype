import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SummaryStats } from '../SummaryStats';
import { createElement } from 'react';
import type { CaseRecord } from '../../types';

const mockCases: CaseRecord[] = [
    {
        id: 'c1', title: '', description: '', status: 'active', caseNumber: '001', clientId: '', lawyerId: '',
        court: 'Salt Lake', prosecutionAttorney: 'Pros A', prosecutionFirm: '', defenseAttorney: 'Def A', defenseFirm: '',
        charge: 'Theft', courtDate: '2026-01-15', districtNumber: '', filingDate: '2025-06-01',
        dispositionDate: '2026-01-10', convictionOutcome: 'Guilty', convictionDate: '', ruling: '',
        sentence: '', caseType: '', offenseCode: '', sentenceDate: '', judgmentDescription: '', sentenceDescription: '', charges: [],
        createdAt: '', updatedAt: '',
    },
    {
        id: 'c2', title: '', description: '', status: 'closed', caseNumber: '002', clientId: '', lawyerId: '',
        court: 'Salt Lake', prosecutionAttorney: 'Pros B', prosecutionFirm: '', defenseAttorney: 'Def B', defenseFirm: '',
        charge: 'DUI', courtDate: '2026-02-15', districtNumber: '', filingDate: '2025-09-01',
        dispositionDate: '2026-02-10', convictionOutcome: 'Not Guilty', convictionDate: '', ruling: '',
        sentence: '', caseType: '', offenseCode: '', sentenceDate: '', judgmentDescription: '', sentenceDescription: '', charges: [],
        createdAt: '', updatedAt: '',
    },
    {
        id: 'c3', title: '', description: '', status: 'active', caseNumber: '003', clientId: '', lawyerId: '',
        court: 'Utah', prosecutionAttorney: 'Pros A', prosecutionFirm: '', defenseAttorney: 'Def A', defenseFirm: '',
        charge: 'Theft', courtDate: '2026-01-20', districtNumber: '', filingDate: '2025-08-01',
        dispositionDate: 'N/A', convictionOutcome: 'Guilty', convictionDate: '', ruling: '',
        sentence: '', caseType: '', offenseCode: '', sentenceDate: '', judgmentDescription: '', sentenceDescription: '', charges: [],
        createdAt: '', updatedAt: '',
    },
];

describe('SummaryStats', () => {
    it('renders total cases', () => {
        render(createElement(SummaryStats, { cases: mockCases }));
        expect(screen.getByText('Total Cases')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('renders active cases count', () => {
        render(createElement(SummaryStats, { cases: mockCases }));
        expect(screen.getByText('Active Cases')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('renders most common conviction', () => {
        render(createElement(SummaryStats, { cases: mockCases }));
        expect(screen.getByText('Most Common Conviction')).toBeInTheDocument();
        expect(screen.getByText('Guilty')).toBeInTheDocument();
    });

    it('renders most active court', () => {
        render(createElement(SummaryStats, { cases: mockCases }));
        expect(screen.getByText('Most Active Court')).toBeInTheDocument();
        expect(screen.getByText('Salt Lake')).toBeInTheDocument();
    });

    it('renders avg duration when available', () => {
        render(createElement(SummaryStats, { cases: mockCases }));
        expect(screen.getByText('Avg Case Duration')).toBeInTheDocument();
    });

    it('renders avg cases per month', () => {
        render(createElement(SummaryStats, { cases: mockCases }));
        expect(screen.getByText('Avg Cases / Month')).toBeInTheDocument();
    });

    it('handles empty cases', () => {
        render(createElement(SummaryStats, { cases: [] }));
        const zeros = screen.getAllByText('0');
        expect(zeros.length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Total Cases')).toBeInTheDocument();
    });
});
