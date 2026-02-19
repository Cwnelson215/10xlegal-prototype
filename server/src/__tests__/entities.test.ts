import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import http from 'http';
import { setupTestDb, getTestDb, closeTestDb, seedTestJudge, seedTestCase } from './helpers.js';

vi.mock('../db/connection.js', () => ({
  getDb: () => getTestDb(),
  initDb: () => {},
}));

import { app } from '../app.js';

let server: http.Server;
let baseUrl: string;

async function request(path: string) {
  return fetch(`${baseUrl}${path}`);
}

describe('Entity routes', () => {
  let judgeId: string;

  beforeAll(async () => {
    setupTestDb();
    judgeId = seedTestJudge();
    seedTestCase(judgeId);
    seedTestCase(judgeId);

    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, () => resolve());
    });
    const addr = server.address() as { port: number };
    baseUrl = `http://localhost:${addr.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    closeTestDb();
  });

  describe('GET /api/judges', () => {
    it('lists judges', async () => {
      const res = await request('/api/judges');
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.data).toBeDefined();
      expect(body.data.length).toBeGreaterThanOrEqual(1);
      expect(body.data[0].name).toBe('Hon. Test Judge');
      expect(body.data[0].caseCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /api/judges/:id', () => {
    it('returns judge profile with stats', async () => {
      const res = await request(`/api/judges/${judgeId}`);
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('Hon. Test Judge');
      expect(body.data.caseCount).toBeGreaterThanOrEqual(2);
      expect(body.data.counties).toContain('Salt Lake');
      expect(body.data.rulingDistribution).toBeDefined();
    });

    it('returns 404 for nonexistent judge', async () => {
      const res = await request('/api/judges/nonexistent');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/attorneys', () => {
    it('returns empty list when no attorneys seeded', async () => {
      const res = await request('/api/attorneys');
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(Array.isArray(body.data)).toBe(true);
    });
  });

  describe('GET /api/firms', () => {
    it('returns empty list when no firms seeded', async () => {
      const res = await request('/api/firms');
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(Array.isArray(body.data)).toBe(true);
    });
  });
});
