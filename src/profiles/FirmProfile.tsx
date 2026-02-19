import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { firmsService } from '../api/services/firmsService';
import { casesService } from '../api/services/casesService';
import type { LawFirm, Case } from '../api/types';
import './profiles.css';

export function FirmProfile() {
    const { id } = useParams<{ id: string }>();
    const [firm, setFirm] = useState<LawFirm | null>(null);
    const [cases, setCases] = useState<Case[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) return;
        let mounted = true;
        setIsLoading(true);

        Promise.all([
            firmsService.getFirm(id),
            casesService.getCases(1, 1000),
        ])
            .then(([firmData, casesData]) => {
                if (!mounted) return;
                setFirm(firmData);
                setCases(casesData.data.filter((c) =>
                    c.prosecutionFirmId === id || c.defenseFirmId === id
                ));
            })
            .catch((err) => { if (mounted) setError(err instanceof Error ? err.message : 'Failed to load'); })
            .finally(() => { if (mounted) setIsLoading(false); });

        return () => { mounted = false; };
    }, [id]);

    if (isLoading) return <div className="profile-container"><div className="loading-state">Loading...</div></div>;
    if (error) return <div className="profile-container"><div className="error-state">{error}</div></div>;
    if (!firm) return <div className="profile-container"><div className="error-state">Firm not found</div></div>;

    return (
        <div className="profile-container">
            <header className="profile-header">
                <div className="header-content">
                    <Link to="/dashboard" className="back-link">Back to Dashboard</Link>
                    <h1>{firm.name}</h1>
                    <p>
                        {firm.type ? `${firm.type === 'prosecution' ? 'Prosecution' : 'Defense'} Firm` : 'Law Firm'}
                        &middot; {firm.attorneyCount} attorneys &middot; {firm.caseCount} cases
                    </p>
                </div>
            </header>

            <div className="profile-content">
                {firm.attorneys && firm.attorneys.length > 0 && (
                    <div className="profile-card full-width">
                        <h3>Attorneys ({firm.attorneys.length})</h3>
                        <table className="profile-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                {firm.attorneys.map((att) => (
                                    <tr key={att.id}>
                                        <td><Link to={`/attorneys/${att.id}`}>{att.name}</Link></td>
                                        <td>{att.type === 'prosecution' ? 'Prosecution' : 'Defense'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

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
