import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AttorneyAnalyticsSection } from '../AttorneyAnalyticsSection';
import { createElement } from 'react';
import type { Attorney, Case } from '../../api/types';

vi.mock('recharts', () => {
    const MockResponsiveContainer = ({ children }: any) => createElement('div', { 'data-testid': 'chart-container' }, children);
    const MockComponent = ({ children }: any) => createElement('div', null, children);
    return {
        ResponsiveContainer: MockResponsiveContainer,
        PieChart: MockComponent,
        Pie: MockComponent,
        Cell: MockComponent,
        Tooltip: MockComponent,
        Legend: MockComponent,
        AreaChart: MockComponent,
        Area: MockComponent,
        XAxis: MockComponent,
        YAxis: MockComponent,
    };
});

const mockAttorney: Attorney = {
    id: 'att-1', name: 'Test Attorney', type: 'defense', firmId: null, firmName: null, caseCount: 3, createdAt: '', updatedAt: '',
};

const mockCases: Case[] = [
    {
        id: 'c1', title: '', description: '', status: 'active', caseNumber: '001', clientId: '', lawyerId: '',
        court: 'Salt Lake', prosecutionAttorneys: [], defenseAttorneys: [{ id: 'att-1', name: 'Test Attorney' }],
        prosecutionFirm: '', defenseFirm: '',
        charge: 'Theft', courtDate: '2026-01-15', districtNumber: '', filingDate: '2025-06-01',
        dispositionDate: '2026-01-10', convictionOutcome: 'Not Guilty', convictionDate: '', ruling: '',
        sentence: '', caseType: '', offenseCode: '', sentenceDate: '', judgmentDescription: '', sentenceDescription: '', charges: [],
        createdAt: '', updatedAt: '',
    },
    {
        id: 'c2', title: '', description: '', status: 'closed', caseNumber: '002', clientId: '', lawyerId: '',
        court: 'Utah', prosecutionAttorneys: [], defenseAttorneys: [{ id: 'att-1', name: 'Test Attorney' }],
        prosecutionFirm: '', defenseFirm: '',
        charge: 'Theft', courtDate: '2026-02-15', districtNumber: '', filingDate: '2025-09-01',
        dispositionDate: '2026-02-10', convictionOutcome: 'Guilty', convictionDate: '', ruling: '',
        sentence: '', caseType: '', offenseCode: '', sentenceDate: '', judgmentDescription: '', sentenceDescription: '', charges: [],
        createdAt: '', updatedAt: '',
    },
];

describe('AttorneyAnalyticsSection', () => {
    it('renders performance stats', () => {
        render(createElement(AttorneyAnalyticsSection, { cases: mockCases, attorney: mockAttorney }));
        expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
        expect(screen.getByText('Total Cases')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('Most Common Charge')).toBeInTheDocument();
        expect(screen.getByText('Theft')).toBeInTheDocument();
    });

    it('calculates favorable outcomes for defense attorney', () => {
        render(createElement(AttorneyAnalyticsSection, { cases: mockCases, attorney: mockAttorney }));
        expect(screen.getByText('Favorable Outcomes')).toBeInTheDocument();
        // Not Guilty is favorable for defense
        expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('renders charts', () => {
        render(createElement(AttorneyAnalyticsSection, { cases: mockCases, attorney: mockAttorney }));
        expect(screen.getByText('Conviction Outcomes')).toBeInTheDocument();
        expect(screen.getByText('Cases Over Time')).toBeInTheDocument();
    });

    it('returns null when no cases', () => {
        const { container } = render(createElement(AttorneyAnalyticsSection, { cases: [], attorney: mockAttorney }));
        expect(container.innerHTML).toBe('');
    });
});
