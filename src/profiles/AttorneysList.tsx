import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { attorneysService } from '../api/services/attorneysService';
import type { Attorney } from '../api/types';
import './profiles.css';

export function AttorneysList() {
    const [attorneys, setAttorneys] = useState<Attorney[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [nameQuery, setNameQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'prosecution' | 'defense'>('all');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        let mounted = true;
        setIsLoading(true);

        attorneysService.getAttorneys(undefined, 1, 1000)
            .then((response) => { if (mounted) setAttorneys(response.data); })
            .catch((err) => { if (mounted) setError(err instanceof Error ? err.message : 'Failed to load attorneys'); })
            .finally(() => { if (mounted) setIsLoading(false); });

        return () => { mounted = false; };
    }, []);

    useEffect(() => { setPage(1); }, [nameQuery, typeFilter, pageSize]);

    const filtered = useMemo(() => {
        const q = nameQuery.trim().toLowerCase();
        return attorneys.filter((a) => {
            const matchesName = !q || a.name.toLowerCase().includes(q);
            const matchesType = typeFilter === 'all' || a.type === typeFilter;
            return matchesName && matchesType;
        });
    }, [attorneys, nameQuery, typeFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paged = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

    const canGoPrevious = page > 1;
    const canGoNext = page < totalPages;

    if (isLoading) return <div className="profile-container"><div className="loading-state">Loading attorneys...</div></div>;
    if (error) return <div className="profile-container"><div className="error-state">{error}</div></div>;

    return (
        <div className="home-container">
            <header className="home-header">
                <div className="header-content">
                    <h1>Attorneys</h1>
                    <p>Browse all attorneys in the system</p>
                </div>
            </header>
            <section className="cases-dashboard-section">
                <div className="section-header">
                    <h2>All Attorneys</h2>
                    <span className="cases-count">{filtered.length} of {attorneys.length} attorneys</span>
                </div>

                <div className="dashboard-filters" style={{ gridTemplateColumns: 'repeat(2, minmax(220px, 1fr))' }}>
                    <div className="filter-group">
                        <label htmlFor="attorney-name-search">Name</label>
                        <input
                            id="attorney-name-search"
                            type="search"
                            placeholder="Search by name"
                            value={nameQuery}
                            onChange={(e) => setNameQuery(e.target.value)}
                        />
                    </div>
                    <div className="filter-group">
                        <label htmlFor="attorney-type-filter">Type</label>
                        <select
                            id="attorney-type-filter"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as 'all' | 'prosecution' | 'defense')}
                        >
                            <option value="all">All</option>
                            <option value="prosecution">Prosecution</option>
                            <option value="defense">Defense</option>
                        </select>
                    </div>
                </div>

                <div className="cases-table">
                    {filtered.length === 0 ? (
                        <div className="dashboard-state">No attorneys match the search criteria.</div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>Case Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paged.map((attorney) => (
                                    <tr key={attorney.id}>
                                        <td><Link to={`/attorneys/${attorney.id}`} className="entity-link">{attorney.name}</Link></td>
                                        <td style={{ textTransform: 'capitalize' }}>{attorney.type}</td>
                                        <td>{attorney.caseCount}</td>
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
