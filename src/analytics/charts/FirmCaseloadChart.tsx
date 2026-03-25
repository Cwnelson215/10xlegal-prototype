import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { CaseRecord } from '../../types';

export function FirmCaseloadChart({ cases }: { cases: CaseRecord[] }) {
    const data = useMemo(() => {
        const counts = new Map<string, number>();
        for (const c of cases) {
            if (c.prosecutionFirm) {
                counts.set(c.prosecutionFirm, (counts.get(c.prosecutionFirm) ?? 0) + 1);
            }
            if (c.defenseFirm) {
                counts.set(c.defenseFirm, (counts.get(c.defenseFirm) ?? 0) + 1);
            }
        }
        return Array.from(counts, ([firm, count]) => ({
            firm: firm.length > 25 ? firm.slice(0, 22) + '...' : firm,
            count,
        }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }, [cases]);

    if (data.length === 0) return <p>No data available.</p>;

    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data} layout="vertical" margin={{ left: 120 }}>
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="firm" width={115} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#9b59b6" radius={[0, 4, 4, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
