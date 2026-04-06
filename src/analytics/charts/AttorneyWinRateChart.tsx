import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { CustomTooltip } from '../CustomTooltip';
import { CHART_COLORS, AXIS_TICK_STYLE, GRID_PROPS } from '../chartTheme';
import type { CaseRecord } from '../../types';

export function AttorneyWinRateChart({ cases }: { cases: CaseRecord[] }) {
    const data = useMemo(() => {
        // Track prosecution attorney outcomes
        const prosStats = new Map<string, { total: number; convictions: number }>();
        const defStats = new Map<string, { total: number; wins: number }>();

        for (const c of cases) {
            const outcome = c.convictionOutcome?.toLowerCase() ?? '';
            const isGuilty = outcome.includes('guilty') && !outcome.includes('not guilty');
            const isNotGuilty = outcome.includes('not guilty') || outcome.includes('acquit') || outcome.includes('dismiss');

            if (c.prosecutionAttorney) {
                const entry = prosStats.get(c.prosecutionAttorney) ?? { total: 0, convictions: 0 };
                entry.total++;
                if (isGuilty) entry.convictions++;
                prosStats.set(c.prosecutionAttorney, entry);
            }
            if (c.defenseAttorney) {
                const entry = defStats.get(c.defenseAttorney) ?? { total: 0, wins: 0 };
                entry.total++;
                if (isNotGuilty) entry.wins++;
                defStats.set(c.defenseAttorney, entry);
            }
        }

        // Top prosecution by conviction rate (min 3 cases)
        const topPros = Array.from(prosStats, ([name, s]) => ({
            name: name.length > 22 ? name.slice(0, 19) + '...' : name,
            rate: Math.round((s.convictions / s.total) * 100),
            total: s.total,
            type: 'Prosecution' as const,
        }))
            .filter((d) => d.total >= 3)
            .sort((a, b) => b.rate - a.rate)
            .slice(0, 5);

        // Top defense by win rate (min 3 cases)
        const topDef = Array.from(defStats, ([name, s]) => ({
            name: name.length > 22 ? name.slice(0, 19) + '...' : name,
            rate: Math.round((s.wins / s.total) * 100),
            total: s.total,
            type: 'Defense' as const,
        }))
            .filter((d) => d.total >= 3)
            .sort((a, b) => b.rate - a.rate)
            .slice(0, 5);

        return [
            ...topPros.map((d) => ({ ...d, prosRate: d.rate, defRate: 0 })),
            ...topDef.map((d) => ({ ...d, prosRate: 0, defRate: d.rate })),
        ];
    }, [cases]);

    if (data.length === 0) return <p className="chart-empty">Not enough data for win rate analysis.</p>;

    return (
        <ResponsiveContainer width="100%" height={Math.max(350, data.length * 36)}>
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30 }}>
                <CartesianGrid {...GRID_PROPS} horizontal={false} />
                <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={AXIS_TICK_STYLE}
                    tickFormatter={(v: number) => `${v}%`}
                />
                <YAxis type="category" dataKey="name" width={120} tick={{ ...AXIS_TICK_STYLE, fontSize: 11 }} />
                <CustomTooltip formatter={(value) => `${value}%`} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="prosRate" fill={CHART_COLORS.coral} name="Conviction Rate" radius={[0, 6, 6, 0]} />
                <Bar dataKey="defRate" fill={CHART_COLORS.green} name="Defense Win Rate" radius={[0, 6, 6, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
