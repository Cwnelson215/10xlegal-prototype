import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AttorneyAnalyticsTab } from '../AttorneyAnalyticsTab';
import { createElement } from 'react';
import type { CaseRecord } from '../../types';

const mockCases: CaseRecord[] = [
    {
        id: 'c1', title: '', description: '', status: 'active', caseNumber: '001', clientId: '', lawyerId: '',
        court: 'Salt Lake', prosecutionAttorney: 'Pros A', prosecutionFirm: 'Firm X', defenseAttorney: 'Def A', defenseFirm: 'Firm Y',
        charge: 'Theft', courtDate: '2026-01-15', districtNumber: '', filingDate: '',
        dispositionDate: '', convictionOutcome: 'Guilty', convictionDate: '', ruling: '',
        sentence: '', caseType: '', offenseCode: '', sentenceDate: '', judgmentDescription: '', sentenceDescription: '', charges: [],
        createdAt: '', updatedAt: '',
    },
    {
        id: 'c2', title: '', description: '', status: 'closed', caseNumber: '002', clientId: '', lawyerId: '',
        court: 'Utah', prosecutionAttorney: 'Pros B', prosecutionFirm: 'Firm X', defenseAttorney: 'Def A', defenseFirm: 'Firm Y',
        charge: 'DUI', courtDate: '2026-02-15', districtNumber: '', filingDate: '',
        dispositionDate: '', convictionOutcome: 'Not Guilty', convictionDate: '', ruling: '',
        sentence: '', caseType: '', offenseCode: '', sentenceDate: '', judgmentDescription: '', sentenceDescription: '', charges: [],
        createdAt: '', updatedAt: '',
    },
];

describe('AttorneyAnalyticsTab', () => {
    it('renders attorney KPI cards', () => {
        render(createElement(AttorneyAnalyticsTab, { cases: mockCases }));
        expect(screen.getByText('Total Attorneys')).toBeInTheDocument();
        expect(screen.getByText('Prosecution Win Rate')).toBeInTheDocument();
        expect(screen.getByText('Defense Win Rate')).toBeInTheDocument();
        expect(screen.getByText('Most Active Firm')).toBeInTheDocument();
    });

    it('renders chart headings', () => {
        render(createElement(AttorneyAnalyticsTab, { cases: mockCases }));
        expect(screen.getByText('Top Attorneys by Caseload')).toBeInTheDocument();
        expect(screen.getByText('Conviction Outcomes by Attorney')).toBeInTheDocument();
        expect(screen.getByText('Cases by Law Firm')).toBeInTheDocument();
        expect(screen.getByText('Prosecution vs Defense Volume')).toBeInTheDocument();
    });

    it('handles empty cases', () => {
        render(createElement(AttorneyAnalyticsTab, { cases: [] }));
        expect(screen.getByText('Total Attorneys')).toBeInTheDocument();
        const zeros = screen.getAllByText('0');
        expect(zeros.length).toBeGreaterThanOrEqual(1);
    });
});
