import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { casesService } from '../api/services/casesService';
import { SentenceDisplay } from '../components/SentenceDisplay';
import { AssignJudgeModal } from './AssignJudgeModal';
import { useAuth } from '../context/AuthContext';
import type { Case } from '../api/types';
import './CaseDetail.css';

export function CaseDetail() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [caseData, setCaseData] = useState<Case | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAssignJudge, setShowAssignJudge] = useState(false);

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
                            <dt>Court</dt>
                            <dd>{caseData.court}</dd>
                            {caseData.districtNumber && <>
                                <dt>District #</dt>
                                <dd>{caseData.districtNumber}</dd>
                            </>}
                            {caseData.caseType && <>
                                <dt>Case Type</dt>
                                <dd>{caseData.caseType}</dd>
                            </>}
                            <dt>Charge</dt>
                            <dd>
                                {caseData.charge}
                                {caseData.offenseCode && <span className="offense-code"> ({caseData.offenseCode})</span>}
                            </dd>
                            {caseData.charges && caseData.charges.length > 1 && <>
                                <dt>All Charges</dt>
                                <dd>
                                    <ul className="charges-list">
                                        {caseData.charges.map((charge, i) => (
                                            <li key={i}>
                                                {charge.description}
                                                {charge.offense_code && <span className="offense-code"> ({charge.offense_code})</span>}
                                                {charge.judgment && <> — {charge.judgment}</>}
                                                {charge.sentence && charge.value && charge.units && <> — {charge.sentence}: {charge.value} {charge.units}</>}
                                            </li>
                                        ))}
                                    </ul>
                                </dd>
                            </>}
                            <dt>Filing Date</dt>
                            <dd>{caseData.filingDate}</dd>
                            <dt>Court Date</dt>
                            <dd>{caseData.courtDate}</dd>
                            <dt>Disposition Date</dt>
                            <dd>{caseData.dispositionDate}</dd>
                            <dt>Conviction Outcome</dt>
                            <dd>{caseData.convictionOutcome}</dd>
                            <dt>Conviction Date</dt>
                            <dd>{caseData.convictionDate}</dd>
                            <dt>Sentence</dt>
                            <dd><SentenceDisplay sentence={caseData.sentence} /></dd>
                            {caseData.sentenceDate && <>
                                <dt>Sentence Date</dt>
                                <dd>{caseData.sentenceDate}</dd>
                            </>}
                            {caseData.judgmentDescription && <>
                                <dt>Judgment Description</dt>
                                <dd>{caseData.judgmentDescription}</dd>
                            </>}
                            {caseData.sentenceDescription && <>
                                <dt>Sentence Description</dt>
                                <dd>{caseData.sentenceDescription}</dd>
                            </>}
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
                        </dl>
                    </div>

                    <div className="detail-card">
                        <h3>Judge</h3>
                        <dl>
                            <dt>Judge</dt>
                            <dd>
                                {caseData.judgeId
                                    ? <Link to={`/judges/${caseData.judgeId}`}>{caseData.judgeName}</Link>
                                    : caseData.judgeName || 'Not assigned'}
                            </dd>
                        </dl>
                        {!caseData.judgeId && user?.role === 'admin' && (
                            <button className="assign-judge-btn" onClick={() => setShowAssignJudge(true)}>
                                Assign Judge
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {showAssignJudge && (
                <AssignJudgeModal
                    caseId={caseData.id}
                    court={caseData.court}
                    district={caseData.districtNumber}
                    onAssigned={(updated) => { setCaseData(updated); setShowAssignJudge(false); }}
                    onClose={() => setShowAssignJudge(false)}
                />
            )}
        </div>
    );
}
