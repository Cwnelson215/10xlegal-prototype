import { useMemo } from 'react';
import type { CaseRecord } from '../types';

export function SummaryStats({ cases }: { cases: CaseRecord[] }) {
    const stats = useMemo(() => {
        const totalCases = cases.length;

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

        // Most active county
        const countyCounts = new Map<string, number>();
        for (const c of cases) {
            countyCounts.set(c.county, (countyCounts.get(c.county) ?? 0) + 1);
        }
        let mostActiveCounty = 'N/A';
        let maxCounty = 0;
        for (const [county, count] of countyCounts) {
            if (count > maxCounty) {
                maxCounty = count;
                mostActiveCounty = county;
            }
        }

        // Avg cases per month
        const months = new Set<string>();
        for (const c of cases) {
            months.add(c.courtDate.slice(0, 7));
        }
        const avgPerMonth = months.size > 0 ? (totalCases / months.size).toFixed(1) : '0';

        return { totalCases, mostCommonConviction, mostActiveCounty, avgPerMonth };
    }, [cases]);

    return (
        <div className="summary-stats">
            <div className="stat-card">
                <p className="stat-label">Total Cases</p>
                <p className="stat-value">{stats.totalCases}</p>
            </div>
            <div className="stat-card">
                <p className="stat-label">Most Common Conviction</p>
                <p className="stat-value">{stats.mostCommonConviction}</p>
            </div>
            <div className="stat-card">
                <p className="stat-label">Most Active County</p>
                <p className="stat-value">{stats.mostActiveCounty}</p>
            </div>
            <div className="stat-card">
                <p className="stat-label">Avg Cases / Month</p>
                <p className="stat-value">{stats.avgPerMonth}</p>
            </div>
        </div>
    );
}
