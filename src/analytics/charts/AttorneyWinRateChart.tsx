import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { CustomTooltip } from '../CustomTooltip';
import { CHART_COLORS, AXIS_TICK_STYLE, GRID_PROPS, classifyOutcome } from '../chartTheme';
import type { CaseRecord } from '../../types';

function truncate(s: string, max: number): string {
    return s.length > max ? s.slice(0, max - 2) + '...' : s;
}

export function AttorneyWinRateChart({ cases }: { cases: CaseRecord[] }) {
    const data = useMemo(() => {
        const prosStats = new Map<string, { total: number; convictions: number }>();
        const defStats = new Map<string, { total: number; wins: number }>();

        for (const c of cases) {
            const cls = classifyOutcome(c.ruling);

            if (c.prosecutionAttorney) {
                const entry = prosStats.get(c.prosecutionAttorney) ?? { total: 0, convictions: 0 };
                entry.total++;
                if (cls === 'guilty' || cls === 'noContest') entry.convictions++;
                prosStats.set(c.prosecutionAttorney, entry);
            }
            if (c.defenseAttorney) {
                const entry = defStats.get(c.defenseAttorney) ?? { total: 0, wins: 0 };
                entry.total++;
                if (cls === 'dismissed') entry.wins++;
                defStats.set(c.defenseAttorney, entry);
            }
        }

        const topPros = Array.from(prosStats, ([name, s]) => ({
            name: truncate(name, 18),
            prosRate: Math.round((s.convictions / s.total) * 100),
            defRate: 0,
            total: s.total,
        }))
            .filter((d) => d.total >= 3)
            .sort((a, b) => b.prosRate - a.prosRate)
            .slice(0, 5);

        const topDef = Array.from(defStats, ([name, s]) => ({
            name: truncate(name, 18),
            prosRate: 0,
            defRate: Math.round((s.wins / s.total) * 100),
            total: s.total,
        }))
            .filter((d) => d.total >= 3)
            .sort((a, b) => b.defRate - a.defRate)
            .slice(0, 5);

        return [...topPros, ...topDef];
    }, [cases]);

    if (data.length === 0) return <p className="chart-empty">Not enough data for win rate analysis.</p>;

    return (
        <ResponsiveContainer width="100%" height={Math.max(350, data.length * 36)}>
            <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
                <CartesianGrid {...GRID_PROPS} horizontal={false} />
                <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={AXIS_TICK_STYLE}
                    tickFormatter={(v: number) => `${v}%`}
                />
                <YAxis type="category" dataKey="name" width={110} tick={{ ...AXIS_TICK_STYLE, fontSize: 11 }} />
                <CustomTooltip formatter={(value) => `${value}%`} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="prosRate" fill={CHART_COLORS.coral} name="Conviction Rate" radius={[0, 6, 6, 0]} />
                <Bar dataKey="defRate" fill={CHART_COLORS.green} name="Dismissal Rate" radius={[0, 6, 6, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
