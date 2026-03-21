import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCaseData } from '../hooks';
import apiClient from '../api/client';
import './home.css';

export function Home() {
    const { user, isAuthenticated } = useAuth();
    const { cases: roleCases, allCases, isLoading, errorMessage } = useCaseData();
    const [caseNumberQuery, setCaseNumberQuery] = useState('');
    const [attorneyQuery, setAttorneyQuery] = useState('');

    const [courtFilter, setCourtFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        setPage(1);
    }, [caseNumberQuery, attorneyQuery, courtFilter, pageSize]);

    const hasSearchCriteria =
        caseNumberQuery.trim().length > 0 ||
        attorneyQuery.trim().length > 0 ||
        courtFilter !== 'all';

    const filteredCases = useMemo(() => {
        const caseQuery = caseNumberQuery.trim().toLowerCase();
        const caseDigits = caseQuery.replace(/\D/g, '');
        const attorneyQueryLower = attorneyQuery.trim().toLowerCase();
        return roleCases.filter((caseItem) => {
            const sequentialDigits = caseItem.caseNumber.split('-')[2] ?? '';
            const matchesCaseNumber = caseDigits.length > 0
                ? sequentialDigits.startsWith(caseDigits)
                : true;

            const matchesAttorney = attorneyQueryLower.length > 0
                ? caseItem.prosecutionAttorney.toLowerCase().includes(attorneyQueryLower) ||
                  caseItem.defenseAttorney.toLowerCase().includes(attorneyQueryLower)
                : true;

            const matchesCounty = courtFilter === 'all' ? true : caseItem.court === courtFilter;

            return matchesCaseNumber && matchesAttorney && matchesCounty;
        });
    }, [
        roleCases,
        caseNumberQuery,
        attorneyQuery,
        courtFilter,
    ]);

    const totalCases = roleCases.length;
    const totalPages = Math.max(1, Math.ceil(filteredCases.length / pageSize));

    const pagedCases = useMemo(() => {
        const startIndex = (page - 1) * pageSize;
        return filteredCases.slice(startIndex, startIndex + pageSize);
    }, [filteredCases, page, pageSize]);

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    const canGoPrevious = page > 1;
    const canGoNext = page < totalPages;

    const handlePageChange = (nextPage: number) => {
        if (nextPage < 1 || nextPage > totalPages) {
            return;
        }
        setPage(nextPage);
    };

    return (
        <div className="home-container">
            <header className="home-header">
                <div className="header-content">
                    <h1>
                        {isAuthenticated && user?.role === 'client' && 'Your Cases'}
                        {isAuthenticated && user?.role === 'lawyer' && 'Your Caseload'}
                        {isAuthenticated && user?.role === 'legal-official' && 'All Cases — Admin View'}
                        {!isAuthenticated && 'Case Dashboard'}
                    </h1>
                    <p>
                        {isAuthenticated && user
                            ? <>{user.name} <span className="role-badge">{user.role === 'legal-official' ? 'Legal Official' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span></>
                            : 'Filter and review all cases stored in the database'}
                    </p>
                </div>
            </header>
            {isAuthenticated && user?.role !== 'admin' && (
                <div style={{ padding: '1rem', textAlign: 'center' }}>
                    <button
                        type="button"
                        className="btn-form-primary"
                        onClick={async () => {
                            try {
                                const res = await apiClient.post<{ data: { token: string; user: { role: string } } }>('/auth/promote-admin');
                                apiClient.setToken(res.data.token);
                                window.location.reload();
                            } catch (err) {
                                alert('Failed to promote: ' + (err instanceof Error ? err.message : 'Unknown error'));
                            }
                        }}
                    >
                        Promote to Admin
                    </button>
                </div>
            )}
            <section className="directory-links">
                <Link to="/attorneys" className="directory-card">
                    <h3>Attorneys</h3>
                    <p>Look up attorneys and their case records</p>
                </Link>
            </section>
            <section className="cases-dashboard-section">
                <div className="section-header">
                    <h2>Cases</h2>
                    <span className="cases-count">{filteredCases.length} of {totalCases} cases</span>
                </div>

                <div className="dashboard-filters">
                    <div className="filter-group">
                        <label htmlFor="case-search">Case Number Sequence</label>
                        <input
                            id="case-search"
                            type="search"
                            placeholder="Enter sequence digits (e.g., 62)"
                            value={caseNumberQuery}
                            onChange={(event) => setCaseNumberQuery(event.target.value)}
                        />
                    </div>
                    <div className="filter-group">
                        <label htmlFor="attorney-search">Attorney Name</label>
                        <input
                            id="attorney-search"
                            type="search"
                            placeholder="Prosecutor or defense"
                            value={attorneyQuery}
                            onChange={(event) => setAttorneyQuery(event.target.value)}
                        />
                    </div>
                    <div className="filter-group">
                        <label htmlFor="court-filter">Court</label>
                        <select
                            id="court-filter"
                            value={courtFilter}
                            onChange={(event) => setCourtFilter(event.target.value)}
                        >
                            <option value="all">All</option>
                            {Array.from(new Set(roleCases.map((caseItem) => caseItem.court)))
                                .sort()
                                .map((court) => (
                                    <option key={court} value={court}>
                                        {court}
                                    </option>
                                ))}
                        </select>
                    </div>
                </div>

                {isLoading && <div className="dashboard-state">Loading cases...</div>}
                {!isLoading && errorMessage && <div className="dashboard-state error">{errorMessage}</div>}

                {!isLoading && !errorMessage && (
                    <div className="cases-table">
                        {filteredCases.length === 0 ? (
                            <div className="dashboard-state">No cases match the selected filters.</div>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Case Number</th>
                                        <th>Court</th>
                                        <th>Prosecuting Attorney</th>
                                        <th>Defense Attorney</th>
                                        <th>Charge</th>
                                        <th>Court Date</th>
                                        <th>Conviction</th>
                                        <th>Sentence</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagedCases.map((caseItem) => (
                                        <tr key={caseItem.caseNumber}>
                                            <td><Link to={`/cases/${caseItem.id}`} className="entity-link">{caseItem.caseNumber}</Link></td>
                                            <td>{caseItem.court}</td>
                                            <td>
                                                {caseItem.prosecutionAttorneyId
                                                    ? <Link to={`/attorneys/${caseItem.prosecutionAttorneyId}`} className="entity-link">{caseItem.prosecutionAttorney}</Link>
                                                    : caseItem.prosecutionAttorney}
                                            </td>
                                            <td>
                                                {caseItem.defenseAttorneyId
                                                    ? <Link to={`/attorneys/${caseItem.defenseAttorneyId}`} className="entity-link">{caseItem.defenseAttorney}</Link>
                                                    : caseItem.defenseAttorney}
                                            </td>
                                            <td>{caseItem.charge}</td>
                                            <td>{caseItem.courtDate}</td>
                                            <td>{caseItem.convictionOutcome}</td>
                                            <td>{caseItem.sentence}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {!isLoading && !errorMessage && totalPages > 1 && (
                    <div className="pagination-controls">
                        <div className="page-size">
                            <label htmlFor="page-size">Rows per page</label>
                            <select
                                id="page-size"
                                value={pageSize}
                                onChange={(event) => setPageSize(Number(event.target.value))}
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                        <div className="page-actions">
                            <button
                                type="button"
                                onClick={() => handlePageChange(1)}
                                disabled={!canGoPrevious}
                            >
                                First
                            </button>
                            <button
                                type="button"
                                onClick={() => handlePageChange(page - 1)}
                                disabled={!canGoPrevious}
                            >
                                Previous
                            </button>
                            <span className="page-info">Page {page} of {totalPages}</span>
                            <button
                                type="button"
                                onClick={() => handlePageChange(page + 1)}
                                disabled={!canGoNext}
                            >
                                Next
                            </button>
                            <button
                                type="button"
                                onClick={() => handlePageChange(totalPages)}
                                disabled={!canGoNext}
                            >
                                Last
                            </button>
                        </div>
                    </div>
                )}
            </section>
        </div>
    )
}
