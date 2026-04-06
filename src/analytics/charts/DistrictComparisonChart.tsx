import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { CustomTooltip } from '../CustomTooltip';
import { CHART_COLORS, AXIS_TICK_STYLE, GRID_PROPS } from '../chartTheme';
import type { CaseRecord } from '../../types';

export function DistrictComparisonChart({ cases }: { cases: CaseRecord[] }) {
    const data = useMemo(() => {
        const counts = new Map<string, number>();
        for (const c of cases) {
            if (c.districtNumber) {
                counts.set(c.districtNumber, (counts.get(c.districtNumber) ?? 0) + 1);
            }
        }
        return Array.from(counts, ([district, count]) => ({
            district: `District ${district}`,
            count,
        }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 15);
    }, [cases]);

    if (data.length === 0) return <p className="chart-empty">No district data available.</p>;

    return (
        <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
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
                    angle={-30}
                    textAnchor="end"
                    height={60}
                />
                <YAxis allowDecimals={false} tick={AXIS_TICK_STYLE} />
                <CustomTooltip />
                <Bar dataKey="count" fill="url(#gradDistrict)" radius={[6, 6, 0, 0]} name="Cases" />
            </BarChart>
        </ResponsiveContainer>
    );
}
