import { useMemo } from 'react';
import { useAnalyticsFilter, type FilterDimension } from './context';
import type { CaseRecord } from '../types';
import './FilterToolbar.css';

interface FilterToolbarProps {
    rawCases: CaseRecord[];
}

function uniqueSorted(values: (string | undefined)[]): string[] {
    const set = new Set<string>();
    for (const v of values) {
        if (v) set.add(v);
    }
    return Array.from(set).sort();
}

export function FilterToolbar({ rawCases }: FilterToolbarProps) {
    const { state, setFilter, clearFilter, setDateRange, clearAll, toggleCrossFilter } = useAnalyticsFilter();

    const options = useMemo(() => ({
        court: uniqueSorted(rawCases.map((c) => c.court)),
        status: uniqueSorted(rawCases.map((c) => c.status)),
        charge: uniqueSorted(rawCases.map((c) => c.charge)),
        caseType: uniqueSorted(rawCases.map((c) => c.caseType)),
        districtNumber: uniqueSorted(rawCases.map((c) => c.districtNumber)),
    }), [rawCases]);

    const activeCount = [
        state.court, state.status, state.charge, state.caseType, state.districtNumber,
        state.judgeName, state.ruling,
        state.dateRange.start, state.dateRange.end,
        state.crossFilter,
    ].filter(Boolean).length;

    function handleSelect(dimension: FilterDimension, value: string) {
        if (value === '') {
            clearFilter(dimension);
        } else {
            setFilter(dimension, value);
        }
    }

    return (
        <div className="filter-toolbar">
            <div className="filter-toolbar-filters">
                <div className="filter-group">
                    <label htmlFor="filter-court">Court</label>
                    <select
                        id="filter-court"
                        className="filter-select"
                        value={state.court ?? ''}
                        onChange={(e) => handleSelect('court', e.target.value)}
                    >
                        <option value="">All Courts</option>
                        {options.court.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                </div>

                <div className="filter-group">
                    <label htmlFor="filter-status">Status</label>
                    <select
                        id="filter-status"
                        className="filter-select"
                        value={state.status ?? ''}
                        onChange={(e) => handleSelect('status', e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        {options.status.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                </div>

                <div className="filter-group">
                    <label htmlFor="filter-caseType">Case Type</label>
                    <select
                        id="filter-caseType"
                        className="filter-select"
                        value={state.caseType ?? ''}
                        onChange={(e) => handleSelect('caseType', e.target.value)}
                    >
                        <option value="">All Types</option>
                        {options.caseType.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                </div>

                <div className="filter-group">
                    <label htmlFor="filter-district">District</label>
                    <select
                        id="filter-district"
                        className="filter-select"
                        value={state.districtNumber ?? ''}
                        onChange={(e) => handleSelect('districtNumber', e.target.value)}
                    >
                        <option value="">All Districts</option>
                        {options.districtNumber.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                </div>

                <div className="filter-group">
                    <label htmlFor="filter-charge">Charge</label>
                    <select
                        id="filter-charge"
                        className="filter-select"
                        value={state.charge ?? ''}
                        onChange={(e) => handleSelect('charge', e.target.value)}
                    >
                        <option value="">All Charges</option>
                        {options.charge.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                </div>

                <div className="filter-group">
                    <label htmlFor="filter-date-start">Filing From</label>
                    <input
                        id="filter-date-start"
                        type="date"
                        className="filter-date"
                        value={state.dateRange.start ?? ''}
                        onChange={(e) => setDateRange(e.target.value || null, state.dateRange.end)}
                    />
                </div>

                <div className="filter-group">
                    <label htmlFor="filter-date-end">Filing To</label>
                    <input
                        id="filter-date-end"
                        type="date"
                        className="filter-date"
                        value={state.dateRange.end ?? ''}
                        onChange={(e) => setDateRange(state.dateRange.start, e.target.value || null)}
                    />
                </div>
            </div>

            <div className="filter-toolbar-actions">
                {state.crossFilter && (
                    <span className="cross-filter-chip">
                        {state.crossFilter.dimension}: {state.crossFilter.value}
                        <button
                            className="chip-dismiss"
                            onClick={() => toggleCrossFilter(state.crossFilter!.dimension, state.crossFilter!.value)}
                        >
                            &times;
                        </button>
                    </span>
                )}
                {activeCount > 0 && (
                    <button className="filter-clear-btn" onClick={clearAll}>
                        Clear All ({activeCount})
                    </button>
                )}
            </div>
        </div>
    );
}
