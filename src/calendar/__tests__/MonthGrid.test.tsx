import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MonthGrid } from '../MonthGrid';
import { createElement } from 'react';
import { vi } from 'vitest';

describe('MonthGrid', () => {
    const defaultProps = {
        year: 2026,
        month: 3, // April
        events: [],
        selectedDate: null,
        onSelectDate: vi.fn(),
        onPrev: vi.fn(),
        onNext: vi.fn(),
    };

    it('renders month title', () => {
        render(createElement(MonthGrid, defaultProps));
        expect(screen.getByText('April 2026')).toBeInTheDocument();
    });

    it('renders weekday headers', () => {
        render(createElement(MonthGrid, defaultProps));
        expect(screen.getByText('Sun')).toBeInTheDocument();
        expect(screen.getByText('Mon')).toBeInTheDocument();
        expect(screen.getByText('Sat')).toBeInTheDocument();
    });

    it('renders day numbers for the month', () => {
        render(createElement(MonthGrid, defaultProps));
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('30')).toBeInTheDocument();
    });

    it('calls onPrev when prev button clicked', () => {
        const onPrev = vi.fn();
        render(createElement(MonthGrid, { ...defaultProps, onPrev }));
        fireEvent.click(screen.getByText(/Prev/));
        expect(onPrev).toHaveBeenCalled();
    });

    it('calls onNext when next button clicked', () => {
        const onNext = vi.fn();
        render(createElement(MonthGrid, { ...defaultProps, onNext }));
        fireEvent.click(screen.getByText(/Next/));
        expect(onNext).toHaveBeenCalled();
    });

    it('calls onSelectDate when a day is clicked', () => {
        const onSelectDate = vi.fn();
        render(createElement(MonthGrid, { ...defaultProps, onSelectDate }));
        fireEvent.click(screen.getByText('15'));
        expect(onSelectDate).toHaveBeenCalledWith('2026-04-15');
    });
});
