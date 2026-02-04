import './app.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import type { JSX } from 'react';
import { Home } from './home/home';
import { Landing } from './landing/landing';
import { AuthProvider, useAuth } from './context/AuthContext';

function DynamicHeader(): JSX.Element {
    const { user, isAuthenticated, login, logout } = useAuth();
    const navigate = useNavigate();
    const [headerEmail, setHeaderEmail] = useState('');
    const [headerPassword, setHeaderPassword] = useState('');

    const handleHeaderLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (headerEmail && headerPassword) {
            login(headerEmail, headerPassword, 'client');
            navigate('/dashboard');
        }
    };

    return (
        <header className="app-header">
            <div className="header-wrapper">
                <div className="logo-section">
                    <a href="/" className="heading">10X-Legal Tech</a>
                </div>
                {isAuthenticated ? (
                    <>
                        <nav className="header-nav">
                            <a href="/dashboard" className="nav-link">Dashboard</a>
                        </nav>
                        <div className="header-actions">
                            <button className="btn-icon">Notifications</button>
                            <div className="user-menu">
                                <button className="btn-icon">Account</button>
                                <div className="user-dropdown">
                                    <p className="user-name">{user?.name}</p>
                                    <p className="user-role">{user?.role === 'legal-official' ? 'Legal Official' : user?.role?.charAt(0).toUpperCase()}{user?.role && user.role.length > 1 ? user.role.slice(1) : ''}</p>
                                    <button className="logout-btn" onClick={logout}>Sign Out</button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="header-actions">
                        <form className="header-login-form" onSubmit={handleHeaderLogin}>
                            <input
                                type="email"
                                placeholder="Email"
                                value={headerEmail}
                                onChange={(e) => setHeaderEmail(e.target.value)}
                                className="header-login-input"
                                required
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={headerPassword}
                                onChange={(e) => setHeaderPassword(e.target.value)}
                                className="header-login-input"
                                required
                            />
                            <button type="submit" className="header-signin-btn">Sign In</button>
                        </form>
                        <button
                            className="header-register-btn"
                            onClick={() => navigate('/?register=true')}
                        >
                            Register
                        </button>
                    </div>
                )}
            </div>
        </header>
    )
}

function AppContent() {
    return (
        <div className="app-container">
            <DynamicHeader />
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/dashboard" element={<Home />} />
            </Routes>
        </div>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <Router>
                <AppContent />
            </Router>
        </AuthProvider>
    )
}