import * as XLSX from 'xlsx';
import type { DataType } from '../api/types';

export interface ParseResult {
    headers: string[];
    rows: Record<string, unknown>[];
}

export type MultiSheetResult = Partial<Record<DataType, ParseResult>>;

const SHEET_NAME_MAP: Record<string, DataType> = {
    cases: 'cases',
    case: 'cases',
    deadlines: 'deadlines',
    deadline: 'deadlines',
    users: 'users',
    user: 'users',
    attorneys: 'attorneys',
    attorney: 'attorneys',
    firms: 'firms',
    firm: 'firms',
};

export function detectFormat(fileName: string): 'xlsx' | null {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'xlsx' || ext === 'xls') return 'xlsx';
    return null;
}

export async function parseFile(file: File): Promise<MultiSheetResult> {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const result: MultiSheetResult = {};

    for (const sheetName of workbook.SheetNames) {
        const dataType = SHEET_NAME_MAP[sheetName.toLowerCase().trim()];
        if (!dataType) continue;

        const worksheet = workbook.Sheets[sheetName]!;
        const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

        if (data.length === 0) continue;

        const headers = Object.keys(data[0]!);
        result[dataType] = { headers, rows: data };
    }

    return result;
}
