import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Brush, ResponsiveContainer } from 'recharts';
import { CustomTooltip } from '../CustomTooltip';
import { CHART_COLORS, AXIS_TICK_STYLE, GRID_PROPS, AREA_ACTIVE_DOT_PROPS } from '../chartTheme';
import type { CaseRecord } from '../../types';

export function CasesOverTimeChart({ cases }: { cases: CaseRecord[] }) {
    const data = useMemo(() => {
        const counts = new Map<string, number>();
        for (const c of cases) {
            const month = c.courtDate.slice(0, 7);
            counts.set(month, (counts.get(month) ?? 0) + 1);
        }
        let cumulative = 0;
        return Array.from(counts, ([month, count]) => ({ month, count }))
            .sort((a, b) => a.month.localeCompare(b.month))
            .map((d) => {
                cumulative += d.count;
                return { ...d, cumulative };
            });
    }, [cases]);

    if (data.length === 0) return <p className="chart-empty">No data available.</p>;

    return (
        <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                <defs>
                    <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_COLORS.blue} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={CHART_COLORS.blue} stopOpacity={0.02} />
                    </linearGradient>
                </defs>
                <CartesianGrid {...GRID_PROPS} />
                <XAxis dataKey="month" tick={AXIS_TICK_STYLE} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={AXIS_TICK_STYLE} />
                <Area
                    type="monotone"
                    dataKey="count"
                    stroke={CHART_COLORS.blue}
                    fill="url(#gradBlue)"
                    strokeWidth={2.5}
                    name="Cases"
                    dot={false}
                    activeDot={AREA_ACTIVE_DOT_PROPS}
                />
                {data.length > 12 && (
                    <Brush
                        dataKey="month"
                        height={28}
                        stroke={CHART_COLORS.blue}
                        travellerWidth={8}
                        fill="#F0F4F8"
                    />
                )}
                <CustomTooltip />
            </AreaChart>
        </ResponsiveContainer>
    );
}
