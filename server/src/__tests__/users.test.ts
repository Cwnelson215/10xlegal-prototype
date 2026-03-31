import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import http from 'http';
import { setupTestDb, getTestDb, closeTestDb, seedTestUser, generateToken } from './helpers.js';

vi.mock('../db/connection.js', () => ({
  getDb: () => getTestDb(),
  initDb: async () => {},
}));

import { app } from '../app.js';

let server: http.Server;
let baseUrl: string;

async function request(path: string, options: RequestInit = {}) {
  return fetch(`${baseUrl}${path}`, options);
}

describe('Users routes', () => {
  let authToken: string;
  let testUser: { id: string; email: string; name: string; role: string };

  beforeAll(async () => {
    await setupTestDb();
    testUser = await seedTestUser('lawyer');
    authToken = generateToken(testUser);

    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, () => resolve());
    });
    const addr = server.address() as { port: number };
    baseUrl = `http://localhost:${addr.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await closeTestDb();
  });

  describe('GET /api/users/profile', () => {
    it('returns current user profile when authenticated', async () => {
      const res = await request('/api/users/profile', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(testUser.id);
      expect(body.data.name).toBe(testUser.name);
      expect(body.data.email).toBe(testUser.email);
      expect(body.data.role).toBe(testUser.role);
      expect(body.data.verificationStatus).toBeDefined();
      expect(body.data.createdAt).toBeDefined();
      expect(body.data.updatedAt).toBeDefined();
    });

    it('rejects unauthenticated request', async () => {
      const res = await request('/api/users/profile');
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/users/profile', () => {
    it('updates name when authenticated', async () => {
      const res = await request('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ name: 'Updated Name' }),
      });

      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('Updated Name');
      expect(body.data.id).toBe(testUser.id);
    });

    it('returns error when no fields provided', async () => {
      const res = await request('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
      const body = await res.json() as any;
      expect(body.success).toBe(false);
    });

    it('rejects unauthenticated request', async () => {
      const res = await request('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Should Fail' }),
      });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/users/:id', () => {
    it('returns user by id when authenticated', async () => {
      const res = await request(`/api/users/${testUser.id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(testUser.id);
      expect(body.data.email).toBe(testUser.email);
      expect(body.data.role).toBe(testUser.role);
      expect(body.data.verificationStatus).toBeDefined();
      expect(body.data.createdAt).toBeDefined();
      expect(body.data.updatedAt).toBeDefined();
    });

    it('returns 404 for nonexistent user', async () => {
      const res = await request('/api/users/nonexistent', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(res.status).toBe(404);
      const body = await res.json() as any;
      expect(body.success).toBe(false);
    });

    it('rejects unauthenticated request', async () => {
      const res = await request(`/api/users/${testUser.id}`);
      expect(res.status).toBe(401);
    });
  });
});
