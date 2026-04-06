import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { CustomTooltip } from '../CustomTooltip';
import { CHART_COLORS, AXIS_TICK_STYLE, GRID_PROPS } from '../chartTheme';
import type { CaseRecord } from '../../types';

function truncate(s: string, max: number): string {
    return s.length > max ? s.slice(0, max - 2) + '...' : s;
}

export function JudgeCaseloadChart({ cases }: { cases: CaseRecord[] }) {
    const data = useMemo(() => {
        const counts = new Map<string, number>();
        for (const c of cases) {
            if (c.judgeName) {
                counts.set(c.judgeName, (counts.get(c.judgeName) ?? 0) + 1);
            }
        }
        return Array.from(counts, ([judge, count]) => ({
            judge: truncate(judge, 22),
            count,
        }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 15);
    }, [cases]);

    if (data.length === 0) return <p className="chart-empty">No judge data available.</p>;

    return (
        <ResponsiveContainer width="100%" height={Math.max(350, data.length * 30)}>
            <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
                <defs>
                    <linearGradient id="gradJudge" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={CHART_COLORS.plum} stopOpacity={0.8} />
                        <stop offset="100%" stopColor={CHART_COLORS.blue} stopOpacity={0.9} />
                    </linearGradient>
                </defs>
                <CartesianGrid {...GRID_PROPS} horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={AXIS_TICK_STYLE} />
                <YAxis type="category" dataKey="judge" width={130} tick={{ ...AXIS_TICK_STYLE, fontSize: 11 }} />
                <CustomTooltip />
                <Bar dataKey="count" fill="url(#gradJudge)" radius={[0, 6, 6, 0]} name="Cases" />
            </BarChart>
        </ResponsiveContainer>
    );
}
