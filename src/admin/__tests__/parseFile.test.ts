import { describe, it, expect } from 'vitest';
import { detectFormat } from '../parseFile';

describe('detectFormat', () => {
    it('returns xlsx for .xlsx files', () => {
        expect(detectFormat('data.xlsx')).toBe('xlsx');
    });

    it('returns xlsx for .xls files', () => {
        expect(detectFormat('data.xls')).toBe('xlsx');
    });

    it('returns null for unsupported formats', () => {
        expect(detectFormat('data.csv')).toBeNull();
        expect(detectFormat('data.json')).toBeNull();
        expect(detectFormat('data.txt')).toBeNull();
    });

    it('handles uppercase extensions', () => {
        expect(detectFormat('data.XLSX')).toBe('xlsx');
    });
});
