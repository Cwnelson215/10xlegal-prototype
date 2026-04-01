import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import { Calendar } from '../calendar';
import { createElement } from 'react';

function renderCalendar() {
    return render(
        createElement(AuthProvider, null,
            createElement(MemoryRouter, null,
                createElement(Calendar)
            )
        )
    );
}

describe('Calendar', () => {
    it('renders loading state then calendar', async () => {
        renderCalendar();
        expect(screen.getByText('Loading calendar...')).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.queryByText('Loading calendar...')).not.toBeInTheDocument();
        });
        expect(screen.getByText('Calendar')).toBeInTheDocument();
    });

    it('renders month grid with navigation', async () => {
        renderCalendar();
        await waitFor(() => {
            expect(screen.queryByText('Loading calendar...')).not.toBeInTheDocument();
        });
        expect(screen.getByText(/Prev/)).toBeInTheDocument();
        expect(screen.getByText(/Next/)).toBeInTheDocument();
    });

    it('renders upcoming events sidebar', async () => {
        renderCalendar();
        await waitFor(() => {
            expect(screen.queryByText('Loading calendar...')).not.toBeInTheDocument();
        });
        expect(screen.getByText('Upcoming Events')).toBeInTheDocument();
    });

    it('shows empty selection message initially', async () => {
        renderCalendar();
        await waitFor(() => {
            expect(screen.queryByText('Loading calendar...')).not.toBeInTheDocument();
        });
        expect(screen.getByText('Select a day to view events.')).toBeInTheDocument();
    });

    it('navigates months with prev/next buttons', async () => {
        renderCalendar();
        await waitFor(() => {
            expect(screen.queryByText('Loading calendar...')).not.toBeInTheDocument();
        });
        const monthTitle = screen.getByRole('heading', { level: 2 });
        const initialText = monthTitle.textContent;
        fireEvent.click(screen.getByText(/Next/));
        expect(monthTitle.textContent).not.toBe(initialText);
    });
});
