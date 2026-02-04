import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const counties = [
  'Beaver',
  'Box Elder',
  'Cache',
  'Carbon',
  'Daggett',
  'Davis',
  'Duchesne',
  'Emery',
  'Garfield',
  'Grand',
  'Iron',
  'Juab',
  'Kane',
  'Millard',
  'Morgan',
  'Piute',
  'Rich',
  'Salt Lake',
  'San Juan',
  'Sanpete',
  'Sevier',
  'Summit',
  'Tooele',
  'Uintah',
  'Utah',
  'Wasatch',
  'Washington',
  'Wayne',
  'Weber',
];

const judges = [
  'Hon. Amelia Grant',
  'Hon. Marcus Keller',
  'Hon. Natalie Rowe',
  'Hon. Daniel Rivas',
  'Hon. Priya Desai',
  'Hon. Benjamin Holt',
  'Hon. Elise Ward',
  'Hon. Peter Caldwell',
  'Hon. Tessa Nguyen',
  'Hon. Julian Park',
];

const prosecutionAttorneys = [
  'Alexandra Pierce',
  'Jordan Hayes',
  'Miguel Santos',
  'Renee Whitaker',
  'Caleb Morgan',
  'Olivia Brooks',
  'Dylan Carr',
  'Sofia Bennett',
  'Noah Sinclair',
  'Vera Whitman',
];

const defenseAttorneys = [
  'Elliot Shaw',
  'Camila Ortiz',
  'Harper Cole',
  'Logan Price',
  'Isabella Ruiz',
  'Reed Patterson',
  'Maya Clarke',
  'Evan Kim',
  'Talia Osborne',
  'Grant Lowell',
];

const prosecutionFirms = [
  'Summit Ridge Legal Group',
  'Wasatch Valley Partners',
  'Canyon State Prosecution Unit',
  'Red Rock Justice Associates',
  'Salt Lake District Counsel',
  'North Star Litigation',
  'Uintah County Legal Office',
  'Wasatch Front Advocates',
];

const defenseFirms = [
  'Harbor & Pine Defense',
  'Stonebridge Legal',
  'Granite Peak Counsel',
  'Frontier Defense Partners',
  'Blue Mesa Law Group',
  'Pioneer Justice Alliance',
  'Cedar Gate Defense',
  'Summit Defense Collective',
];

const charges = [
  'Possession of Child Sexual Abuse Material',
  'Distribution of Child Sexual Abuse Material',
  'Production of Child Sexual Abuse Material',
  'Receipt of Child Sexual Abuse Material',
  'Transportation of Child Sexual Abuse Material',
  'Sexual Exploitation of a Minor',
  'Sexual Abuse of a Minor - First Degree',
  'Sexual Abuse of a Minor - Second Degree',
  'Child Enticement',
  'Online Solicitation of a Minor',
  'Attempted Sexual Exploitation of a Minor',
  'Conspiracy to Produce CSAM',
  'Coercion and Enticement of a Minor',
  'Trafficking of Minors',
  'Child Pornography Possession',
  'Child Pornography Distribution',
  'Aggravated Sexual Abuse of a Minor',
  'Using the Internet to Facilitate Child Exploitation',
  'Interstate Travel for Illegal Sex with a Minor',
  'Possession with Intent to Distribute CSAM',
];

const rulings = ['Guilty', 'Not Guilty', 'Dismissed', 'Plea Deal', 'Deferred', 'Mistrial'];

const caseTypeCode = 'CR';

const randomFrom = (list) => list[Math.floor(Math.random() * list.length)];

const randomDateBetween = (startDate, endDate) => {
  const start = startDate.getTime();
  const end = endDate.getTime();
  const timestamp = Math.floor(Math.random() * (end - start + 1)) + start;
  return new Date(timestamp);
};

const createCaseNumber = (usedNumbers, usedSequences) => {
  const year = randomFrom(['19', '20', '21', '22', '23', '24', '25', '26']);

  let sequence = '';
  while (!sequence || usedSequences.has(sequence)) {
    sequence = Array.from({ length: 5 }, () => String(Math.floor(Math.random() * 10))).join('');
  }

  usedSequences.add(sequence);
  const candidate = `${year}-${caseTypeCode}-${sequence}`;

  if (usedNumbers.has(candidate)) {
    return createCaseNumber(usedNumbers, usedSequences);
  }

  usedNumbers.add(candidate);
  return candidate;
};

const generateCase = (usedNumbers, usedSequences) => {
  const courtDate = randomDateBetween(new Date('2019-01-01'), new Date('2026-12-31'));
  const ruling = randomFrom(rulings);
  const sentence = (() => {
    if (['Not Guilty', 'Dismissed', 'Mistrial'].includes(ruling)) {
      return 'N/A';
    }

    const unitRoll = Math.random();
    if (unitRoll < 0.4) {
      const days = Math.floor(Math.random() * 330) + 30;
      return `${days} days`;
    }
    if (unitRoll < 0.75) {
      const months = Math.floor(Math.random() * 36) + 3;
      if (months <= 12) {
        return `${months} months`;
      }
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      if (remainingMonths === 0) {
        return `${years} years`;
      }
      return `${years} years ${remainingMonths} months`;
    }
    const years = Math.floor(Math.random() * 20) + 1;
    return `${years} years`;
  })();

  return {
    caseNumber: createCaseNumber(usedNumbers, usedSequences),
    county: randomFrom(counties),
    judge: randomFrom(judges),
    prosecutionAttorney: randomFrom(prosecutionAttorneys),
    prosecutionFirm: randomFrom(prosecutionFirms),
    defenseAttorney: randomFrom(defenseAttorneys),
    defenseFirm: randomFrom(defenseFirms),
    charge: randomFrom(charges),
    courtDate: courtDate.toISOString().slice(0, 10),
    ruling,
    sentence,
  };
};

const parseArg = (flag, fallback) => {
  const value = process.argv.find((arg) => arg.startsWith(flag));
  if (!value) return fallback;
  const parts = value.split('=');
  return parts.length > 1 ? parts[1] : fallback;
};

const count = Number(parseArg('--count', '50'));
const outputPath = parseArg('--out', 'src/data/fake-cases.json');

const total = Number.isFinite(count) && count > 0 ? count : 50;
const usedNumbers = new Set();
const usedSequences = new Set();
const data = Array.from({ length: total }, () => generateCase(usedNumbers, usedSequences));

writeFileSync(resolve(outputPath), JSON.stringify(data, null, 2), 'utf-8');

console.log(`Generated ${total} cases to ${outputPath}`);
