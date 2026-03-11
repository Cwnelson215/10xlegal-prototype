import { useState, useEffect, useCallback } from 'react';
import type { AuditLogEntry } from '../api/types';
import { adminService } from '../api/services/adminService';

export function AuditLogTab() {
    const [entries, setEntries] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchLog = useCallback(async () => {
        setLoading(true);
        try {
            const response = await adminService.getAuditLog(page);
            setEntries(response.data);
            setTotalPages(response.totalPages);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load audit log');
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => { fetchLog(); }, [fetchLog]);

    if (loading) return <div className="text-center py-5"><div className="spinner-border"></div></div>;

    return (
        <div>
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="admin-card">
                <h3>Audit Log</h3>
                <div className="table-responsive">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>User</th>
                                <th>Action</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.length === 0 ? (
                                <tr><td colSpan={4} className="text-center text-muted py-4">No activity recorded</td></tr>
                            ) : entries.map(entry => (
                                <tr key={entry.id}>
                                    <td>{new Date(entry.createdAt).toLocaleString()}</td>
                                    <td>{entry.userName}</td>
                                    <td><span className="badge bg-secondary">{entry.action}</span></td>
                                    <td>{entry.details}</td>
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
