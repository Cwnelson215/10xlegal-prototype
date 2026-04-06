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

// Semantic outcome colors
export const OUTCOME_COLORS = {
    guilty: '#CB6040',
    notGuilty: '#27AB83',
    dismissed: '#9FB3C8',
    other: '#9FB3C8',
} as const;

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
