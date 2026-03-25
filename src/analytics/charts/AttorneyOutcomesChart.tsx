import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { CaseRecord } from '../../types';

export function AttorneyOutcomesChart({ cases }: { cases: CaseRecord[] }) {
    const data = useMemo(() => {
        // Count cases per attorney, then for top 8 show outcome breakdown
        const attorneyCases = new Map<string, CaseRecord[]>();
        for (const c of cases) {
            if (c.prosecutionAttorney) {
                const arr = attorneyCases.get(c.prosecutionAttorney) ?? [];
                arr.push(c);
                attorneyCases.set(c.prosecutionAttorney, arr);
            }
            if (c.defenseAttorney) {
                const arr = attorneyCases.get(c.defenseAttorney) ?? [];
                arr.push(c);
                attorneyCases.set(c.defenseAttorney, arr);
            }
        }

        // Sort by case count, take top 8
        const sorted = Array.from(attorneyCases.entries())
            .sort((a, b) => b[1].length - a[1].length)
            .slice(0, 8);

        return sorted.map(([name, attCases]) => {
            let guilty = 0;
            let notGuilty = 0;
            let other = 0;
            for (const c of attCases) {
                const outcome = c.convictionOutcome?.toLowerCase() ?? '';
                if (outcome.includes('guilty') && !outcome.includes('not guilty')) {
                    guilty++;
                } else if (outcome.includes('not guilty') || outcome.includes('acquit')) {
                    notGuilty++;
                } else {
                    other++;
                }
            }
            return {
                name: name.length > 18 ? name.slice(0, 15) + '...' : name,
                guilty,
                notGuilty,
                other,
            };
        });
    }, [cases]);

    if (data.length === 0) return <p>No data available.</p>;

    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data} layout="vertical" margin={{ left: 100 }}>
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={95} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="guilty" stackId="a" fill="#e74c3c" name="Guilty" />
                <Bar dataKey="notGuilty" stackId="a" fill="#2ecc71" name="Not Guilty" />
                <Bar dataKey="other" stackId="a" fill="#95a5a6" name="Other" radius={[0, 4, 4, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
