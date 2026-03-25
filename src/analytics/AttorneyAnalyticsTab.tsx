import { useMemo } from 'react';
import {
    TopAttorneysChart,
    AttorneyOutcomesChart,
    FirmCaseloadChart,
    ProsDefVolumeChart,
} from './charts';
import type { CaseRecord } from '../types';

function AttorneySummaryStats({ cases }: { cases: CaseRecord[] }) {
    const stats = useMemo(() => {
        const prosecutionSet = new Set<string>();
        const defenseSet = new Set<string>();
        const prosecutionCounts = new Map<string, number>();
        const defenseCounts = new Map<string, number>();

        for (const c of cases) {
            if (c.prosecutionAttorney) {
                prosecutionSet.add(c.prosecutionAttorney);
                prosecutionCounts.set(c.prosecutionAttorney, (prosecutionCounts.get(c.prosecutionAttorney) ?? 0) + 1);
            }
            if (c.defenseAttorney) {
                defenseSet.add(c.defenseAttorney);
                defenseCounts.set(c.defenseAttorney, (defenseCounts.get(c.defenseAttorney) ?? 0) + 1);
            }
        }

        const totalAttorneys = new Set([...prosecutionSet, ...defenseSet]).size;

        let mostActiveProsecution = 'N/A';
        let maxPros = 0;
        for (const [name, count] of prosecutionCounts) {
            if (count > maxPros) { maxPros = count; mostActiveProsecution = name; }
        }

        let mostActiveDefense = 'N/A';
        let maxDef = 0;
        for (const [name, count] of defenseCounts) {
            if (count > maxDef) { maxDef = count; mostActiveDefense = name; }
        }

        const avgCasesPerAttorney = totalAttorneys > 0 ? (cases.length / totalAttorneys).toFixed(1) : '0';

        return { totalAttorneys, mostActiveProsecution, mostActiveDefense, avgCasesPerAttorney };
    }, [cases]);

    return (
        <div className="summary-stats">
            <div className="stat-card">
                <p className="stat-label">Total Attorneys</p>
                <p className="stat-value">{stats.totalAttorneys}</p>
            </div>
            <div className="stat-card">
                <p className="stat-label">Most Active Prosecutor</p>
                <p className="stat-value">{stats.mostActiveProsecution}</p>
            </div>
            <div className="stat-card">
                <p className="stat-label">Most Active Defender</p>
                <p className="stat-value">{stats.mostActiveDefense}</p>
            </div>
            <div className="stat-card">
                <p className="stat-label">Avg Cases / Attorney</p>
                <p className="stat-value">{stats.avgCasesPerAttorney}</p>
            </div>
        </div>
    );
}

export function AttorneyAnalyticsTab({ cases }: { cases: CaseRecord[] }) {
    return (
        <>
            <AttorneySummaryStats cases={cases} />

            <div className="charts-grid">
                <div className="chart-card">
                    <h3>Top Attorneys by Caseload</h3>
                    <TopAttorneysChart cases={cases} />
                </div>
                <div className="chart-card">
                    <h3>Conviction Outcomes by Attorney</h3>
                    <AttorneyOutcomesChart cases={cases} />
                </div>
                <div className="chart-card">
                    <h3>Cases by Law Firm</h3>
                    <FirmCaseloadChart cases={cases} />
                </div>
                <div className="chart-card">
                    <h3>Prosecution vs Defense Volume</h3>
                    <ProsDefVolumeChart cases={cases} />
                </div>
            </div>
        </>
    );
}
