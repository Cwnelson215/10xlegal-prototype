import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import { Home } from '../home';

function renderHome() {
    return render(
        <AuthProvider>
            <MemoryRouter>
                <Home />
            </MemoryRouter>
        </AuthProvider>
    );
}

describe('Home dashboard', () => {
    it('renders loading state then case table', async () => {
        renderHome();

        expect(screen.getByText('Loading cases...')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.queryByText('Loading cases...')).not.toBeInTheDocument();
        });

        expect(screen.getByText('Case Dashboard')).toBeInTheDocument();
        expect(screen.getByText('21-CR-10001')).toBeInTheDocument();
        expect(screen.getByText('21-CR-10002')).toBeInTheDocument();
    });

    it('renders entity links in table', async () => {
        renderHome();

        await waitFor(() => {
            expect(screen.queryByText('Loading cases...')).not.toBeInTheDocument();
        });

        // Case numbers should be links
        const caseLink = screen.getByText('21-CR-10001').closest('a');
        expect(caseLink).toHaveAttribute('href', '/cases/case-1');

        // Prosecutor name should be a link
        const prosecutorLink = screen.getByText('Test Prosecutor').closest('a');
        expect(prosecutorLink).toHaveAttribute('href', '/attorneys/att-1');

        // Defense attorney should be a link
        const defenseLink = screen.getByText('Test Defender').closest('a');
        expect(defenseLink).toHaveAttribute('href', '/attorneys/att-2');

    });

    it('renders case data columns correctly', async () => {
        renderHome();

        await waitFor(() => {
            expect(screen.queryByText('Loading cases...')).not.toBeInTheDocument();
        });

        // Verify table headers
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
        const headers = table.querySelectorAll('th');
        const headerTexts = Array.from(headers).map((th) => th.textContent);
        expect(headerTexts).toEqual([
            'Case Number', 'Court', 'Prosecuting Attorney',
            'Defense Attorney', 'Charge', 'Court Date',
            'Conviction', 'Sentence',
        ]);

        // Verify data from mock cases within the table body
        const rows = table.querySelectorAll('tbody tr');
        expect(rows).toHaveLength(2);

        const firstRowCells = rows[0]!.querySelectorAll('td');
        expect(firstRowCells[0]!.textContent).toBe('21-CR-10001');
        expect(firstRowCells[1]!.textContent).toBe('Salt Lake');
        expect(firstRowCells[4]!.textContent).toBe('Test Charge');

        const secondRowCells = rows[1]!.querySelectorAll('td');
        expect(secondRowCells[0]!.textContent).toBe('21-CR-10002');
        expect(secondRowCells[1]!.textContent).toBe('Utah');
        expect(secondRowCells[4]!.textContent).toBe('Another Charge');
        expect(secondRowCells[7]!.textContent).toBe('30 days');
    });

    it('renders filter inputs', async () => {
        renderHome();

        await waitFor(() => {
            expect(screen.queryByText('Loading cases...')).not.toBeInTheDocument();
        });

        expect(screen.getByLabelText('Case Number Sequence')).toBeInTheDocument();
        expect(screen.getByLabelText('Attorney Name')).toBeInTheDocument();

        expect(screen.getByLabelText('Court')).toBeInTheDocument();
    });
});
