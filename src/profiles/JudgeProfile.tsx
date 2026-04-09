import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { judgesService } from '../api/services/judgesService';
import { casesService } from '../api/services/casesService';
import { useAuth } from '../context/AuthContext';
import type { Judge, Case } from '../api/types';
import './profiles.css';

export function JudgeProfile() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [judge, setJudge] = useState<Judge | null>(null);
    const [cases, setCases] = useState<Case[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editTitle, setEditTitle] = useState('');
    const [editCourt, setEditCourt] = useState('');
    const [editDistrict, setEditDistrict] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

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

    function startEditing() {
        if (!judge) return;
        setEditName(judge.name);
        setEditTitle(judge.title);
        setEditCourt(judge.court);
        setEditDistrict(judge.district);
        setSaveError('');
        setIsEditing(true);
    }

    async function handleSave() {
        if (!judge || !id) return;
        setSaveError('');
        setIsSaving(true);
        try {
            const updates: Record<string, string> = {};
            if (editName.trim() !== judge.name) updates.name = editName.trim();
            if (editTitle !== judge.title) updates.title = editTitle;
            if (editCourt !== judge.court) updates.court = editCourt;
            if (editDistrict !== judge.district) updates.district = editDistrict;

            if (Object.keys(updates).length === 0) {
                setIsEditing(false);
                setIsSaving(false);
                return;
            }

            const updated = await judgesService.updateJudge(id, updates);
            setJudge(updated);
            setIsEditing(false);
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading) return <div className="profile-container"><div className="loading-state">Loading...</div></div>;
    if (error) return <div className="profile-container"><div className="error-state">{error}</div></div>;
    if (!judge) return <div className="profile-container"><div className="error-state">Judge not found</div></div>;

    const isAdmin = user?.role === 'admin';

    return (
        <div className="profile-container">
            <header className="profile-header">
                <div className="header-content">
                    <Link to="/dashboard" className="back-link">Back to Dashboard</Link>
                    {isEditing ? (
                        <div className="edit-form">
                            <div className="form-group">
                                <label htmlFor="edit-name">Name</label>
                                <input id="edit-name" type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="edit-title">Title</label>
                                <input id="edit-title" type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="edit-court">Court</label>
                                <input id="edit-court" type="text" value={editCourt} onChange={(e) => setEditCourt(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="edit-district">District</label>
                                <input id="edit-district" type="text" value={editDistrict} onChange={(e) => setEditDistrict(e.target.value)} />
                            </div>
                            {saveError && <div className="edit-error">{saveError}</div>}
                            <div className="edit-actions">
                                <button className="btn-save" onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? 'Saving...' : 'Save'}
                                </button>
                                <button className="btn-cancel-edit" onClick={() => setIsEditing(false)} disabled={isSaving}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h1>
                                {judge.name}
                                {isAdmin && (
                                    <button className="edit-profile-btn" onClick={startEditing}>Edit</button>
                                )}
                            </h1>
                            <p>
                                {judge.title || 'Judge'}
                                {judge.court && <> &middot; {judge.court}</>}
                                {judge.district && <> &middot; District {judge.district}</>}
                                &middot; {judge.caseCount} cases
                            </p>
                        </>
                    )}
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
