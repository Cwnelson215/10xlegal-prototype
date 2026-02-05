import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { CaseRecord } from '../../types';

export function CasesOverTimeChart({ cases }: { cases: CaseRecord[] }) {
    const data = useMemo(() => {
        const counts = new Map<string, number>();
        for (const c of cases) {
            const month = c.courtDate.slice(0, 7); // YYYY-MM
            counts.set(month, (counts.get(month) ?? 0) + 1);
        }
        return Array.from(counts, ([month, count]) => ({ month, count })).sort((a, b) =>
            a.month.localeCompare(b.month),
        );
    }, [cases]);

    if (data.length === 0) {
        return <p>No data available.</p>;
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#2c3e50"
                    fill="rgba(52,152,219,0.2)"
                    strokeWidth={2}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
