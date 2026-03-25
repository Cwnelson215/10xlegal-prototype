import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { CaseRecord } from '../../types';

export function RulingDistributionChart({ cases }: { cases: CaseRecord[] }) {
    const data = useMemo(() => {
        const counts = new Map<string, number>();
        for (const c of cases) {
            if (c.ruling) {
                counts.set(c.ruling, (counts.get(c.ruling) ?? 0) + 1);
            }
        }
        return Array.from(counts, ([ruling, count]) => ({
            ruling: ruling.length > 30 ? ruling.slice(0, 27) + '...' : ruling,
            count,
        }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }, [cases]);

    if (data.length === 0) return <p>No data available.</p>;

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical" margin={{ left: 120 }}>
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="ruling" width={115} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#f39c12" radius={[0, 4, 4, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
