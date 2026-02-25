import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import http from 'http';
import { setupTestDb, getTestDb, closeTestDb, seedTestUser, generateToken } from './helpers.js';

// Mock the database connection before importing app
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

describe('Auth routes', () => {
  beforeAll(async () => {
    await setupTestDb();
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

  describe('POST /api/auth/register', () => {
    it('registers a new user', async () => {
      const res = await request('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New User',
          email: 'new@test.com',
          password: 'password123',
          role: 'client',
        }),
      });

      expect(res.status).toBe(201);
      const body = await res.json() as any;
      expect(body.success).toBe(true);
      expect(body.data.user.email).toBe('new@test.com');
      expect(body.data.token).toBeDefined();
    });

    it('rejects duplicate email', async () => {
      const res = await request('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Dup User',
          email: 'new@test.com',
          password: 'password123',
          role: 'client',
        }),
      });

      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with valid credentials', async () => {
      await seedTestUser('lawyer');

      const res = await request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'lawyer@test.com',
          password: 'password123',
          role: 'lawyer',
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.success).toBe(true);
      expect(body.data.user.role).toBe('lawyer');
      expect(body.data.token).toBeDefined();
    });

    it('rejects invalid password', async () => {
      const res = await request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'lawyer@test.com',
          password: 'wrongpassword',
          role: 'lawyer',
        }),
      });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/verify-token', () => {
    it('returns user for valid token', async () => {
      const user = await seedTestUser('legal-official');
      const token = generateToken(user);

      const res = await request('/api/auth/verify-token', {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.success).toBe(true);
      expect(body.data.email).toBe(user.email);
    });

    it('rejects without token', async () => {
      const res = await request('/api/auth/verify-token');

      expect(res.status).toBe(401);
    });
  });
});
