import * as XLSX from 'xlsx';
import type { MultiSheetResult } from './parseFile';

const CSAM_SHEET_NAMES = [
  'district court sentence data',
  'district court attorney data',
  'justice court data',
];

export function isCSAMFormat(sheetNames: string[]): boolean {
  const lower = sheetNames.map(s => s.toLowerCase().trim());
  return CSAM_SHEET_NAMES.some(name => lower.includes(name));
}

interface AttorneyInfo {
  def_atty: string;
  pla_atty: string;
}

interface RawRow {
  [key: string]: unknown;
}

function str(val: unknown): string {
  if (val == null) return '';
  return String(val).trim();
}

function deriveStatus(disposition: string): string {
  const d = disposition.toLowerCase();
  if (d.includes('disposed') || d.includes('closed')) return 'closed';
  return 'active';
}

function parseAttorneySheet(workbook: XLSX.WorkBook): Map<string, AttorneyInfo> {
  const map = new Map<string, AttorneyInfo>();
  const sheetName = workbook.SheetNames.find(
    s => s.toLowerCase().trim() === 'district court attorney data'
  );
  if (!sheetName) return map;

  const sheet = workbook.Sheets[sheetName]!;
  const rows = XLSX.utils.sheet_to_json<RawRow>(sheet);

  for (const row of rows) {
    const caseNum = str(row['case_num']);
    if (!caseNum || map.has(caseNum)) continue;
    map.set(caseNum, {
      def_atty: str(row['def_atty']),
      pla_atty: str(row['pla_atty']),
    });
  }

  return map;
}

interface ChargeEntry {
  offense_code: string;
  description: string;
  judgment: string;
  sentence: string;
  value: string;
  units: string;
  charge_sequence: string;
}

function aggregateDistrictCourt(
  workbook: XLSX.WorkBook,
  attorneyMap: Map<string, AttorneyInfo>
): RawRow[] {
  const sheetName = workbook.SheetNames.find(
    s => s.toLowerCase().trim() === 'district court sentence data'
  );
  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName]!;
  const rows = XLSX.utils.sheet_to_json<RawRow>(sheet);

  // Group by case_num
  const grouped = new Map<string, RawRow[]>();
  for (const row of rows) {
    const caseNum = str(row['case_num']);
    if (!caseNum) continue;
    const existing = grouped.get(caseNum);
    if (existing) {
      existing.push(row);
    } else {
      grouped.set(caseNum, [row]);
    }
  }

  const cases: RawRow[] = [];
  for (const [caseNum, caseRows] of grouped) {
    const first = caseRows[0]!;
    const attorney = attorneyMap.get(caseNum);

    const charges: ChargeEntry[] = caseRows.map(r => ({
      offense_code: str(r['offs_viol_code']),
      description: str(r['offs_viol_descr']),
      judgment: str(r['judgment']),
      sentence: str(r['sentence']),
      value: str(r['value']),
      units: str(r['units']),
      charge_sequence: str(r['charge_sequence']),
    }));

    const disposition = str(first['disposition']);

    cases.push({
      case_number: caseNum,
      filing_date: str(first['filing_date']),
      court_district: str(first['court_district']),
      court_type: str(first['court_type']),
      court_location: str(first['locn_descr']),
      case_type: str(first['case_type']),
      disposition_date: str(first['disp_date']),
      conviction_outcome: disposition,
      conviction_date: str(first['jdmt_date']),
      offense_code: str(first['offs_viol_code']),
      charge: str(first['offs_viol_descr']),
      defense_attorney: attorney?.def_atty ?? '',
      prosecution_attorney: attorney?.pla_atty ?? '',
      status: deriveStatus(disposition),
      charges,
    });
  }

  return cases;
}

function aggregateJusticeCourt(workbook: XLSX.WorkBook): RawRow[] {
  const sheetName = workbook.SheetNames.find(
    s => s.toLowerCase().trim() === 'justice court data'
  );
  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName]!;
  const rows = XLSX.utils.sheet_to_json<RawRow>(sheet);

  const grouped = new Map<string, RawRow[]>();
  for (const row of rows) {
    const caseNum = str(row['case_num']);
    if (!caseNum) continue;
    const existing = grouped.get(caseNum);
    if (existing) {
      existing.push(row);
    } else {
      grouped.set(caseNum, [row]);
    }
  }

  const cases: RawRow[] = [];
  for (const [caseNum, caseRows] of grouped) {
    const first = caseRows[0]!;

    const charges: ChargeEntry[] = caseRows.map(r => ({
      offense_code: str(r['offs_viol_code']),
      description: str(r['offs_viol_description']),
      judgment: str(r['jdmt_description']),
      sentence: str(r['sentence_description']),
      value: str(r['value']),
      units: str(r['units']),
      charge_sequence: str(r['charge_sequence']),
    }));

    const disposition = str(first['disposition']);

    cases.push({
      case_number: caseNum,
      filing_date: str(first['filing_date']),
      court_district: str(first['court_district']),
      court_type: str(first['court_type']),
      court_location: str(first['locn_descr']),
      case_type: str(first['case_type']),
      disposition_date: str(first['disp_date']),
      conviction_outcome: disposition,
      conviction_date: str(first['jdmt_date']),
      offense_code: str(first['offs_viol_code']),
      charge: str(first['offs_viol_description']),
      defense_attorney: str(first['def_res_atty']),
      prosecution_attorney: str(first['pet_pla_atty']),
      status: deriveStatus(disposition),
      charges,
    });
  }

  return cases;
}

export function transformCSAM(workbook: XLSX.WorkBook): MultiSheetResult {
  const attorneyMap = parseAttorneySheet(workbook);
  const districtCases = aggregateDistrictCourt(workbook, attorneyMap);
  const justiceCases = aggregateJusticeCourt(workbook);
  const allCases = [...districtCases, ...justiceCases];

  if (allCases.length === 0) return {};

  const headers = Object.keys(allCases[0]!);
  return {
    cases: { headers, rows: allCases },
  };
}
