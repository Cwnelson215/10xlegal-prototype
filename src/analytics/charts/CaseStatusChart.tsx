import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { CaseRecord } from '../../types';

const COLORS = ['#3498db', '#2ecc71', '#f39c12', '#95a5a6'];
const STATUS_LABELS: Record<string, string> = {
    pending: 'Pending',
    active: 'Active',
    'on-hold': 'On Hold',
    closed: 'Closed',
};

export function CaseStatusChart({ cases }: { cases: CaseRecord[] }) {
    const data = useMemo(() => {
        const counts = new Map<string, number>();
        for (const c of cases) {
            counts.set(c.status, (counts.get(c.status) ?? 0) + 1);
        }
        return Array.from(counts, ([name, value]) => ({
            name: STATUS_LABELS[name] ?? name,
            value,
        })).sort((a, b) => b.value - a.value);
    }, [cases]);

    if (data.length === 0) return <p>No data available.</p>;

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
                    label={({ name, percent }: { name?: string; percent?: number }) =>
                        `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
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
