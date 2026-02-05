import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { CaseRecord } from '../../types';

const COLORS = ['#2c3e50', '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6'];

export function RulingDistributionChart({ cases }: { cases: CaseRecord[] }) {
    const data = useMemo(() => {
        const counts = new Map<string, number>();
        for (const c of cases) {
            counts.set(c.ruling, (counts.get(c.ruling) ?? 0) + 1);
        }
        return Array.from(counts, ([name, value]) => ({ name, value })).sort(
            (a, b) => b.value - a.value,
        );
    }, [cases]);

    if (data.length === 0) {
        return <p>No data available.</p>;
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={50}
                    dataKey="value"
                    label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                    {data.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]!} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
}
