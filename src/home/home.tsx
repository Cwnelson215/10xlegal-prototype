import { useNavigate } from "react-router-dom";
import './home.css';

export function Home() {
    const navigate = useNavigate();

    const handleButtonClick = (service: string) => {
        navigate(`/${service}`)
    };

    const stats = [
        { label: 'Active Cases', value: '12', icon: '📋' },
        { label: 'Pending Documents', value: '8', icon: '📄' },
        { label: 'Upcoming Deadlines', value: '3', icon: '⏰' },
        { label: 'Team Members', value: '5', icon: '👥' },
    ];

    const recentCases = [
        { id: 1, name: 'Smith vs. Johnson Inc.', status: 'In Progress', date: '2024-01-15' },
        { id: 2, name: 'Corporate Merger Review', status: 'Document Review', date: '2024-01-12' },
        { id: 3, name: 'Contract Dispute Resolution', status: 'Pending', date: '2024-01-10' },
    ];

    const upcomingDeadlines = [
        { id: 1, case: 'Smith vs. Johnson Inc.', deadline: '2024-02-05', daysLeft: 8 },
        { id: 2, case: 'Corporate Merger Review', deadline: '2024-02-10', daysLeft: 13 },
        { id: 3, case: 'Patent Application', deadline: '2024-02-03', daysLeft: 6 },
    ];

    return (
        <div className="home-container">
            <header className="home-header">
                <div className="header-content">
                    <h1>Legal Dashboard</h1>
                    <p>Manage cases, documents, and deadlines efficiently</p>
                </div>
            </header>

            <section className="stats-section">
                <h2>Overview</h2>
                <div className="stats-grid">
                    {stats.map((stat, index) => (
                        <div key={index} className="stat-card">
                            <div className="stat-icon">{stat.icon}</div>
                            <div className="stat-content">
                                <p className="stat-label">{stat.label}</p>
                                <p className="stat-value">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="recent-cases-section">
                <div className="section-header">
                    <h2>Recent Cases</h2>
                    <button className="view-all-btn" onClick={() => handleButtonClick('cases')}>View All →</button>
                </div>
                <div className="cases-list">
                    {recentCases.map((caseItem) => (
                        <div key={caseItem.id} className="case-item">
                            <div className="case-info">
                                <h3>{caseItem.name}</h3>
                                <p className="case-date">{caseItem.date}</p>
                            </div>
                            <span className={`case-status status-${caseItem.status.toLowerCase().replace(' ', '-')}`}>
                                {caseItem.status}
                            </span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Upcoming Deadlines */}
            <section className="deadlines-section">
                <div className="section-header">
                    <h2>Upcoming Deadlines</h2>
                    <button className="view-all-btn" onClick={() => handleButtonClick('deadlines')}>View All →</button>
                </div>
                <div className="deadlines-list">
                    {upcomingDeadlines.map((deadline) => (
                        <div key={deadline.id} className={`deadline-item ${deadline.daysLeft <= 7 ? 'urgent' : ''}`}>
                            <div className="deadline-info">
                                <h4>{deadline.case}</h4>
                                <p className="deadline-date">{deadline.deadline}</p>
                            </div>
                            <div className={`days-left ${deadline.daysLeft <= 7 ? 'urgent' : ''}`}>
                                {deadline.daysLeft} days left
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Quick Actions */}
            <section className="quick-actions-section">
                <h2>Quick Actions</h2>
                <div className="actions-grid">
                    <button className="action-btn primary" onClick={() => handleButtonClick('cases')}>
                        <span className="action-icon">➕</span>
                        <span>New Case</span>
                    </button>
                    <button className="action-btn secondary" onClick={() => handleButtonClick('documents')}>
                        <span className="action-icon">📤</span>
                        <span>Upload Document</span>
                    </button>
                    <button className="action-btn secondary" onClick={() => handleButtonClick('team')}>
                        <span className="action-icon">🧑</span>
                        <span>Manage Team</span>
                    </button>
                    <button className="action-btn secondary" onClick={() => handleButtonClick('settings')}>
                        <span className="action-icon">⚙️</span>
                        <span>Settings</span>
                    </button>
                </div>
            </section>
        </div>
    )
}