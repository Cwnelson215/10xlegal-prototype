import { useCaseData } from '../hooks';
import { SummaryStats } from './SummaryStats';
import {
    RulingDistributionChart,
    CasesByCountyChart,
    CasesOverTimeChart,
    ChargeDistributionChart,
} from './charts';
import './analytics.css';

export function Analytics() {
    const { cases, isLoading, errorMessage } = useCaseData();

    return (
        <div className="analytics-container">
            <header className="analytics-header">
                <div className="header-content">
                    <h1>Analytics</h1>
                    <p>Overview of all case data</p>
                </div>
            </header>

            {isLoading && <div className="analytics-state">Loading analytics...</div>}
            {!isLoading && errorMessage && <div className="analytics-state error">{errorMessage}</div>}

            {!isLoading && !errorMessage && (
                <div className="analytics-content">
                    <SummaryStats cases={cases} />

                    <div className="charts-grid">
                        <div className="chart-card">
                            <h3>Ruling Distribution</h3>
                            <RulingDistributionChart cases={cases} />
                        </div>
                        <div className="chart-card">
                            <h3>Cases by County</h3>
                            <CasesByCountyChart cases={cases} />
                        </div>
                        <div className="chart-card">
                            <h3>Cases Over Time</h3>
                            <CasesOverTimeChart cases={cases} />
                        </div>
                        <div className="chart-card">
                            <h3>Charge Distribution</h3>
                            <ChargeDistributionChart cases={cases} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
