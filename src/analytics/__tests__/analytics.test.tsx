import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import { Analytics } from '../analytics';
import { createElement } from 'react';

function renderAnalytics() {
    return render(
        createElement(AuthProvider, null,
            createElement(MemoryRouter, null,
                createElement(Analytics)
            )
        )
    );
}

describe('Analytics', () => {
    it('renders loading state then content', async () => {
        renderAnalytics();
        expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.queryByText('Loading analytics...')).not.toBeInTheDocument();
        });
        expect(screen.getByText('Analytics')).toBeInTheDocument();
    });

    it('renders overview tab by default', async () => {
        renderAnalytics();
        await waitFor(() => {
            expect(screen.queryByText('Loading analytics...')).not.toBeInTheDocument();
        });
        expect(screen.getByText('Total Cases')).toBeInTheDocument();
    });

    it('switches to attorney analytics tab', async () => {
        renderAnalytics();
        await waitFor(() => {
            expect(screen.queryByText('Loading analytics...')).not.toBeInTheDocument();
        });
        fireEvent.click(screen.getByText('Attorneys & Firms'));
        expect(screen.getByText('Total Attorneys')).toBeInTheDocument();
    });

    it('switches to cases tab', async () => {
        renderAnalytics();
        await waitFor(() => {
            expect(screen.queryByText('Loading analytics...')).not.toBeInTheDocument();
        });
        fireEvent.click(screen.getByText('Cases'));
        expect(screen.getByText('Unique Charges')).toBeInTheDocument();
    });

    it('switches to judges tab', async () => {
        renderAnalytics();
        await waitFor(() => {
            expect(screen.queryByText('Loading analytics...')).not.toBeInTheDocument();
        });
        fireEvent.click(screen.getByText('Judges & Courts'));
        expect(screen.getByText('Total Judges')).toBeInTheDocument();
    });
});
