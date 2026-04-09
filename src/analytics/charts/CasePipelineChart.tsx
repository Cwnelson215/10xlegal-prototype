import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { CustomTooltip } from '../CustomTooltip';
import { STATUS_COLORS, AXIS_TICK_STYLE, GRID_PROPS, BAR_HOVER_PROPS, TOOLTIP_CURSOR_FILL } from '../chartTheme';
import type { CaseRecord } from '../../types';

const PIPELINE_STAGES = [
    { key: 'pending', label: 'Pending' },
    { key: 'active', label: 'Active' },
    { key: 'on-hold', label: 'On Hold' },
    { key: 'closed', label: 'Closed' },
];

export function CasePipelineChart({ cases }: { cases: CaseRecord[] }) {
    const data = useMemo(() => {
        const counts = new Map<string, number>();
        for (const c of cases) {
            counts.set(c.status, (counts.get(c.status) ?? 0) + 1);
        }
        return PIPELINE_STAGES.map((stage) => ({
            stage: stage.label,
            count: counts.get(stage.key) ?? 0,
            status: stage.key,
        }));
    }, [cases]);

    const total = useMemo(() => data.reduce((s, d) => s + d.count, 0), [data]);

    return (
        <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                <CartesianGrid {...GRID_PROPS} />
                <XAxis dataKey="stage" tick={AXIS_TICK_STYLE} />
                <YAxis allowDecimals={false} tick={AXIS_TICK_STYLE} />
                <Tooltip cursor={TOOLTIP_CURSOR_FILL} content={<CustomTooltip total={total} />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Cases" activeBar={BAR_HOVER_PROPS}>
                    {data.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#9FB3C8'} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}
