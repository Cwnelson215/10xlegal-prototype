import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { CaseRecord } from '../../types';

export function CasesByCountyChart({ cases }: { cases: CaseRecord[] }) {
    const data = useMemo(() => {
        const counts = new Map<string, number>();
        for (const c of cases) {
            counts.set(c.county, (counts.get(c.county) ?? 0) + 1);
        }
        return Array.from(counts, ([county, count]) => ({ county, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 15);
    }, [cases]);

    if (data.length === 0) {
        return <p>No data available.</p>;
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="county" width={75} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3498db" radius={[0, 4, 4, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
