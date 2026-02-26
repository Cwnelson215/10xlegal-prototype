import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcryptjs from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from './connection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', '..', '..', 'src', 'data');

interface FakeUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface FakeCase {
  caseNumber: string;
  county: string;
  prosecutionAttorney: string;
  prosecutionFirm: string;
  defenseAttorney: string;
  defenseFirm: string;
  charge: string;
  courtDate: string;
  ruling: string;
  sentence: string;
  convictionOutcome: string;
  convictionDate: string;
  courtDistrict: string;
  courtLocation: string;
  filingDate: string;
  dispositionDate: string;
  clientId: string;
}

interface FakeDeadline {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  caseNumber: string;
  assignedTo: string;
  status: string;
  clientId: string;
}

function rulingToStatus(ruling: string): string {
  switch (ruling) {
    case 'Guilty':
    case 'Not Guilty':
    case 'Dismissed':
    case 'Plea Deal':
      return 'closed';
    case 'Mistrial':
      return 'on-hold';
    case 'Deferred':
      return 'pending';
    default:
      return 'active';
  }
}

export async function seedDatabase(): Promise<void> {
  const pool = getDb();

  const userCountResult = await pool.query('SELECT COUNT(*)::int as count FROM users');
  const usersExist = userCountResult.rows[0]!.count > 0;

  const forceReseed = process.env.FORCE_RESEED === 'true';

  if (usersExist && !forceReseed) {
    // Check if cases need reseeding: stale data (empty conviction fields) OR no cases at all
    const caseCheck = await pool.query(
      `SELECT COUNT(*)::int as total,
              COUNT(*) FILTER (WHERE conviction_outcome = '' OR conviction_outcome IS NULL)::int as stale
       FROM cases`
    );
    const { total, stale } = caseCheck.rows[0]!;
    if (total === 0 || stale > 0) {
      console.log('Detected stale/missing case data, reseeding...');
      // DELETEs happen inside the transaction below
    } else {
      console.log('Database already seeded with current data');
      return;
    }
  } else if (forceReseed) {
    console.log('FORCE_RESEED enabled, reseeding database...');
  }

  console.log('Seeding database...');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const now = new Date().toISOString();

    if (usersExist) {
      // Clean out stale data inside the transaction so rollback is safe
      await client.query('DELETE FROM deadlines');
      await client.query('DELETE FROM cases');
      await client.query('DELETE FROM attorneys');
      await client.query('DELETE FROM law_firms');
    }

    // Seed users and team members only on fresh database
    if (!usersExist) {
      const hashedPassword = bcryptjs.hashSync('password123', 10);
      const usersPath = path.join(dataDir, 'fake-users.json');
      const users: FakeUser[] = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));

      for (const u of users) {
        await client.query(
          `INSERT INTO users (id, name, email, password, role, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [u.id, u.name, u.email, hashedPassword, u.role, now, now]
        );
      }
      console.log(`  Seeded ${users.length} users`);

      for (const u of users) {
        await client.query(
          `INSERT INTO team_members (id, user_id, name, email, role, joined_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [uuidv4(), u.id, u.name, u.email, u.role, now]
        );
      }
      console.log(`  Seeded ${users.length} team members`);
    }

    // Load cases to extract entities
    const casesPath = path.join(dataDir, 'fake-cases.json');
    const cases: FakeCase[] = JSON.parse(fs.readFileSync(casesPath, 'utf-8'));

    // Extract unique firms (track which side they appear on)
    const firmSides = new Map<string, Set<string>>();
    for (const c of cases) {
      if (c.prosecutionFirm) {
        if (!firmSides.has(c.prosecutionFirm)) firmSides.set(c.prosecutionFirm, new Set());
        firmSides.get(c.prosecutionFirm)!.add('prosecution');
      }
      if (c.defenseFirm) {
        if (!firmSides.has(c.defenseFirm)) firmSides.set(c.defenseFirm, new Set());
        firmSides.get(c.defenseFirm)!.add('defense');
      }
    }
    const firmNameToId = new Map<string, string>();
    for (const [name, sides] of firmSides.entries()) {
      const id = uuidv4();
      firmNameToId.set(name, id);
      const type = sides.size === 1 ? [...sides][0]! : '';
      await client.query(
        `INSERT INTO law_firms (id, name, type, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)`,
        [id, name, type, now, now]
      );
    }
    console.log(`  Seeded ${firmSides.size} law firms`);

    // Extract unique attorneys
    const attorneyKeys = new Map<string, { name: string; type: string; firmId: string | null }>();
    for (const c of cases) {
      if (c.prosecutionAttorney) {
        const key = `prosecution:${c.prosecutionAttorney}`;
        if (!attorneyKeys.has(key)) {
          attorneyKeys.set(key, {
            name: c.prosecutionAttorney,
            type: 'prosecution',
            firmId: firmNameToId.get(c.prosecutionFirm) ?? null,
          });
        }
      }
      if (c.defenseAttorney) {
        const key = `defense:${c.defenseAttorney}`;
        if (!attorneyKeys.has(key)) {
          attorneyKeys.set(key, {
            name: c.defenseAttorney,
            type: 'defense',
            firmId: firmNameToId.get(c.defenseFirm) ?? null,
          });
        }
      }
    }
    const attorneyKeyToId = new Map<string, string>();
    for (const [key, att] of attorneyKeys.entries()) {
      const id = uuidv4();
      attorneyKeyToId.set(key, id);
      await client.query(
        `INSERT INTO attorneys (id, name, type, firm_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, att.name, att.type, att.firmId, now, now]
      );
    }
    console.log(`  Seeded ${attorneyKeys.size} attorneys`);

    // Seed cases with entity FK references
    const caseNumberToId = new Map<string, string>();

    for (const c of cases) {
      const id = uuidv4();
      const title = `${c.charge} - ${c.caseNumber}`;
      const status = rulingToStatus(c.ruling);
      const description = `${c.charge} case in ${c.county} County`;

      caseNumberToId.set(c.caseNumber, id);

      const prosAttId = attorneyKeyToId.get(`prosecution:${c.prosecutionAttorney}`) ?? null;
      const defAttId = attorneyKeyToId.get(`defense:${c.defenseAttorney}`) ?? null;
      const prosFirmId = firmNameToId.get(c.prosecutionFirm) ?? null;
      const defFirmId = firmNameToId.get(c.defenseFirm) ?? null;

      await client.query(
        `INSERT INTO cases (id, title, description, status, case_number, client_id, lawyer_id,
          county, prosecution_attorney, prosecution_attorney_id,
          prosecution_firm, prosecution_firm_id, defense_attorney, defense_attorney_id,
          defense_firm, defense_firm_id, charge, court_date, ruling, sentence,
          conviction_outcome, conviction_date, court_district, court_location,
          filing_date, disposition_date, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)`,
        [
          id, title, description, status, c.caseNumber, c.clientId, '',
          c.county,
          c.prosecutionAttorney, prosAttId,
          c.prosecutionFirm, prosFirmId,
          c.defenseAttorney, defAttId,
          c.defenseFirm, defFirmId,
          c.charge, c.courtDate, c.ruling, c.sentence,
          c.convictionOutcome || '', c.convictionDate || '',
          c.courtDistrict || '', c.courtLocation || '',
          c.filingDate || '', c.dispositionDate || '', now, now,
        ]
      );
    }
    console.log(`  Seeded ${cases.length} cases`);

    // Seed deadlines
    const deadlinesPath = path.join(dataDir, 'fake-deadlines.json');
    const deadlines: FakeDeadline[] = JSON.parse(fs.readFileSync(deadlinesPath, 'utf-8'));

    for (const d of deadlines) {
      const caseId = caseNumberToId.get(d.caseNumber) || '';
      await client.query(
        `INSERT INTO deadlines (id, title, description, due_date, case_id, case_number, assigned_to, status, client_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [d.id, d.title, d.description, d.dueDate, caseId, d.caseNumber, d.assignedTo, d.status, d.clientId, now, now]
      );
    }
    console.log(`  Seeded ${deadlines.length} deadlines`);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  console.log('Database seeding complete');
}
