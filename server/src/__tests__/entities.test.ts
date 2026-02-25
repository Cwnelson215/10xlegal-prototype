import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import http from 'http';
import { setupTestDb, getTestDb, closeTestDb } from './helpers.js';

vi.mock('../db/connection.js', () => ({
  getDb: () => getTestDb(),
  initDb: async () => {},
}));

import { app } from '../app.js';

let server: http.Server;
let baseUrl: string;

async function request(path: string) {
  return fetch(`${baseUrl}${path}`);
}

describe('Entity routes', () => {
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
