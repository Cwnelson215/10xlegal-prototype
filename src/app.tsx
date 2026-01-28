import './app.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import type { JSX } from 'react';
import { Home } from './home/home';
import { Landing } from './landing/landing';
import { AuthProvider, useAuth } from './context/AuthContext';

function DynamicHeader(): JSX.Element {
    const location = useLocation();
    const { user, logout } = useAuth();
    
    // Don't show app header on landing page
    if (location.pathname === '/') {
        return <></>;
    }

    return (
        <header className="app-header">
            <div className="header-wrapper">
                <div className="logo-section">
                    <span className="logo-icon">⚖️</span>
                    <span className="heading">10x Legal</span>
                </div>
                <nav className="header-nav">
                    <a href="/dashboard" className="nav-link">Dashboard</a>
                    <a href="/cases" className="nav-link">Cases</a>
                    <a href="/documents" className="nav-link">Documents</a>
                    <a href="/team" className="nav-link">Team</a>
                </nav>
                <div className="header-actions">
                    <button className="btn-icon">🔔</button>
                    <div className="user-menu">
                        <button className="btn-icon">👤</button>
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

function ProtectedRoute({ children }: { children: JSX.Element }) {
    const { isAuthenticated } = useAuth();
    
    if (!isAuthenticated) {
        return <Landing />;
    }
    
    return children;
}

function AppContent() {
    return (
        <div className="app-container">
            <DynamicHeader />
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/dashboard" element={<ProtectedRoute><Home /></ProtectedRoute>} />
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