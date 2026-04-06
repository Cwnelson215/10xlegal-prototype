import { useMemo } from 'react';
import { KpiRow } from './KpiRow';
import { KpiCard } from './KpiCard';
import { ChartCard } from './ChartCard';
import { CHART_COLORS } from './chartTheme';
import {
    ChargeTreemapChart,
    CaseTypeBreakdownChart,
    RulingDistributionChart,
    SentenceLengthChart,
    TimeToDispositionChart,
    ChargeDistributionChart,
} from './charts';
import type { CaseRecord } from '../types';

export function CasesTab({ cases }: { cases: CaseRecord[] }) {
    const stats = useMemo(() => {
        const chargeSet = new Set<string>();
        const chargeCounts = new Map<string, number>();
        let totalCharges = 0;
        let pendingRuling = 0;

        for (const c of cases) {
            if (c.charge) {
                chargeSet.add(c.charge);
                chargeCounts.set(c.charge, (chargeCounts.get(c.charge) ?? 0) + 1);
            }
            totalCharges += c.charges?.length ?? 0;
            if (!c.ruling) pendingRuling++;
        }

        let mostCommonCharge = 'N/A';
        let maxCount = 0;
        for (const [charge, count] of chargeCounts) {
            if (count > maxCount) {
                maxCount = count;
                mostCommonCharge = charge.length > 25 ? charge.slice(0, 22) + '...' : charge;
            }
        }

        const avgChargesPerCase = cases.length > 0 ? (totalCharges / cases.length).toFixed(1) : '0';

        return {
            uniqueCharges: chargeSet.size,
            mostCommonCharge,
            avgChargesPerCase,
            pendingRuling,
        };
    }, [cases]);

    return (
        <>
            <KpiRow>
                <KpiCard
                    label="Unique Charges"
                    value={stats.uniqueCharges.toLocaleString()}
                    accentColor={CHART_COLORS.coral}
                />
                <KpiCard
                    label="Most Common Charge"
                    value={stats.mostCommonCharge}
                    accentColor={CHART_COLORS.rose}
                />
                <KpiCard
                    label="Avg Charges / Case"
                    value={stats.avgChargesPerCase}
                    accentColor={CHART_COLORS.amber}
                />
                <KpiCard
                    label="Pending Ruling"
                    value={stats.pendingRuling.toLocaleString()}
                    accentColor={CHART_COLORS.grey}
                />
            </KpiRow>

            <div className="dashboard-grid">
                <ChartCard title="Charge Distribution" subtitle="Top 20 charges by case volume" span={12}>
                    <ChargeTreemapChart cases={cases} />
                </ChartCard>

                <ChartCard title="Case Type Breakdown" subtitle="Distribution of case categories" span={4}>
                    <CaseTypeBreakdownChart cases={cases} />
                </ChartCard>

                <ChartCard title="Ruling Distribution" subtitle="Top 10 ruling outcomes" span={8}>
                    <RulingDistributionChart cases={cases} />
                </ChartCard>

                <ChartCard title="Sentence Length Distribution" subtitle="Bucketed by duration" span={6}>
                    <SentenceLengthChart cases={cases} />
                </ChartCard>

                <ChartCard title="Time to Disposition by Charge" subtitle="Avg days from filing to disposition" span={6}>
                    <TimeToDispositionChart cases={cases} />
                </ChartCard>

                <ChartCard title="Top Charges" subtitle="Top 10 charges by frequency" span={12}>
                    <ChargeDistributionChart cases={cases} />
                </ChartCard>
            </div>
        </>
    );
}
