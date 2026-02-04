import './app.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import type { JSX } from 'react';
import { Home } from './home/home';
import { Landing } from './landing/landing';
import { AuthProvider, useAuth } from './context/AuthContext';

function DynamicHeader(): JSX.Element {
    const { user, logout } = useAuth();

    return (
        <header className="app-header">
            <div className="header-wrapper">
                <div className="logo-section">
                    <span className="heading">10X-Legal Tech</span>
                </div>
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