import { useMemo } from 'react';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area, XAxis, YAxis,
} from 'recharts';
import type { Case, Attorney } from '../api/types';
import './AttorneyAnalyticsSection.css';

const COLORS = ['#e74c3c', '#2ecc71', '#3498db', '#f39c12', '#9b59b6', '#95a5a6'];

export function AttorneyAnalyticsSection({ cases, attorney }: { cases: Case[]; attorney: Attorney }) {
    const stats = useMemo(() => {
        const totalCases = cases.length;

        // Most common charge
        const chargeCounts = new Map<string, number>();
        for (const c of cases) {
            if (c.charge) {
                chargeCounts.set(c.charge, (chargeCounts.get(c.charge) ?? 0) + 1);
            }
        }
        let mostCommonCharge = 'N/A';
        let maxCharge = 0;
        for (const [charge, count] of chargeCounts) {
            if (count > maxCharge) { maxCharge = count; mostCommonCharge = charge; }
        }

        // Outcome breakdown (contextual)
        let favorable = 0;
        let unfavorable = 0;
        let otherOutcome = 0;
        for (const c of cases) {
            const outcome = c.convictionOutcome?.toLowerCase() ?? '';
            const isGuilty = outcome.includes('guilty') && !outcome.includes('not guilty');
            const isNotGuilty = outcome.includes('not guilty') || outcome.includes('acquit');

            if (attorney.type === 'defense') {
                if (isNotGuilty) favorable++;
                else if (isGuilty) unfavorable++;
                else otherOutcome++;
            } else {
                if (isGuilty) favorable++;
                else if (isNotGuilty) unfavorable++;
                else otherOutcome++;
            }
        }

        // Avg case duration
        let durationSum = 0;
        let durationCount = 0;
        for (const c of cases) {
            if (c.filingDate && c.dispositionDate) {
                const filing = new Date(c.filingDate).getTime();
                const disposition = new Date(c.dispositionDate).getTime();
                if (!isNaN(filing) && !isNaN(disposition) && disposition > filing) {
                    durationSum += (disposition - filing) / (1000 * 60 * 60 * 24);
                    durationCount++;
                }
            }
        }
        const avgDuration = durationCount > 0 ? Math.round(durationSum / durationCount) : null;

        return { totalCases, mostCommonCharge, favorable, unfavorable, otherOutcome, avgDuration };
    }, [cases, attorney.type]);

    // Conviction outcome pie data
    const outcomeData = useMemo(() => {
        const counts = new Map<string, number>();
        for (const c of cases) {
            if (c.convictionOutcome) {
                counts.set(c.convictionOutcome, (counts.get(c.convictionOutcome) ?? 0) + 1);
            }
        }
        return Array.from(counts, ([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [cases]);

    // Cases over time data
    const timelineData = useMemo(() => {
        const counts = new Map<string, number>();
        for (const c of cases) {
            if (c.courtDate) {
                const month = c.courtDate.slice(0, 7);
                counts.set(month, (counts.get(month) ?? 0) + 1);
            }
        }
        return Array.from(counts, ([month, count]) => ({ month, count }))
            .sort((a, b) => a.month.localeCompare(b.month));
    }, [cases]);

    if (cases.length === 0) return null;

    return (
        <div className="attorney-analytics-section">
            <h2 className="section-title">Performance Analytics</h2>

            <div className="attorney-stats-grid">
                <div className="attorney-stat-card">
                    <p className="stat-label">Total Cases</p>
                    <p className="stat-value">{stats.totalCases}</p>
                </div>
                <div className="attorney-stat-card">
                    <p className="stat-label">Most Common Charge</p>
                    <p className="stat-value">{stats.mostCommonCharge}</p>
                </div>
                <div className="attorney-stat-card">
                    <p className="stat-label">Favorable Outcomes</p>
                    <p className="stat-value">{stats.favorable}</p>
                    <p className="stat-detail">
                        {stats.unfavorable} unfavorable &middot; {stats.otherOutcome} other
                    </p>
                </div>
                <div className="attorney-stat-card">
                    <p className="stat-label">Avg Case Duration</p>
                    <p className="stat-value">{stats.avgDuration !== null ? `${stats.avgDuration} days` : 'N/A'}</p>
                </div>
            </div>

            <div className="attorney-charts-grid">
                <div className="profile-card chart-card">
                    <h3>Conviction Outcomes</h3>
                    {outcomeData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={outcomeData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={90}
                                    innerRadius={45}
                                    dataKey="value"
                                    label={({ name, percent }: { name?: string; percent?: number }) =>
                                        `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`
                                    }
                                >
                                    {outcomeData.map((_, index) => (
                                        <Cell key={index} fill={COLORS[index % COLORS.length]!} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="empty-state">No outcome data</p>
                    )}
                </div>
                <div className="profile-card chart-card">
                    <h3>Cases Over Time</h3>
                    {timelineData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={timelineData}>
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#2c3e50"
                                    fill="rgba(52,152,219,0.2)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="empty-state">No timeline data</p>
                    )}
                </div>
            </div>
        </div>
    );
}
