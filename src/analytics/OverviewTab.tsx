import { SummaryStats } from './SummaryStats';
import {
    ConvictionDistributionChart,
    CasesByCourtChart,
    CasesOverTimeChart,
    ChargeDistributionChart,
    CaseStatusChart,
    RulingDistributionChart,
} from './charts';
import type { CaseRecord } from '../types';

export function OverviewTab({ cases }: { cases: CaseRecord[] }) {
    return (
        <>
            <SummaryStats cases={cases} />

            <div className="charts-grid">
                <div className="chart-card">
                    <h3>Conviction Distribution</h3>
                    <ConvictionDistributionChart cases={cases} />
                </div>
                <div className="chart-card">
                    <h3>Cases by Court</h3>
                    <CasesByCourtChart cases={cases} />
                </div>
                <div className="chart-card">
                    <h3>Cases Over Time</h3>
                    <CasesOverTimeChart cases={cases} />
                </div>
                <div className="chart-card">
                    <h3>Charge Distribution</h3>
                    <ChargeDistributionChart cases={cases} />
                </div>
                <div className="chart-card">
                    <h3>Case Status</h3>
                    <CaseStatusChart cases={cases} />
                </div>
                <div className="chart-card">
                    <h3>Ruling Distribution</h3>
                    <RulingDistributionChart cases={cases} />
                </div>
            </div>
        </>
    );
}
