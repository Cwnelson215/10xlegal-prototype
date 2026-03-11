import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './admin-login.css';

export function AdminLogin() {
    const navigate = useNavigate();
    const { login, isAuthenticated, user, error, clearError } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (isAuthenticated && user?.role === 'admin') {
            navigate('/admin', { replace: true });
        } else if (isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        if (email && password) {
            try {
                await login(email, password, 'admin');
                navigate('/admin');
            } catch {
                // error state handled by AuthContext
            }
        }
    };

    return (
        <div className="admin-login-page">
            <div className="admin-login-card">
                <div className="admin-login-header">
                    <h1>10X-Legal Tech</h1>
                    <p>Admin Access</p>
                </div>

                {error && (
                    <div className="alert alert-danger" role="alert" style={{ margin: '0 0 1rem' }}>
                        {error}
                    </div>
                )}

                <form className="admin-login-form" onSubmit={handleSubmit}>
                    <input
                        type="email"
                        placeholder="Admin email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit" className="btn-form-primary">Sign In as Admin</button>
                </form>
            </div>
        </div>
    );
}
