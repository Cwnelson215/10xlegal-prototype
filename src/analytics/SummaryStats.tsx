import { useMemo } from 'react';
import type { CaseRecord } from '../types';

export function SummaryStats({ cases }: { cases: CaseRecord[] }) {
    const stats = useMemo(() => {
        const totalCases = cases.length;

        // Active cases
        const activeCases = cases.filter((c) => c.status === 'active').length;

        // Avg case duration (filing to disposition)
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

        // Most common conviction outcome
        const convictionCounts = new Map<string, number>();
        for (const c of cases) {
            convictionCounts.set(c.convictionOutcome, (convictionCounts.get(c.convictionOutcome) ?? 0) + 1);
        }
        let mostCommonConviction = 'N/A';
        let maxConviction = 0;
        for (const [outcome, count] of convictionCounts) {
            if (count > maxConviction) {
                maxConviction = count;
                mostCommonConviction = outcome;
            }
        }

        // Most active court
        const courtCounts = new Map<string, number>();
        for (const c of cases) {
            courtCounts.set(c.court, (courtCounts.get(c.court) ?? 0) + 1);
        }
        let mostActiveCourt = 'N/A';
        let maxCourt = 0;
        for (const [court, count] of courtCounts) {
            if (count > maxCourt) {
                maxCourt = count;
                mostActiveCourt = court;
            }
        }

        // Avg cases per month
        const months = new Set<string>();
        for (const c of cases) {
            months.add(c.courtDate.slice(0, 7));
        }
        const avgPerMonth = months.size > 0 ? (totalCases / months.size).toFixed(1) : '0';

        return { totalCases, activeCases, avgDuration, mostCommonConviction, mostActiveCourt, avgPerMonth };
    }, [cases]);

    return (
        <div className="summary-stats">
            <div className="stat-card">
                <p className="stat-label">Total Cases</p>
                <p className="stat-value">{stats.totalCases}</p>
            </div>
            <div className="stat-card">
                <p className="stat-label">Active Cases</p>
                <p className="stat-value">{stats.activeCases}</p>
            </div>
            <div className="stat-card">
                <p className="stat-label">Avg Case Duration</p>
                <p className="stat-value">{stats.avgDuration !== null ? `${stats.avgDuration} days` : 'N/A'}</p>
            </div>
            <div className="stat-card">
                <p className="stat-label">Most Common Conviction</p>
                <p className="stat-value">{stats.mostCommonConviction}</p>
            </div>
            <div className="stat-card">
                <p className="stat-label">Most Active Court</p>
                <p className="stat-value">{stats.mostActiveCourt}</p>
            </div>
            <div className="stat-card">
                <p className="stat-label">Avg Cases / Month</p>
                <p className="stat-value">{stats.avgPerMonth}</p>
            </div>
        </div>
    );
}
