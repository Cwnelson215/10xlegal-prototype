import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { CustomTooltip } from '../CustomTooltip';
import { OUTCOME_COLORS, AXIS_TICK_STYLE, GRID_PROPS, classifyOutcome } from '../chartTheme';
import type { CaseRecord } from '../../types';

function truncate(s: string, max: number): string {
    return s.length > max ? s.slice(0, max - 2) + '...' : s;
}

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
                let guilty = 0, noContest = 0, dismissed = 0, pending = 0;
                for (const c of jCases) {
                    const cls = classifyOutcome(c.ruling);
                    if (cls === 'guilty') guilty++;
                    else if (cls === 'noContest') noContest++;
                    else if (cls === 'dismissed') dismissed++;
                    else pending++;
                }
                return { name: truncate(name, 18), guilty, noContest, dismissed, pending };
            });
    }, [cases]);

    if (data.length === 0) return <p className="chart-empty">No judge outcome data available.</p>;

    return (
        <ResponsiveContainer width="100%" height={Math.max(350, data.length * 36)}>
            <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
                <CartesianGrid {...GRID_PROPS} horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={AXIS_TICK_STYLE} />
                <YAxis type="category" dataKey="name" width={110} tick={{ ...AXIS_TICK_STYLE, fontSize: 11 }} />
                <CustomTooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="guilty" stackId="a" fill={OUTCOME_COLORS.guilty} name="Guilty" />
                <Bar dataKey="noContest" stackId="a" fill={OUTCOME_COLORS.noContest} name="No Contest" />
                <Bar dataKey="dismissed" stackId="a" fill={OUTCOME_COLORS.dismissed} name="Dismissed" />
                <Bar dataKey="pending" stackId="a" fill={OUTCOME_COLORS.pending} name="Pending" radius={[0, 6, 6, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
