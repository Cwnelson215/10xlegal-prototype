import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { CustomTooltip } from '../CustomTooltip';
import { OUTCOME_COLORS, AXIS_TICK_STYLE, GRID_PROPS, BAR_HOVER_PROPS, TOOLTIP_CURSOR_FILL, classifyOutcome } from '../chartTheme';
import type { CaseRecord } from '../../types';

function truncate(s: string, max: number): string {
    return s.length > max ? s.slice(0, max - 2) + '...' : s;
}

export function AttorneyOutcomesChart({ cases }: { cases: CaseRecord[] }) {
    const data = useMemo(() => {
        const attorneyCases = new Map<string, CaseRecord[]>();
        for (const c of cases) {
            for (const a of c.prosecutionAttorneys) {
                const arr = attorneyCases.get(a.name) ?? [];
                arr.push(c);
                attorneyCases.set(a.name, arr);
            }
            for (const a of c.defenseAttorneys) {
                const arr = attorneyCases.get(a.name) ?? [];
                arr.push(c);
                attorneyCases.set(a.name, arr);
            }
        }

        return Array.from(attorneyCases.entries())
            .sort((a, b) => b[1].length - a[1].length)
            .slice(0, 8)
            .map(([name, attCases]) => {
                let guilty = 0, noContest = 0, dismissed = 0, pending = 0;
                for (const c of attCases) {
                    const cls = classifyOutcome(c.ruling);
                    if (cls === 'guilty') guilty++;
                    else if (cls === 'noContest') noContest++;
                    else if (cls === 'dismissed') dismissed++;
                    else pending++;
                }
                return { name: truncate(name, 18), guilty, noContest, dismissed, pending };
            });
    }, [cases]);

    if (data.length === 0) return <p className="chart-empty">No data available.</p>;

    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
                <CartesianGrid {...GRID_PROPS} horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={AXIS_TICK_STYLE} />
                <YAxis type="category" dataKey="name" width={110} tick={{ ...AXIS_TICK_STYLE, fontSize: 11 }} />
                <Tooltip
                    cursor={TOOLTIP_CURSOR_FILL}
                    content={
                        <CustomTooltip
                            percentOfRow
                            footer={(payload) => {
                                const sum = payload.reduce((s, p) => s + (p.value ?? 0), 0);
                                return `Total cases: ${sum.toLocaleString()}`;
                            }}
                        />
                    }
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="guilty" stackId="a" fill={OUTCOME_COLORS.guilty} name="Guilty" activeBar={BAR_HOVER_PROPS} />
                <Bar dataKey="noContest" stackId="a" fill={OUTCOME_COLORS.noContest} name="No Contest" activeBar={BAR_HOVER_PROPS} />
                <Bar dataKey="dismissed" stackId="a" fill={OUTCOME_COLORS.dismissed} name="Dismissed" activeBar={BAR_HOVER_PROPS} />
                <Bar dataKey="pending" stackId="a" fill={OUTCOME_COLORS.pending} name="Pending" radius={[0, 6, 6, 0]} activeBar={BAR_HOVER_PROPS} />
            </BarChart>
        </ResponsiveContainer>
    );
}
