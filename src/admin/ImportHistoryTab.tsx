import { useState, useEffect, useCallback } from 'react';
import type { DataImportRecord } from '../api/types';
import { adminService } from '../api/services/adminService';

export function ImportHistoryTab() {
    const [records, setRecords] = useState<DataImportRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const response = await adminService.getImportHistory(page);
            setRecords(response.data);
            setTotalPages(response.totalPages);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load import history');
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => { fetchHistory(); }, [fetchHistory]);

    if (loading) return <div className="text-center py-5"><div className="spinner-border"></div></div>;

    return (
        <div>
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="admin-card">
                <h3>Import History</h3>
                <div className="table-responsive">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>File</th>
                                <th>Data Type</th>
                                <th>Format</th>
                                <th>Rows</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.length === 0 ? (
                                <tr><td colSpan={6} className="text-center text-muted py-4">No imports yet</td></tr>
                            ) : records.map(record => (
                                <tr key={record.id}>
                                    <td>{new Date(record.createdAt).toLocaleString()}</td>
                                    <td>{record.fileName}</td>
                                    <td className="text-capitalize">{record.dataType}</td>
                                    <td>{record.format.toUpperCase()}</td>
                                    <td>{record.importedRows}/{record.totalRows}</td>
                                    <td>
                                        <span className={`badge ${
                                            record.status === 'completed' ? 'bg-success' :
                                            record.status === 'partial' ? 'bg-warning' : 'bg-danger'
                                        }`}>
                                            {record.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <nav>
                        <ul className="pagination justify-content-center">
                            <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => setPage(p => p - 1)}>Previous</button>
                            </li>
                            <li className="page-item disabled">
                                <span className="page-link">Page {page} of {totalPages}</span>
                            </li>
                            <li className={`page-item ${page >= totalPages ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => setPage(p => p + 1)}>Next</button>
                            </li>
                        </ul>
                    </nav>
                )}
            </div>
        </div>
    );
}
