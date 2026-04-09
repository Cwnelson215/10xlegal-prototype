import { useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, type BarRectangleItem } from 'recharts';
import { CustomTooltip } from '../CustomTooltip';
import { CHART_COLORS, AXIS_TICK_STYLE, GRID_PROPS, BAR_HOVER_PROPS, TOOLTIP_CURSOR_FILL } from '../chartTheme';
import { useAnalyticsFilter } from '../context';
import type { CaseRecord } from '../../types';

function truncate(s: string, max: number): string {
    return s.length > max ? s.slice(0, max - 2) + '...' : s;
}

export function RulingDistributionChart({ cases }: { cases: CaseRecord[] }) {
    const { openDrillDown } = useAnalyticsFilter();

    const data = useMemo(() => {
        const counts = new Map<string, number>();
        for (const c of cases) {
            if (c.ruling) {
                counts.set(c.ruling, (counts.get(c.ruling) ?? 0) + 1);
            }
        }
        return Array.from(counts, ([ruling, count]) => ({
            ruling: truncate(ruling, 28),
            fullRuling: ruling,
            count,
        }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }, [cases]);

    const total = useMemo(() => data.reduce((s, d) => s + d.count, 0), [data]);
    const fullNameMap = useMemo(() => {
        const map = new Map<string, string>();
        for (const d of data) map.set(d.ruling, d.fullRuling);
        return map;
    }, [data]);

    const handleClick = useCallback((entry: BarRectangleItem) => {
        const ruling = (entry as BarRectangleItem & { fullRuling?: string }).fullRuling;
        if (!ruling) return;
        const matching = cases.filter((c) => c.ruling === ruling);
        openDrillDown(`"${ruling}" Cases (${matching.length})`, matching);
    }, [cases, openDrillDown]);

    if (data.length === 0) return <p className="chart-empty">No data available.</p>;

    return (
        <ResponsiveContainer width="100%" height={Math.max(300, data.length * 36)}>
            <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
                <defs>
                    <linearGradient id="gradRulingBar" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={CHART_COLORS.amber} stopOpacity={0.85} />
                        <stop offset="100%" stopColor={CHART_COLORS.amber} stopOpacity={1} />
                    </linearGradient>
                </defs>
                <CartesianGrid {...GRID_PROPS} horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={AXIS_TICK_STYLE} />
                <YAxis type="category" dataKey="ruling" width={170} tick={{ ...AXIS_TICK_STYLE, fontSize: 11 }} />
                <Tooltip
                    cursor={TOOLTIP_CURSOR_FILL}
                    content={
                        <CustomTooltip
                            total={total}
                            labelFormatter={(l) => fullNameMap.get(String(l)) ?? String(l)}
                        />
                    }
                />
                <Bar
                    dataKey="count"
                    fill="url(#gradRulingBar)"
                    radius={[0, 6, 6, 0]}
                    name="Rulings"
                    onClick={handleClick}
                    style={{ cursor: 'pointer' }}
                    activeBar={BAR_HOVER_PROPS}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}
