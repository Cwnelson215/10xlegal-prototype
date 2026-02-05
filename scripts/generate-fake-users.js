import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Users map to the attorneys and client IDs used in fake-cases.json
const users = [
  // Clients (3) — IDs match clientId values in fake-cases.json
  {
    id: 'client-1',
    name: 'Sarah Mitchell',
    email: 'sarah.mitchell@example.com',
    role: 'client',
  },
  {
    id: 'client-2',
    name: 'James Cooper',
    email: 'james.cooper@example.com',
    role: 'client',
  },
  {
    id: 'client-3',
    name: 'Maria Gonzalez',
    email: 'maria.gonzalez@example.com',
    role: 'client',
  },
  // Lawyers (5) — names match defense/prosecution attorneys in fake-cases.json
  {
    id: 'lawyer-1',
    name: 'Elliot Shaw',
    email: 'elliot.shaw@example.com',
    role: 'lawyer',
  },
  {
    id: 'lawyer-2',
    name: 'Camila Ortiz',
    email: 'camila.ortiz@example.com',
    role: 'lawyer',
  },
  {
    id: 'lawyer-3',
    name: 'Alexandra Pierce',
    email: 'alexandra.pierce@example.com',
    role: 'lawyer',
  },
  {
    id: 'lawyer-4',
    name: 'Jordan Hayes',
    email: 'jordan.hayes@example.com',
    role: 'lawyer',
  },
  {
    id: 'lawyer-5',
    name: 'Harper Cole',
    email: 'harper.cole@example.com',
    role: 'lawyer',
  },
  // Legal Officials (2)
  {
    id: 'official-1',
    name: 'Robert Chen',
    email: 'robert.chen@example.com',
    role: 'legal-official',
  },
  {
    id: 'official-2',
    name: 'Patricia Dawson',
    email: 'patricia.dawson@example.com',
    role: 'legal-official',
  },
];

const outputPath = process.argv.find((a) => a.startsWith('--out'))?.split('=')[1]
  ?? 'src/data/fake-users.json';

writeFileSync(resolve(outputPath), JSON.stringify(users, null, 2), 'utf-8');
console.log(`Generated ${users.length} users to ${outputPath}`);
