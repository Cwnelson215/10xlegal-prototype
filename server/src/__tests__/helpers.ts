import { PGlite } from '@electric-sql/pglite';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';

let pglite: PGlite;

// pg.Pool-compatible wrapper around PGlite
const poolProxy = {
  async query(text: string, params?: unknown[]) {
    return pglite.query(text, params as any[]);
  },
};

async function exec(sql: string) {
  // Split multi-statement SQL and execute one at a time
  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
  for (const stmt of statements) {
    await pglite.query(stmt);
  }
}

export async function setupTestDb() {
  pglite = new PGlite();

  await exec(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('client', 'lawyer', 'legal-official', 'admin')),
      lawyer_state_bar TEXT,
      lawyer_bar_number TEXT,
      official_agency TEXT,
      official_id TEXT,
      verification_status TEXT DEFAULT 'pending',
      admin_password TEXT,
      created_at TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE refresh_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE law_firms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE attorneys (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('prosecution', 'defense')),
      firm_id TEXT REFERENCES law_firms(id),
      created_at TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE judges (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      court TEXT NOT NULL DEFAULT '',
      district TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE cases (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('pending', 'active', 'on-hold', 'closed')),
      case_number TEXT NOT NULL,
      client_id TEXT NOT NULL,
      lawyer_id TEXT NOT NULL DEFAULT '',
      court TEXT NOT NULL DEFAULT '',
      prosecution_firm TEXT NOT NULL DEFAULT '',
      prosecution_firm_id TEXT REFERENCES law_firms(id),
      defense_firm TEXT NOT NULL DEFAULT '',
      defense_firm_id TEXT REFERENCES law_firms(id),
      judge_name TEXT NOT NULL DEFAULT '',
      judge_id TEXT REFERENCES judges(id),
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
      created_at TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE case_attorneys (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
      attorney_id TEXT NOT NULL REFERENCES attorneys(id),
      side TEXT NOT NULL CHECK(side IN ('prosecution', 'defense')),
      attorney_name TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE documents (
      id TEXT PRIMARY KEY,
      file_name TEXT NOT NULL,
      file_size INTEGER NOT NULL DEFAULT 0,
      file_type TEXT NOT NULL DEFAULT '',
      url TEXT NOT NULL DEFAULT '',
      case_id TEXT NOT NULL,
      uploaded_by TEXT NOT NULL,
      uploaded_at TEXT NOT NULL DEFAULT '',
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
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'overdue')),
      client_id TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE import_history (
      id TEXT PRIMARY KEY,
      data_type TEXT NOT NULL,
      format TEXT NOT NULL,
      file_name TEXT NOT NULL DEFAULT '',
      total_rows INTEGER NOT NULL DEFAULT 0,
      imported_rows INTEGER NOT NULL DEFAULT 0,
      failed_rows INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('completed', 'partial', 'failed')),
      errors TEXT NOT NULL DEFAULT '[]',
      imported_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE audit_log (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      details TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT ''
    );

    CREATE UNIQUE INDEX attorneys_name_type_idx ON attorneys (name, type);
    CREATE UNIQUE INDEX cases_case_number_district_idx ON cases (case_number, district_number);
    CREATE UNIQUE INDEX case_attorneys_case_attorney_idx ON case_attorneys (case_id, attorney_id)
  `);

  return poolProxy;
}

export function getTestDb() {
  return poolProxy;
}

export async function closeTestDb() {
  if (pglite) {
    await pglite.close();
  }
}

export async function seedTestUser(role: string = 'legal-official') {
  const id = uuidv4();
  const hashedPassword = bcryptjs.hashSync('password123', 10);
  const now = new Date().toISOString();
  await pglite.query(`
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

export async function seedTestCase(overrides: Record<string, string> = {}) {
  const id = uuidv4();
  const now = new Date().toISOString();
  await pglite.query(`
    INSERT INTO cases (id, title, description, status, case_number, client_id, court, charge, court_date, ruling, sentence, conviction_outcome, conviction_date, district_number, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
  `, [
    id,
    overrides.title || 'Test Case',
    overrides.description || 'Description',
    overrides.status || 'active',
    overrides.caseNumber || `21-CR-${Math.floor(Math.random() * 99999)}`,
    overrides.clientId || 'client-1',
    overrides.court || 'Salt Lake',
    overrides.charge || 'Test Charge',
    overrides.courtDate || '2026-06-15',
    overrides.ruling || 'Pending',
    overrides.sentence || '',
    overrides.convictionOutcome || 'Guilty',
    overrides.convictionDate || '2026-06-20',
    overrides.districtNumber || '',
    now, now,
  ]);
  return id;
}

export async function seedTestFirm(name = 'Test Firm') {
  const id = uuidv4();
  const now = new Date().toISOString();
  await pglite.query(
    `INSERT INTO law_firms (id, name, type, created_at, updated_at) VALUES ($1, $2, '', $3, $4)`,
    [id, name, now, now]
  );
  return id;
}

export async function seedTestAttorney(type: 'prosecution' | 'defense' = 'prosecution', firmId?: string, name?: string) {
  const id = uuidv4();
  const now = new Date().toISOString();
  await pglite.query(
    `INSERT INTO attorneys (id, name, type, firm_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, name || `Test ${type} attorney`, type, firmId || null, now, now]
  );
  return id;
}

export async function seedTestJudge(name = 'Test Judge', title = 'Judge', court = 'Salt Lake', district = '3') {
  const id = uuidv4();
  const now = new Date().toISOString();
  await pglite.query(
    `INSERT INTO judges (id, name, title, court, district, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, name, title, court, district, now, now]
  );
  return id;
}

export async function seedTestDeadline(caseId = '', title = 'Test Deadline') {
  const id = uuidv4();
  const now = new Date().toISOString();
  await pglite.query(
    `INSERT INTO deadlines (id, title, description, due_date, case_id, status, created_at, updated_at)
     VALUES ($1, $2, '', '2026-07-01', $3, 'pending', $4, $5)`,
    [id, title, caseId, now, now]
  );
  return id;
}
