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

  // Load cases to extract entities
  const casesPath = path.join(dataDir, 'fake-cases.json');
  const cases: FakeCase[] = JSON.parse(fs.readFileSync(casesPath, 'utf-8'));

  // Extract unique judges
  const judgeNames = new Set<string>();
  for (const c of cases) {
    if (c.judge) judgeNames.add(c.judge);
  }
  const judgeNameToId = new Map<string, string>();
  const insertJudge = db.prepare(`
    INSERT INTO judges (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)
  `);
  const insertJudgeMany = db.transaction((names: string[]) => {
    for (const name of names) {
      const id = uuidv4();
      judgeNameToId.set(name, id);
      insertJudge.run(id, name, now, now);
    }
  });
  insertJudgeMany([...judgeNames]);
  console.log(`  Seeded ${judgeNames.size} judges`);

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
  const insertFirm = db.prepare(`
    INSERT INTO law_firms (id, name, type, created_at, updated_at) VALUES (?, ?, ?, ?, ?)
  `);
  const insertFirmMany = db.transaction((entries: [string, Set<string>][]) => {
    for (const [name, sides] of entries) {
      const id = uuidv4();
      firmNameToId.set(name, id);
      // If firm appears on both sides, leave type empty
      const type = sides.size === 1 ? [...sides][0]! : '';
      insertFirm.run(id, name, type, now, now);
    }
  });
  insertFirmMany([...firmSides.entries()]);
  console.log(`  Seeded ${firmSides.size} law firms`);

  // Extract unique attorneys (name + type combo to handle same-name attorneys on different sides)
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
  const insertAttorney = db.prepare(`
    INSERT INTO attorneys (id, name, type, firm_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertAttorneyMany = db.transaction((entries: [string, { name: string; type: string; firmId: string | null }][]) => {
    for (const [key, att] of entries) {
      const id = uuidv4();
      attorneyKeyToId.set(key, id);
      insertAttorney.run(id, att.name, att.type, att.firmId, now, now);
    }
  });
  insertAttorneyMany([...attorneyKeys.entries()]);
  console.log(`  Seeded ${attorneyKeys.size} attorneys`);

  // Seed cases with entity FK references
  const insertCase = db.prepare(`
    INSERT INTO cases (id, title, description, status, case_number, client_id, lawyer_id,
      county, judge, judge_id, prosecution_attorney, prosecution_attorney_id,
      prosecution_firm, prosecution_firm_id, defense_attorney, defense_attorney_id,
      defense_firm, defense_firm_id, charge, court_date, ruling, sentence, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const caseNumberToId = new Map<string, string>();

  const insertCaseMany = db.transaction((items: FakeCase[]) => {
    for (const c of items) {
      const id = uuidv4();
      const title = `${c.charge} - ${c.caseNumber}`;
      const status = rulingToStatus(c.ruling);
      const description = `${c.charge} case in ${c.county} County`;

      caseNumberToId.set(c.caseNumber, id);

      const judgeId = judgeNameToId.get(c.judge) ?? null;
      const prosAttId = attorneyKeyToId.get(`prosecution:${c.prosecutionAttorney}`) ?? null;
      const defAttId = attorneyKeyToId.get(`defense:${c.defenseAttorney}`) ?? null;
      const prosFirmId = firmNameToId.get(c.prosecutionFirm) ?? null;
      const defFirmId = firmNameToId.get(c.defenseFirm) ?? null;

      insertCase.run(
        id, title, description, status, c.caseNumber, c.clientId, '',
        c.county, c.judge, judgeId,
        c.prosecutionAttorney, prosAttId,
        c.prosecutionFirm, prosFirmId,
        c.defenseAttorney, defAttId,
        c.defenseFirm, defFirmId,
        c.charge, c.courtDate, c.ruling, c.sentence, now, now
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
