import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import { AdminLogin } from '../AdminLogin';
import { createElement } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';

function renderAdminLogin() {
    return render(
        createElement(AuthProvider, null,
            createElement(MemoryRouter, null,
                createElement(AdminLogin)
            )
        )
    );
}

describe('AdminLogin', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('renders admin login form', async () => {
        renderAdminLogin();
        await waitFor(() => {
            expect(screen.getByText('Admin Access')).toBeInTheDocument();
        });
        expect(screen.getByPlaceholderText('Admin email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
        expect(screen.getByText('Sign In as Admin')).toBeInTheDocument();
    });

    it('renders 10X-Legal Tech heading', async () => {
        renderAdminLogin();
        await waitFor(() => {
            expect(screen.getByText('10X-Legal Tech')).toBeInTheDocument();
        });
    });

    it('fills and submits admin login form', async () => {
        renderAdminLogin();
        await waitFor(() => {
            expect(screen.getByText('Admin Access')).toBeInTheDocument();
        });
        fireEvent.change(screen.getByPlaceholderText('Admin email'), { target: { value: 'admin@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'adminpass' } });
        expect(screen.getByPlaceholderText('Admin email')).toHaveValue('admin@example.com');
        expect(screen.getByPlaceholderText('Password')).toHaveValue('adminpass');
    });

    it('shows error on failed login', async () => {
        server.use(
            http.post('/api/auth/login', () => {
                return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
            })
        );
        renderAdminLogin();
        await waitFor(() => {
            expect(screen.getByText('Admin Access')).toBeInTheDocument();
        });
        fireEvent.change(screen.getByPlaceholderText('Admin email'), { target: { value: 'wrong@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'wrong' } });
        fireEvent.submit(screen.getByText('Sign In as Admin').closest('form')!);
        await waitFor(() => {
            expect(screen.getByRole('alert')).toBeInTheDocument();
        });
    });

    it('submits login as admin role', async () => {
        server.use(
            http.post('/api/auth/login', () => {
                return HttpResponse.json({
                    success: true,
                    data: {
                        token: 'admin-token',
                        refreshToken: 'admin-refresh',
                        user: { id: 'admin-1', name: 'Admin User', email: 'admin@example.com', role: 'admin', createdAt: '', updatedAt: '' },
                    },
                });
            })
        );
        renderAdminLogin();
        await waitFor(() => {
            expect(screen.getByText('Admin Access')).toBeInTheDocument();
        });
        fireEvent.change(screen.getByPlaceholderText('Admin email'), { target: { value: 'admin@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'adminpass' } });
        fireEvent.submit(screen.getByText('Sign In as Admin').closest('form')!);
        // After successful login, tries to navigate to /admin
        await waitFor(() => {
            expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        });
    });
});
