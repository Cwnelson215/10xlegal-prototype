import { useMemo } from 'react';
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts';
import { CustomTooltip } from '../CustomTooltip';
import { CHART_PALETTE } from '../chartTheme';
import type { CaseRecord } from '../../types';

export function CaseTypeBreakdownChart({ cases }: { cases: CaseRecord[] }) {
    const data = useMemo(() => {
        const counts = new Map<string, number>();
        for (const c of cases) {
            if (c.caseType) {
                counts.set(c.caseType, (counts.get(c.caseType) ?? 0) + 1);
            }
        }
        return Array.from(counts, ([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [cases]);

    if (data.length === 0) return <p className="chart-empty">No case type data available.</p>;

    return (
        <ResponsiveContainer width="100%" height={320}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="45%"
                    outerRadius={90}
                    innerRadius={50}
                    dataKey="value"
                    paddingAngle={2}
                    label={({ name, percent }: { name?: string; percent?: number }) => {
                        const short = (name ?? '').length > 15 ? (name ?? '').slice(0, 12) + '...' : name ?? '';
                        return `${short} ${((percent ?? 0) * 100).toFixed(0)}%`;
                    }}
                    labelLine={{ strokeWidth: 1 }}
                >
                    {data.map((_, index) => (
                        <Cell key={index} fill={CHART_PALETTE[index % CHART_PALETTE.length]!} />
                    ))}
                </Pie>
                <CustomTooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
        </ResponsiveContainer>
    );
}
