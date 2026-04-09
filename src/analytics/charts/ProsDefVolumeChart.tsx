import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer } from 'recharts';
import { CustomTooltip } from '../CustomTooltip';
import { CHART_COLORS, AXIS_TICK_STYLE, GRID_PROPS, AREA_ACTIVE_DOT_PROPS } from '../chartTheme';
import type { CaseRecord } from '../../types';

export function ProsDefVolumeChart({ cases }: { cases: CaseRecord[] }) {
    const { data, avgTotal } = useMemo(() => {
        const monthly = new Map<string, { prosecution: number; defense: number }>();
        for (const c of cases) {
            if (!c.courtDate) continue;
            const month = c.courtDate.slice(0, 7);
            const entry = monthly.get(month) ?? { prosecution: 0, defense: 0 };
            if (c.prosecutionAttorneys.length > 0) entry.prosecution++;
            if (c.defenseAttorneys.length > 0) entry.defense++;
            monthly.set(month, entry);
        }
        const result = Array.from(monthly, ([month, counts]) => ({ month, ...counts }))
            .sort((a, b) => a.month.localeCompare(b.month));
        const avg = result.length > 0
            ? Math.round(result.reduce((s, d) => s + d.prosecution + d.defense, 0) / result.length)
            : 0;
        return { data: result, avgTotal: avg };
    }, [cases]);

    if (data.length === 0) return <p className="chart-empty">No data available.</p>;

    return (
        <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={data} margin={{ top: 10, right: 40, bottom: 0, left: 0 }}>
                <defs>
                    <linearGradient id="gradPros" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_COLORS.coral} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={CHART_COLORS.coral} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gradDef" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_COLORS.blue} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={CHART_COLORS.blue} stopOpacity={0.02} />
                    </linearGradient>
                </defs>
                <CartesianGrid {...GRID_PROPS} />
                <XAxis dataKey="month" tick={AXIS_TICK_STYLE} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={AXIS_TICK_STYLE} />
                <ReferenceLine
                    y={avgTotal}
                    stroke={CHART_COLORS.grey}
                    strokeDasharray="6 4"
                    label={{ value: `Avg: ${avgTotal}`, position: 'right', fill: '#627D98', fontSize: 11 }}
                />
                <CustomTooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Area
                    type="natural"
                    dataKey="prosecution"
                    stroke={CHART_COLORS.coral}
                    fill="url(#gradPros)"
                    name="Prosecution"
                    strokeWidth={2}
                    dot={false}
                    activeDot={AREA_ACTIVE_DOT_PROPS}
                />
                <Area
                    type="natural"
                    dataKey="defense"
                    stroke={CHART_COLORS.blue}
                    fill="url(#gradDef)"
                    name="Defense"
                    strokeWidth={2}
                    dot={false}
                    activeDot={AREA_ACTIVE_DOT_PROPS}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
