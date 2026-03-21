import pg from 'pg';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';

const { Pool } = pg;

let testPool: pg.Pool;
let schemaName: string;

const testDbUrl = process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/10xlegal_test';

export async function setupTestDb(): Promise<pg.Pool> {
  // Each test suite gets its own schema to avoid parallel conflicts
  schemaName = `test_${uuidv4().replace(/-/g, '_')}`;

  // Use a temporary pool to create the schema
  const setupPool = new Pool({ connectionString: testDbUrl });
  await setupPool.query(`CREATE SCHEMA ${schemaName}`);
  await setupPool.end();

  // Create the real pool with search_path set so all connections use the schema
  const url = new URL(testDbUrl);
  url.searchParams.set('options', `-c search_path=${schemaName}`);
  testPool = new Pool({ connectionString: url.toString() });

  await testPool.query(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('client', 'lawyer', 'legal-official')),
      lawyer_state_bar TEXT,
      lawyer_bar_number TEXT,
      official_agency TEXT,
      official_id TEXT,
      verification_status TEXT DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT NOW(),
      updated_at TEXT NOT NULL DEFAULT NOW()
    );

    CREATE TABLE refresh_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT NOW()
    );

    CREATE TABLE law_firms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT NOW(),
      updated_at TEXT NOT NULL DEFAULT NOW()
    );

    CREATE TABLE attorneys (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('prosecution', 'defense')),
      firm_id TEXT REFERENCES law_firms(id),
      created_at TEXT NOT NULL DEFAULT NOW(),
      updated_at TEXT NOT NULL DEFAULT NOW()
    );

    CREATE TABLE cases (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active',
      case_number TEXT NOT NULL UNIQUE,
      client_id TEXT NOT NULL,
      lawyer_id TEXT NOT NULL DEFAULT '',
      court TEXT NOT NULL DEFAULT '',
      prosecution_attorney TEXT NOT NULL DEFAULT '',
      prosecution_attorney_id TEXT REFERENCES attorneys(id),
      prosecution_firm TEXT NOT NULL DEFAULT '',
      prosecution_firm_id TEXT REFERENCES law_firms(id),
      defense_attorney TEXT NOT NULL DEFAULT '',
      defense_attorney_id TEXT REFERENCES attorneys(id),
      defense_firm TEXT NOT NULL DEFAULT '',
      defense_firm_id TEXT REFERENCES law_firms(id),
      charge TEXT NOT NULL DEFAULT '',
      court_date TEXT NOT NULL DEFAULT '',
      ruling TEXT NOT NULL DEFAULT '',
      sentence TEXT NOT NULL DEFAULT '',
      conviction_outcome TEXT NOT NULL DEFAULT '',
      conviction_date TEXT NOT NULL DEFAULT '',
      district_number TEXT NOT NULL DEFAULT '',
      filing_date TEXT NOT NULL DEFAULT '',
      disposition_date TEXT NOT NULL DEFAULT '',
      case_type TEXT NOT NULL DEFAULT '',
      offense_code TEXT NOT NULL DEFAULT '',
      sentence_date TEXT NOT NULL DEFAULT '',
      charges TEXT NOT NULL DEFAULT '',
      judgment_description TEXT NOT NULL DEFAULT '',
      sentence_description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT NOW(),
      updated_at TEXT NOT NULL DEFAULT NOW()
    );

    CREATE TABLE documents (
      id TEXT PRIMARY KEY,
      file_name TEXT NOT NULL,
      file_size INTEGER NOT NULL DEFAULT 0,
      file_type TEXT NOT NULL DEFAULT '',
      url TEXT NOT NULL DEFAULT '',
      case_id TEXT NOT NULL,
      uploaded_by TEXT NOT NULL,
      uploaded_at TEXT NOT NULL DEFAULT NOW(),
      version INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE deadlines (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      due_date TEXT NOT NULL,
      case_id TEXT NOT NULL DEFAULT '',
      case_number TEXT NOT NULL DEFAULT '',
      assigned_to TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      client_id TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT NOW(),
      updated_at TEXT NOT NULL DEFAULT NOW()
    );

`);

  return testPool;
}

export function getTestDb(): pg.Pool {
  return testPool;
}

export async function closeTestDb() {
  if (testPool) {
    await testPool.query(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`);
    await testPool.end();
  }
}

export async function seedTestUser(role: string = 'legal-official') {
  const id = uuidv4();
  const hashedPassword = bcryptjs.hashSync('password123', 10);
  const now = new Date().toISOString();
  await testPool.query(`
    INSERT INTO users (id, name, email, password, role, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [id, `Test ${role}`, `${role}@test.com`, hashedPassword, role, now, now]);
  return { id, email: `${role}@test.com`, name: `Test ${role}`, role };
}

export function generateToken(user: { id: string; name: string; email: string; role: string }) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: '1h' }
  );
}

export async function seedTestCase() {
  const id = uuidv4();
  const now = new Date().toISOString();
  await testPool.query(`
    INSERT INTO cases (id, title, description, status, case_number, client_id, court, charge, court_date, ruling, sentence, conviction_outcome, conviction_date, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
  `, [id, 'Test Case', 'Description', 'active', `21-CR-${Math.floor(Math.random() * 99999)}`, 'client-1', 'Salt Lake', 'Test Charge', '2026-06-15', 'Pending', '', 'Guilty', '2026-06-20', now, now]);
  return id;
}
