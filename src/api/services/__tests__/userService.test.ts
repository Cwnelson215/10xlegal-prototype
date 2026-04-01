import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/mocks/server';
import { userService } from '../userService';
import apiClient from '../../client';

const mockUser = { id: 'u1', name: 'Test User', email: 'test@example.com', role: 'client' as const, createdAt: '', updatedAt: '' };

describe('userService', () => {
    beforeEach(() => {
        localStorage.clear();
        apiClient.clearToken();
    });

    describe('getProfile', () => {
        it('returns user profile', async () => {
            server.use(
                http.get('/api/users/profile', () => {
                    return HttpResponse.json({ success: true, data: mockUser });
                })
            );

            const result = await userService.getProfile();
            expect(result.name).toBe('Test User');
        });
    });

    describe('updateProfile', () => {
        it('updates and returns user profile', async () => {
            server.use(
                http.put('/api/users/profile', () => {
                    return HttpResponse.json({ success: true, data: { ...mockUser, name: 'Updated Name' } });
                })
            );

            const result = await userService.updateProfile({ name: 'Updated Name' });
            expect(result.name).toBe('Updated Name');
        });
    });

    describe('getUser', () => {
        it('returns user by ID', async () => {
            server.use(
                http.get('/api/users/:id', () => {
                    return HttpResponse.json({ success: true, data: mockUser });
                })
            );

            const result = await userService.getUser('u1');
            expect(result.id).toBe('u1');
        });
    });
});
