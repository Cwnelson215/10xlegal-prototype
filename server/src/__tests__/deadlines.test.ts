import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import http from 'http';
import { setupTestDb, getTestDb, closeTestDb, seedTestUser, generateToken, seedTestDeadline } from './helpers.js';

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

describe('Deadlines routes', () => {
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

  describe('GET /api/deadlines', () => {
    it('allows unauthenticated access (optionalAuth)', async () => {
      const res = await request('/api/deadlines');
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.data).toBeDefined();
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('returns paginated response', async () => {
      await seedTestDeadline('', 'Deadline A');
      await seedTestDeadline('', 'Deadline B');

      const res = await request('/api/deadlines?page=1&pageSize=10');
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.total).toBeGreaterThanOrEqual(2);
      expect(body.page).toBe(1);
      expect(body.pageSize).toBe(10);
    });

    it('filters by caseId', async () => {
      const targetCaseId = 'case-filter-test';
      await seedTestDeadline(targetCaseId, 'Filtered Deadline');
      await seedTestDeadline('other-case', 'Other Deadline');

      const res = await request(`/api/deadlines?caseId=${targetCaseId}`);
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.data.length).toBeGreaterThanOrEqual(1);
      for (const deadline of body.data) {
        expect(deadline.caseId).toBe(targetCaseId);
      }
    });
  });

  describe('POST /api/deadlines', () => {
    it('creates a deadline when authenticated', async () => {
      const res = await request('/api/deadlines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'New Deadline',
          dueDate: '2026-08-15',
          caseId: 'case-123',
        }),
      });

      expect(res.status).toBe(201);
      const body = await res.json() as any;
      expect(body.success).toBe(true);
      expect(body.data.title).toBe('New Deadline');
      expect(body.data.dueDate).toBe('2026-08-15');
      expect(body.data.caseId).toBe('case-123');
      expect(body.data.status).toBe('pending');
    });

    it('rejects unauthenticated create', async () => {
      const res = await request('/api/deadlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Unauthorized Deadline',
          dueDate: '2026-08-15',
          caseId: 'case-123',
        }),
      });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/deadlines/:id', () => {
    it('returns a single deadline', async () => {
      const deadlineId = await seedTestDeadline('case-single', 'Single Deadline');

      const res = await request(`/api/deadlines/${deadlineId}`);
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(deadlineId);
      expect(body.data.title).toBe('Single Deadline');
    });

    it('returns 404 for nonexistent deadline', async () => {
      const res = await request('/api/deadlines/nonexistent');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/deadlines/:id', () => {
    it('updates fields when authenticated', async () => {
      const deadlineId = await seedTestDeadline('case-update', 'Update Me');

      const res = await request(`/api/deadlines/${deadlineId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Updated Title',
          description: 'Updated description',
          dueDate: '2026-09-01',
          status: 'completed',
          assignedTo: 'user-456',
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.success).toBe(true);
      expect(body.data.title).toBe('Updated Title');
      expect(body.data.description).toBe('Updated description');
      expect(body.data.dueDate).toBe('2026-09-01');
      expect(body.data.status).toBe('completed');
      expect(body.data.assignedTo).toBe('user-456');
    });

    it('rejects unauthenticated update', async () => {
      const deadlineId = await seedTestDeadline('case-unauth', 'No Auth Update');

      const res = await request(`/api/deadlines/${deadlineId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Should Fail' }),
      });

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/deadlines/:id', () => {
    it('deletes when authenticated', async () => {
      const deadlineId = await seedTestDeadline('case-delete', 'Delete Me');

      const res = await request(`/api/deadlines/${deadlineId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(res.status).toBe(200);

      // Verify it's gone
      const getRes = await request(`/api/deadlines/${deadlineId}`);
      expect(getRes.status).toBe(404);
    });

    it('returns 404 for nonexistent deadline', async () => {
      const res = await request('/api/deadlines/nonexistent', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(res.status).toBe(404);
    });
  });
});
