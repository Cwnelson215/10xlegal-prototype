import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, ResponsiveContainer } from 'recharts';
import { CustomTooltip } from '../CustomTooltip';
import { CHART_COLORS, AXIS_TICK_STYLE, GRID_PROPS } from '../chartTheme';
import type { CaseRecord } from '../../types';

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
            charge: charge.length > 30 ? charge.slice(0, 27) + '...' : charge,
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
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30 }}>
                <defs>
                    <linearGradient id="gradDisposition" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={CHART_COLORS.plum} stopOpacity={0.85} />
                        <stop offset="100%" stopColor={CHART_COLORS.plum} stopOpacity={1} />
                    </linearGradient>
                </defs>
                <CartesianGrid {...GRID_PROPS} horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={AXIS_TICK_STYLE} label={{ value: 'Days', position: 'insideBottomRight', offset: -5, fill: '#627D98', fontSize: 11 }} />
                <YAxis type="category" dataKey="charge" width={150} tick={{ ...AXIS_TICK_STYLE, fontSize: 11 }} />
                <ReferenceLine
                    x={overallAvg}
                    stroke={CHART_COLORS.coral}
                    strokeDasharray="6 4"
                    label={{ value: `Avg: ${overallAvg}d`, position: 'top', fill: CHART_COLORS.coral, fontSize: 11 }}
                />
                <CustomTooltip formatter={(value, name) => name === 'Avg Days' ? `${value} days` : String(value)} />
                <Bar dataKey="avgDays" fill="url(#gradDisposition)" radius={[0, 6, 6, 0]} name="Avg Days" />
            </BarChart>
        </ResponsiveContainer>
    );
}
