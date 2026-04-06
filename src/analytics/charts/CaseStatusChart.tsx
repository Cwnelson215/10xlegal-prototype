import { useMemo } from 'react';
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts';
import { CustomTooltip } from '../CustomTooltip';
import { STATUS_COLORS } from '../chartTheme';
import type { CaseRecord } from '../../types';

const STATUS_LABELS: Record<string, string> = {
    pending: 'Pending',
    active: 'Active',
    'on-hold': 'On Hold',
    closed: 'Closed',
};

const STATUS_ORDER = ['active', 'pending', 'on-hold', 'closed'];

export function CaseStatusChart({ cases }: { cases: CaseRecord[] }) {
    const data = useMemo(() => {
        const counts = new Map<string, number>();
        for (const c of cases) {
            counts.set(c.status, (counts.get(c.status) ?? 0) + 1);
        }
        return STATUS_ORDER.filter((s) => counts.has(s)).map((s) => ({
            name: STATUS_LABELS[s] ?? s,
            value: counts.get(s) ?? 0,
            status: s,
        }));
    }, [cases]);

    const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);

    if (data.length === 0) return <p className="chart-empty">No data available.</p>;

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={55}
                    dataKey="value"
                    paddingAngle={2}
                    label={({ name, percent }: { name?: string; percent?: number }) =>
                        `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                >
                    {data.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#9FB3C8'} />
                    ))}
                </Pie>
                <text x="50%" y="48%" textAnchor="middle" fill="#1B2A4A" fontSize={24} fontWeight={700}>
                    {total.toLocaleString()}
                </text>
                <text x="50%" y="56%" textAnchor="middle" fill="#627D98" fontSize={12}>
                    Total
                </text>
                <CustomTooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
        </ResponsiveContainer>
    );
}
