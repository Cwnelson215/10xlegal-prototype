import { useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { CustomTooltip } from '../CustomTooltip';
import { CHART_COLORS, AXIS_TICK_STYLE, GRID_PROPS } from '../chartTheme';
import { useAnalyticsFilter } from '../context';
import type { CaseRecord } from '../../types';

function truncate(s: string, max: number): string {
    return s.length > max ? s.slice(0, max - 2) + '...' : s;
}

export function ChargeDistributionChart({ cases }: { cases: CaseRecord[] }) {
    const { openDrillDown, toggleCrossFilter } = useAnalyticsFilter();

    const data = useMemo(() => {
        const counts = new Map<string, number>();
        for (const c of cases) {
            counts.set(c.charge, (counts.get(c.charge) ?? 0) + 1);
        }
        return Array.from(counts, ([charge, count]) => ({
            charge: truncate(charge, 28),
            fullCharge: charge,
            count,
        }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }, [cases]);

    const handleClick = useCallback((entry: { fullCharge?: string }) => {
        const charge = entry.fullCharge;
        if (!charge) return;
        const matching = cases.filter((c) => c.charge === charge);
        openDrillDown(`"${charge}" Cases (${matching.length})`, matching);
    }, [cases, openDrillDown]);

    const handleDoubleClick = useCallback((entry: { fullCharge?: string }) => {
        const charge = entry.fullCharge;
        if (!charge) return;
        toggleCrossFilter('charge', charge);
    }, [toggleCrossFilter]);

    if (data.length === 0) return <p className="chart-empty">No data available.</p>;

    return (
        <ResponsiveContainer width="100%" height={Math.max(300, data.length * 36)}>
            <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
                <defs>
                    <linearGradient id="gradChargeBar" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={CHART_COLORS.coral} stopOpacity={0.85} />
                        <stop offset="100%" stopColor={CHART_COLORS.rose} stopOpacity={0.9} />
                    </linearGradient>
                </defs>
                <CartesianGrid {...GRID_PROPS} horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={AXIS_TICK_STYLE} />
                <YAxis type="category" dataKey="charge" width={170} tick={{ ...AXIS_TICK_STYLE, fontSize: 11 }} />
                <CustomTooltip />
                <Bar
                    dataKey="count"
                    fill="url(#gradChargeBar)"
                    radius={[0, 6, 6, 0]}
                    name="Cases"
                    onClick={handleClick}
                    onDoubleClick={handleDoubleClick}
                    style={{ cursor: 'pointer' }}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}
