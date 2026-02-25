import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, type UserRole } from '../context/AuthContext';
import type { RegisterRequest } from '../api/types';
import { US_STATES } from '../api/types';
import './landing.css';

export function Landing() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { register, login, isAuthenticated, error, clearError } = useAuth();
    const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
    const [selectedRole, setSelectedRole] = useState<UserRole>('client');
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [registerName, setRegisterName] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState('');
    const [barState, setBarState] = useState('');
    const [barNumber, setBarNumber] = useState('');
    const [governmentAgency, setGovernmentAgency] = useState('');
    const [officialId, setOfficialId] = useState('');

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        if (searchParams.get('register') === 'true') {
            setActiveTab('register');
            setSearchParams({}, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    const handleRoleChange = (role: UserRole) => {
        setSelectedRole(role);
        setBarState('');
        setBarNumber('');
        setGovernmentAgency('');
        setOfficialId('');
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loginEmail && loginPassword && selectedRole) {
            try {
                await login(loginEmail, loginPassword, selectedRole);
                navigate('/dashboard');
            } catch {
                // login failed — AuthContext already sets the error state
            }
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (registerName && registerEmail && registerPassword && registerPassword === registerPasswordConfirm && selectedRole) {
            const data: RegisterRequest = {
                name: registerName,
                email: registerEmail,
                password: registerPassword,
                role: selectedRole as 'client' | 'lawyer' | 'legal-official',
            };

            if (selectedRole === 'lawyer' && barState && barNumber) {
                data.lawyerInfo = {
                    stateBarAssociation: barState,
                    barNumber,
                };
            }

            if (selectedRole === 'legal-official' && governmentAgency && officialId) {
                data.legalOfficialInfo = {
                    governmentAgency,
                    officialId,
                };
            }

            try {
                await register(data);
                navigate('/dashboard');
            } catch {
                // register failed — AuthContext already sets the error state
            }
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <h1>10X-Legal Tech</h1>
                    <p>Public legal case data at your fingertips</p>
                </div>

                <div className="auth-tabs">
                    <button
                        className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('login'); clearError(); }}
                    >
                        Sign In
                    </button>
                    <button
                        className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('register'); clearError(); }}
                    >
                        Register
                    </button>
                </div>

                {/* Role Selection */}
                <div className="role-selection">
                    <label>I am a:</label>
                    <div className="role-options">
                        <button
                            type="button"
                            className={`role-btn ${selectedRole === 'client' ? 'selected' : ''}`}
                            onClick={() => handleRoleChange('client')}
                        >
                            <span className="role-label">Client</span>
                            <span className="role-description">Individual seeking legal help</span>
                        </button>
                        <button
                            type="button"
                            className={`role-btn ${selectedRole === 'lawyer' ? 'selected' : ''}`}
                            onClick={() => handleRoleChange('lawyer')}
                        >
                            <span className="role-label">Lawyer</span>
                            <span className="role-description">Licensed attorney</span>
                        </button>
                        <button
                            type="button"
                            className={`role-btn ${selectedRole === 'legal-official' ? 'selected' : ''}`}
                            onClick={() => handleRoleChange('legal-official')}
                        >
                            <span className="role-label">Legal Official</span>
                            <span className="role-description">Court or government staff</span>
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="alert alert-danger" role="alert" style={{ margin: '0 0 1rem' }}>
                        {error}
                    </div>
                )}

                {activeTab === 'login' ? (
                    <form className="auth-form" onSubmit={handleLogin}>
                        <h2>Welcome Back</h2>
                        <input
                            type="email"
                            placeholder="Email address"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            required
                        />
                        <label className="remember-me">
                            <input type="checkbox" />
                            Remember me
                        </label>
                        <button type="submit" className="btn-form-primary">Sign In</button>
                    </form>
                ) : (
                    <form className="auth-form" onSubmit={handleRegister}>
                        <h2>Create Your Account</h2>
                        <input
                            type="text"
                            placeholder="Full name"
                            value={registerName}
                            onChange={(e) => setRegisterName(e.target.value)}
                            required
                        />
                        <input
                            type="email"
                            placeholder="Email address"
                            value={registerEmail}
                            onChange={(e) => setRegisterEmail(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={registerPassword}
                            onChange={(e) => setRegisterPassword(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Confirm password"
                            value={registerPasswordConfirm}
                            onChange={(e) => setRegisterPasswordConfirm(e.target.value)}
                            required
                        />

                        {selectedRole === 'lawyer' && (
                            <div className="role-specific-fields">
                                <div className="role-fields-header">
                                    <h3>Professional Verification</h3>
                                    <p>Provide your bar association details for account verification.</p>
                                </div>
                                <select
                                    value={barState}
                                    onChange={(e) => setBarState(e.target.value)}
                                    required
                                >
                                    <option value="">Select State Bar Association</option>
                                    {US_STATES.map((state) => (
                                        <option key={state.abbreviation} value={state.abbreviation}>
                                            {state.name}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    placeholder="Bar number"
                                    value={barNumber}
                                    onChange={(e) => setBarNumber(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        {selectedRole === 'legal-official' && (
                            <div className="role-specific-fields">
                                <div className="role-fields-header">
                                    <h3>Official Verification</h3>
                                    <p>Provide your government agency details for account verification.</p>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Government agency name"
                                    value={governmentAgency}
                                    onChange={(e) => setGovernmentAgency(e.target.value)}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Official ID number"
                                    value={officialId}
                                    onChange={(e) => setOfficialId(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        <label className="remember-me">
                            <input type="checkbox" />
                            I agree to the Terms of Service
                        </label>
                        <button type="submit" className="btn-form-primary">Create Account</button>
                    </form>
                )}
            </div>
        </div>
    );
}
