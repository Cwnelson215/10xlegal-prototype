import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { CustomTooltip } from '../CustomTooltip';
import { CHART_COLORS, AXIS_TICK_STYLE, GRID_PROPS } from '../chartTheme';
import type { CaseRecord } from '../../types';

export function RulingDistributionChart({ cases }: { cases: CaseRecord[] }) {
    const data = useMemo(() => {
        const counts = new Map<string, number>();
        for (const c of cases) {
            if (c.ruling) {
                counts.set(c.ruling, (counts.get(c.ruling) ?? 0) + 1);
            }
        }
        return Array.from(counts, ([ruling, count]) => ({
            ruling: ruling.length > 35 ? ruling.slice(0, 32) + '...' : ruling,
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
                    <linearGradient id="gradRulingBar" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={CHART_COLORS.amber} stopOpacity={0.85} />
                        <stop offset="100%" stopColor={CHART_COLORS.amber} stopOpacity={1} />
                    </linearGradient>
                </defs>
                <CartesianGrid {...GRID_PROPS} horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={AXIS_TICK_STYLE} />
                <YAxis type="category" dataKey="ruling" width={160} tick={{ ...AXIS_TICK_STYLE, fontSize: 11 }} />
                <CustomTooltip />
                <Bar dataKey="count" fill="url(#gradRulingBar)" radius={[0, 6, 6, 0]} name="Rulings" />
            </BarChart>
        </ResponsiveContainer>
    );
}
