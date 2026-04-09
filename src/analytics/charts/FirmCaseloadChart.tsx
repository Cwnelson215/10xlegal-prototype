import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { CustomTooltip } from '../CustomTooltip';
import { CHART_COLORS, AXIS_TICK_STYLE, GRID_PROPS, BAR_HOVER_PROPS, TOOLTIP_CURSOR_FILL } from '../chartTheme';
import type { CaseRecord } from '../../types';

function truncate(s: string, max: number): string {
    return s.length > max ? s.slice(0, max - 2) + '...' : s;
}

export function FirmCaseloadChart({ cases }: { cases: CaseRecord[] }) {
    const data = useMemo(() => {
        const firms = new Map<string, { prosecution: number; defense: number }>();
        for (const c of cases) {
            if (c.prosecutionFirm) {
                const entry = firms.get(c.prosecutionFirm) ?? { prosecution: 0, defense: 0 };
                entry.prosecution++;
                firms.set(c.prosecutionFirm, entry);
            }
            if (c.defenseFirm) {
                const entry = firms.get(c.defenseFirm) ?? { prosecution: 0, defense: 0 };
                entry.defense++;
                firms.set(c.defenseFirm, entry);
            }
        }
        return Array.from(firms, ([firm, counts]) => ({
            firm: truncate(firm, 22),
            prosecution: counts.prosecution,
            defense: counts.defense,
            total: counts.prosecution + counts.defense,
        }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);
    }, [cases]);

    if (data.length === 0) return <p className="chart-empty">No firm data available.</p>;

    return (
        <ResponsiveContainer width="100%" height={Math.max(350, data.length * 36)}>
            <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
                <CartesianGrid {...GRID_PROPS} horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={AXIS_TICK_STYLE} />
                <YAxis type="category" dataKey="firm" width={130} tick={{ ...AXIS_TICK_STYLE, fontSize: 11 }} />
                <Tooltip
                    cursor={TOOLTIP_CURSOR_FILL}
                    content={
                        <CustomTooltip
                            percentOfRow
                            footer={(payload) => {
                                const row = payload[0]?.payload as { total?: number } | undefined;
                                if (row?.total == null) return null;
                                return `Total cases: ${row.total.toLocaleString()}`;
                            }}
                        />
                    }
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="prosecution" stackId="a" fill={CHART_COLORS.coral} name="Prosecution" activeBar={BAR_HOVER_PROPS} />
                <Bar dataKey="defense" stackId="a" fill={CHART_COLORS.blue} name="Defense" radius={[0, 6, 6, 0]} activeBar={BAR_HOVER_PROPS} />
            </BarChart>
        </ResponsiveContainer>
    );
}
