import Database, { type Database as DatabaseType } from 'better-sqlite3';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';

let testDb: DatabaseType;

export function setupTestDb(): DatabaseType {
  testDb = new Database(':memory:');
  testDb.pragma('journal_mode = WAL');
  testDb.pragma('foreign_keys = ON');

  // Create schema
  testDb.exec(`
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
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE refresh_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE judges (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE law_firms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE attorneys (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('prosecution', 'defense')),
      firm_id TEXT REFERENCES law_firms(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE cases (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active',
      case_number TEXT NOT NULL UNIQUE,
      client_id TEXT NOT NULL,
      lawyer_id TEXT NOT NULL DEFAULT '',
      county TEXT NOT NULL DEFAULT '',
      judge TEXT NOT NULL DEFAULT '',
      judge_id TEXT REFERENCES judges(id),
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
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE documents (
      id TEXT PRIMARY KEY,
      file_name TEXT NOT NULL,
      file_size INTEGER NOT NULL DEFAULT 0,
      file_type TEXT NOT NULL DEFAULT '',
      url TEXT NOT NULL DEFAULT '',
      case_id TEXT NOT NULL,
      uploaded_by TEXT NOT NULL,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
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
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE team_members (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL,
      joined_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  return testDb;
}

export function getTestDb(): DatabaseType {
  return testDb;
}

export function closeTestDb() {
  if (testDb) testDb.close();
}

export function seedTestUser(role: string = 'legal-official') {
  const id = uuidv4();
  const hashedPassword = bcryptjs.hashSync('password123', 10);
  const now = new Date().toISOString();
  testDb.prepare(`
    INSERT INTO users (id, name, email, password, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, `Test ${role}`, `${role}@test.com`, hashedPassword, role, now, now);
  return { id, email: `${role}@test.com`, name: `Test ${role}`, role };
}

export function generateToken(user: { id: string; name: string; email: string; role: string }) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: '1h' }
  );
}

export function seedTestCase(judgeId?: string) {
  const id = uuidv4();
  const now = new Date().toISOString();
  testDb.prepare(`
    INSERT INTO cases (id, title, description, status, case_number, client_id, county, judge, judge_id, charge, court_date, ruling, sentence, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, 'Test Case', 'Description', 'active', `21-CR-${Math.floor(Math.random() * 99999)}`, 'client-1', 'Salt Lake', 'Hon. Test Judge', judgeId ?? null, 'Test Charge', '2026-06-15', 'Pending', '', now, now);
  return id;
}

