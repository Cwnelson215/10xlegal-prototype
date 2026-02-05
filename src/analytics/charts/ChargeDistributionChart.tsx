import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { CaseRecord } from '../../types';

export function ChargeDistributionChart({ cases }: { cases: CaseRecord[] }) {
    const data = useMemo(() => {
        const counts = new Map<string, number>();
        for (const c of cases) {
            counts.set(c.charge, (counts.get(c.charge) ?? 0) + 1);
        }
        return Array.from(counts, ([charge, count]) => ({
            charge: charge.length > 30 ? charge.slice(0, 27) + '...' : charge,
            count,
        }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }, [cases]);

    if (data.length === 0) {
        return <p>No data available.</p>;
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical" margin={{ left: 120 }}>
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="charge" width={115} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#e74c3c" radius={[0, 4, 4, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
