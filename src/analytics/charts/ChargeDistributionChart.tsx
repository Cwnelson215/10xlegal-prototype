import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { CustomTooltip } from '../CustomTooltip';
import { CHART_COLORS, AXIS_TICK_STYLE, GRID_PROPS } from '../chartTheme';
import type { CaseRecord } from '../../types';

export function ChargeDistributionChart({ cases }: { cases: CaseRecord[] }) {
    const data = useMemo(() => {
        const counts = new Map<string, number>();
        for (const c of cases) {
            counts.set(c.charge, (counts.get(c.charge) ?? 0) + 1);
        }
        return Array.from(counts, ([charge, count]) => ({
            charge: charge.length > 35 ? charge.slice(0, 32) + '...' : charge,
            count,
        }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }, [cases]);

    if (data.length === 0) return <p className="chart-empty">No data available.</p>;

    return (
        <ResponsiveContainer width="100%" height={Math.max(300, data.length * 36)}>
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
                <defs>
                    <linearGradient id="gradChargeBar" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={CHART_COLORS.coral} stopOpacity={0.85} />
                        <stop offset="100%" stopColor={CHART_COLORS.rose} stopOpacity={0.9} />
                    </linearGradient>
                </defs>
                <CartesianGrid {...GRID_PROPS} horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={AXIS_TICK_STYLE} />
                <YAxis type="category" dataKey="charge" width={160} tick={{ ...AXIS_TICK_STYLE, fontSize: 11 }} />
                <CustomTooltip />
                <Bar dataKey="count" fill="url(#gradChargeBar)" radius={[0, 6, 6, 0]} name="Cases" />
            </BarChart>
        </ResponsiveContainer>
    );
}
