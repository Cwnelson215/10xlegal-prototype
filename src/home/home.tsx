import { useEffect, useMemo, useState } from 'react';
import './home.css';

type CaseRecord = {
    caseNumber: string;
    county: string;
    judge: string;
    prosecutionAttorney: string;
    prosecutionFirm: string;
    defenseAttorney: string;
    defenseFirm: string;
    charge: string;
    courtDate: string;
    ruling: string;
    sentence: string;
};

export function Home() {
    const [allCases, setAllCases] = useState<CaseRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [caseNumberQuery, setCaseNumberQuery] = useState('');
    const [attorneyQuery, setAttorneyQuery] = useState('');
    const [firmQuery, setFirmQuery] = useState('');
    const [judgeQuery, setJudgeQuery] = useState('');
    const [countyFilter, setCountyFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        let isMounted = true;

        const loadCases = async () => {
            try {
                setIsLoading(true);
                setErrorMessage('');
                const dataUrl = new URL('../data/fake-cases.json', import.meta.url).href;
                const response = await fetch(dataUrl);
                if (!response.ok) {
                    throw new Error('Unable to load case data.');
                }
                const data = (await response.json()) as CaseRecord[];
                if (isMounted) {
                    setAllCases(data);
                }
            } catch (error) {
                if (isMounted) {
                    setErrorMessage(error instanceof Error ? error.message : 'Unable to load cases.');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadCases();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        setPage(1);
    }, [caseNumberQuery, attorneyQuery, firmQuery, judgeQuery, countyFilter, pageSize]);

    const hasSearchCriteria =
        caseNumberQuery.trim().length > 0 ||
        attorneyQuery.trim().length > 0 ||
        firmQuery.trim().length > 0 ||
        judgeQuery.trim().length > 0 ||
        countyFilter !== 'all';

    const filteredCases = useMemo(() => {
        const caseQuery = caseNumberQuery.trim().toLowerCase();
        const caseDigits = caseQuery.replace(/\D/g, '');
        const attorneyQueryLower = attorneyQuery.trim().toLowerCase();
        const firmQueryLower = firmQuery.trim().toLowerCase();
        const judgeQueryLower = judgeQuery.trim().toLowerCase();
        return allCases.filter((caseItem) => {
            const sequentialDigits = caseItem.caseNumber.split('-')[2] ?? '';
            const matchesCaseNumber = caseDigits.length > 0
                ? sequentialDigits.startsWith(caseDigits)
                : true;

            const matchesAttorney = attorneyQueryLower.length > 0
                ? caseItem.prosecutionAttorney.toLowerCase().includes(attorneyQueryLower) ||
                  caseItem.defenseAttorney.toLowerCase().includes(attorneyQueryLower)
                : true;

            const matchesFirm = firmQueryLower.length > 0
                ? caseItem.prosecutionFirm.toLowerCase().includes(firmQueryLower) ||
                  caseItem.defenseFirm.toLowerCase().includes(firmQueryLower)
                : true;

            const matchesJudge = judgeQueryLower.length > 0
                ? caseItem.judge.toLowerCase().includes(judgeQueryLower)
                : true;

            const matchesCounty = countyFilter === 'all' ? true : caseItem.county === countyFilter;

            return matchesCaseNumber && matchesAttorney && matchesFirm && matchesJudge && matchesCounty;
        });
    }, [
        allCases,
        caseNumberQuery,
        attorneyQuery,
        firmQuery,
        judgeQuery,
        countyFilter,
    ]);

    const totalCases = allCases.length;
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
                    <h1>Case Dashboard</h1>
                    <p>Filter and review all cases stored in the backend database</p>
                </div>
            </header>
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
                        <label htmlFor="firm-search">Firm Name</label>
                        <input
                            id="firm-search"
                            type="search"
                            placeholder="Prosecutor or defense firm"
                            value={firmQuery}
                            onChange={(event) => setFirmQuery(event.target.value)}
                        />
                    </div>
                    <div className="filter-group">
                        <label htmlFor="judge-search">Judge Name</label>
                        <input
                            id="judge-search"
                            type="search"
                            placeholder="Judge name"
                            value={judgeQuery}
                            onChange={(event) => setJudgeQuery(event.target.value)}
                        />
                    </div>
                    <div className="filter-group">
                        <label htmlFor="county-filter">County</label>
                        <select
                            id="county-filter"
                            value={countyFilter}
                            onChange={(event) => setCountyFilter(event.target.value)}
                        >
                            <option value="all">All</option>
                            {Array.from(new Set(allCases.map((caseItem) => caseItem.county)))
                                .sort()
                                .map((county) => (
                                    <option key={county} value={county}>
                                        {county}
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
                                        <th>County</th>
                                        <th>Judge</th>
                                        <th>Prosecuting Attorney</th>
                                        <th>Prosecuting Firm</th>
                                        <th>Defense Attorney</th>
                                        <th>Defense Firm</th>
                                        <th>Charge</th>
                                        <th>Court Date</th>
                                        <th>Ruling</th>
                                        <th>Sentence</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagedCases.map((caseItem) => (
                                        <tr key={caseItem.caseNumber}>
                                            <td>{caseItem.caseNumber}</td>
                                            <td>{caseItem.county}</td>
                                            <td>{caseItem.judge}</td>
                                            <td>{caseItem.prosecutionAttorney}</td>
                                            <td>{caseItem.prosecutionFirm}</td>
                                            <td>{caseItem.defenseAttorney}</td>
                                            <td>{caseItem.defenseFirm}</td>
                                            <td>{caseItem.charge}</td>
                                            <td>{caseItem.courtDate}</td>
                                            <td>{caseItem.ruling}</td>
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