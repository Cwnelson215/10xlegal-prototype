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

        // Judge name should be a link
        const judgeLink = screen.getByText('Hon. Test Judge').closest('a');
        expect(judgeLink).toHaveAttribute('href', '/judges/judge-1');
    });

    it('renders filter inputs', async () => {
        renderHome();

        await waitFor(() => {
            expect(screen.queryByText('Loading cases...')).not.toBeInTheDocument();
        });

        expect(screen.getByLabelText('Case Number Sequence')).toBeInTheDocument();
        expect(screen.getByLabelText('Attorney Name')).toBeInTheDocument();
        expect(screen.getByLabelText('Firm Name')).toBeInTheDocument();
        expect(screen.getByLabelText('Judge Name')).toBeInTheDocument();
        expect(screen.getByLabelText('County')).toBeInTheDocument();
    });
});
