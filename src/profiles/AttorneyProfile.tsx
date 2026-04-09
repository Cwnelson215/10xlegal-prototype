import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { attorneysService } from '../api/services/attorneysService';
import { casesService } from '../api/services/casesService';
import { AttorneyAnalyticsSection } from './AttorneyAnalyticsSection';
import { useAuth } from '../context/AuthContext';
import type { Attorney, Case } from '../api/types';
import './profiles.css';

export function AttorneyProfile() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [attorney, setAttorney] = useState<Attorney | null>(null);
    const [cases, setCases] = useState<Case[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editType, setEditType] = useState<'prosecution' | 'defense'>('prosecution');
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    useEffect(() => {
        if (!id) return;
        let mounted = true;
        setIsLoading(true);

        Promise.all([
            attorneysService.getAttorney(id),
            casesService.getCases(1, 100000),
        ])
            .then(([attData, casesData]) => {
                if (!mounted) return;
                setAttorney(attData);
                setCases(casesData.data.filter((c) =>
                    c.prosecutionAttorneys.some((a) => a.id === id) ||
                    c.defenseAttorneys.some((a) => a.id === id)
                ));
            })
            .catch((err) => { if (mounted) setError(err instanceof Error ? err.message : 'Failed to load'); })
            .finally(() => { if (mounted) setIsLoading(false); });

        return () => { mounted = false; };
    }, [id]);

    function startEditing() {
        if (!attorney) return;
        setEditName(attorney.name);
        setEditType(attorney.type);
        setSaveError('');
        setIsEditing(true);
    }

    async function handleSave() {
        if (!attorney || !id) return;
        setSaveError('');
        setIsSaving(true);
        try {
            const updates: Record<string, string> = {};
            if (editName.trim() !== attorney.name) updates.name = editName.trim();
            if (editType !== attorney.type) updates.type = editType;

            if (Object.keys(updates).length === 0) {
                setIsEditing(false);
                setIsSaving(false);
                return;
            }

            const updated = await attorneysService.updateAttorney(id, updates);
            setAttorney(updated);
            setIsEditing(false);
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading) return <div className="profile-container"><div className="loading-state">Loading...</div></div>;
    if (error) return <div className="profile-container"><div className="error-state">{error}</div></div>;
    if (!attorney) return <div className="profile-container"><div className="error-state">Attorney not found</div></div>;

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
                                <input
                                    id="edit-name"
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="edit-type">Type</label>
                                <select
                                    id="edit-type"
                                    value={editType}
                                    onChange={(e) => setEditType(e.target.value as 'prosecution' | 'defense')}
                                >
                                    <option value="prosecution">Prosecution</option>
                                    <option value="defense">Defense</option>
                                </select>
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
                                {attorney.name}
                                {isAdmin && (
                                    <button className="edit-profile-btn" onClick={startEditing}>Edit</button>
                                )}
                            </h1>
                            <p>
                                {attorney.type === 'prosecution' ? 'Prosecution' : 'Defense'} Attorney
                                &middot; {attorney.caseCount} cases
                            </p>
                        </>
                    )}
                </div>
            </header>

            <div className="profile-content">
                <AttorneyAnalyticsSection cases={cases} attorney={attorney} />

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
