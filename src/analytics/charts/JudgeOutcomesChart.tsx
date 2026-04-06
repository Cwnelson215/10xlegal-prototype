import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { CustomTooltip } from '../CustomTooltip';
import { OUTCOME_COLORS, AXIS_TICK_STYLE, GRID_PROPS, classifyOutcome } from '../chartTheme';
import type { CaseRecord } from '../../types';

export function JudgeOutcomesChart({ cases }: { cases: CaseRecord[] }) {
    const data = useMemo(() => {
        const judgeCases = new Map<string, CaseRecord[]>();
        for (const c of cases) {
            if (c.judgeName) {
                const arr = judgeCases.get(c.judgeName) ?? [];
                arr.push(c);
                judgeCases.set(c.judgeName, arr);
            }
        }

        return Array.from(judgeCases.entries())
            .sort((a, b) => b[1].length - a[1].length)
            .slice(0, 10)
            .map(([name, jCases]) => {
                let guilty = 0;
                let notGuilty = 0;
                let other = 0;
                for (const c of jCases) {
                    const cls = classifyOutcome(c.convictionOutcome ?? c.ruling);
                    if (cls === 'guilty') guilty++;
                    else if (cls === 'notGuilty') notGuilty++;
                    else other++;
                }
                return {
                    name: name.length > 22 ? name.slice(0, 19) + '...' : name,
                    guilty,
                    notGuilty,
                    other,
                };
            });
    }, [cases]);

    if (data.length === 0) return <p className="chart-empty">No judge outcome data available.</p>;

    return (
        <ResponsiveContainer width="100%" height={Math.max(350, data.length * 36)}>
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid {...GRID_PROPS} horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={AXIS_TICK_STYLE} />
                <YAxis type="category" dataKey="name" width={120} tick={{ ...AXIS_TICK_STYLE, fontSize: 11 }} />
                <CustomTooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="guilty" stackId="a" fill={OUTCOME_COLORS.guilty} name="Guilty" />
                <Bar dataKey="notGuilty" stackId="a" fill={OUTCOME_COLORS.notGuilty} name="Not Guilty" />
                <Bar dataKey="other" stackId="a" fill={OUTCOME_COLORS.other} name="Other" radius={[0, 6, 6, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
