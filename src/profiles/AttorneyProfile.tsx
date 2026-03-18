import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { attorneysService } from '../api/services/attorneysService';
import { casesService } from '../api/services/casesService';
import type { Attorney, Case } from '../api/types';
import './profiles.css';

export function AttorneyProfile() {
    const { id } = useParams<{ id: string }>();
    const [attorney, setAttorney] = useState<Attorney | null>(null);
    const [cases, setCases] = useState<Case[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) return;
        let mounted = true;
        setIsLoading(true);

        Promise.all([
            attorneysService.getAttorney(id),
            casesService.getCases(1, 1000),
        ])
            .then(([attData, casesData]) => {
                if (!mounted) return;
                setAttorney(attData);
                setCases(casesData.data.filter((c) =>
                    c.prosecutionAttorneyId === id || c.defenseAttorneyId === id
                ));
            })
            .catch((err) => { if (mounted) setError(err instanceof Error ? err.message : 'Failed to load'); })
            .finally(() => { if (mounted) setIsLoading(false); });

        return () => { mounted = false; };
    }, [id]);

    if (isLoading) return <div className="profile-container"><div className="loading-state">Loading...</div></div>;
    if (error) return <div className="profile-container"><div className="error-state">{error}</div></div>;
    if (!attorney) return <div className="profile-container"><div className="error-state">Attorney not found</div></div>;

    return (
        <div className="profile-container">
            <header className="profile-header">
                <div className="header-content">
                    <Link to="/dashboard" className="back-link">Back to Dashboard</Link>
                    <h1>{attorney.name}</h1>
                    <p>
                        {attorney.type === 'prosecution' ? 'Prosecution' : 'Defense'} Attorney
                        &middot; {attorney.caseCount} cases
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
