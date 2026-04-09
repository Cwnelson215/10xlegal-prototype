import { useMemo, useCallback } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { CustomTooltip } from '../CustomTooltip';
import { renderActiveShape } from '../pieActiveShape';
import { CHART_PALETTE } from '../chartTheme';
import { useAnalyticsFilter } from '../context';
import type { CaseRecord } from '../../types';

export function CaseTypeBreakdownChart({ cases }: { cases: CaseRecord[] }) {
    const { openDrillDown } = useAnalyticsFilter();

    const data = useMemo(() => {
        const counts = new Map<string, number>();
        for (const c of cases) {
            if (c.caseType) {
                counts.set(c.caseType, (counts.get(c.caseType) ?? 0) + 1);
            }
        }
        return Array.from(counts, ([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [cases]);

    const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);

    const handleClick = useCallback((_: unknown, index: number) => {
        const entry = data[index];
        if (!entry) return;
        const matching = cases.filter((c) => c.caseType === entry.name);
        openDrillDown(`${entry.name} Cases (${matching.length})`, matching);
    }, [data, cases, openDrillDown]);

    if (data.length === 0) return <p className="chart-empty">No case type data available.</p>;

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={50}
                    dataKey="value"
                    paddingAngle={2}
                    onClick={handleClick}
                    style={{ cursor: 'pointer' }}
                    activeShape={renderActiveShape}
                >
                    {data.map((_, index) => (
                        <Cell key={index} fill={CHART_PALETTE[index % CHART_PALETTE.length]!} />
                    ))}
                </Pie>
                <Tooltip cursor={false} content={<CustomTooltip total={total} />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
        </ResponsiveContainer>
    );
}
