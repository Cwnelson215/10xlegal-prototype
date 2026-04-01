import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UpcomingEvents } from '../UpcomingEvents';
import { createElement } from 'react';
import { vi } from 'vitest';

describe('UpcomingEvents', () => {
    it('shows no upcoming events message when empty', () => {
        render(createElement(UpcomingEvents, { events: [], onSelectEvent: vi.fn() }));
        expect(screen.getByText('No upcoming events.')).toBeInTheDocument();
    });

    it('renders event list', () => {
        const events = [
            { id: '1', date: '2026-05-01', title: 'Court Date', type: 'court-date' as const, caseNumber: 'CR-001', detail: '' },
        ];
        render(createElement(UpcomingEvents, { events, onSelectEvent: vi.fn() }));
        expect(screen.getByText('Court Date')).toBeInTheDocument();
        expect(screen.getByText('CR-001')).toBeInTheDocument();
    });

    it('calls onSelectEvent when event clicked', () => {
        const onSelectEvent = vi.fn();
        const events = [
            { id: '1', date: '2026-05-01', title: 'Court Date', type: 'court-date' as const, caseNumber: 'CR-001', detail: '' },
        ];
        render(createElement(UpcomingEvents, { events, onSelectEvent }));
        fireEvent.click(screen.getByText('Court Date'));
        expect(onSelectEvent).toHaveBeenCalledWith(events[0]);
    });
});
