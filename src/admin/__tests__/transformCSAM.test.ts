import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { isCSAMFormat, transformCSAM } from '../transformCSAM';

function makeWorkbook(sheets: Record<string, Record<string, unknown>[]>): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  for (const [name, data] of Object.entries(sheets)) {
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, name);
  }
  return wb;
}

describe('isCSAMFormat', () => {
  it('returns true when CSAM sheet names are present', () => {
    expect(isCSAMFormat(['District Court Sentence Data', 'District Court Attorney Data', 'Query'])).toBe(true);
  });

  it('returns true for Justice Court Data alone', () => {
    expect(isCSAMFormat(['Justice Court Data'])).toBe(true);
  });

  it('returns false for generic sheet names', () => {
    expect(isCSAMFormat(['Cases', 'Deadlines', 'Users'])).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isCSAMFormat(['DISTRICT COURT SENTENCE DATA'])).toBe(true);
  });
});

describe('transformCSAM', () => {
  it('aggregates multiple rows per case into charges array', () => {
    const wb = makeWorkbook({
      'District Court Sentence Data': [
        { case_num: 'C-001', filing_date: '2025-01-01', court_district: 'D1', court_type: 'District', locn_descr: 'Salt Lake', case_type: 'Criminal', orig_disp_date: '2025-05-30', disp_date: '2025-06-01', disposition: 'Disposed', jdmt_date: '2025-05-15', offs_viol_code: '76-5-401', offs_viol_descr: 'Assault', judgment: 'Guilty', sentence: 'Jail', value: '30', units: 'Days', charge_sequence: '1', sentence_date: '2025-06-02' },
        { case_num: 'C-001', filing_date: '2025-01-01', court_district: 'D1', court_type: 'District', locn_descr: 'Salt Lake', case_type: 'Criminal', orig_disp_date: '2025-05-30', disp_date: '2025-06-01', disposition: 'Disposed', jdmt_date: '2025-05-15', offs_viol_code: '76-5-402', offs_viol_descr: 'Battery', judgment: 'Not Guilty', sentence: '', value: '', units: '', charge_sequence: '2', sentence_date: '2025-06-02' },
      ],
      'District Court Attorney Data': [
        { case_num: 'C-001', def_atty: 'Jane Doe', pla_atty: 'John Smith' },
      ],
    });

    const result = transformCSAM(wb);
    expect(result.cases).toBeDefined();
    expect(result.cases!.rows).toHaveLength(1);

    const row = result.cases!.rows[0]!;
    expect(row['case_number']).toBe('C-001');
    expect(row['court']).toBe('Salt Lake');
    expect(row['district_number']).toBe('D1');
    expect(row['defense_attorney']).toBe('Jane Doe');
    expect(row['prosecution_attorney']).toBe('John Smith');
    expect(row['charge']).toBe('Assault');
    expect(row['offense_code']).toBe('76-5-401');
    expect(row['ruling']).toBe('Disposed - Guilty');
    expect(row['sentence']).toBe('Jail: 30: Days');
    expect(row['status']).toBe('closed');

    const charges = row['charges'] as { offense_code: string; description: string }[];
    expect(charges).toHaveLength(2);
    expect(charges[0]!.offense_code).toBe('76-5-401');
    expect(charges[1]!.description).toBe('Battery');
  });

  it('merges attorneys from separate sheet', () => {
    const wb = makeWorkbook({
      'District Court Sentence Data': [
        { case_num: 'C-002', filing_date: '2025-02-01', offs_viol_code: 'X', offs_viol_descr: 'Theft', disposition: 'Active' },
      ],
      'District Court Attorney Data': [
        { case_num: 'C-002', def_atty: 'Atty A', pla_atty: 'Atty B' },
        { case_num: 'C-002', def_atty: 'Atty C', pla_atty: 'Atty D' }, // duplicate, should be ignored
      ],
    });

    const result = transformCSAM(wb);
    const row = result.cases!.rows[0]!;
    expect(row['defense_attorney']).toBe('Atty A');
    expect(row['prosecution_attorney']).toBe('Atty B');
  });

  it('handles Justice Court Data with different column names', () => {
    const wb = makeWorkbook({
      'Justice Court Data': [
        { case_num: 'JC-001', filing_date: '2025-03-01', court_district: 'J1', court_type: 'Justice', locn_descr: 'Provo', case_type: 'Infraction', orig_disp_date: '2025-06-28', disp_date: '2025-07-01', disposition: 'Closed', jdmt_date: '2025-06-15', offs_viol_code: '41-6a-501', offs_viol_description: 'DUI', jdmt_description: 'Guilty', sentence_description: 'Fine', value: '500', units: 'Dollars', charge_sequence: '1', def_res_atty: 'JC Def', pet_pla_atty: 'JC Pros', sentence_date: '2025-07-02', disposition_description: '' },
      ],
    });

    const result = transformCSAM(wb);
    expect(result.cases!.rows).toHaveLength(1);

    const row = result.cases!.rows[0]!;
    expect(row['case_number']).toBe('JC-001');
    expect(row['court']).toBe('Provo');
    expect(row['district_number']).toBe('J1');
    expect(row['charge']).toBe('DUI');
    expect(row['defense_attorney']).toBe('JC Def');
    expect(row['prosecution_attorney']).toBe('JC Pros');
    expect(row['judgment_description']).toBe('Guilty');
    expect(row['sentence_description']).toBe('Fine');
    expect(row['sentence']).toBe('500 Dollars');
    expect(row['status']).toBe('closed');

    const charges = row['charges'] as { judgment: string; sentence: string }[];
    expect(charges[0]!.judgment).toBe('Guilty');
    expect(charges[0]!.sentence).toBe('Fine');
  });

  it('derives active status when disposition does not contain Disposed or Closed', () => {
    const wb = makeWorkbook({
      'District Court Sentence Data': [
        { case_num: 'C-003', disposition: 'Pending Trial', offs_viol_code: 'X', offs_viol_descr: 'Fraud' },
      ],
    });

    const result = transformCSAM(wb);
    expect(result.cases!.rows[0]!['status']).toBe('active');
  });

  it('merges District Court and Justice Court cases', () => {
    const wb = makeWorkbook({
      'District Court Sentence Data': [
        { case_num: 'DC-001', offs_viol_code: 'A', offs_viol_descr: 'A', disposition: 'Disposed' },
      ],
      'District Court Attorney Data': [],
      'Justice Court Data': [
        { case_num: 'JC-001', offs_viol_code: 'B', offs_viol_description: 'B', disposition: 'Active' },
      ],
    });

    const result = transformCSAM(wb);
    expect(result.cases!.rows).toHaveLength(2);
    expect(result.cases!.rows[0]!['case_number']).toBe('DC-001');
    expect(result.cases!.rows[1]!['case_number']).toBe('JC-001');
  });

  it('skips the Query sheet', () => {
    const wb = makeWorkbook({
      'District Court Sentence Data': [
        { case_num: 'C-004', offs_viol_code: 'X', offs_viol_descr: 'X', disposition: '' },
      ],
      'Query': [
        { some_field: 'should be ignored' },
      ],
    });

    const result = transformCSAM(wb);
    expect(result.cases!.rows).toHaveLength(1);
    // Only 'cases' key should exist
    expect(Object.keys(result)).toEqual(['cases']);
  });

  it('returns empty result when no cases found', () => {
    const wb = makeWorkbook({
      'District Court Attorney Data': [
        { case_num: 'C-001', def_atty: 'A', pla_atty: 'B' },
      ],
    });

    const result = transformCSAM(wb);
    expect(Object.keys(result)).toHaveLength(0);
  });
});
