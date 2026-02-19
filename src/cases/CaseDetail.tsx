import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { casesService } from '../api/services/casesService';
import type { Case } from '../api/types';
import './CaseDetail.css';

export function CaseDetail() {
    const { id } = useParams<{ id: string }>();
    const [caseData, setCaseData] = useState<Case | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) return;
        let mounted = true;
        setIsLoading(true);
        casesService.getCase(id)
            .then((data) => { if (mounted) setCaseData(data); })
            .catch((err) => { if (mounted) setError(err instanceof Error ? err.message : 'Failed to load case'); })
            .finally(() => { if (mounted) setIsLoading(false); });
        return () => { mounted = false; };
    }, [id]);

    if (isLoading) return <div className="case-detail-container"><div className="loading-state">Loading case...</div></div>;
    if (error) return <div className="case-detail-container"><div className="error-state">{error}</div></div>;
    if (!caseData) return <div className="case-detail-container"><div className="error-state">Case not found</div></div>;

    return (
        <div className="case-detail-container">
            <header className="case-detail-header">
                <div className="header-content">
                    <Link to="/dashboard" className="back-link">Back to Dashboard</Link>
                    <h1>{caseData.caseNumber}</h1>
                    <p>{caseData.charge}</p>
                </div>
            </header>

            <div className="case-detail-content">
                <div className="detail-grid">
                    <div className="detail-card">
                        <h3>Case Information</h3>
                        <dl>
                            <dt>Case Number</dt>
                            <dd>{caseData.caseNumber}</dd>
                            <dt>Status</dt>
                            <dd><span className={`status-pill status-${caseData.status}`}>{caseData.status}</span></dd>
                            <dt>County</dt>
                            <dd>{caseData.county}</dd>
                            <dt>Charge</dt>
                            <dd>{caseData.charge}</dd>
                            <dt>Court Date</dt>
                            <dd>{caseData.courtDate}</dd>
                            <dt>Ruling</dt>
                            <dd>{caseData.ruling || 'Pending'}</dd>
                            <dt>Sentence</dt>
                            <dd>{caseData.sentence || 'N/A'}</dd>
                        </dl>
                    </div>

                    <div className="detail-card">
                        <h3>Judge</h3>
                        <dl>
                            <dt>Name</dt>
                            <dd>
                                {caseData.judgeId
                                    ? <Link to={`/judges/${caseData.judgeId}`}>{caseData.judge}</Link>
                                    : caseData.judge}
                            </dd>
                        </dl>
                    </div>

                    <div className="detail-card">
                        <h3>Prosecution</h3>
                        <dl>
                            <dt>Attorney</dt>
                            <dd>
                                {caseData.prosecutionAttorneyId
                                    ? <Link to={`/attorneys/${caseData.prosecutionAttorneyId}`}>{caseData.prosecutionAttorney}</Link>
                                    : caseData.prosecutionAttorney}
                            </dd>
                            <dt>Firm</dt>
                            <dd>
                                {caseData.prosecutionFirmId
                                    ? <Link to={`/firms/${caseData.prosecutionFirmId}`}>{caseData.prosecutionFirm}</Link>
                                    : caseData.prosecutionFirm}
                            </dd>
                        </dl>
                    </div>

                    <div className="detail-card">
                        <h3>Defense</h3>
                        <dl>
                            <dt>Attorney</dt>
                            <dd>
                                {caseData.defenseAttorneyId
                                    ? <Link to={`/attorneys/${caseData.defenseAttorneyId}`}>{caseData.defenseAttorney}</Link>
                                    : caseData.defenseAttorney}
                            </dd>
                            <dt>Firm</dt>
                            <dd>
                                {caseData.defenseFirmId
                                    ? <Link to={`/firms/${caseData.defenseFirmId}`}>{caseData.defenseFirm}</Link>
                                    : caseData.defenseFirm}
                            </dd>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    );
}
