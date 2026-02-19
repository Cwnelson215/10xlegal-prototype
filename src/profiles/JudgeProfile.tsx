import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { judgesService } from '../api/services/judgesService';
import { casesService } from '../api/services/casesService';
import type { Judge, Case } from '../api/types';
import './profiles.css';

const COLORS = ['#2c3e50', '#2980b9', '#27ae60', '#e67e22', '#c0392b', '#8e44ad', '#16a085', '#d35400'];

export function JudgeProfile() {
    const { id } = useParams<{ id: string }>();
    const [judge, setJudge] = useState<Judge | null>(null);
    const [cases, setCases] = useState<Case[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) return;
        let mounted = true;
        setIsLoading(true);

        Promise.all([
            judgesService.getJudge(id),
            casesService.getCases(1, 1000),
        ])
            .then(([judgeData, casesData]) => {
                if (!mounted) return;
                setJudge(judgeData);
                setCases(casesData.data.filter((c) => c.judgeId === id));
            })
            .catch((err) => { if (mounted) setError(err instanceof Error ? err.message : 'Failed to load'); })
            .finally(() => { if (mounted) setIsLoading(false); });

        return () => { mounted = false; };
    }, [id]);

    if (isLoading) return <div className="profile-container"><div className="loading-state">Loading...</div></div>;
    if (error) return <div className="profile-container"><div className="error-state">{error}</div></div>;
    if (!judge) return <div className="profile-container"><div className="error-state">Judge not found</div></div>;

    const rulingData = judge.rulingDistribution
        ? Object.entries(judge.rulingDistribution).map(([name, value]) => ({ name, value }))
        : [];

    return (
        <div className="profile-container">
            <header className="profile-header">
                <div className="header-content">
                    <Link to="/dashboard" className="back-link">Back to Dashboard</Link>
                    <h1>{judge.name}</h1>
                    <p>Judge &middot; {judge.caseCount} cases &middot; {judge.counties.join(', ')} {judge.counties.length === 1 ? 'County' : 'Counties'}</p>
                </div>
            </header>

            <div className="profile-content">
                <div className="profile-grid">
                    {rulingData.length > 0 && (
                        <div className="profile-card chart-card">
                            <h3>Ruling Distribution</h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie data={rulingData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name ?? ''} (${((percent ?? 0) * 100).toFixed(0)}%)`}>
                                        {rulingData.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length] ?? '#999'} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    <div className="profile-card">
                        <h3>Counties</h3>
                        <div className="tag-list">
                            {judge.counties.map((county) => (
                                <span key={county} className="tag">{county}</span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="profile-card full-width">
                    <h3>Cases ({cases.length})</h3>
                    {cases.length === 0 ? (
                        <p className="empty-state">No cases found</p>
                    ) : (
                        <table className="profile-table">
                            <thead>
                                <tr>
                                    <th>Case Number</th>
                                    <th>Charge</th>
                                    <th>County</th>
                                    <th>Court Date</th>
                                    <th>Ruling</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cases.map((c) => (
                                    <tr key={c.id}>
                                        <td><Link to={`/cases/${c.id}`}>{c.caseNumber}</Link></td>
                                        <td>{c.charge}</td>
                                        <td>{c.county}</td>
                                        <td>{c.courtDate}</td>
                                        <td>{c.ruling}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
