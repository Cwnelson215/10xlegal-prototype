import pg from 'pg';
import { config } from '../config.js';

const { Pool } = pg;

let pool: pg.Pool;

export async function initDb(): Promise<void> {
  pool = new Pool({
    connectionString: config.databaseUrl,
  });

  // Verify connectivity
  const client = await pool.connect();
  client.release();
}

export function getDb(): pg.Pool {
  if (!pool) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return pool;
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
  }
}
