import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { judgesService } from '../api/services/judgesService';
import { casesService } from '../api/services/casesService';
import type { Judge, Case } from '../api/types';
import './profiles.css';

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
            casesService.getCases(1, 100000),
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

    return (
        <div className="profile-container">
            <header className="profile-header">
                <div className="header-content">
                    <Link to="/dashboard" className="back-link">Back to Dashboard</Link>
                    <h1>{judge.name}</h1>
                    <p>
                        {judge.title || 'Judge'}
                        {judge.court && <> &middot; {judge.court}</>}
                        {judge.district && <> &middot; District {judge.district}</>}
                        &middot; {judge.caseCount} cases
                    </p>
                </div>
            </header>

            <div className="profile-content">
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
                                    <th>Court</th>
                                    <th>Court Date</th>
                                    <th>Ruling</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cases.map((c) => (
                                    <tr key={c.id}>
                                        <td><Link to={`/cases/${c.id}`}>{c.caseNumber}</Link></td>
                                        <td>{c.charge}</td>
                                        <td>{c.court}</td>
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
