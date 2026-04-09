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

describe('Cases CRUD routes', () => {
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
    if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
    await closeTestDb();
  });

  describe('PUT /api/cases/:id', () => {
    it('updates case fields (title, status) when authenticated', async () => {
      const caseId = await seedTestCase();

      const res = await request(`/api/cases/${caseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Updated Title',
          status: 'closed',
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.success).toBe(true);
      expect(body.data.title).toBe('Updated Title');
      expect(body.data.status).toBe('closed');
    });

    it('returns 404 for nonexistent case', async () => {
      const res = await request('/api/cases/nonexistent', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Does Not Exist',
        }),
      });

      expect(res.status).toBe(404);
    });

    it('rejects unauthenticated update (401)', async () => {
      const caseId = await seedTestCase();

      const res = await request(`/api/cases/${caseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Unauthorized Update',
        }),
      });

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/cases/:id', () => {
    it('deletes case when authenticated', async () => {
      const caseId = await seedTestCase();

      const res = await request(`/api/cases/${caseId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.success).toBe(true);

      // Verify the case is actually deleted
      const getRes = await request(`/api/cases/${caseId}`);
      expect(getRes.status).toBe(404);
    });

    it('returns 404 for nonexistent case', async () => {
      const res = await request('/api/cases/nonexistent', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.status).toBe(404);
    });

    it('rejects unauthenticated delete (401)', async () => {
      const caseId = await seedTestCase();

      const res = await request(`/api/cases/${caseId}`, {
        method: 'DELETE',
      });

      expect(res.status).toBe(401);
    });
  });
});
