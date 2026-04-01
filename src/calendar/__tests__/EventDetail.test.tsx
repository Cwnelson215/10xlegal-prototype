import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EventDetail } from '../EventDetail';
import { createElement } from 'react';

describe('EventDetail', () => {
    it('shows select prompt when no date selected', () => {
        render(createElement(EventDetail, { events: [], selectedDate: null }));
        expect(screen.getByText('Select a day to view events.')).toBeInTheDocument();
    });

    it('shows no events message when date has no events', () => {
        render(createElement(EventDetail, { events: [], selectedDate: '2026-04-15' }));
        expect(screen.getByText('No events on this day.')).toBeInTheDocument();
    });

    it('renders events list when events exist', () => {
        const events = [
            { id: '1', date: '2026-04-15', title: 'Court Hearing', type: 'court-date' as const, caseNumber: '21-CR-001', detail: 'Theft charge' },
        ];
        render(createElement(EventDetail, { events, selectedDate: '2026-04-15' }));
        expect(screen.getByText('Court Hearing')).toBeInTheDocument();
        expect(screen.getByText('21-CR-001')).toBeInTheDocument();
        expect(screen.getByText('Theft charge')).toBeInTheDocument();
    });
});
