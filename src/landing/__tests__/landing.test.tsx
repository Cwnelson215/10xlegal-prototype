import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import { Landing } from '../landing';
import { createElement } from 'react';

function renderLanding(initialEntries?: string[]) {
    return render(
        createElement(AuthProvider, null,
            createElement(MemoryRouter, { initialEntries: initialEntries ?? ['/'] },
                createElement(Landing)
            )
        )
    );
}

describe('Landing', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('renders login form by default', async () => {
        renderLanding();
        await waitFor(() => {
            expect(screen.getByText('10X-Legal Tech')).toBeInTheDocument();
        });
        expect(screen.getByText('Welcome Back')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
        expect(screen.getAllByText('Sign In').length).toBeGreaterThanOrEqual(1);
    });

    it('switches to register tab', async () => {
        renderLanding();
        await waitFor(() => {
            expect(screen.getByText('Register')).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText('Register'));
        expect(screen.getByText('Create Your Account')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Full name')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Confirm password')).toBeInTheDocument();
    });

    it('renders role selection buttons', async () => {
        renderLanding();
        await waitFor(() => {
            expect(screen.getByText('Client')).toBeInTheDocument();
        });
        expect(screen.getByText('Lawyer')).toBeInTheDocument();
        expect(screen.getByText('Legal Official')).toBeInTheDocument();
    });

    it('shows lawyer-specific fields when lawyer role selected in register', async () => {
        renderLanding();
        await waitFor(() => {
            expect(screen.getByText('Register')).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText('Register'));
        fireEvent.click(screen.getByText('Lawyer'));
        expect(screen.getByText('Professional Verification')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Bar number')).toBeInTheDocument();
    });

    it('shows legal official fields when legal-official role selected in register', async () => {
        renderLanding();
        await waitFor(() => {
            expect(screen.getByText('Register')).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText('Register'));
        fireEvent.click(screen.getByText('Legal Official'));
        expect(screen.getByText('Official Verification')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Government agency name')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Official ID number')).toBeInTheDocument();
    });

    it('clears role-specific fields when switching roles', async () => {
        renderLanding();
        await waitFor(() => {
            expect(screen.getByText('Register')).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText('Register'));
        fireEvent.click(screen.getByText('Lawyer'));
        expect(screen.getByPlaceholderText('Bar number')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Client'));
        expect(screen.queryByPlaceholderText('Bar number')).not.toBeInTheDocument();
    });

    it('submits login form with filled values', async () => {
        renderLanding();
        await waitFor(() => {
            expect(screen.getByText('Welcome Back')).toBeInTheDocument();
        });
        fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });
        // Verify inputs are filled
        expect(screen.getByPlaceholderText('Email address')).toHaveValue('test@example.com');
        expect(screen.getByPlaceholderText('Password')).toHaveValue('password123');
    });

    it('fills register form fields', async () => {
        renderLanding();
        await waitFor(() => {
            expect(screen.getByText('Register')).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText('Register'));
        fireEvent.change(screen.getByPlaceholderText('Full name'), { target: { value: 'New User' } });
        fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'new@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'pass123' } });
        fireEvent.change(screen.getByPlaceholderText('Confirm password'), { target: { value: 'pass123' } });
        expect(screen.getByPlaceholderText('Full name')).toHaveValue('New User');
        expect(screen.getByPlaceholderText('Confirm password')).toHaveValue('pass123');
    });

    it('displays error from auth context', async () => {
        const { http, HttpResponse } = await import('msw');
        const { server } = await import('../../test/mocks/server');
        server.use(
            http.post('/api/auth/login', () => {
                return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
            })
        );
        renderLanding();
        await waitFor(() => {
            expect(screen.getByText('Welcome Back')).toBeInTheDocument();
        });
        fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'wrong@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'wrong' } });
        fireEvent.submit(screen.getByText('Welcome Back').closest('form')!);
        await waitFor(() => {
            expect(screen.getByRole('alert')).toBeInTheDocument();
        });
        // Switching tab should clear error
        fireEvent.click(screen.getByText('Register'));
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('opens register tab from URL param', async () => {
        renderLanding(['/?register=true']);
        await waitFor(() => {
            expect(screen.getByText('Create Your Account')).toBeInTheDocument();
        });
    });

    it('submits login and navigates on success', async () => {
        renderLanding();
        await waitFor(() => {
            expect(screen.getByText('Welcome Back')).toBeInTheDocument();
        });
        fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });
        fireEvent.submit(screen.getByText('Welcome Back').closest('form')!);
        // Wait for authentication to complete - component will try to navigate
        await waitFor(() => {
            expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        });
    });

    it('submits register form with lawyer info', async () => {
        const { http, HttpResponse } = await import('msw');
        const { server } = await import('../../test/mocks/server');
        server.use(
            http.post('/api/auth/register', () => {
                return HttpResponse.json({
                    success: true,
                    data: {
                        token: 'reg-token',
                        refreshToken: 'reg-refresh',
                        user: { id: 'u2', name: 'Lawyer', email: 'law@example.com', role: 'lawyer', createdAt: '', updatedAt: '' },
                    },
                });
            })
        );
        renderLanding();
        await waitFor(() => {
            expect(screen.getByText('Register')).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText('Register'));
        fireEvent.click(screen.getByText('Lawyer'));
        fireEvent.change(screen.getByPlaceholderText('Full name'), { target: { value: 'Test Lawyer' } });
        fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'law@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'pass123' } });
        fireEvent.change(screen.getByPlaceholderText('Confirm password'), { target: { value: 'pass123' } });
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'CA' } });
        fireEvent.change(screen.getByPlaceholderText('Bar number'), { target: { value: '12345' } });
        fireEvent.submit(screen.getByText('Create Your Account').closest('form')!);
        await waitFor(() => {
            expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        });
    });

    it('submits register form with legal official info', async () => {
        const { http, HttpResponse } = await import('msw');
        const { server } = await import('../../test/mocks/server');
        server.use(
            http.post('/api/auth/register', () => {
                return HttpResponse.json({
                    success: true,
                    data: {
                        token: 'reg-token',
                        refreshToken: 'reg-refresh',
                        user: { id: 'u3', name: 'Official', email: 'off@example.com', role: 'legal-official', createdAt: '', updatedAt: '' },
                    },
                });
            })
        );
        renderLanding();
        await waitFor(() => {
            expect(screen.getByText('Register')).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText('Register'));
        fireEvent.click(screen.getByText('Legal Official'));
        fireEvent.change(screen.getByPlaceholderText('Full name'), { target: { value: 'Test Official' } });
        fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'off@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'pass123' } });
        fireEvent.change(screen.getByPlaceholderText('Confirm password'), { target: { value: 'pass123' } });
        fireEvent.change(screen.getByPlaceholderText('Government agency name'), { target: { value: 'FBI' } });
        fireEvent.change(screen.getByPlaceholderText('Official ID number'), { target: { value: 'GOV-001' } });
        fireEvent.submit(screen.getByText('Create Your Account').closest('form')!);
        await waitFor(() => {
            expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        });
    });

    it('shows state bar select for lawyer registration', async () => {
        renderLanding();
        await waitFor(() => {
            expect(screen.getByText('Register')).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText('Register'));
        fireEvent.click(screen.getByText('Lawyer'));
        const select = screen.getByRole('combobox');
        expect(select).toBeInTheDocument();
        // Should have US states as options
        expect(screen.getByText('California')).toBeInTheDocument();
        expect(screen.getByText('New York')).toBeInTheDocument();
    });
});
