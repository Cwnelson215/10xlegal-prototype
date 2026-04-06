import { useMemo } from 'react';
import { Treemap, ResponsiveContainer } from 'recharts';
import { CHART_PALETTE } from '../chartTheme';
import type { CaseRecord } from '../../types';

interface TreemapContentProps {
    x: number;
    y: number;
    width: number;
    height: number;
    name?: string;
    value?: number;
    index?: number;
}

function TreemapContent({ x, y, width, height, name, value, index }: TreemapContentProps) {
    if (width < 50 || height < 30) return null;
    const color = CHART_PALETTE[(index ?? 0) % CHART_PALETTE.length]!;
    return (
        <g>
            <rect x={x} y={y} width={width} height={height} fill={color} rx={6} opacity={0.88} stroke="#fff" strokeWidth={2} />
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

    if (data.length === 0) return <p className="chart-empty">No charge data available.</p>;

    return (
        <ResponsiveContainer width="100%" height={360}>
            <Treemap
                data={data}
                dataKey="value"
                nameKey="name"
                content={<TreemapContent x={0} y={0} width={0} height={0} />}
            />
        </ResponsiveContainer>
    );
}
