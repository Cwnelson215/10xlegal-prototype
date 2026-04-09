import { useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, type BarRectangleItem } from 'recharts';
import { CustomTooltip } from '../CustomTooltip';
import { CHART_COLORS, AXIS_TICK_STYLE, GRID_PROPS, BAR_HOVER_PROPS, TOOLTIP_CURSOR_FILL } from '../chartTheme';
import { useAnalyticsFilter } from '../context';
import type { CaseRecord } from '../../types';

function truncate(s: string, max: number): string {
    return s.length > max ? s.slice(0, max - 2) + '...' : s;
}

export function JudgeCaseloadChart({ cases }: { cases: CaseRecord[] }) {
    const { openDrillDown } = useAnalyticsFilter();

    const data = useMemo(() => {
        const counts = new Map<string, number>();
        for (const c of cases) {
            if (c.judgeName) {
                counts.set(c.judgeName, (counts.get(c.judgeName) ?? 0) + 1);
            }
        }
        return Array.from(counts, ([judge, count]) => ({
            judge: truncate(judge, 22),
            fullJudge: judge,
            count,
        }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 15);
    }, [cases]);

    const total = useMemo(() => data.reduce((s, d) => s + d.count, 0), [data]);
    const fullNameMap = useMemo(() => {
        const map = new Map<string, string>();
        for (const d of data) map.set(d.judge, d.fullJudge);
        return map;
    }, [data]);

    const handleClick = useCallback((entry: BarRectangleItem) => {
        const judge = (entry as BarRectangleItem & { fullJudge?: string }).fullJudge;
        if (!judge) return;
        const matching = cases.filter((c) => c.judgeName === judge);
        openDrillDown(`Judge ${judge} Cases (${matching.length})`, matching);
    }, [cases, openDrillDown]);

    if (data.length === 0) return <p className="chart-empty">No judge data available.</p>;

    return (
        <ResponsiveContainer width="100%" height={Math.max(350, data.length * 30)}>
            <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
                <defs>
                    <linearGradient id="gradJudge" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={CHART_COLORS.plum} stopOpacity={0.8} />
                        <stop offset="100%" stopColor={CHART_COLORS.blue} stopOpacity={0.9} />
                    </linearGradient>
                </defs>
                <CartesianGrid {...GRID_PROPS} horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={AXIS_TICK_STYLE} />
                <YAxis type="category" dataKey="judge" width={130} tick={{ ...AXIS_TICK_STYLE, fontSize: 11 }} />
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
                    fill="url(#gradJudge)"
                    radius={[0, 6, 6, 0]}
                    name="Cases"
                    onClick={handleClick}
                    style={{ cursor: 'pointer' }}
                    activeBar={BAR_HOVER_PROPS}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}
