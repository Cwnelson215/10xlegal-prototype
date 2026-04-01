import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DayCell } from '../DayCell';
import { createElement } from 'react';
import { vi } from 'vitest';

describe('DayCell', () => {
    it('renders empty cell when day is null', () => {
        const { container } = render(createElement(DayCell, { day: null, dateString: null, events: [], isToday: false, isSelected: false, onClick: vi.fn() }));
        expect(container.querySelector('.empty')).toBeInTheDocument();
    });

    it('renders day number', () => {
        render(createElement(DayCell, { day: 15, dateString: '2026-04-15', events: [], isToday: false, isSelected: false, onClick: vi.fn() }));
        expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('applies today class', () => {
        const { container } = render(createElement(DayCell, { day: 1, dateString: '2026-04-01', events: [], isToday: true, isSelected: false, onClick: vi.fn() }));
        expect(container.querySelector('.today')).toBeInTheDocument();
    });

    it('applies selected class', () => {
        const { container } = render(createElement(DayCell, { day: 1, dateString: '2026-04-01', events: [], isToday: false, isSelected: true, onClick: vi.fn() }));
        expect(container.querySelector('.selected')).toBeInTheDocument();
    });

    it('renders event dots for different event types', () => {
        const events = [
            { id: '1', date: '2026-04-01', title: 'Court', type: 'court-date' as const, caseNumber: 'C1', detail: '' },
            { id: '2', date: '2026-04-01', title: 'Deadline', type: 'deadline' as const, caseNumber: 'C1', detail: '' },
        ];
        const { container } = render(createElement(DayCell, { day: 1, dateString: '2026-04-01', events, isToday: false, isSelected: false, onClick: vi.fn() }));
        expect(container.querySelector('.court-dot')).toBeInTheDocument();
        expect(container.querySelector('.deadline-dot')).toBeInTheDocument();
    });

    it('calls onClick when clicked', () => {
        const onClick = vi.fn();
        render(createElement(DayCell, { day: 5, dateString: '2026-04-05', events: [], isToday: false, isSelected: false, onClick }));
        fireEvent.click(screen.getByText('5'));
        expect(onClick).toHaveBeenCalled();
    });
});
