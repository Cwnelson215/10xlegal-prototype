import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/mocks/server';
import { authService } from '../authService';
import apiClient from '../../client';

describe('authService', () => {
    beforeEach(() => {
        localStorage.clear();
        apiClient.clearToken();
    });

    describe('login', () => {
        it('returns user data and sets token', async () => {
            const result = await authService.login({
                email: 'test@example.com',
                password: 'password123',
                role: 'legal-official',
            });

            expect(result.user.email).toBe('test@example.com');
            expect(result.token).toBe('mock-jwt-token');
            expect(localStorage.getItem('authToken')).toBe('mock-jwt-token');
        });

        it('throws on invalid credentials', async () => {
            await expect(
                authService.login({ email: 'wrong@example.com', password: 'wrong', role: 'client' })
            ).rejects.toBeDefined();
        });
    });

    describe('register', () => {
        it('registers user and sets token', async () => {
            server.use(
                http.post('/api/auth/register', () => {
                    return HttpResponse.json({
                        success: true,
                        data: {
                            token: 'new-token',
                            refreshToken: 'new-refresh',
                            user: { id: 'u2', name: 'New User', email: 'new@example.com', role: 'client', createdAt: '', updatedAt: '' },
                        },
                    });
                })
            );

            const result = await authService.register({
                name: 'New User',
                email: 'new@example.com',
                password: 'pass123',
                role: 'client',
            });

            expect(result.user.name).toBe('New User');
            expect(localStorage.getItem('authToken')).toBe('new-token');
        });
    });

    describe('logout', () => {
        it('clears token even if backend call succeeds', async () => {
            apiClient.setToken('some-token');
            await authService.logout();
            expect(localStorage.getItem('authToken')).toBeNull();
        });

        it('clears token even if backend call fails', async () => {
            server.use(
                http.post('/api/auth/logout', () => {
                    return HttpResponse.error();
                })
            );

            apiClient.setToken('some-token');
            await authService.logout();
            expect(localStorage.getItem('authToken')).toBeNull();
        });
    });

    describe('refreshToken', () => {
        it('refreshes and stores new token', async () => {
            server.use(
                http.post('/api/auth/refresh-token', () => {
                    return HttpResponse.json({
                        success: true,
                        data: {
                            token: 'refreshed-token',
                            refreshToken: 'new-refresh',
                            user: { id: 'u1', name: 'Test', email: 'test@example.com', role: 'client', createdAt: '', updatedAt: '' },
                        },
                    });
                })
            );

            const result = await authService.refreshToken('old-refresh-token');
            expect(result.token).toBe('refreshed-token');
            expect(localStorage.getItem('authToken')).toBe('refreshed-token');
        });
    });

    describe('verifyToken', () => {
        it('returns user data', async () => {
            apiClient.setToken('valid-token');
            const user = await authService.verifyToken();
            expect(user.email).toBe('test@example.com');
            expect(user.role).toBe('legal-official');
        });
    });

    describe('clearToken / setToken', () => {
        it('clearToken removes stored token', () => {
            apiClient.setToken('tok');
            authService.clearToken();
            expect(localStorage.getItem('authToken')).toBeNull();
        });

        it('setToken stores token', () => {
            authService.setToken('my-token');
            expect(localStorage.getItem('authToken')).toBe('my-token');
        });
    });
});
