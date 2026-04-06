import { useMemo } from 'react';
import { KpiRow } from './KpiRow';
import { KpiCard } from './KpiCard';
import { ChartCard } from './ChartCard';
import { CHART_COLORS, classifyOutcome } from './chartTheme';
import {
    CasesOverTimeChart,
    CaseStatusChart,
    CasePipelineChart,
    ConvictionDistributionChart,
    CasesByCourtChart,
    CaseResolutionTimeChart,
} from './charts';
import type { CaseRecord } from '../types';

export function OverviewTab({ cases }: { cases: CaseRecord[] }) {
    const stats = useMemo(() => {
        const totalCases = cases.length;
        const activeCases = cases.filter((c) => c.status === 'active').length;

        // Avg resolution time
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
        const avgResolution = durationCount > 0 ? Math.round(durationSum / durationCount) : null;

        // Conviction rate (check both convictionOutcome and ruling)
        let guiltyCount = 0;
        let outcomeCount = 0;
        for (const c of cases) {
            const source = c.convictionOutcome || c.ruling;
            if (source) {
                outcomeCount++;
                if (classifyOutcome(source) === 'guilty') {
                    guiltyCount++;
                }
            }
        }
        const convictionRate = outcomeCount > 0 ? Math.round((guiltyCount / outcomeCount) * 100) : null;

        return { totalCases, activeCases, avgResolution, convictionRate };
    }, [cases]);

    return (
        <>
            <KpiRow>
                <KpiCard
                    label="Total Cases"
                    value={stats.totalCases.toLocaleString()}
                    accentColor={CHART_COLORS.blue}
                />
                <KpiCard
                    label="Active Cases"
                    value={stats.activeCases.toLocaleString()}
                    accentColor={CHART_COLORS.teal}
                    subtitle={`${stats.totalCases > 0 ? Math.round((stats.activeCases / stats.totalCases) * 100) : 0}% of total`}
                />
                <KpiCard
                    label="Avg Resolution Time"
                    value={stats.avgResolution !== null ? `${stats.avgResolution} days` : 'N/A'}
                    accentColor={CHART_COLORS.amber}
                />
                <KpiCard
                    label="Conviction Rate"
                    value={stats.convictionRate !== null ? `${stats.convictionRate}%` : 'N/A'}
                    accentColor={CHART_COLORS.coral}
                />
            </KpiRow>

            <div className="dashboard-grid">
                <ChartCard title="Cases Over Time" subtitle="Monthly case volume with timeline brush" span={12}>
                    <CasesOverTimeChart cases={cases} />
                </ChartCard>

                <ChartCard title="Case Status" subtitle="Distribution by current status" span={4}>
                    <CaseStatusChart cases={cases} />
                </ChartCard>

                <ChartCard title="Case Pipeline" subtitle="Cases flowing through each stage" span={4}>
                    <CasePipelineChart cases={cases} />
                </ChartCard>

                <ChartCard title="Conviction Distribution" subtitle="Outcome breakdown" span={4}>
                    <ConvictionDistributionChart cases={cases} />
                </ChartCard>

                <ChartCard title="Cases by Court" subtitle="Top 15 courts by case volume" span={6}>
                    <CasesByCourtChart cases={cases} />
                </ChartCard>

                <ChartCard title="Avg Resolution Time by Court" subtitle="Days from filing to disposition" span={6}>
                    <CaseResolutionTimeChart cases={cases} />
                </ChartCard>
            </div>
        </>
    );
}
