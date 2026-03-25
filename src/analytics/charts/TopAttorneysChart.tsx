import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { CaseRecord } from '../../types';

export function TopAttorneysChart({ cases }: { cases: CaseRecord[] }) {
    const data = useMemo(() => {
        const counts = new Map<string, { prosecution: number; defense: number }>();
        for (const c of cases) {
            if (c.prosecutionAttorney) {
                const entry = counts.get(c.prosecutionAttorney) ?? { prosecution: 0, defense: 0 };
                entry.prosecution++;
                counts.set(c.prosecutionAttorney, entry);
            }
            if (c.defenseAttorney) {
                const entry = counts.get(c.defenseAttorney) ?? { prosecution: 0, defense: 0 };
                entry.defense++;
                counts.set(c.defenseAttorney, entry);
            }
        }
        return Array.from(counts, ([name, { prosecution, defense }]) => ({
            name: name.length > 20 ? name.slice(0, 17) + '...' : name,
            prosecution,
            defense,
            total: prosecution + defense,
        }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);
    }, [cases]);

    if (data.length === 0) return <p>No data available.</p>;

    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data} layout="vertical" margin={{ left: 100 }}>
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={95} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="prosecution" stackId="a" fill="#e74c3c" name="Prosecution" />
                <Bar dataKey="defense" stackId="a" fill="#3498db" name="Defense" radius={[0, 4, 4, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
