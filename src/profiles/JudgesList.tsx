import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { judgesService } from '../api/services/judgesService';
import type { Judge } from '../api/types';
import './profiles.css';

export function JudgesList() {
    const [judges, setJudges] = useState<Judge[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [nameQuery, setNameQuery] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        let mounted = true;
        setIsLoading(true);

        judgesService.getJudges(1, 1000)
            .then((response) => { if (mounted) setJudges(response.data); })
            .catch((err) => { if (mounted) setError(err instanceof Error ? err.message : 'Failed to load judges'); })
            .finally(() => { if (mounted) setIsLoading(false); });

        return () => { mounted = false; };
    }, []);

    useEffect(() => { setPage(1); }, [nameQuery, pageSize]);

    const filtered = useMemo(() => {
        const q = nameQuery.trim().toLowerCase();
        if (!q) return judges;
        return judges.filter((j) => j.name.toLowerCase().includes(q));
    }, [judges, nameQuery]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paged = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

    const canGoPrevious = page > 1;
    const canGoNext = page < totalPages;

    if (isLoading) return <div className="profile-container"><div className="loading-state">Loading judges...</div></div>;
    if (error) return <div className="profile-container"><div className="error-state">{error}</div></div>;

    return (
        <div className="home-container">
            <header className="home-header">
                <div className="header-content">
                    <h1>Judges</h1>
                    <p>Browse all judges in the system</p>
                </div>
            </header>
            <section className="cases-dashboard-section">
                <div className="section-header">
                    <h2>All Judges</h2>
                    <span className="cases-count">{filtered.length} of {judges.length} judges</span>
                </div>

                <div className="dashboard-filters" style={{ gridTemplateColumns: 'minmax(220px, 1fr)' }}>
                    <div className="filter-group">
                        <label htmlFor="judge-name-search">Name</label>
                        <input
                            id="judge-name-search"
                            type="search"
                            placeholder="Search by name"
                            value={nameQuery}
                            onChange={(e) => setNameQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="cases-table">
                    {filtered.length === 0 ? (
                        <div className="dashboard-state">No judges match the search criteria.</div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Case Count</th>
                                    <th>Counties</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paged.map((judge) => (
                                    <tr key={judge.id}>
                                        <td><Link to={`/judges/${judge.id}`} className="entity-link">{judge.name}</Link></td>
                                        <td>{judge.caseCount}</td>
                                        <td>{judge.counties.join(', ')}</td>
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
