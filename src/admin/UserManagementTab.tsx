import { useState, useEffect, useCallback } from 'react';
import type { User, UserRole } from '../api/types';
import { adminService } from '../api/services/adminService';

const ROLES: { value: UserRole; label: string }[] = [
    { value: 'client', label: 'Client' },
    { value: 'lawyer', label: 'Lawyer' },
    { value: 'legal-official', label: 'Legal Official' },
    { value: 'admin', label: 'Admin' },
];

type ModalStep = 'setup-password' | 'confirm' | 'password';

export function UserManagementTab() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Admin upgrade modal state
    const [pendingUpgrade, setPendingUpgrade] = useState<{ userId: string; userName: string; userEmail: string } | null>(null);
    const [modalStep, setModalStep] = useState<ModalStep>('confirm');
    const [hasAdminPw, setHasAdminPw] = useState<boolean | null>(null);
    const [adminPassword, setAdminPassword] = useState('');
    const [newAdminPassword, setNewAdminPassword] = useState('');
    const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
    const [upgrading, setUpgrading] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await adminService.getUsers(page);
            setUsers(response.data);
            setTotalPages(response.totalPages);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load users');
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    // Check if admin has set an admin password
    useEffect(() => {
        adminService.hasAdminPassword().then(setHasAdminPw).catch(() => setHasAdminPw(false));
    }, []);

    const closeModal = () => {
        setPendingUpgrade(null);
        setAdminPassword('');
        setNewAdminPassword('');
        setConfirmAdminPassword('');
        setModalError(null);
        setUpgrading(false);
    };

    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        if (newRole === 'admin') {
            const user = users.find(u => u.id === userId);
            if (!user) return;
            setPendingUpgrade({ userId, userName: user.name, userEmail: user.email });
            setModalStep(hasAdminPw ? 'confirm' : 'setup-password');
            setModalError(null);
            return;
        }

        try {
            const updated = await adminService.updateUserRole(userId, newRole);
            setUsers(prev => prev.map(u => u.id === userId ? updated : u));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update role');
        }
    };

    const handleSetAdminPassword = async () => {
        setModalError(null);
        if (newAdminPassword.length < 8) {
            setModalError('Admin password must be at least 8 characters');
            return;
        }
        if (newAdminPassword !== confirmAdminPassword) {
            setModalError('Passwords do not match');
            return;
        }
        setUpgrading(true);
        try {
            await adminService.setAdminPassword(newAdminPassword);
            setHasAdminPw(true);
            setNewAdminPassword('');
            setConfirmAdminPassword('');
            setModalStep('confirm');
        } catch (err) {
            setModalError(err instanceof Error ? err.message : 'Failed to set admin password');
        } finally {
            setUpgrading(false);
        }
    };

    const handleAdminUpgrade = async () => {
        if (!pendingUpgrade) return;
        setModalError(null);
        if (!adminPassword) {
            setModalError('Please enter your admin password');
            return;
        }
        setUpgrading(true);
        try {
            const updated = await adminService.updateUserRole(pendingUpgrade.userId, 'admin', adminPassword);
            setUsers(prev => prev.map(u => u.id === pendingUpgrade.userId ? updated : u));
            closeModal();
        } catch (err) {
            setModalError(err instanceof Error ? err.message : 'Failed to upgrade user');
        } finally {
            setUpgrading(false);
        }
    };

    if (loading) return <div className="text-center py-5"><div className="spinner-border"></div></div>;

    return (
        <div>
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="admin-card">
                <h3>All Users</h3>
                <div className="table-responsive">
                    <table className="table user-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Verification</th>
                                <th>Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr><td colSpan={5} className="text-center text-muted py-4">No users found</td></tr>
                            ) : users.map(user => (
                                <tr key={user.id}>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <select
                                            className="form-select form-select-sm role-select"
                                            value={user.role}
                                            onChange={e => handleRoleChange(user.id, e.target.value as UserRole)}
                                        >
                                            {ROLES.map(r => (
                                                <option key={r.value} value={r.value}>{r.label}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        <span className={`badge ${
                                            user.verificationStatus === 'verified' ? 'bg-success' :
                                            user.verificationStatus === 'rejected' ? 'bg-danger' : 'bg-warning'
                                        }`}>
                                            {user.verificationStatus ?? 'N/A'}
                                        </span>
                                    </td>
                                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <nav>
                        <ul className="pagination justify-content-center">
                            <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => setPage(p => p - 1)}>Previous</button>
                            </li>
                            <li className="page-item disabled">
                                <span className="page-link">Page {page} of {totalPages}</span>
                            </li>
                            <li className={`page-item ${page >= totalPages ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => setPage(p => p + 1)}>Next</button>
                            </li>
                        </ul>
                    </nav>
                )}
            </div>

            {/* Admin Upgrade Confirmation Modal */}
            {pendingUpgrade && (
                <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {modalStep === 'setup-password' && 'Set Admin Password'}
                                    {modalStep === 'confirm' && 'Confirm Admin Upgrade'}
                                    {modalStep === 'password' && 'Enter Admin Password'}
                                </h5>
                                <button type="button" className="btn-close" onClick={closeModal} disabled={upgrading}></button>
                            </div>
                            <div className="modal-body">
                                {modalError && <div className="alert alert-danger py-2">{modalError}</div>}

                                {modalStep === 'setup-password' && (
                                    <>
                                        <p className="text-muted">
                                            You need to set a separate admin password before you can grant admin privileges.
                                            This password is different from your login password.
                                        </p>
                                        <div className="mb-3">
                                            <label className="form-label">New Admin Password</label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                value={newAdminPassword}
                                                onChange={e => setNewAdminPassword(e.target.value)}
                                                placeholder="Minimum 8 characters"
                                                disabled={upgrading}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Confirm Admin Password</label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                value={confirmAdminPassword}
                                                onChange={e => setConfirmAdminPassword(e.target.value)}
                                                placeholder="Re-enter password"
                                                disabled={upgrading}
                                                onKeyDown={e => e.key === 'Enter' && handleSetAdminPassword()}
                                            />
                                        </div>
                                    </>
                                )}

                                {modalStep === 'confirm' && (
                                    <p>
                                        Are you sure you want to grant <strong>admin privileges</strong> to{' '}
                                        <strong>{pendingUpgrade.userName}</strong> ({pendingUpgrade.userEmail})?
                                        This will give them full administrative access.
                                    </p>
                                )}

                                {modalStep === 'password' && (
                                    <>
                                        <p className="text-muted">
                                            Enter your admin password to confirm upgrading{' '}
                                            <strong>{pendingUpgrade.userName}</strong> to admin.
                                        </p>
                                        <div className="mb-3">
                                            <label className="form-label">Admin Password</label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                value={adminPassword}
                                                onChange={e => setAdminPassword(e.target.value)}
                                                placeholder="Enter your admin password"
                                                disabled={upgrading}
                                                autoFocus
                                                onKeyDown={e => e.key === 'Enter' && handleAdminUpgrade()}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={closeModal} disabled={upgrading}>
                                    Cancel
                                </button>

                                {modalStep === 'setup-password' && (
                                    <button className="btn btn-primary" onClick={handleSetAdminPassword} disabled={upgrading}>
                                        {upgrading ? <><span className="spinner-border spinner-border-sm me-1"></span>Setting...</> : 'Set Admin Password'}
                                    </button>
                                )}

                                {modalStep === 'confirm' && (
                                    <button className="btn btn-danger" onClick={() => { setModalStep('password'); setModalError(null); }}>
                                        Yes, Proceed
                                    </button>
                                )}

                                {modalStep === 'password' && (
                                    <button className="btn btn-danger" onClick={handleAdminUpgrade} disabled={upgrading}>
                                        {upgrading ? <><span className="spinner-border spinner-border-sm me-1"></span>Upgrading...</> : 'Confirm Upgrade'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
