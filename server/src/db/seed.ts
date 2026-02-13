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
  judge: string;
  prosecutionAttorney: string;
  prosecutionFirm: string;
  defenseAttorney: string;
  defenseFirm: string;
  charge: string;
  courtDate: string;
  ruling: string;
  sentence: string;
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

export function seedDatabase(): void {
  const db = getDb();

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) {
    console.log('Database already seeded, skipping');
    return;
  }

  console.log('Seeding database...');
  const hashedPassword = bcryptjs.hashSync('password123', 10);

  // Seed users
  const usersPath = path.join(dataDir, 'fake-users.json');
  const users: FakeUser[] = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
  const now = new Date().toISOString();

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertUserMany = db.transaction((items: FakeUser[]) => {
    for (const u of items) {
      insertUser.run(u.id, u.name, u.email, hashedPassword, u.role, now, now);
    }
  });
  insertUserMany(users);
  console.log(`  Seeded ${users.length} users`);

  // Seed cases
  const casesPath = path.join(dataDir, 'fake-cases.json');
  const cases: FakeCase[] = JSON.parse(fs.readFileSync(casesPath, 'utf-8'));

  const insertCase = db.prepare(`
    INSERT INTO cases (id, title, description, status, case_number, client_id, lawyer_id,
      county, judge, prosecution_attorney, prosecution_firm, defense_attorney, defense_firm,
      charge, court_date, ruling, sentence, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Build a caseNumber -> id map for deadlines
  const caseNumberToId = new Map<string, string>();

  const insertCaseMany = db.transaction((items: FakeCase[]) => {
    for (const c of items) {
      const id = uuidv4();
      const title = `${c.charge} - ${c.caseNumber}`;
      const status = rulingToStatus(c.ruling);
      const description = `${c.charge} case in ${c.county} County`;

      caseNumberToId.set(c.caseNumber, id);

      insertCase.run(
        id, title, description, status, c.caseNumber, c.clientId, '',
        c.county, c.judge, c.prosecutionAttorney, c.prosecutionFirm,
        c.defenseAttorney, c.defenseFirm, c.charge, c.courtDate,
        c.ruling, c.sentence, now, now
      );
    }
  });
  insertCaseMany(cases);
  console.log(`  Seeded ${cases.length} cases`);

  // Seed deadlines
  const deadlinesPath = path.join(dataDir, 'fake-deadlines.json');
  const deadlines: FakeDeadline[] = JSON.parse(fs.readFileSync(deadlinesPath, 'utf-8'));

  const insertDeadline = db.prepare(`
    INSERT INTO deadlines (id, title, description, due_date, case_id, case_number, assigned_to, status, client_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertDeadlineMany = db.transaction((items: FakeDeadline[]) => {
    for (const d of items) {
      const caseId = caseNumberToId.get(d.caseNumber) || '';
      insertDeadline.run(
        d.id, d.title, d.description, d.dueDate, caseId, d.caseNumber,
        d.assignedTo, d.status, d.clientId, now, now
      );
    }
  });
  insertDeadlineMany(deadlines);
  console.log(`  Seeded ${deadlines.length} deadlines`);

  // Seed team members from users
  const insertTeamMember = db.prepare(`
    INSERT INTO team_members (id, user_id, name, email, role, joined_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertTeamMany = db.transaction((items: FakeUser[]) => {
    for (const u of items) {
      insertTeamMember.run(uuidv4(), u.id, u.name, u.email, u.role, now);
    }
  });
  insertTeamMany(users);
  console.log(`  Seeded ${users.length} team members`);

  console.log('Database seeding complete');
}
