import { getDb } from './connection.js';

export async function runSchema(): Promise<void> {
  const pool = getDb();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('client', 'lawyer', 'legal-official', 'admin')),
      lawyer_state_bar TEXT,
      lawyer_bar_number TEXT,
      official_agency TEXT,
      official_id TEXT,
      verification_status TEXT DEFAULT 'pending' CHECK(verification_status IN ('pending', 'verified', 'rejected')),
      created_at TEXT NOT NULL DEFAULT NOW(),
      updated_at TEXT NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS law_firms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL DEFAULT '' CHECK(type IN ('prosecution', 'defense', '')),
      created_at TEXT NOT NULL DEFAULT NOW(),
      updated_at TEXT NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS attorneys (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('prosecution', 'defense')),
      firm_id TEXT REFERENCES law_firms(id),
      created_at TEXT NOT NULL DEFAULT NOW(),
      updated_at TEXT NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('pending', 'active', 'on-hold', 'closed')),
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
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      file_name TEXT NOT NULL,
      file_size INTEGER NOT NULL DEFAULT 0,
      file_type TEXT NOT NULL DEFAULT '',
      url TEXT NOT NULL DEFAULT '',
      case_id TEXT NOT NULL,
      uploaded_by TEXT NOT NULL,
      uploaded_at TEXT NOT NULL DEFAULT NOW(),
      version INTEGER NOT NULL DEFAULT 1
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS deadlines (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      due_date TEXT NOT NULL,
      case_id TEXT NOT NULL DEFAULT '',
      case_number TEXT NOT NULL DEFAULT '',
      assigned_to TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'overdue')),
      client_id TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT NOW(),
      updated_at TEXT NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS import_history (
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
      created_at TEXT NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      details TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT NOW()
    )
  `);

  // Migrate: add columns if missing (for existing databases)
  await pool.query(`
    ALTER TABLE cases ADD COLUMN IF NOT EXISTS conviction_outcome TEXT NOT NULL DEFAULT ''
  `);
  await pool.query(`
    ALTER TABLE cases ADD COLUMN IF NOT EXISTS conviction_date TEXT NOT NULL DEFAULT ''
  `);
  await pool.query(`
    ALTER TABLE cases ADD COLUMN IF NOT EXISTS filing_date TEXT NOT NULL DEFAULT ''
  `);
  await pool.query(`
    ALTER TABLE cases ADD COLUMN IF NOT EXISTS disposition_date TEXT NOT NULL DEFAULT ''
  `);
  await pool.query(`
    ALTER TABLE cases ADD COLUMN IF NOT EXISTS case_type TEXT NOT NULL DEFAULT ''
  `);
  await pool.query(`
    ALTER TABLE cases ADD COLUMN IF NOT EXISTS offense_code TEXT NOT NULL DEFAULT ''
  `);
  await pool.query(`
    ALTER TABLE cases ADD COLUMN IF NOT EXISTS sentence_date TEXT NOT NULL DEFAULT ''
  `);
  await pool.query(`
    ALTER TABLE cases ADD COLUMN IF NOT EXISTS charges TEXT NOT NULL DEFAULT ''
  `);
  await pool.query(`
    ALTER TABLE cases ADD COLUMN IF NOT EXISTS court TEXT NOT NULL DEFAULT ''
  `);
  await pool.query(`
    ALTER TABLE cases ADD COLUMN IF NOT EXISTS district_number TEXT NOT NULL DEFAULT ''
  `);
  await pool.query(`
    ALTER TABLE cases ADD COLUMN IF NOT EXISTS judgment_description TEXT NOT NULL DEFAULT ''
  `);
  await pool.query(`
    ALTER TABLE cases ADD COLUMN IF NOT EXISTS sentence_description TEXT NOT NULL DEFAULT ''
  `);

  // Migrate: copy county data to court before dropping
  await pool.query(`
    UPDATE cases SET court = county WHERE court = '' AND county != ''
  `).catch(() => { /* county column may not exist */ });

  // Migrate: drop obsolete columns
  await pool.query(`ALTER TABLE cases DROP COLUMN IF EXISTS county`);
  await pool.query(`ALTER TABLE cases DROP COLUMN IF EXISTS court_district`);
  await pool.query(`ALTER TABLE cases DROP COLUMN IF EXISTS court_location`);
  await pool.query(`ALTER TABLE cases DROP COLUMN IF EXISTS court_type`);

  // Migrate: drop judge remnants from existing databases
  await pool.query(`ALTER TABLE cases DROP COLUMN IF EXISTS judge`);
  await pool.query(`ALTER TABLE cases DROP COLUMN IF EXISTS judge_id`);
  await pool.query(`DROP TABLE IF EXISTS judges`);
  await pool.query(`DROP TABLE IF EXISTS team_members`);

  console.log('Database schema initialized');
}
