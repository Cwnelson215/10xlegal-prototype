import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { CustomTooltip } from '../CustomTooltip';
import { OUTCOME_COLORS, AXIS_TICK_STYLE, GRID_PROPS } from '../chartTheme';
import type { CaseRecord } from '../../types';

export function AttorneyOutcomesChart({ cases }: { cases: CaseRecord[] }) {
    const data = useMemo(() => {
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
                name: name.length > 20 ? name.slice(0, 17) + '...' : name,
                guilty,
                notGuilty,
                other,
            };
        });
    }, [cases]);

    if (data.length === 0) return <p className="chart-empty">No data available.</p>;

    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid {...GRID_PROPS} horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={AXIS_TICK_STYLE} />
                <YAxis type="category" dataKey="name" width={110} tick={{ ...AXIS_TICK_STYLE, fontSize: 11 }} />
                <CustomTooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="guilty" stackId="a" fill={OUTCOME_COLORS.guilty} name="Guilty" />
                <Bar dataKey="notGuilty" stackId="a" fill={OUTCOME_COLORS.notGuilty} name="Not Guilty" />
                <Bar dataKey="other" stackId="a" fill={OUTCOME_COLORS.other} name="Other" radius={[0, 6, 6, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
