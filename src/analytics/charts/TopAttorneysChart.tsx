import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { CustomTooltip } from '../CustomTooltip';
import { CHART_COLORS, AXIS_TICK_STYLE, GRID_PROPS } from '../chartTheme';
import type { CaseRecord } from '../../types';

function truncate(s: string, max: number): string {
    return s.length > max ? s.slice(0, max - 2) + '...' : s;
}

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
            name: truncate(name, 18),
            prosecution,
            defense,
            total: prosecution + defense,
        }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);
    }, [cases]);

    if (data.length === 0) return <p className="chart-empty">No data available.</p>;

    return (
        <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data} margin={{ left: 10, right: 20, bottom: 40, top: 10 }}>
                <CartesianGrid {...GRID_PROPS} />
                <XAxis
                    dataKey="name"
                    tick={{ ...AXIS_TICK_STYLE, fontSize: 10 }}
                    angle={-40}
                    textAnchor="end"
                    height={80}
                    interval={0}
                />
                <YAxis allowDecimals={false} tick={AXIS_TICK_STYLE} />
                <CustomTooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                <Bar dataKey="prosecution" fill={CHART_COLORS.coral} name="Prosecution" radius={[4, 4, 0, 0]} />
                <Bar dataKey="defense" fill={CHART_COLORS.blue} name="Defense" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
