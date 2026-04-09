import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import type { CaseRecord } from '../../types';

// --- Types ---

export type FilterDimension = 'court' | 'status' | 'charge' | 'caseType' | 'districtNumber' | 'judgeName' | 'ruling';

export interface AnalyticsFilterState {
    court: string | null;
    status: string | null;
    charge: string | null;
    caseType: string | null;
    districtNumber: string | null;
    judgeName: string | null;
    ruling: string | null;
    dateRange: { start: string | null; end: string | null };
    crossFilter: { dimension: FilterDimension; value: string } | null;
    drillDown: { title: string; cases: CaseRecord[] } | null;
}

type Action =
    | { type: 'SET_FILTER'; dimension: FilterDimension; value: string }
    | { type: 'CLEAR_FILTER'; dimension: FilterDimension }
    | { type: 'SET_DATE_RANGE'; start: string | null; end: string | null }
    | { type: 'CLEAR_ALL' }
    | { type: 'SET_CROSS_FILTER'; dimension: FilterDimension; value: string }
    | { type: 'CLEAR_CROSS_FILTER' }
    | { type: 'OPEN_DRILL_DOWN'; title: string; cases: CaseRecord[] }
    | { type: 'CLOSE_DRILL_DOWN' };

export interface AnalyticsFilterAPI {
    state: AnalyticsFilterState;
    setFilter: (dimension: FilterDimension, value: string) => void;
    clearFilter: (dimension: FilterDimension) => void;
    setDateRange: (start: string | null, end: string | null) => void;
    clearAll: () => void;
    toggleCrossFilter: (dimension: FilterDimension, value: string) => void;
    openDrillDown: (title: string, cases: CaseRecord[]) => void;
    closeDrillDown: () => void;
}

// --- Initial State ---

const initialState: AnalyticsFilterState = {
    court: null,
    status: null,
    charge: null,
    caseType: null,
    districtNumber: null,
    judgeName: null,
    ruling: null,
    dateRange: { start: null, end: null },
    crossFilter: null,
    drillDown: null,
};

// --- Reducer ---

function reducer(state: AnalyticsFilterState, action: Action): AnalyticsFilterState {
    switch (action.type) {
        case 'SET_FILTER':
            return { ...state, [action.dimension]: action.value };
        case 'CLEAR_FILTER':
            return { ...state, [action.dimension]: null };
        case 'SET_DATE_RANGE':
            return { ...state, dateRange: { start: action.start, end: action.end } };
        case 'CLEAR_ALL':
            return { ...initialState };
        case 'SET_CROSS_FILTER':
            return { ...state, crossFilter: { dimension: action.dimension, value: action.value } };
        case 'CLEAR_CROSS_FILTER':
            return { ...state, crossFilter: null };
        case 'OPEN_DRILL_DOWN':
            return { ...state, drillDown: { title: action.title, cases: action.cases } };
        case 'CLOSE_DRILL_DOWN':
            return { ...state, drillDown: null };
    }
}

// --- Context ---

const AnalyticsFilterContext = createContext<AnalyticsFilterAPI | null>(null);

export function AnalyticsFilterProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);

    const setFilter = useCallback((dimension: FilterDimension, value: string) => {
        dispatch({ type: 'SET_FILTER', dimension, value });
    }, []);

    const clearFilter = useCallback((dimension: FilterDimension) => {
        dispatch({ type: 'CLEAR_FILTER', dimension });
    }, []);

    const setDateRange = useCallback((start: string | null, end: string | null) => {
        dispatch({ type: 'SET_DATE_RANGE', start, end });
    }, []);

    const clearAll = useCallback(() => {
        dispatch({ type: 'CLEAR_ALL' });
    }, []);

    const toggleCrossFilter = useCallback((dimension: FilterDimension, value: string) => {
        if (state.crossFilter?.dimension === dimension && state.crossFilter.value === value) {
            dispatch({ type: 'CLEAR_CROSS_FILTER' });
        } else {
            dispatch({ type: 'SET_CROSS_FILTER', dimension, value });
        }
    }, [state.crossFilter]);

    const openDrillDown = useCallback((title: string, cases: CaseRecord[]) => {
        dispatch({ type: 'OPEN_DRILL_DOWN', title, cases });
    }, []);

    const closeDrillDown = useCallback(() => {
        dispatch({ type: 'CLOSE_DRILL_DOWN' });
    }, []);

    const api: AnalyticsFilterAPI = {
        state,
        setFilter,
        clearFilter,
        setDateRange,
        clearAll,
        toggleCrossFilter,
        openDrillDown,
        closeDrillDown,
    };

    return (
        <AnalyticsFilterContext value={api}>
            {children}
        </AnalyticsFilterContext>
    );
}

export function useAnalyticsFilter(): AnalyticsFilterAPI {
    const ctx = useContext(AnalyticsFilterContext);
    if (!ctx) throw new Error('useAnalyticsFilter must be used within AnalyticsFilterProvider');
    return ctx;
}
