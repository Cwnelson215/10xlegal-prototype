import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, ResponsiveContainer } from 'recharts';
import { CustomTooltip } from '../CustomTooltip';
import { CHART_COLORS, AXIS_TICK_STYLE, GRID_PROPS } from '../chartTheme';
import type { CaseRecord } from '../../types';

function truncate(s: string, max: number): string {
    return s.length > max ? s.slice(0, max - 2) + '...' : s;
}

export function CaseResolutionTimeChart({ cases }: { cases: CaseRecord[] }) {
    const { data, overallAvg } = useMemo(() => {
        const courtDays = new Map<string, number[]>();
        for (const c of cases) {
            if (c.filingDate && c.dispositionDate) {
                const filing = new Date(c.filingDate).getTime();
                const disposition = new Date(c.dispositionDate).getTime();
                if (!isNaN(filing) && !isNaN(disposition) && disposition > filing) {
                    const days = Math.round((disposition - filing) / (1000 * 60 * 60 * 24));
                    const arr = courtDays.get(c.court) ?? [];
                    arr.push(days);
                    courtDays.set(c.court, arr);
                }
            }
        }

        const result = Array.from(courtDays, ([court, days]) => ({
            court: truncate(court, 22),
            avgDays: Math.round(days.reduce((a, b) => a + b, 0) / days.length),
            cases: days.length,
        }))
            .sort((a, b) => b.avgDays - a.avgDays)
            .slice(0, 12);

        const allDays = Array.from(courtDays.values()).flat();
        const avg = allDays.length > 0 ? Math.round(allDays.reduce((a, b) => a + b, 0) / allDays.length) : 0;

        return { data: result, overallAvg: avg };
    }, [cases]);

    if (data.length === 0) return <p className="chart-empty">No resolution data available.</p>;

    return (
        <ResponsiveContainer width="100%" height={Math.max(300, data.length * 32)}>
            <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20, top: 15, bottom: 5 }}>
                <defs>
                    <linearGradient id="gradResolution" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={CHART_COLORS.teal} stopOpacity={0.85} />
                        <stop offset="100%" stopColor={CHART_COLORS.green} stopOpacity={0.95} />
                    </linearGradient>
                </defs>
                <CartesianGrid {...GRID_PROPS} horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={AXIS_TICK_STYLE} />
                <YAxis type="category" dataKey="court" width={130} tick={{ ...AXIS_TICK_STYLE, fontSize: 11 }} />
                <ReferenceLine
                    x={overallAvg}
                    stroke={CHART_COLORS.coral}
                    strokeDasharray="6 4"
                />
                <CustomTooltip formatter={(value, name) => name === 'Avg Days' ? `${value} days` : String(value)} />
                <Bar dataKey="avgDays" fill="url(#gradResolution)" radius={[0, 6, 6, 0]} name="Avg Days" />
            </BarChart>
        </ResponsiveContainer>
    );
}
