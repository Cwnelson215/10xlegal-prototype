import { useMemo } from 'react';
import { useAnalyticsFilter, type FilterDimension } from './AnalyticsFilterContext';
import type { CaseRecord } from '../../types';

const FIELD_ACCESSORS: Record<FilterDimension, (c: CaseRecord) => string | undefined> = {
    court: (c) => c.court,
    status: (c) => c.status,
    charge: (c) => c.charge,
    caseType: (c) => c.caseType,
    districtNumber: (c) => c.districtNumber,
    judgeName: (c) => c.judgeName,
    ruling: (c) => c.ruling,
};

const FILTER_DIMENSIONS: FilterDimension[] = ['court', 'status', 'charge', 'caseType', 'districtNumber', 'judgeName', 'ruling'];

export function useFilteredCases(allCases: CaseRecord[]): CaseRecord[] {
    const { state } = useAnalyticsFilter();

    return useMemo(() => {
        let filtered = allCases;

        // Apply global filters
        for (const dim of FILTER_DIMENSIONS) {
            const filterValue = state[dim];
            if (filterValue !== null) {
                const accessor = FIELD_ACCESSORS[dim];
                filtered = filtered.filter((c) => accessor(c) === filterValue);
            }
        }

        // Apply date range filter
        if (state.dateRange.start) {
            const start = state.dateRange.start;
            filtered = filtered.filter((c) => c.filingDate >= start);
        }
        if (state.dateRange.end) {
            const end = state.dateRange.end;
            filtered = filtered.filter((c) => c.filingDate <= end);
        }

        // Apply cross-chart filter
        if (state.crossFilter) {
            const accessor = FIELD_ACCESSORS[state.crossFilter.dimension];
            const value = state.crossFilter.value;
            filtered = filtered.filter((c) => accessor(c) === value);
        }

        return filtered;
    }, [allCases, state]);
}
