import { useState } from 'react';
import { DataImportTab } from './DataImportTab';
import { UserManagementTab } from './UserManagementTab';
import { SystemOverviewTab } from './SystemOverviewTab';
import { ImportHistoryTab } from './ImportHistoryTab';
import { AuditLogTab } from './AuditLogTab';
import './admin.css';

type AdminTab = 'import' | 'users' | 'overview' | 'history' | 'audit';

const TABS: { key: AdminTab; label: string }[] = [
    { key: 'import', label: 'Data Import' },
    { key: 'users', label: 'User Management' },
    { key: 'overview', label: 'System Overview' },
    { key: 'history', label: 'Import History' },
    { key: 'audit', label: 'Audit Log' },
];

export function Admin() {
    const [activeTab, setActiveTab] = useState<AdminTab>('import');

    return (
        <div className="admin-container">
            <div className="admin-header">
                <div className="admin-header-content">
                    <h1>Admin Panel</h1>
                    <p>Manage data imports, users, and system settings</p>
                </div>
            </div>

            <div className="admin-tabs">
                <ul className="nav nav-tabs">
                    {TABS.map(tab => (
                        <li className="nav-item" key={tab.key}>
                            <button
                                className={`nav-link ${activeTab === tab.key ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.key)}
                            >
                                {tab.label}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="admin-body">
                {activeTab === 'import' && <DataImportTab />}
                {activeTab === 'users' && <UserManagementTab />}
                {activeTab === 'overview' && <SystemOverviewTab />}
                {activeTab === 'history' && <ImportHistoryTab />}
                {activeTab === 'audit' && <AuditLogTab />}
            </div>
        </div>
    );
}
