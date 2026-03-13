import { useState, useRef, useCallback } from 'react';
import type { DataType, ImportFormat, DataImportResponse } from '../api/types';
import { adminService } from '../api/services/adminService';
import { parseFile, detectFormat, type ParseResult } from './parseFile';

const DATA_TYPES: { value: DataType; label: string }[] = [
    { value: 'cases', label: 'Cases' },
    { value: 'deadlines', label: 'Deadlines' },
    { value: 'users', label: 'Users' },
    { value: 'attorneys', label: 'Attorneys' },
    { value: 'firms', label: 'Firms' },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DataImportTab() {
    const [dataType, setDataType] = useState<DataType>('cases');
    const [file, setFile] = useState<File | null>(null);
    const [format, setFormat] = useState<ImportFormat | null>(null);
    const [preview, setPreview] = useState<ParseResult | null>(null);
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
            const response = await adminService.uploadData(preview.rows, format, dataType, file.name);
            setResult(response);
        } catch (err) {
            setError(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setImporting(false);
        }
    }, [file, format, dataType, preview]);

    const previewRows = preview?.rows.slice(0, 10) ?? [];

    return (
        <div>
            <div className="admin-card">
                <h3>Data Type</h3>
                <div className="btn-group" role="group">
                    {DATA_TYPES.map(dt => (
                        <button
                            key={dt.value}
                            type="button"
                            className={`btn ${dataType === dt.value ? 'btn-dark' : 'btn-outline-secondary'}`}
                            onClick={() => setDataType(dt.value)}
                        >
                            {dt.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="admin-card">
                <h3>Upload File</h3>
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

            {preview && preview.rows.length > 0 && (
                <div className="admin-card">
                    <h3>Preview ({preview.rows.length} rows total, showing first {Math.min(10, preview.rows.length)})</h3>
                    <div className="preview-table-wrapper">
                        <table className="table preview-table">
                            <thead>
                                <tr>
                                    {preview.headers.map(h => <th key={h}>{h}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {previewRows.map((row, i) => (
                                    <tr key={i}>
                                        {preview.headers.map(h => (
                                            <td key={h}>{String(row[h] ?? '')}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <button
                        className="btn btn-primary mt-3"
                        onClick={handleImport}
                        disabled={importing}
                    >
                        {importing ? 'Importing...' : `Import ${preview.rows.length} rows as ${dataType}`}
                    </button>
                </div>
            )}

            {result && (
                <div className={`import-result ${result.failedRows === 0 ? 'success' : result.importedRows > 0 ? 'partial' : 'error'}`}>
                    <h4>Import Complete</h4>
                    <p><strong>{result.importedRows}</strong> rows imported, <strong>{result.failedRows}</strong> failed.</p>
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
