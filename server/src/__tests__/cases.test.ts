import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import http from 'http';
import { setupTestDb, getTestDb, closeTestDb, seedTestUser, generateToken, seedTestCase } from './helpers.js';

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

describe('Cases routes', () => {
  let authToken: string;

  beforeAll(async () => {
    await setupTestDb();
    const user = await seedTestUser('legal-official');
    authToken = generateToken(user);

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

  describe('GET /api/cases', () => {
    it('allows unauthenticated access (optionalAuth)', async () => {
      const res = await request('/api/cases');
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.data).toBeDefined();
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('returns paginated response', async () => {
      await seedTestCase();
      await seedTestCase();

      const res = await request('/api/cases?page=1&pageSize=10');
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.total).toBeGreaterThanOrEqual(2);
      expect(body.page).toBe(1);
      expect(body.pageSize).toBe(10);
    });
  });

  describe('POST /api/cases', () => {
    it('creates a case when authenticated', async () => {
      const res = await request('/api/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'New Case',
          caseNumber: '99-CR-99999',
          clientId: 'client-test',
        }),
      });

      expect(res.status).toBe(201);
      const body = await res.json() as any;
      expect(body.success).toBe(true);
      expect(body.data.caseNumber).toBe('99-CR-99999');
    });

    it('rejects unauthenticated create', async () => {
      const res = await request('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Unauthorized Case',
          caseNumber: '99-CR-00000',
          clientId: 'client-test',
        }),
      });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/cases/:id', () => {
    it('returns a single case', async () => {
      const caseId = await seedTestCase();

      const res = await request(`/api/cases/${caseId}`);
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(caseId);
    });

    it('returns 404 for nonexistent case', async () => {
      const res = await request('/api/cases/nonexistent');
      expect(res.status).toBe(404);
    });
  });
});
