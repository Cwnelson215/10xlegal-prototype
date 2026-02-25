import './app.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import type { JSX } from 'react';
import { Home } from './home/home';
import { Landing } from './landing/landing';
import { Analytics } from './analytics/analytics';
import { Calendar } from './calendar/calendar';
import { CaseDetail } from './cases/CaseDetail';
import { AttorneyProfile } from './profiles/AttorneyProfile';
import { FirmProfile } from './profiles/FirmProfile';
import { AttorneysList } from './profiles/AttorneysList';
import { FirmsList } from './profiles/FirmsList';
import { AuthProvider, useAuth } from './context/AuthContext';

function DynamicHeader(): JSX.Element {
    const { user, isAuthenticated, logout } = useAuth();

    return (
        <header className="app-header">
            <div className="header-wrapper">
                <div className="logo-section">
                    <Link to="/" className="heading">10X-Legal Tech</Link>
                </div>
                {isAuthenticated ? (
                    <>
                        <nav className="header-nav">
                            <Link to="/dashboard" className="nav-link">Dashboard</Link>
                            <Link to="/attorneys" className="nav-link">Attorneys</Link>
                            <Link to="/firms" className="nav-link">Firms</Link>
                            <Link to="/analytics" className="nav-link">Analytics</Link>
                            <Link to="/calendar" className="nav-link">Calendar</Link>
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
                        <Link to="/" className="nav-link">Sign In</Link>
                    </div>
                )}
            </div>
        </header>
    )
}

function AppContent() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!isAuthenticated && location.pathname !== '/') {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, navigate, location.pathname]);

    return (
        <div className="app-container">
            <DynamicHeader />
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/dashboard" element={<Home />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/cases/:id" element={<CaseDetail />} />
                <Route path="/attorneys" element={<AttorneysList />} />
                <Route path="/attorneys/:id" element={<AttorneyProfile />} />
                <Route path="/firms" element={<FirmsList />} />
                <Route path="/firms/:id" element={<FirmProfile />} />
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
