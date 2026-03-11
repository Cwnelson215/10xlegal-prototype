import * as XLSX from 'xlsx';
import type { ImportFormat } from '../api/types';

export interface ParseResult {
    headers: string[];
    rows: Record<string, unknown>[];
}

export function detectFormat(fileName: string): ImportFormat | null {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'json': return 'json';
        case 'csv': return 'csv';
        case 'xlsx': case 'xls': return 'xlsx';
        default: return null;
    }
}

export async function parseFile(file: File, format: ImportFormat): Promise<ParseResult> {
    switch (format) {
        case 'json': return parseJSON(file);
        case 'csv': return parseCSV(file);
        case 'xlsx': return parseXLSX(file);
    }
}

async function parseJSON(file: File): Promise<ParseResult> {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const data: Record<string, unknown>[] = Array.isArray(parsed) ? parsed : [parsed];

    if (data.length === 0) {
        return { headers: [], rows: [] };
    }

    const headers = Object.keys(data[0]!);
    return { headers, rows: data };
}

async function parseCSV(file: File): Promise<ParseResult> {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim() !== '');

    if (lines.length === 0) {
        return { headers: [], rows: [] };
    }

    const headers = parseCSVLine(lines[0]!);
    const rows: Record<string, unknown>[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]!);
        const row: Record<string, unknown> = {};
        for (let j = 0; j < headers.length; j++) {
            row[headers[j]!] = values[j] ?? '';
        }
        rows.push(row);
    }

    return { headers, rows };
}

function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i]!;
        if (inQuotes) {
            if (char === '"') {
                if (i + 1 < line.length && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                current += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
    }
    result.push(current.trim());
    return result;
}

async function parseXLSX(file: File): Promise<ParseResult> {
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
