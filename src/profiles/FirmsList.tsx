import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { firmsService } from '../api/services/firmsService';
import type { LawFirm } from '../api/types';
import './profiles.css';

export function FirmsList() {
    const [firms, setFirms] = useState<LawFirm[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [nameQuery, setNameQuery] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        let mounted = true;
        setIsLoading(true);

        firmsService.getFirms(1, 1000)
            .then((response) => { if (mounted) setFirms(response.data); })
            .catch((err) => { if (mounted) setError(err instanceof Error ? err.message : 'Failed to load firms'); })
            .finally(() => { if (mounted) setIsLoading(false); });

        return () => { mounted = false; };
    }, []);

    useEffect(() => { setPage(1); }, [nameQuery, pageSize]);

    const filtered = useMemo(() => {
        const q = nameQuery.trim().toLowerCase();
        if (!q) return firms;
        return firms.filter((f) => f.name.toLowerCase().includes(q));
    }, [firms, nameQuery]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paged = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

    const canGoPrevious = page > 1;
    const canGoNext = page < totalPages;

    if (isLoading) return <div className="profile-container"><div className="loading-state">Loading firms...</div></div>;
    if (error) return <div className="profile-container"><div className="error-state">{error}</div></div>;

    return (
        <div className="home-container">
            <header className="home-header">
                <div className="header-content">
                    <h1>Law Firms</h1>
                    <p>Browse all law firms in the system</p>
                </div>
            </header>
            <section className="cases-dashboard-section">
                <div className="section-header">
                    <h2>All Firms</h2>
                    <span className="cases-count">{filtered.length} of {firms.length} firms</span>
                </div>

                <div className="dashboard-filters" style={{ gridTemplateColumns: 'minmax(220px, 1fr)' }}>
                    <div className="filter-group">
                        <label htmlFor="firm-name-search">Name</label>
                        <input
                            id="firm-name-search"
                            type="search"
                            placeholder="Search by name"
                            value={nameQuery}
                            onChange={(e) => setNameQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="cases-table">
                    {filtered.length === 0 ? (
                        <div className="dashboard-state">No firms match the search criteria.</div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>Attorney Count</th>
                                    <th>Case Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paged.map((firm) => (
                                    <tr key={firm.id}>
                                        <td><Link to={`/firms/${firm.id}`} className="entity-link">{firm.name}</Link></td>
                                        <td style={{ textTransform: 'capitalize' }}>{firm.type}</td>
                                        <td>{firm.attorneyCount}</td>
                                        <td>{firm.caseCount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="pagination-controls">
                        <div className="page-size">
                            <label htmlFor="page-size">Rows per page</label>
                            <select id="page-size" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                        <div className="page-actions">
                            <button type="button" onClick={() => setPage(1)} disabled={!canGoPrevious}>First</button>
                            <button type="button" onClick={() => setPage(page - 1)} disabled={!canGoPrevious}>Previous</button>
                            <span className="page-info">Page {page} of {totalPages}</span>
                            <button type="button" onClick={() => setPage(page + 1)} disabled={!canGoNext}>Next</button>
                            <button type="button" onClick={() => setPage(totalPages)} disabled={!canGoNext}>Last</button>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
