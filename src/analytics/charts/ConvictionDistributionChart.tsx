import { useMemo } from 'react';
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts';
import { CustomTooltip } from '../CustomTooltip';
import { renderActiveShape } from '../pieActiveShape';
import { CHART_PALETTE } from '../chartTheme';
import type { CaseRecord } from '../../types';

function shortenOutcome(name: string): string {
    return name
        .replace('Charges All Disposed - ', '')
        .replace('Criminal Case Closed - ', '')
        .replace('Charges All Disposed', 'All Disposed')
        .replace('Criminal Case Closed', 'Case Closed');
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
        return Array.from(counts, ([name, value]) => ({
            name,
            short: shortenOutcome(name),
            value,
        }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);
    }, [cases]);

    const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);

    if (data.length === 0) return <p className="chart-empty">No data available.</p>;

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={50}
                    dataKey="value"
                    nameKey="short"
                    paddingAngle={2}
                    activeShape={renderActiveShape}
                    style={{ cursor: 'pointer' }}
                >
                    {data.map((_, index) => (
                        <Cell key={index} fill={CHART_PALETTE[index % CHART_PALETTE.length]!} />
                    ))}
                </Pie>
                <text x="50%" y="47%" textAnchor="middle" fill="#1B2A4A" fontSize={22} fontWeight={700}>
                    {total.toLocaleString()}
                </text>
                <text x="50%" y="55%" textAnchor="middle" fill="#627D98" fontSize={11}>
                    Total
                </text>
                <CustomTooltip />
                <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11, lineHeight: '18px' }}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}
