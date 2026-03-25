import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { CaseRecord } from '../../types';

export function ProsDefVolumeChart({ cases }: { cases: CaseRecord[] }) {
    const data = useMemo(() => {
        const monthly = new Map<string, { prosecution: number; defense: number }>();
        for (const c of cases) {
            if (!c.courtDate) continue;
            const month = c.courtDate.slice(0, 7);
            const entry = monthly.get(month) ?? { prosecution: 0, defense: 0 };
            if (c.prosecutionAttorney) entry.prosecution++;
            if (c.defenseAttorney) entry.defense++;
            monthly.set(month, entry);
        }
        return Array.from(monthly, ([month, counts]) => ({ month, ...counts }))
            .sort((a, b) => a.month.localeCompare(b.month));
    }, [cases]);

    if (data.length === 0) return <p>No data available.</p>;

    return (
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Area
                    type="monotone"
                    dataKey="prosecution"
                    stackId="1"
                    stroke="#e74c3c"
                    fill="rgba(231,76,60,0.25)"
                    name="Prosecution"
                    strokeWidth={2}
                />
                <Area
                    type="monotone"
                    dataKey="defense"
                    stackId="1"
                    stroke="#3498db"
                    fill="rgba(52,152,219,0.25)"
                    name="Defense"
                    strokeWidth={2}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
