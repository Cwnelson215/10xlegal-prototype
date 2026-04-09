// Color palette and shared Recharts configuration for analytics dashboard

// Primary palette (dark, authoritative)
export const NAVY = '#1B2A4A';
export const SLATE = '#334E68';
export const STEEL = '#627D98';

// Chart accent colors
export const CHART_COLORS = {
    blue: '#2680C2',
    teal: '#0E9AA7',
    amber: '#D4A017',
    coral: '#CB6040',
    green: '#27AB83',
    plum: '#724BB7',
    rose: '#C44569',
    grey: '#9FB3C8',
} as const;

// Ordered array for cycling through colors in charts
export const CHART_PALETTE = [
    CHART_COLORS.blue,
    CHART_COLORS.teal,
    CHART_COLORS.amber,
    CHART_COLORS.coral,
    CHART_COLORS.green,
    CHART_COLORS.plum,
    CHART_COLORS.rose,
    CHART_COLORS.grey,
];

// Semantic status colors
export const STATUS_COLORS: Record<string, string> = {
    active: '#2680C2',
    pending: '#D4A017',
    'on-hold': '#9FB3C8',
    closed: '#27AB83',
};

// Outcome categories and their colors
export const OUTCOME_CATEGORIES = ['guilty', 'noContest', 'dismissed', 'pending'] as const;
export type OutcomeCategory = typeof OUTCOME_CATEGORIES[number];

export const OUTCOME_COLORS: Record<OutcomeCategory, string> = {
    guilty: '#CB6040',
    noContest: '#D4A017',
    dismissed: '#9FB3C8',
    pending: '#724BB7',
};

export const OUTCOME_LABELS: Record<OutcomeCategory, string> = {
    guilty: 'Guilty',
    noContest: 'No Contest',
    dismissed: 'Dismissed',
    pending: 'Pending',
};

// Shared Recharts axis tick style
export const AXIS_TICK_STYLE = {
    fontSize: 12,
    fill: '#627D98',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
} as const;

// Shared CartesianGrid props
export const GRID_PROPS = {
    strokeDasharray: '3 3',
    stroke: '#E4E7EB',
} as const;

// Hover highlight for Bar components
export const BAR_HOVER_PROPS = {
    fillOpacity: 0.75,
    stroke: '#1B2A4A',
    strokeWidth: 1.5,
} as const;

// Hover highlight for Area activeDot
export const AREA_ACTIVE_DOT_PROPS = {
    r: 6,
    strokeWidth: 2,
    stroke: '#fff',
} as const;

// Tooltip cursor overlay for bar/area charts
export const TOOLTIP_CURSOR_FILL = { fill: 'rgba(27,42,74,0.06)' } as const;

// Format a "YYYY-MM" month key as a human-readable label (e.g. "Mar 2024").
export function formatMonthLabel(yyyyMm: string | number): string {
    const s = String(yyyyMm);
    const [y, m] = s.split('-');
    if (!y || !m) return s;
    const yearNum = Number(y);
    const monthNum = Number(m);
    if (!Number.isFinite(yearNum) || !Number.isFinite(monthNum)) return s;
    const date = new Date(yearNum, monthNum - 1, 1);
    return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

// Classify a ruling string into a meaningful outcome category.
// The ruling field contains the real detail (e.g. "Charges All Disposed - Guilty").
// The convictionOutcome field only has generic values like "Charges All Disposed".
// Always pass `ruling` to this function.
export function classifyOutcome(ruling: string | null | undefined): OutcomeCategory {
    if (!ruling) return 'pending';
    const lower = ruling.toLowerCase();

    // Dismissed (check before guilty since "dismissed" is unambiguous)
    if (lower.includes('dismiss')) return 'dismissed';

    // No Contest
    if (lower.includes('no contest') || lower.includes('nolo')) return 'noContest';

    // Guilty (includes "Guilty", "Guilty - Jury", "Guilty - Mental Cond", etc.)
    if (lower.includes('guilty')) return 'guilty';

    // No clear outcome keyword -- treat as pending/unresolved
    return 'pending';
}
