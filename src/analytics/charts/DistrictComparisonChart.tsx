import { useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, type BarRectangleItem } from 'recharts';
import { CustomTooltip } from '../CustomTooltip';
import { CHART_COLORS, AXIS_TICK_STYLE, GRID_PROPS } from '../chartTheme';
import { useAnalyticsFilter } from '../context';
import type { CaseRecord } from '../../types';

export function DistrictComparisonChart({ cases }: { cases: CaseRecord[] }) {
    const { openDrillDown } = useAnalyticsFilter();

    const data = useMemo(() => {
        const counts = new Map<string, number>();
        for (const c of cases) {
            if (c.districtNumber) {
                counts.set(c.districtNumber, (counts.get(c.districtNumber) ?? 0) + 1);
            }
        }
        return Array.from(counts, ([districtNum, count]) => ({
            district: `Dist. ${districtNum}`,
            districtNumber: districtNum,
            count,
        }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 15);
    }, [cases]);

    const handleClick = useCallback((entry: BarRectangleItem) => {
        const dn = (entry as BarRectangleItem & { districtNumber?: string }).districtNumber;
        if (!dn) return;
        const matching = cases.filter((c) => c.districtNumber === dn);
        openDrillDown(`District ${dn} Cases (${matching.length})`, matching);
    }, [cases, openDrillDown]);

    if (data.length === 0) return <p className="chart-empty">No district data available.</p>;

    return (
        <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <defs>
                    <linearGradient id="gradDistrict" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_COLORS.blue} stopOpacity={0.9} />
                        <stop offset="100%" stopColor={CHART_COLORS.teal} stopOpacity={0.8} />
                    </linearGradient>
                </defs>
                <CartesianGrid {...GRID_PROPS} />
                <XAxis
                    dataKey="district"
                    tick={{ ...AXIS_TICK_STYLE, fontSize: 11 }}
                    interval={0}
                />
                <YAxis allowDecimals={false} tick={AXIS_TICK_STYLE} />
                <CustomTooltip />
                <Bar
                    dataKey="count"
                    fill="url(#gradDistrict)"
                    radius={[6, 6, 0, 0]}
                    name="Cases"
                    onClick={handleClick}
                    style={{ cursor: 'pointer' }}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}
