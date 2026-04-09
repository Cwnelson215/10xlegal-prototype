import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, Tooltip, ResponsiveContainer } from 'recharts';
import { CustomTooltip } from '../CustomTooltip';
import { CHART_COLORS, AXIS_TICK_STYLE, GRID_PROPS, BAR_HOVER_PROPS, TOOLTIP_CURSOR_FILL } from '../chartTheme';
import type { CaseRecord } from '../../types';

function truncate(s: string, max: number): string {
    return s.length > max ? s.slice(0, max - 2) + '...' : s;
}

export function TimeToDispositionChart({ cases }: { cases: CaseRecord[] }) {
    const { data, overallAvg } = useMemo(() => {
        const chargeDays = new Map<string, number[]>();
        for (const c of cases) {
            if (c.filingDate && c.dispositionDate && c.charge) {
                const filing = new Date(c.filingDate).getTime();
                const disposition = new Date(c.dispositionDate).getTime();
                if (!isNaN(filing) && !isNaN(disposition) && disposition > filing) {
                    const days = Math.round((disposition - filing) / (1000 * 60 * 60 * 24));
                    const arr = chargeDays.get(c.charge) ?? [];
                    arr.push(days);
                    chargeDays.set(c.charge, arr);
                }
            }
        }

        const result = Array.from(chargeDays, ([charge, days]) => ({
            charge: truncate(charge, 25),
            avgDays: Math.round(days.reduce((a, b) => a + b, 0) / days.length),
            cases: days.length,
        }))
            .filter((d) => d.cases >= 2)
            .sort((a, b) => b.avgDays - a.avgDays)
            .slice(0, 10);

        const allDays = Array.from(chargeDays.values()).flat();
        const avg = allDays.length > 0 ? Math.round(allDays.reduce((a, b) => a + b, 0) / allDays.length) : 0;

        return { data: result, overallAvg: avg };
    }, [cases]);

    if (data.length === 0) return <p className="chart-empty">No disposition data available.</p>;

    return (
        <ResponsiveContainer width="100%" height={Math.max(300, data.length * 36)}>
            <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20, top: 15, bottom: 5 }}>
                <defs>
                    <linearGradient id="gradDisposition" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={CHART_COLORS.plum} stopOpacity={0.85} />
                        <stop offset="100%" stopColor={CHART_COLORS.plum} stopOpacity={1} />
                    </linearGradient>
                </defs>
                <CartesianGrid {...GRID_PROPS} horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={AXIS_TICK_STYLE} />
                <YAxis type="category" dataKey="charge" width={155} tick={{ ...AXIS_TICK_STYLE, fontSize: 11 }} />
                <ReferenceLine
                    x={overallAvg}
                    stroke={CHART_COLORS.coral}
                    strokeDasharray="6 4"
                />
                <Tooltip
                    cursor={TOOLTIP_CURSOR_FILL}
                    content={
                        <CustomTooltip
                            formatter={(value, name) => name === 'Avg Days' ? `${value} days` : String(value)}
                            footer={(payload) => {
                                const row = payload[0]?.payload as { cases?: number } | undefined;
                                if (row?.cases == null) return null;
                                return `Sample size: ${row.cases.toLocaleString()} case${row.cases === 1 ? '' : 's'}`;
                            }}
                        />
                    }
                />
                <Bar dataKey="avgDays" fill="url(#gradDisposition)" radius={[0, 6, 6, 0]} name="Avg Days" activeBar={BAR_HOVER_PROPS} />
            </BarChart>
        </ResponsiveContainer>
    );
}
