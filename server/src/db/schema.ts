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
    CREATE TABLE IF NOT EXISTS judges (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      court TEXT NOT NULL DEFAULT '',
      district TEXT NOT NULL DEFAULT '',
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
      judge_name TEXT NOT NULL DEFAULT '',
      judge_id TEXT REFERENCES judges(id),
      prosecution_arguing_attorney TEXT NOT NULL DEFAULT '',
      prosecution_arguing_attorney_id TEXT REFERENCES attorneys(id),
      defense_arguing_attorney TEXT NOT NULL DEFAULT '',
      defense_arguing_attorney_id TEXT REFERENCES attorneys(id),
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

  // Migrate: add admin_password column for separate admin verification
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_password TEXT
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

  // Migrate: drop obsolete team_members table
  await pool.query(`DROP TABLE IF EXISTS team_members`);

  // Migrate: add judge columns if missing (for existing databases)
  await pool.query(`ALTER TABLE cases ADD COLUMN IF NOT EXISTS judge_name TEXT NOT NULL DEFAULT ''`);
  await pool.query(`ALTER TABLE cases ADD COLUMN IF NOT EXISTS judge_id TEXT REFERENCES judges(id)`);

  // Migrate: add arguing attorney columns if missing (for existing databases)
  await pool.query(`ALTER TABLE cases ADD COLUMN IF NOT EXISTS prosecution_arguing_attorney TEXT NOT NULL DEFAULT ''`);
  await pool.query(`ALTER TABLE cases ADD COLUMN IF NOT EXISTS prosecution_arguing_attorney_id TEXT REFERENCES attorneys(id)`);
  await pool.query(`ALTER TABLE cases ADD COLUMN IF NOT EXISTS defense_arguing_attorney TEXT NOT NULL DEFAULT ''`);
  await pool.query(`ALTER TABLE cases ADD COLUMN IF NOT EXISTS defense_arguing_attorney_id TEXT REFERENCES attorneys(id)`);

  // Migrate: unique index on attorneys(name, type) for upsert support
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS attorneys_name_type_idx ON attorneys (name, type)
  `);

  // Performance indexes on foreign keys and frequently queried columns
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_cases_prosecution_attorney_id ON cases (prosecution_attorney_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_cases_defense_attorney_id ON cases (defense_attorney_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_cases_client_id ON cases (client_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_cases_prosecution_firm_id ON cases (prosecution_firm_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_cases_defense_firm_id ON cases (defense_firm_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_attorneys_firm_id ON attorneys (firm_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_deadlines_case_id ON deadlines (case_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_documents_case_id ON documents (case_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents (uploaded_by)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log (created_at DESC)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_cases_judge_id ON cases (judge_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_cases_prosecution_arguing_attorney_id ON cases (prosecution_arguing_attorney_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_cases_defense_arguing_attorney_id ON cases (defense_arguing_attorney_id)`);

  // Migrate: normalize existing attorney names from "Last, First" to "First Last" title case
  await pool.query(`
    UPDATE attorneys
    SET name = INITCAP(TRIM(SPLIT_PART(name, ',', 2)) || ' ' || TRIM(SPLIT_PART(name, ',', 1))),
        updated_at = NOW()
    WHERE name LIKE '%,%'
  `);
  await pool.query(`
    UPDATE attorneys SET name = INITCAP(name), updated_at = NOW()
    WHERE name = UPPER(name) AND name NOT LIKE '%,%'
  `);
  await pool.query(`
    UPDATE cases
    SET prosecution_attorney = INITCAP(TRIM(SPLIT_PART(prosecution_attorney, ',', 2)) || ' ' || TRIM(SPLIT_PART(prosecution_attorney, ',', 1))),
        updated_at = NOW()
    WHERE prosecution_attorney LIKE '%,%'
  `);
  await pool.query(`
    UPDATE cases
    SET defense_attorney = INITCAP(TRIM(SPLIT_PART(defense_attorney, ',', 2)) || ' ' || TRIM(SPLIT_PART(defense_attorney, ',', 1))),
        updated_at = NOW()
    WHERE defense_attorney LIKE '%,%'
  `);

  // Migrate: backfill attorney records from existing case data
  // Create prosecution attorneys from cases that have a name but no attorney_id
  await pool.query(`
    INSERT INTO attorneys (id, name, type, created_at, updated_at)
    SELECT gen_random_uuid()::text, prosecution_attorney, 'prosecution', NOW(), NOW()
    FROM cases
    WHERE prosecution_attorney != ''
      AND prosecution_attorney_id IS NULL
    GROUP BY prosecution_attorney
    ON CONFLICT (name, type) DO NOTHING
  `);
  // Create defense attorneys from cases that have a name but no attorney_id
  await pool.query(`
    INSERT INTO attorneys (id, name, type, created_at, updated_at)
    SELECT gen_random_uuid()::text, defense_attorney, 'defense', NOW(), NOW()
    FROM cases
    WHERE defense_attorney != ''
      AND defense_attorney_id IS NULL
    GROUP BY defense_attorney
    ON CONFLICT (name, type) DO NOTHING
  `);
  // Link existing cases to their newly-created attorney records
  await pool.query(`
    UPDATE cases SET prosecution_attorney_id = a.id
    FROM attorneys a
    WHERE cases.prosecution_attorney = a.name
      AND a.type = 'prosecution'
      AND cases.prosecution_attorney != ''
      AND cases.prosecution_attorney_id IS NULL
  `);
  await pool.query(`
    UPDATE cases SET defense_attorney_id = a.id
    FROM attorneys a
    WHERE cases.defense_attorney = a.name
      AND a.type = 'defense'
      AND cases.defense_attorney != ''
      AND cases.defense_attorney_id IS NULL
  `);

  console.log('Database schema initialized');
}
