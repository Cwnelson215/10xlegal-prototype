import { useState, useEffect } from 'react';
import { attorneysService } from '../api/services/attorneysService';
import { casesService } from '../api/services/casesService';
import type { Attorney, Case } from '../api/types';
import './AssignJudgeModal.css';

interface AssignAttorneyModalProps {
    caseId: string;
    side: 'prosecution' | 'defense';
    onAssigned: (updatedCase: Case) => void;
    onClose: () => void;
}

export function AssignAttorneyModal({ caseId, side, onAssigned, onClose }: AssignAttorneyModalProps) {
    const [attorneys, setAttorneys] = useState<Attorney[]>([]);
    const [selectedAttorneyId, setSelectedAttorneyId] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        attorneysService.getAttorneys(side, 1, 1000)
            .then((res) => setAttorneys(res.data))
            .catch(() => setError('Failed to load attorneys'));
    }, [side]);

    async function handleAssign() {
        setError('');
        setIsSubmitting(true);
        try {
            let attorneyId = selectedAttorneyId;

            if (isCreating) {
                if (!newName.trim()) {
                    setError('Attorney name is required');
                    setIsSubmitting(false);
                    return;
                }
                const attorney = await attorneysService.createAttorney({
                    name: newName.trim(),
                    type: side,
                });
                attorneyId = attorney.id;
            }

            if (!attorneyId) {
                setError('Please select an attorney or create a new one');
                setIsSubmitting(false);
                return;
            }

            const updated = await casesService.assignAttorney(caseId, side, attorneyId);
            onAssigned(updated);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to assign attorney');
        } finally {
            setIsSubmitting(false);
        }
    }

    const sideLabel = side === 'prosecution' ? 'Prosecution' : 'Defense';
    const title = `Add ${sideLabel} Attorney`;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    {error && <div className="modal-error">{error}</div>}

                    {!isCreating ? (
                        <>
                            <div className="form-group">
                                <label htmlFor="attorney-select">Select Existing Attorney</label>
                                <select
                                    id="attorney-select"
                                    value={selectedAttorneyId}
                                    onChange={(e) => setSelectedAttorneyId(e.target.value)}
                                >
                                    <option value="">-- Select an attorney --</option>
                                    {attorneys.map((a) => (
                                        <option key={a.id} value={a.id}>
                                            {a.name}{a.firmName ? ` (${a.firmName})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                className="btn-link"
                                type="button"
                                onClick={() => setIsCreating(true)}
                            >
                                + Create New Attorney
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="form-group">
                                <label htmlFor="attorney-name">Name *</label>
                                <input
                                    id="attorney-name"
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Attorney name"
                                />
                            </div>
                            <button
                                className="btn-link"
                                type="button"
                                onClick={() => setIsCreating(false)}
                            >
                                Select Existing Attorney Instead
                            </button>
                        </>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn-cancel" onClick={onClose} disabled={isSubmitting}>Cancel</button>
                    <button className="btn-assign" onClick={handleAssign} disabled={isSubmitting}>
                        {isSubmitting ? 'Adding...' : 'Add Attorney'}
                    </button>
                </div>
            </div>
        </div>
    );
}
