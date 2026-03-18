import { useState, useEffect } from 'react';
import type { SystemStats, ApiResponse } from '../api/types';
import { adminService } from '../api/services/adminService';

export function SystemOverviewTab() {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [resetting, setResetting] = useState(false);
    const [resetMessage, setResetMessage] = useState<string | null>(null);

    const loadStats = async () => {
        try {
            const data = await adminService.getSystemStats();
            setStats(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load stats');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    const handleResetDatabase = async () => {
        if (!window.confirm('Are you sure you want to delete ALL data (except users)? This cannot be undone.')) {
            return;
        }
        setResetting(true);
        setResetMessage(null);
        try {
            const result = await adminService.resetDatabase();
            setResetMessage(result.message);
            loadStats();
        } catch (err) {
            setResetMessage(err instanceof Error ? err.message : 'Reset failed');
        } finally {
            setResetting(false);
        }
    };

    if (loading) return <div className="text-center py-5"><div className="spinner-border"></div></div>;

    if (error) return <div className="alert alert-danger">{error}</div>;

    if (!stats) return null;

    return (
        <div>
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">{stats.totalCases}</div>
                    <div className="stat-label">Total Cases</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.totalUsers}</div>
                    <div className="stat-label">Total Users</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.totalAttorneys}</div>
                    <div className="stat-label">Attorneys</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.totalFirms}</div>
                    <div className="stat-label">Firms</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.totalDeadlines}</div>
                    <div className="stat-label">Deadlines</div>
                </div>
            </div>

            <div className="row">
                <div className="col-md-6">
                    <div className="admin-card">
                        <h3>Cases by Status</h3>
                        <table className="table table-sm">
                            <tbody>
                                {Object.entries(stats.casesByStatus).map(([status, count]) => (
                                    <tr key={status}>
                                        <td className="text-capitalize">{status}</td>
                                        <td className="text-end fw-bold">{count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="admin-card">
                        <h3>Users by Role</h3>
                        <table className="table table-sm">
                            <tbody>
                                {Object.entries(stats.usersByRole).map(([role, count]) => (
                                    <tr key={role}>
                                        <td className="text-capitalize">{role}</td>
                                        <td className="text-end fw-bold">{count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="admin-card mt-4">
                <h3>Danger Zone</h3>
                <p className="text-muted">Truncate all data tables (cases, attorneys, firms, deadlines, documents, imports, audit log, refresh tokens). Users are preserved.</p>
                {resetMessage && (
                    <div className={`alert ${resetMessage.includes('fail') ? 'alert-danger' : 'alert-success'} mb-3`}>
                        {resetMessage}
                    </div>
                )}
                <button
                    className="btn btn-danger"
                    onClick={handleResetDatabase}
                    disabled={resetting}
                >
                    {resetting ? 'Resetting...' : 'Reset Database'}
                </button>
            </div>
        </div>
    );
}
