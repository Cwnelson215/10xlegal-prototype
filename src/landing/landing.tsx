import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, type UserRole } from '../context/AuthContext';
import './landing.css';

export function Landing() {
    const navigate = useNavigate();
    const { register, login } = useAuth();
    const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState<UserRole>('client');
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [registerName, setRegisterName] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState('');

    const handleDashboardClick = () => {
        navigate('/dashboard');
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (loginEmail && loginPassword && selectedRole) {
            login(loginEmail, loginPassword, selectedRole);
            setShowAuthModal(false);
            navigate('/dashboard');
        }
    };

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        if (registerName && registerEmail && registerPassword && registerPassword === registerPasswordConfirm && selectedRole) {
            register(registerName, registerEmail, registerPassword, selectedRole);
            setShowAuthModal(false);
            navigate('/dashboard');
        }
    };
    
    const features = [
        {
            icon: '📋',
            title: 'Case Management',
            description: 'Organize and track all your legal cases in one centralized platform'
        },
        {
            icon: '📄',
            title: 'Document Control',
            description: 'Securely manage, version, and collaborate on legal documents'
        },
        {
            icon: '⏰',
            title: 'Deadline Tracking',
            description: 'Never miss important dates with automated reminders and timelines'
        },
        {
            icon: '👥',
            title: 'Team Collaboration',
            description: 'Work seamlessly with your team on cases and documents'
        },
        {
            icon: '🔒',
            title: 'Security & Compliance',
            description: 'Enterprise-grade security with full compliance certifications'
        },
        {
            icon: '📊',
            title: 'Analytics & Reporting',
            description: 'Gain insights into your practice with detailed analytics'
        },
    ];

    const faqs = [
        {
            question: 'Is my data secure?',
            answer: 'Yes, we use enterprise-grade encryption and comply with all legal industry standards for data protection and privacy.'
        },
        {
            question: 'Can I integrate with other tools?',
            answer: 'Absolutely. 10x Legal integrates with popular legal software, document management systems, and communication tools.'
        },
        {
            question: 'What is the pricing?',
            answer: 'We offer flexible pricing plans starting at $99/month for solo practitioners, with custom enterprise solutions available.'
        },
        {
            question: 'Do you offer customer support?',
            answer: 'Yes, all plans include 24/7 customer support via email, chat, and phone with dedicated account managers for enterprise customers.'
        },
    ];

    return (
        <div className="landing-container">
            {/* Navigation */}
            <nav className="landing-nav">
                <div className="nav-wrapper">
                    <div className="nav-logo">
                        <span className="nav-logo-icon">⚖️</span>
                        <span className="nav-logo-text">10x Legal</span>
                    </div>
                    <div className="nav-actions">
                        <button 
                            className="nav-link-btn"
                            onClick={() => {
                                setShowAuthModal(true);
                                setActiveTab('login');
                            }}
                        >
                            Sign In
                        </button>
                        <button 
                            className="nav-btn-primary"
                            onClick={() => {
                                setShowAuthModal(true);
                                setActiveTab('register');
                            }}
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">Legal Practice Management Made Simple</h1>
                    <p className="hero-subtitle">Streamline your legal practice with 10x Legal. Manage cases, documents, deadlines, and your team all in one place.</p>
                    <div className="hero-actions">
                        <button 
                            className="btn-primary-large"
                            onClick={() => {
                                setShowAuthModal(true);
                                setActiveTab('register');
                            }}
                        >
                            Start Free Trial
                        </button>
                        <button 
                            className="btn-secondary-large"
                            onClick={handleDashboardClick}
                        >
                            View Demo →
                        </button>
                    </div>
                    <p className="hero-trust-text">✓ No credit card required • 14-day free trial • Enterprise-grade security</p>
                </div>
                <div className="hero-image">
                    <div className="hero-placeholder">📊 Dashboard Preview</div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="section-wrapper">
                    <h2>Why Choose 10x Legal?</h2>
                    <div className="features-grid">
                        {features.map((feature, index) => (
                            <div key={index} className="feature-card">
                                <div className="feature-icon">{feature.icon}</div>
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="pricing-section">
                <div className="section-wrapper">
                    <h2>Simple, Transparent Pricing</h2>
                    <div className="pricing-grid">
                        <div className="pricing-card">
                            <h3>Solo</h3>
                            <div className="price">$99<span>/month</span></div>
                            <p className="pricing-desc">Perfect for solo practitioners</p>
                            <ul className="pricing-features">
                                <li>✓ Up to 50 cases</li>
                                <li>✓ 10 GB storage</li>
                                <li>✓ Basic reporting</li>
                                <li>✓ Email support</li>
                            </ul>
                            <button className="pricing-btn">Get Started</button>
                        </div>

                        <div className="pricing-card featured">
                            <div className="featured-badge">Most Popular</div>
                            <h3>Team</h3>
                            <div className="price">$299<span>/month</span></div>
                            <p className="pricing-desc">For growing legal teams</p>
                            <ul className="pricing-features">
                                <li>✓ Unlimited cases</li>
                                <li>✓ 100 GB storage</li>
                                <li>✓ Advanced analytics</li>
                                <li>✓ Up to 5 team members</li>
                                <li>✓ Priority support</li>
                            </ul>
                            <button className="pricing-btn-primary">Get Started</button>
                        </div>

                        <div className="pricing-card">
                            <h3>Enterprise</h3>
                            <div className="price">Custom</div>
                            <p className="pricing-desc">For large organizations</p>
                            <ul className="pricing-features">
                                <li>✓ Everything in Team</li>
                                <li>✓ Unlimited storage</li>
                                <li>✓ Unlimited team members</li>
                                <li>✓ Custom integrations</li>
                                <li>✓ Dedicated support</li>
                            </ul>
                            <button className="pricing-btn">Contact Sales</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="faq-section">
                <div className="section-wrapper">
                    <h2>Frequently Asked Questions</h2>
                    <div className="faq-grid">
                        {faqs.map((faq, index) => (
                            <div key={index} className="faq-item">
                                <h3>{faq.question}</h3>
                                <p>{faq.answer}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="cta-content">
                    <h2>Ready to transform your legal practice?</h2>
                    <p>Join hundreds of law firms using 10x Legal to manage their practice more efficiently.</p>
                    <button 
                        className="btn-primary-large"
                        onClick={() => {
                            setShowAuthModal(true);
                            setActiveTab('register');
                        }}
                    >
                        Start Your Free Trial Today
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-column">
                        <h4>10x Legal</h4>
                        <p>Empowering law firms with modern practice management tools.</p>
                    </div>
                    <div className="footer-column">
                        <h4>Product</h4>
                        <a href="#features">Features</a>
                        <a href="#pricing">Pricing</a>
                        <a href="#security">Security</a>
                    </div>
                    <div className="footer-column">
                        <h4>Company</h4>
                        <a href="#about">About Us</a>
                        <a href="#blog">Blog</a>
                        <a href="#contact">Contact</a>
                    </div>
                    <div className="footer-column">
                        <h4>Legal</h4>
                        <a href="#privacy">Privacy Policy</a>
                        <a href="#terms">Terms of Service</a>
                        <a href="#cookies">Cookie Policy</a>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2024 10x Legal. All rights reserved.</p>
                </div>
            </footer>

            {/* Auth Modal */}
            {showAuthModal && (
                <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowAuthModal(false)}>✕</button>
                        
                        <div className="modal-tabs">
                            <button 
                                className={`modal-tab ${activeTab === 'login' ? 'active' : ''}`}
                                onClick={() => setActiveTab('login')}
                            >
                                Sign In
                            </button>
                            <button 
                                className={`modal-tab ${activeTab === 'register' ? 'active' : ''}`}
                                onClick={() => setActiveTab('register')}
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
                                    onClick={() => setSelectedRole('client')}
                                >
                                    <span className="role-icon">👤</span>
                                    <span className="role-label">Client</span>
                                </button>
                                <button
                                    type="button"
                                    className={`role-btn ${selectedRole === 'lawyer' ? 'selected' : ''}`}
                                    onClick={() => setSelectedRole('lawyer')}
                                >
                                    <span className="role-icon">⚖️</span>
                                    <span className="role-label">Lawyer</span>
                                </button>
                                <button
                                    type="button"
                                    className={`role-btn ${selectedRole === 'legal-official' ? 'selected' : ''}`}
                                    onClick={() => setSelectedRole('legal-official')}
                                >
                                    <span className="role-icon">👨‍⚖️</span>
                                    <span className="role-label">Legal Official</span>
                                </button>
                            </div>
                        </div>

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
                                <p className="auth-link">Don't have an account? <a href="#">Create one</a></p>
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
                                <label className="remember-me">
                                    <input type="checkbox" />
                                    I agree to the Terms of Service
                                </label>
                                <button type="submit" className="btn-form-primary">Create Account</button>
                                <p className="auth-link">Already have an account? <a href="#">Sign in</a></p>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
