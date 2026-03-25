import { useState } from 'react';
import { useCaseData } from '../hooks';
import { OverviewTab } from './OverviewTab';
import { AttorneyAnalyticsTab } from './AttorneyAnalyticsTab';
import './analytics.css';

type Tab = 'overview' | 'attorneys';

export function Analytics() {
    const { cases, isLoading, errorMessage } = useCaseData();
    const [activeTab, setActiveTab] = useState<Tab>('overview');

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
                    <div className="analytics-tabs">
                        <button
                            className={`tab-btn${activeTab === 'overview' ? ' active' : ''}`}
                            onClick={() => setActiveTab('overview')}
                        >
                            Overview
                        </button>
                        <button
                            className={`tab-btn${activeTab === 'attorneys' ? ' active' : ''}`}
                            onClick={() => setActiveTab('attorneys')}
                        >
                            Attorney Analytics
                        </button>
                    </div>

                    {activeTab === 'overview' && <OverviewTab cases={cases} />}
                    {activeTab === 'attorneys' && <AttorneyAnalyticsTab cases={cases} />}
                </div>
            )}
        </div>
    );
}
