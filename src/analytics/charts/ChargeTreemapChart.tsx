import { useMemo, useCallback } from 'react';
import { Treemap, Tooltip, ResponsiveContainer } from 'recharts';
import { CustomTooltip } from '../CustomTooltip';
import { CHART_PALETTE } from '../chartTheme';
import { useAnalyticsFilter } from '../context';
import type { CaseRecord } from '../../types';

interface TreemapContentProps {
    x: number;
    y: number;
    width: number;
    height: number;
    name?: string;
    value?: number;
    index?: number;
    onClick?: (name: string) => void;
}

function TreemapContent({ x, y, width, height, name, value, index, onClick }: TreemapContentProps) {
    if (width < 50 || height < 30) return null;
    const color = CHART_PALETTE[(index ?? 0) % CHART_PALETTE.length]!;
    return (
        <g style={{ cursor: 'pointer' }} onClick={() => name && onClick?.(name)}>
            <rect x={x} y={y} width={width} height={height} fill={color} rx={6} opacity={0.88} stroke="#fff" strokeWidth={2} className="treemap-cell" />
            {width > 70 && height > 44 && (
                <>
                    <text x={x + 10} y={y + 22} fill="#fff" fontSize={13} fontWeight={600}>
                        {(name ?? '').length > Math.floor(width / 8) ? (name ?? '').slice(0, Math.floor(width / 8) - 2) + '...' : name}
                    </text>
                    <text x={x + 10} y={y + 40} fill="rgba(255,255,255,0.8)" fontSize={12}>
                        {(value ?? 0).toLocaleString()} cases
                    </text>
                </>
            )}
        </g>
    );
}

export function ChargeTreemapChart({ cases }: { cases: CaseRecord[] }) {
    const { openDrillDown } = useAnalyticsFilter();

    const data = useMemo(() => {
        const counts = new Map<string, number>();
        for (const c of cases) {
            if (c.charge) {
                counts.set(c.charge, (counts.get(c.charge) ?? 0) + 1);
            }
        }
        return Array.from(counts, ([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 20);
    }, [cases]);

    const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);

    const handleNodeClick = useCallback((charge: string) => {
        const matching = cases.filter((c) => c.charge === charge);
        openDrillDown(`"${charge}" Cases (${matching.length})`, matching);
    }, [cases, openDrillDown]);

    if (data.length === 0) return <p className="chart-empty">No charge data available.</p>;

    return (
        <ResponsiveContainer width="100%" height={360}>
            <Treemap
                data={data}
                dataKey="value"
                nameKey="name"
                content={<TreemapContent x={0} y={0} width={0} height={0} onClick={handleNodeClick} />}
            >
                <Tooltip
                    cursor={false}
                    content={
                        <CustomTooltip
                            total={total}
                            formatter={(value) => `${value.toLocaleString()} case${value === 1 ? '' : 's'}`}
                        />
                    }
                />
            </Treemap>
        </ResponsiveContainer>
    );
}
