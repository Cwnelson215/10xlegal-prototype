import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import apiClient from '../client';

describe('ApiClient', () => {
    beforeEach(() => {
        localStorage.clear();
        apiClient.clearToken();
    });

    describe('get', () => {
        it('makes GET requests and returns JSON data', async () => {
            server.use(
                http.get('/api/test-endpoint', () => {
                    return HttpResponse.json({ message: 'hello' });
                })
            );

            const result = await apiClient.get<{ message: string }>('/test-endpoint');
            expect(result.message).toBe('hello');
        });

        it('handles non-JSON responses', async () => {
            server.use(
                http.get('/api/text-endpoint', () => {
                    return new HttpResponse('plain text', {
                        headers: { 'content-type': 'text/plain' },
                    });
                })
            );

            const result = await apiClient.get<string>('/text-endpoint');
            expect(result).toBe('plain text');
        });
    });

    describe('post', () => {
        it('sends JSON body', async () => {
            server.use(
                http.post('/api/test-post', async ({ request }) => {
                    const body = await request.json();
                    return HttpResponse.json({ received: body });
                })
            );

            const result = await apiClient.post<{ received: unknown }>('/test-post', { foo: 'bar' });
            expect(result.received).toEqual({ foo: 'bar' });
        });

        it('sends FormData when isFormData is true', async () => {
            server.use(
                http.post('/api/test-form', async ({ request }) => {
                    const formData = await request.formData();
                    return HttpResponse.json({ field: formData.get('key') });
                })
            );

            const form = new FormData();
            form.append('key', 'value');
            const result = await apiClient.post<{ field: unknown }>('/test-form', form, true);
            expect(result.field).toBe('value');
        });
    });

    describe('put', () => {
        it('sends PUT with JSON body', async () => {
            server.use(
                http.put('/api/test-put', async ({ request }) => {
                    const body = await request.json();
                    return HttpResponse.json({ updated: body });
                })
            );

            const result = await apiClient.put<{ updated: unknown }>('/test-put', { name: 'test' });
            expect(result.updated).toEqual({ name: 'test' });
        });
    });

    describe('patch', () => {
        it('sends PATCH with JSON body', async () => {
            server.use(
                http.patch('/api/test-patch', async ({ request }) => {
                    const body = await request.json();
                    return HttpResponse.json({ patched: body });
                })
            );

            const result = await apiClient.patch<{ patched: unknown }>('/test-patch', { field: 'val' });
            expect(result.patched).toEqual({ field: 'val' });
        });
    });

    describe('delete', () => {
        it('sends DELETE request', async () => {
            server.use(
                http.delete('/api/test-delete', () => {
                    return HttpResponse.json({ deleted: true });
                })
            );

            const result = await apiClient.delete<{ deleted: boolean }>('/test-delete');
            expect(result.deleted).toBe(true);
        });
    });

    describe('authentication', () => {
        it('includes Authorization header when token is set', async () => {
            let capturedAuth = '';
            server.use(
                http.get('/api/auth-check', ({ request }) => {
                    capturedAuth = request.headers.get('Authorization') ?? '';
                    return HttpResponse.json({ ok: true });
                })
            );

            apiClient.setToken('test-token');
            await apiClient.get('/auth-check');
            expect(capturedAuth).toBe('Bearer test-token');
        });

        it('does not include Authorization header when no token', async () => {
            let capturedAuth: string | null = null;
            server.use(
                http.get('/api/no-auth', ({ request }) => {
                    capturedAuth = request.headers.get('Authorization');
                    return HttpResponse.json({ ok: true });
                })
            );

            await apiClient.get('/no-auth');
            expect(capturedAuth).toBeNull();
        });

        it('stores token in localStorage when setToken is called', () => {
            apiClient.setToken('my-token');
            expect(localStorage.getItem('authToken')).toBe('my-token');
        });

        it('removes token from localStorage when clearToken is called', () => {
            apiClient.setToken('my-token');
            apiClient.clearToken();
            expect(localStorage.getItem('authToken')).toBeNull();
        });
    });

    describe('error handling', () => {
        it('throws ApiError on non-ok response', async () => {
            server.use(
                http.get('/api/bad-request', () => {
                    return HttpResponse.json(
                        { message: 'Bad request', errors: { field: ['required'] } },
                        { status: 400 }
                    );
                })
            );

            await expect(apiClient.get('/bad-request')).rejects.toMatchObject({
                status: 400,
                message: 'Bad request',
                errors: { field: ['required'] },
            });
        });

        it('handles 401 on non-auth endpoints by clearing token', async () => {
            server.use(
                http.get('/api/protected', () => {
                    return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
                })
            );

            apiClient.setToken('expired-token');

            await expect(apiClient.get('/protected')).rejects.toThrow('Session expired');
            expect(localStorage.getItem('authToken')).toBeNull();
        });

        it('does not redirect on 401 for auth endpoints', async () => {
            server.use(
                http.post('/api/auth/login', () => {
                    return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
                })
            );

            await expect(apiClient.post('/auth/login', {})).rejects.toMatchObject({
                status: 401,
                message: 'Invalid credentials',
            });
        });

        it('wraps network errors with helpful message', async () => {
            server.use(
                http.get('/api/network-fail', () => {
                    return HttpResponse.error();
                })
            );

            await expect(apiClient.get('/network-fail')).rejects.toThrow('Network error');
        });
    });
});
