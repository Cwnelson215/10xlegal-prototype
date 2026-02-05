import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const casesPath = resolve('src/data/fake-cases.json');
const cases = JSON.parse(readFileSync(casesPath, 'utf-8'));

const deadlineTypes = [
  'Motion Filing Deadline',
  'Discovery Response Due',
  'Pre-Trial Conference',
  'Jury Selection',
  'Sentencing Hearing',
  'Appeal Filing Deadline',
  'Plea Hearing',
  'Status Conference',
  'Evidence Submission Deadline',
  'Witness List Due',
  'Deposition Scheduled',
  'Bail Review Hearing',
  'Arraignment',
  'Preliminary Hearing',
  'Trial Date',
  'Probation Review',
  'Restitution Payment Due',
  'Compliance Hearing',
  'Expert Report Due',
  'Mediation Session',
];

const statuses = ['pending', 'completed', 'overdue'];

const randomFrom = (list) => list[Math.floor(Math.random() * list.length)];

const randomDateBetween = (start, end) => {
  const s = start.getTime();
  const e = end.getTime();
  const ts = Math.floor(Math.random() * (e - s + 1)) + s;
  return new Date(ts);
};

const parseArg = (flag, fallback) => {
  const value = process.argv.find((arg) => arg.startsWith(flag));
  if (!value) return fallback;
  const parts = value.split('=');
  return parts.length > 1 ? parts[1] : fallback;
};

const count = Number(parseArg('--count', '150'));
const outputPath = parseArg('--out', 'src/data/fake-deadlines.json');
const total = Number.isFinite(count) && count > 0 ? count : 150;

const deadlines = Array.from({ length: total }, (_, i) => {
  const caseItem = randomFrom(cases);
  const dueDate = randomDateBetween(new Date('2024-01-01'), new Date('2027-12-31'));
  const now = new Date();
  const isPast = dueDate < now;
  const status = isPast
    ? (Math.random() < 0.7 ? 'completed' : 'overdue')
    : (Math.random() < 0.15 ? 'completed' : 'pending');

  return {
    id: `deadline-${i + 1}`,
    title: randomFrom(deadlineTypes),
    description: `${randomFrom(deadlineTypes)} for case ${caseItem.caseNumber}`,
    dueDate: dueDate.toISOString().slice(0, 10),
    caseNumber: caseItem.caseNumber,
    assignedTo: Math.random() < 0.5 ? caseItem.defenseAttorney : caseItem.prosecutionAttorney,
    status,
    clientId: caseItem.clientId,
  };
});

writeFileSync(resolve(outputPath), JSON.stringify(deadlines, null, 2), 'utf-8');
console.log(`Generated ${total} deadlines to ${outputPath}`);
