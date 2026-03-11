import { useState, useEffect, useCallback } from 'react';
import type { User, UserRole } from '../api/types';
import { adminService } from '../api/services/adminService';

const ROLES: { value: UserRole; label: string }[] = [
    { value: 'client', label: 'Client' },
    { value: 'lawyer', label: 'Lawyer' },
    { value: 'legal-official', label: 'Legal Official' },
    { value: 'admin', label: 'Admin' },
];

export function UserManagementTab() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

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

    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        try {
            const updated = await adminService.updateUserRole(userId, newRole);
            setUsers(prev => prev.map(u => u.id === userId ? updated : u));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update role');
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
        </div>
    );
}
