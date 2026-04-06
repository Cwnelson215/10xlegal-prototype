import { useMemo } from 'react';
import { KpiRow } from './KpiRow';
import { KpiCard } from './KpiCard';
import { ChartCard } from './ChartCard';
import { CHART_COLORS } from './chartTheme';
import {
    JudgeCaseloadChart,
    JudgeOutcomesChart,
    CourtThroughputChart,
    DistrictComparisonChart,
} from './charts';
import type { CaseRecord } from '../types';

export function JudgesTab({ cases }: { cases: CaseRecord[] }) {
    const stats = useMemo(() => {
        const judgeSet = new Set<string>();
        const judgeCounts = new Map<string, number>();
        const courtSet = new Set<string>();

        for (const c of cases) {
            if (c.judgeName) {
                judgeSet.add(c.judgeName);
                judgeCounts.set(c.judgeName, (judgeCounts.get(c.judgeName) ?? 0) + 1);
            }
            if (c.court) {
                courtSet.add(c.court);
            }
        }

        let mostActiveJudge = 'N/A';
        let maxCount = 0;
        for (const [judge, count] of judgeCounts) {
            if (count > maxCount) {
                maxCount = count;
                mostActiveJudge = judge.length > 25 ? judge.slice(0, 22) + '...' : judge;
            }
        }

        const avgCasesPerJudge = judgeSet.size > 0 ? (cases.length / judgeSet.size).toFixed(1) : '0';

        return {
            totalJudges: judgeSet.size,
            mostActiveJudge,
            avgCasesPerJudge,
            courtsRepresented: courtSet.size,
        };
    }, [cases]);

    return (
        <>
            <KpiRow>
                <KpiCard
                    label="Total Judges"
                    value={stats.totalJudges.toLocaleString()}
                    accentColor={CHART_COLORS.plum}
                />
                <KpiCard
                    label="Most Active Judge"
                    value={stats.mostActiveJudge}
                    accentColor={CHART_COLORS.blue}
                />
                <KpiCard
                    label="Avg Cases / Judge"
                    value={stats.avgCasesPerJudge}
                    accentColor={CHART_COLORS.teal}
                />
                <KpiCard
                    label="Courts Represented"
                    value={stats.courtsRepresented.toLocaleString()}
                    accentColor={CHART_COLORS.amber}
                />
            </KpiRow>

            <div className="dashboard-grid">
                <ChartCard title="Cases by Judge" subtitle="Top 15 judges by caseload" span={12}>
                    <JudgeCaseloadChart cases={cases} />
                </ChartCard>

                <ChartCard title="Judge Outcomes" subtitle="Conviction outcome breakdown by judge" span={6}>
                    <JudgeOutcomesChart cases={cases} />
                </ChartCard>

                <ChartCard title="Court Throughput" subtitle="Avg days from filing to disposition" span={6}>
                    <CourtThroughputChart cases={cases} />
                </ChartCard>

                <ChartCard title="District Comparison" subtitle="Case volume by district" span={12}>
                    <DistrictComparisonChart cases={cases} />
                </ChartCard>
            </div>
        </>
    );
}
