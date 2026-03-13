import * as XLSX from 'xlsx';

export interface ParseResult {
    headers: string[];
    rows: Record<string, unknown>[];
}

export function detectFormat(fileName: string): 'xlsx' | null {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'xlsx' || ext === 'xls') return 'xlsx';
    return null;
}

export async function parseFile(file: File): Promise<ParseResult> {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const firstSheet = workbook.SheetNames[0];
    if (!firstSheet) {
        return { headers: [], rows: [] };
    }
    const worksheet = workbook.Sheets[firstSheet]!;
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

    if (data.length === 0) {
        return { headers: [], rows: [] };
    }

    const headers = Object.keys(data[0]!);
    return { headers, rows: data };
}
