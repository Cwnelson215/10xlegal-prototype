import { useMemo } from 'react';
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts';
import { CustomTooltip } from '../CustomTooltip';
import { CHART_PALETTE } from '../chartTheme';
import type { CaseRecord } from '../../types';

function shortenLabel(name: string): string {
    if (name.length <= 20) return name;
    // Try to abbreviate common prefixes
    return name
        .replace('Charges All Disposed - ', '')
        .replace('Criminal Case Closed - ', '')
        .slice(0, 18) + '...';
}

export function ConvictionDistributionChart({ cases }: { cases: CaseRecord[] }) {
    const data = useMemo(() => {
        const counts = new Map<string, number>();
        for (const c of cases) {
            const outcome = c.convictionOutcome || c.ruling;
            if (outcome) {
                counts.set(outcome, (counts.get(outcome) ?? 0) + 1);
            }
        }
        return Array.from(counts, ([name, value]) => ({ name, value, short: shortenLabel(name) })).sort(
            (a, b) => b.value - a.value,
        );
    }, [cases]);

    const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);

    if (data.length === 0) return <p className="chart-empty">No data available.</p>;

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
                    nameKey="short"
                    paddingAngle={2}
                    label={({ short, percent }: { short?: string; percent?: number }) =>
                        `${short ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={{ strokeWidth: 1 }}
                >
                    {data.map((_, index) => (
                        <Cell key={index} fill={CHART_PALETTE[index % CHART_PALETTE.length]!} />
                    ))}
                </Pie>
                <text x="50%" y="43%" textAnchor="middle" fill="#1B2A4A" fontSize={22} fontWeight={700}>
                    {total.toLocaleString()}
                </text>
                <text x="50%" y="50%" textAnchor="middle" fill="#627D98" fontSize={11}>
                    Total Cases
                </text>
                <CustomTooltip />
                <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: 11 }}
                    formatter={(value: string) => value.length > 25 ? value.slice(0, 22) + '...' : value}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}
