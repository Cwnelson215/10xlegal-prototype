import { useState, useEffect } from 'react';
import { judgesService } from '../api/services/judgesService';
import { casesService } from '../api/services/casesService';
import type { Judge, Case } from '../api/types';
import './AssignJudgeModal.css';

interface AssignJudgeModalProps {
    caseId: string;
    court: string;
    district: string;
    onAssigned: (updatedCase: Case) => void;
    onClose: () => void;
}

export function AssignJudgeModal({ caseId, court, district, onAssigned, onClose }: AssignJudgeModalProps) {
    const [judges, setJudges] = useState<Judge[]>([]);
    const [selectedJudgeId, setSelectedJudgeId] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newTitle, setNewTitle] = useState('');
    const [newCourt, setNewCourt] = useState(court);
    const [newDistrict, setNewDistrict] = useState(district);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        judgesService.getJudges(1, 1000)
            .then((res) => setJudges(res.data))
            .catch(() => setError('Failed to load judges'));
    }, []);

    async function handleAssign() {
        setError('');
        setIsSubmitting(true);
        try {
            let judgeId = selectedJudgeId;

            if (isCreating) {
                if (!newName.trim()) {
                    setError('Judge name is required');
                    setIsSubmitting(false);
                    return;
                }
                const judge = await judgesService.createJudge({
                    name: newName.trim(),
                    title: newTitle.trim() || undefined,
                    court: newCourt.trim() || undefined,
                    district: newDistrict.trim() || undefined,
                });
                judgeId = judge.id;
            }

            if (!judgeId) {
                setError('Please select a judge or create a new one');
                setIsSubmitting(false);
                return;
            }

            const updated = await casesService.assignJudge(caseId, judgeId);
            onAssigned(updated);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to assign judge');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Assign Judge</h3>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    {error && <div className="modal-error">{error}</div>}

                    {!isCreating ? (
                        <>
                            <div className="form-group">
                                <label htmlFor="judge-select">Select Existing Judge</label>
                                <select
                                    id="judge-select"
                                    value={selectedJudgeId}
                                    onChange={(e) => setSelectedJudgeId(e.target.value)}
                                >
                                    <option value="">-- Select a judge --</option>
                                    {judges.map((j) => (
                                        <option key={j.id} value={j.id}>
                                            {j.name}{j.court ? ` (${j.court})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                className="btn-link"
                                type="button"
                                onClick={() => setIsCreating(true)}
                            >
                                + Create New Judge
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="form-group">
                                <label htmlFor="judge-name">Name *</label>
                                <input
                                    id="judge-name"
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Judge name"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="judge-title">Title</label>
                                <input
                                    id="judge-title"
                                    type="text"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder="e.g. District Judge"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="judge-court">Court</label>
                                <input
                                    id="judge-court"
                                    type="text"
                                    value={newCourt}
                                    onChange={(e) => setNewCourt(e.target.value)}
                                    placeholder="Court name"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="judge-district">District</label>
                                <input
                                    id="judge-district"
                                    type="text"
                                    value={newDistrict}
                                    onChange={(e) => setNewDistrict(e.target.value)}
                                    placeholder="District number"
                                />
                            </div>
                            <button
                                className="btn-link"
                                type="button"
                                onClick={() => setIsCreating(false)}
                            >
                                Select Existing Judge Instead
                            </button>
                        </>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn-cancel" onClick={onClose} disabled={isSubmitting}>Cancel</button>
                    <button className="btn-assign" onClick={handleAssign} disabled={isSubmitting}>
                        {isSubmitting ? 'Assigning...' : 'Assign Judge'}
                    </button>
                </div>
            </div>
        </div>
    );
}
