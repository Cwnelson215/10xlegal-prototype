import { useState } from 'react';
import { useCaseData } from '../hooks';
import { OverviewTab } from './OverviewTab';
import { CasesTab } from './CasesTab';
import { AttorneyAnalyticsTab } from './AttorneyAnalyticsTab';
import { JudgesTab } from './JudgesTab';
import './analytics.css';

type Tab = 'overview' | 'cases' | 'attorneys' | 'judges';

const TABS: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'cases', label: 'Cases' },
    { key: 'attorneys', label: 'Attorneys & Firms' },
    { key: 'judges', label: 'Judges & Courts' },
];

export function Analytics() {
    const { cases, isLoading, errorMessage } = useCaseData();
    const [activeTab, setActiveTab] = useState<Tab>('overview');

    return (
        <div className="analytics-container">
            <header className="analytics-header">
                <div className="header-content">
                    <h1>Analytics</h1>
                    <p>Comprehensive insights across all case data</p>
                </div>
            </header>

            {isLoading && <div className="analytics-state">Loading analytics...</div>}
            {!isLoading && errorMessage && <div className="analytics-state error">{errorMessage}</div>}

            {!isLoading && !errorMessage && (
                <div className="analytics-content">
                    <div className="analytics-tabs">
                        {TABS.map((tab) => (
                            <button
                                key={tab.key}
                                className={`tab-btn${activeTab === tab.key ? ' active' : ''}`}
                                onClick={() => setActiveTab(tab.key)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'overview' && <OverviewTab cases={cases} />}
                    {activeTab === 'cases' && <CasesTab cases={cases} />}
                    {activeTab === 'attorneys' && <AttorneyAnalyticsTab cases={cases} />}
                    {activeTab === 'judges' && <JudgesTab cases={cases} />}
                </div>
            )}
        </div>
    );
}
