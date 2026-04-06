import { useMemo } from 'react';
import { KpiRow } from './KpiRow';
import { KpiCard } from './KpiCard';
import { ChartCard } from './ChartCard';
import { CHART_COLORS, classifyOutcome } from './chartTheme';
import {
    TopAttorneysChart,
    AttorneyOutcomesChart,
    AttorneyWinRateChart,
    FirmCaseloadChart,
    ProsDefVolumeChart,
} from './charts';
import type { CaseRecord } from '../types';

export function AttorneyAnalyticsTab({ cases }: { cases: CaseRecord[] }) {
    const stats = useMemo(() => {
        const prosecutionSet = new Set<string>();
        const defenseSet = new Set<string>();
        const firmCounts = new Map<string, number>();
        let prosConvictions = 0;
        let prosTotal = 0;
        let defWins = 0;
        let defTotal = 0;

        for (const c of cases) {
            const cls = classifyOutcome(c.convictionOutcome || c.ruling);

            if (c.prosecutionAttorney) {
                prosecutionSet.add(c.prosecutionAttorney);
                prosTotal++;
                if (cls === 'guilty') prosConvictions++;
            }
            if (c.defenseAttorney) {
                defenseSet.add(c.defenseAttorney);
                defTotal++;
                if (cls === 'notGuilty') defWins++;
            }
            if (c.prosecutionFirm) firmCounts.set(c.prosecutionFirm, (firmCounts.get(c.prosecutionFirm) ?? 0) + 1);
            if (c.defenseFirm) firmCounts.set(c.defenseFirm, (firmCounts.get(c.defenseFirm) ?? 0) + 1);
        }

        const totalAttorneys = new Set([...prosecutionSet, ...defenseSet]).size;
        const prosWinRate = prosTotal > 0 ? Math.round((prosConvictions / prosTotal) * 100) : null;
        const defWinRate = defTotal > 0 ? Math.round((defWins / defTotal) * 100) : null;

        let mostActiveFirm = 'N/A';
        let maxFirm = 0;
        for (const [firm, count] of firmCounts) {
            if (count > maxFirm) {
                maxFirm = count;
                mostActiveFirm = firm.length > 25 ? firm.slice(0, 22) + '...' : firm;
            }
        }

        return { totalAttorneys, prosWinRate, defWinRate, mostActiveFirm };
    }, [cases]);

    return (
        <>
            <KpiRow>
                <KpiCard
                    label="Total Attorneys"
                    value={stats.totalAttorneys.toLocaleString()}
                    accentColor={CHART_COLORS.blue}
                />
                <KpiCard
                    label="Prosecution Win Rate"
                    value={stats.prosWinRate !== null ? `${stats.prosWinRate}%` : 'N/A'}
                    accentColor={CHART_COLORS.coral}
                />
                <KpiCard
                    label="Defense Win Rate"
                    value={stats.defWinRate !== null ? `${stats.defWinRate}%` : 'N/A'}
                    accentColor={CHART_COLORS.green}
                />
                <KpiCard
                    label="Most Active Firm"
                    value={stats.mostActiveFirm}
                    accentColor={CHART_COLORS.plum}
                />
            </KpiRow>

            <div className="dashboard-grid">
                <ChartCard title="Top Attorneys by Caseload" subtitle="Prosecution vs defense cases" span={12}>
                    <TopAttorneysChart cases={cases} />
                </ChartCard>

                <ChartCard title="Attorney Win Rates" subtitle="Top attorneys by conviction/acquittal rate" span={6}>
                    <AttorneyWinRateChart cases={cases} />
                </ChartCard>

                <ChartCard title="Conviction Outcomes by Attorney" subtitle="Top 8 attorneys by outcome breakdown" span={6}>
                    <AttorneyOutcomesChart cases={cases} />
                </ChartCard>

                <ChartCard title="Cases by Law Firm" subtitle="Prosecution vs defense split" span={6}>
                    <FirmCaseloadChart cases={cases} />
                </ChartCard>

                <ChartCard title="Prosecution vs Defense Volume" subtitle="Monthly trend over time" span={6}>
                    <ProsDefVolumeChart cases={cases} />
                </ChartCard>
            </div>
        </>
    );
}
