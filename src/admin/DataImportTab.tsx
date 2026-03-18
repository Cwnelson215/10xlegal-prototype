import { useState, useRef, useCallback } from 'react';
import type { DataType, ImportFormat, DataImportResponse } from '../api/types';
import { adminService } from '../api/services/adminService';
import { parseFile, detectFormat, type MultiSheetResult } from './parseFile';

const DATA_TYPE_LABELS: Record<DataType, string> = {
    cases: 'Cases',
    deadlines: 'Deadlines',
    users: 'Users',
    attorneys: 'Attorneys',
    firms: 'Firms',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DataImportTab() {
    const [file, setFile] = useState<File | null>(null);
    const [format, setFormat] = useState<ImportFormat | null>(null);
    const [preview, setPreview] = useState<MultiSheetResult | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<DataImportResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback(async (selectedFile: File) => {
        setError(null);
        setResult(null);

        if (selectedFile.size > MAX_FILE_SIZE) {
            setError('File size exceeds 10MB limit.');
            return;
        }

        const detected = detectFormat(selectedFile.name);
        if (!detected) {
            setError('Unsupported file type. Please use Excel files (.xlsx, .xls).');
            return;
        }

        setFile(selectedFile);
        setFormat(detected);

        try {
            const parsed = await parseFile(selectedFile);
            if (Object.keys(parsed).length === 0) {
                setError('No recognized sheets found. Name sheets: Cases, Deadlines, Users, Attorneys, or Firms.');
                setFile(null);
                setFormat(null);
                setPreview(null);
                return;
            }
            setPreview(parsed);
        } catch (err) {
            setError(`Failed to parse file: ${err instanceof Error ? err.message : 'Unknown error'}`);
            setFile(null);
            setFormat(null);
            setPreview(null);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) handleFile(droppedFile);
    }, [handleFile]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback(() => setDragOver(false), []);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) handleFile(selectedFile);
    }, [handleFile]);

    const clearFile = useCallback(() => {
        setFile(null);
        setFormat(null);
        setPreview(null);
        setResult(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    const handleImport = useCallback(async () => {
        if (!file || !format || !preview) return;
        setImporting(true);
        setError(null);

        try {
            const sheets: Partial<Record<DataType, Record<string, unknown>[]>> = {};
            for (const [dt, parsed] of Object.entries(preview)) {
                sheets[dt as DataType] = parsed.rows;
            }
            const response = await adminService.uploadData(sheets, format, file.name);
            setResult(response);
        } catch (err) {
            setError(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setImporting(false);
        }
    }, [file, format, preview]);

    const totalRows = preview
        ? Object.values(preview).reduce((sum, p) => sum + p.rows.length, 0)
        : 0;

    const sheetEntries = preview ? Object.entries(preview) as [DataType, { headers: string[]; rows: Record<string, unknown>[] }][] : [];

    return (
        <div>
            <div className="admin-card">
                <h3>Upload File</h3>
                <p className="text-muted mb-3">
                    Upload an Excel file with sheets named: Cases, Deadlines, Users, Attorneys, Firms.
                    Each sheet will be imported into its corresponding table.
                </p>
                <div
                    className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <h4>Drop your file here or click to browse</h4>
                    <p>Supports Excel files only (.xlsx, .xls) (max 10MB)</p>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileInput}
                    style={{ display: 'none' }}
                />

                {file && (
                    <div className="file-info">
                        <div>
                            <span className="file-name">{file.name}</span>
                            <span className="file-size"> ({formatFileSize(file.size)})</span>
                        </div>
                        <span className="badge bg-secondary">{format?.toUpperCase()}</span>
                        <button className="btn-remove" onClick={clearFile} title="Remove file">&times;</button>
                    </div>
                )}
            </div>

            {error && (
                <div className="alert alert-danger" role="alert">{error}</div>
            )}

            {preview && sheetEntries.length > 0 && (
                <div className="admin-card">
                    <h3>Preview ({sheetEntries.length} sheet{sheetEntries.length > 1 ? 's' : ''}, {totalRows} rows total)</h3>

                    {sheetEntries.map(([dt, parsed]) => {
                        const previewRows = parsed.rows.slice(0, 5);
                        return (
                            <div key={dt} className="mb-4">
                                <h5>{DATA_TYPE_LABELS[dt]} ({parsed.rows.length} rows)</h5>
                                <div className="preview-table-wrapper">
                                    <table className="table preview-table">
                                        <thead>
                                            <tr>
                                                {parsed.headers.map(h => <th key={h}>{h}</th>)}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewRows.map((row, i) => (
                                                <tr key={i}>
                                                    {parsed.headers.map(h => (
                                                        <td key={h}>{String(row[h] ?? '')}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {parsed.rows.length > 5 && (
                                    <p className="text-muted">...and {parsed.rows.length - 5} more rows</p>
                                )}
                            </div>
                        );
                    })}

                    <button
                        className="btn btn-primary mt-3"
                        onClick={handleImport}
                        disabled={importing}
                    >
                        {importing ? 'Importing...' : `Import ${totalRows} rows across ${sheetEntries.length} type${sheetEntries.length > 1 ? 's' : ''}`}
                    </button>
                </div>
            )}

            {result && (
                <div className={`import-result ${result.failedRows === 0 ? 'success' : result.importedRows > 0 ? 'partial' : 'error'}`}>
                    <h4>Import Complete</h4>
                    <p><strong>{result.importedRows}</strong> rows imported, <strong>{result.failedRows}</strong> failed.</p>
                    {result.results.length > 0 && (
                        <div className="mt-2">
                            <strong>Breakdown:</strong>
                            <ul className="mb-2 mt-1">
                                {result.results.map(r => (
                                    <li key={r.dataType}>
                                        {DATA_TYPE_LABELS[r.dataType]}: {r.importedRows} imported, {r.failedRows} failed
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {result.errors.length > 0 && (
                        <div className="mt-2">
                            <strong>Errors:</strong>
                            <ul className="mb-0 mt-1">
                                {result.errors.slice(0, 10).map((err, i) => (
                                    <li key={i}>Row {err.row}: {err.field} - {err.message}</li>
                                ))}
                                {result.errors.length > 10 && <li>...and {result.errors.length - 10} more</li>}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
