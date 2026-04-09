import { useState, useMemo } from 'react';
import { useAnalyticsFilter } from './context';
import type { CaseRecord } from '../types';
import './CaseDrillDownModal.css';

type SortKey = 'caseNumber' | 'court' | 'charge' | 'status' | 'filingDate' | 'judgeName' | 'ruling';
type SortDir = 'asc' | 'desc';

const COLUMNS: { key: SortKey; label: string }[] = [
    { key: 'caseNumber', label: 'Case #' },
    { key: 'court', label: 'Court' },
    { key: 'charge', label: 'Charge' },
    { key: 'status', label: 'Status' },
    { key: 'filingDate', label: 'Filing Date' },
    { key: 'judgeName', label: 'Judge' },
    { key: 'ruling', label: 'Ruling' },
];

function getCellValue(c: CaseRecord, key: SortKey): string {
    return (c[key] as string | undefined) ?? '';
}

export function CaseDrillDownModal() {
    const { state, closeDrillDown } = useAnalyticsFilter();
    const [sortKey, setSortKey] = useState<SortKey>('caseNumber');
    const [sortDir, setSortDir] = useState<SortDir>('asc');

    const drillDown = state.drillDown;
    if (!drillDown) return null;

    function handleSort(key: SortKey) {
        if (key === sortKey) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    }

    return <ModalContent
        title={drillDown.title}
        cases={drillDown.cases}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
        onClose={closeDrillDown}
    />;
}

function ModalContent({
    title,
    cases,
    sortKey,
    sortDir,
    onSort,
    onClose,
}: {
    title: string;
    cases: CaseRecord[];
    sortKey: SortKey;
    sortDir: SortDir;
    onSort: (key: SortKey) => void;
    onClose: () => void;
}) {
    const sorted = useMemo(() => {
        const arr = [...cases];
        arr.sort((a, b) => {
            const va = getCellValue(a, sortKey);
            const vb = getCellValue(b, sortKey);
            const cmp = va.localeCompare(vb, undefined, { numeric: true });
            return sortDir === 'asc' ? cmp : -cmp;
        });
        return arr;
    }, [cases, sortKey, sortDir]);

    return (
        <div className="drilldown-overlay" onClick={onClose}>
            <div className="drilldown-modal" onClick={(e) => e.stopPropagation()}>
                <div className="drilldown-header">
                    <div>
                        <h3>{title}</h3>
                        <span className="drilldown-count">{cases.length} case{cases.length !== 1 ? 's' : ''}</span>
                    </div>
                    <button className="drilldown-close" onClick={onClose}>&times;</button>
                </div>
                <div className="drilldown-body">
                    <table className="drilldown-table">
                        <thead>
                            <tr>
                                {COLUMNS.map((col) => (
                                    <th
                                        key={col.key}
                                        className={sortKey === col.key ? `sorted ${sortDir}` : ''}
                                        onClick={() => onSort(col.key)}
                                    >
                                        {col.label}
                                        {sortKey === col.key && (
                                            <span className="sort-arrow">{sortDir === 'asc' ? ' \u25B2' : ' \u25BC'}</span>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map((c) => (
                                <tr key={c.id}>
                                    <td>
                                        <a href={`/cases/${c.id}`} className="drilldown-link">
                                            {c.caseNumber}
                                        </a>
                                    </td>
                                    <td>{c.court}</td>
                                    <td>{c.charge}</td>
                                    <td>
                                        <span className={`status-badge status-${c.status}`}>
                                            {c.status}
                                        </span>
                                    </td>
                                    <td>{c.filingDate}</td>
                                    <td>{c.judgeName ?? ''}</td>
                                    <td>{c.ruling}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
