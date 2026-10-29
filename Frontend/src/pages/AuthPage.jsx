import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Sun,
  TrendingUp,
  Sparkles,
  Info,
  X,
  Zap,
} from 'lucide-react';
import './AuthPage.css';

export function AuthPage({ initialMode = 'login' }) {
  const { login, register } = useAuth();

  const [mode, setMode] = useState(initialMode); // 'login' | 'register'

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  // Dynamic Password Strength Meter
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[0-9]/.test(password) && /[a-zA-Z]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    if (score <= 1) {
      return { score: 1, label: 'Weak', color: '#B53F3F' };
    }
    if (score === 2 || score === 3) {
      return { score: 2, label: 'Good', color: '#C49A58' };
    }
    return { score: 3, label: 'Strong', color: '#72866A' };
  }, [password]);

  // Real-time Match Validation
  const passwordsMatch = useMemo(() => {
    if (!confirmPassword) return null;
    return password === confirmPassword;
  }, [password, confirmPassword]);

  // Switch between Login and Register
  const handleSwitchMode = (newMode) => {
    setMode(newMode);
    setErrorMessage('');
  };

  // Quick fill helper for testing/demo
  const handleQuickDemoFill = () => {
    if (mode === 'login') {
      setEmail('demo@spendwise.app');
      setPassword('SpendWise2026!');
    } else {
      setName('Demo User');
      setEmail('demo' + Math.floor(Math.random() * 900 + 100) + '@spendwise.app');
      setPassword('SpendWise2026!');
      setConfirmPassword('SpendWise2026!');
    }
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    if (mode === 'register') {
      const cleanName = name.trim();
      if (!cleanName || cleanName.length < 2) {
        setErrorMessage('Please enter your full name (at least 2 characters).');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please verify both password fields.');
        return;
      }

      setIsSubmitting(true);
      try {
        await register({ name: cleanName, email: cleanEmail, password });
      } catch (err) {
        setErrorMessage(
          err.message || 'Registration failed. An account with this email may already exist.'
        );
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Login mode
      setIsSubmitting(true);
      try {
        await login({ email: cleanEmail, password });
      } catch (err) {
        setErrorMessage(
          err.message || 'Invalid email or password. Please verify your credentials and try again.'
        );
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="auth-root-wrapper">
      {/* Dynamic Ambient Background Elements */}
      <div className="ambient-blob blob-1" aria-hidden="true" />
      <div className="ambient-blob blob-2" aria-hidden="true" />

      <div className="auth-content-container">
        {/* LEFT COLUMN: Dynamic Financial Showcase & Intelligence Preview */}
        <aside className="auth-showcase-panel" aria-label="SpendWise Features">
          {/* Brand Row */}
          <div className="showcase-brand-row">
            <div className="brand-logo-mark" aria-hidden="true">
              <svg
                viewBox="0 0 28 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="brand-svg"
              >
                <rect x="2" y="2" width="24" height="24" rx="7" fill="var(--accent-primary)" />
                <path
                  d="M14 6V22M14 6C17.5 6 20.5 8.5 20.5 11.5C20.5 14.5 16 15.5 14 16C12 16.5 7.5 17.5 7.5 20.5"
                  stroke="#FFFFFF"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="14" cy="14" r="1.8" fill="#FFFFFF" />
              </svg>
            </div>
            <div>
              <span className="showcase-brand-name">SpendWise</span>
              <span className="showcase-brand-tag">Intelligent Finance</span>
            </div>
          </div>

          {/* Editorial Headline */}
          <div className="showcase-hero-text">
            <h1 className="showcase-title">
              Personal finance, calibrated with intelligence.
            </h1>
            <p className="showcase-subtitle">
              A private, distraction-free money command center. Every rupee is tracked,
              every budget is guarded, and your records belong exclusively to you.
            </p>
          </div>

          {/* Dynamic Interactive Micro-Widgets */}
          <div className="showcase-widgets-stack">
            {/* Widget 1: Financial Weather */}
            <div className="dynamic-micro-card weather-card">
              <div className="micro-card-header">
                <div className="micro-card-icon-box sunny">
                  <Sun size={18} />
                </div>
                <div className="micro-card-titles">
                  <span className="micro-badge sunny-badge">Radiant Sunny</span>
                  <span className="micro-title">Financial Weather: Optimal</span>
                </div>
                <span className="micro-metric-highlight">78% Safe</span>
              </div>
              <div className="micro-progress-track">
                <div className="micro-progress-fill weather-fill" style={{ width: '78%' }} />
              </div>
              <div className="micro-card-subtext">
                <span>Monthly Budget: ₹60,000</span>
                <span>₹13,200 Spent</span>
              </div>
            </div>

            {/* Widget 2: Speedometer & Category Detective */}
            <div className="dynamic-micro-card velocity-card">
              <div className="micro-card-header">
                <div className="micro-card-icon-box velocity">
                  <TrendingUp size={18} />
                </div>
                <div className="micro-card-titles">
                  <span className="micro-badge velocity-badge">Cruise Velocity</span>
                  <span className="micro-title">Spending Speedometer</span>
                </div>
                <span className="micro-metric-highlight">₹1,420 / day</span>
              </div>
              <div className="micro-chips-row">
                <span className="micro-chip">☕ Food & Dining (24%)</span>
                <span className="micro-chip">🏠 Housing & Bills (48%)</span>
                <span className="micro-chip">🚗 Transport (12%)</span>
              </div>
            </div>

            {/* Widget 3: Privacy & Zero-Admin Security */}
            <div className="dynamic-micro-card privacy-card">
              <div className="privacy-card-inner">
                <ShieldCheck size={20} className="privacy-shield-icon" />
                <div className="privacy-text-group">
                  <span className="privacy-heading">Zero Admin Hierarchy</span>
                  <span className="privacy-desc">
                    No super-admins or cross-user access. Your transactions, budgets, and savings
                    goals are isolated in a private, encrypted account vault.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Philosophy */}
          <div className="showcase-footer-note">
            <span className="live-dot" aria-hidden="true" />
            <span>End-to-end multi-tenant account isolation. Private & secure.</span>
          </div>
        </aside>

        {/* RIGHT COLUMN: Modern Auth Card */}
        <main className="auth-card-container">
          <div className="auth-card">
            {/* Mobile Brand Bar (Visible only on small screens) */}
            <div className="auth-mobile-header">
              <div className="brand-logo-mark" aria-hidden="true">
                <svg
                  viewBox="0 0 28 28"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="brand-svg"
                >
                  <rect x="2" y="2" width="24" height="24" rx="7" fill="var(--accent-primary)" />
                  <path
                    d="M14 6V22M14 6C17.5 6 20.5 8.5 20.5 11.5C20.5 14.5 16 15.5 14 16C12 16.5 7.5 17.5 7.5 20.5"
                    stroke="#FFFFFF"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="14" cy="14" r="1.8" fill="#FFFFFF" />
                </svg>
              </div>
              <span className="mobile-brand-title">SpendWise</span>
            </div>

            {/* Animated Tab Switcher */}
            <div className="auth-tab-bar" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'login'}
                className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
                onClick={() => handleSwitchMode('login')}
              >
                Sign In
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'register'}
                className={`auth-tab-btn ${mode === 'register' ? 'active' : ''}`}
                onClick={() => handleSwitchMode('register')}
              >
                Create Account
              </button>
            </div>

            {/* Header Titles */}
            <div className="auth-card-title-group">
              <h2 className="auth-card-heading">
                {mode === 'login' ? 'Welcome Back' : 'Create Individual Account'}
              </h2>
              <p className="auth-card-subheading">
                {mode === 'login'
                  ? 'Enter your credentials to access your financial workspace.'
                  : 'Get started with your private expense and budget workspace.'}
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="auth-error-banner" role="alert" aria-live="assertive">
                <AlertCircle size={18} className="auth-error-icon" />
                <span className="auth-error-message">{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form className="auth-active-form" onSubmit={handleSubmit} noValidate>
              {/* Full Name (Registration only) */}
              {mode === 'register' && (
                <div className="auth-input-group">
                  <label htmlFor="auth-name" className="auth-field-label">
                    Full Name
                  </label>
                  <div className="auth-input-relative">
                    <User size={18} className="auth-field-icon" aria-hidden="true" />
                    <input
                      id="auth-name"
                      type="text"
                      className="auth-text-input"
                      placeholder="e.g. Maya Patel"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errorMessage) setErrorMessage('');
                      }}
                      autoComplete="name"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div className="auth-input-group">
                <label htmlFor="auth-email" className="auth-field-label">
                  Email Address
                </label>
                <div className="auth-input-relative">
                  <Mail size={18} className="auth-field-icon" aria-hidden="true" />
                  <input
                    id="auth-email"
                    type="email"
                    className="auth-text-input"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    autoComplete="email"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="auth-input-group">
                <div className="auth-field-label-row">
                  <label htmlFor="auth-password" className="auth-field-label">
                    Password
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      className="auth-ghost-link"
                      onClick={() => setShowForgotPasswordModal(true)}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="auth-input-relative">
                  <Lock size={18} className="auth-field-icon" aria-hidden="true" />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    className="auth-text-input has-toggle"
                    placeholder={mode === 'register' ? 'At least 6 characters' : 'Enter your password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    disabled={isSubmitting}
                    required
                  />
                  <button
                    type="button"
                    className="auth-eye-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Password Strength Meter (Registration only) */}
                {mode === 'register' && password.length > 0 && (
                  <div className="auth-strength-box">
                    <div className="strength-bar-track">
                      <div
                        className={`strength-bar-tick ${passwordStrength.score >= 1 ? 'active' : ''}`}
                        style={{ backgroundColor: passwordStrength.score >= 1 ? passwordStrength.color : undefined }}
                      />
                      <div
                        className={`strength-bar-tick ${passwordStrength.score >= 2 ? 'active' : ''}`}
                        style={{ backgroundColor: passwordStrength.score >= 2 ? passwordStrength.color : undefined }}
                      />
                      <div
                        className={`strength-bar-tick ${passwordStrength.score >= 3 ? 'active' : ''}`}
                        style={{ backgroundColor: passwordStrength.score >= 3 ? passwordStrength.color : undefined }}
                      />
                    </div>
                    <span className="strength-text-tag" style={{ color: passwordStrength.color }}>
                      Strength: {passwordStrength.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password (Registration only) */}
              {mode === 'register' && (
                <div className="auth-input-group">
                  <label htmlFor="auth-confirm-password" className="auth-field-label">
                    Confirm Password
                  </label>
                  <div className="auth-input-relative">
                    <Lock size={18} className="auth-field-icon" aria-hidden="true" />
                    <input
                      id="auth-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="auth-text-input has-toggle"
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errorMessage) setErrorMessage('');
                      }}
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      required
                    />
                    <button
                      type="button"
                      className="auth-eye-toggle"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {confirmPassword.length > 0 && (
                    <div className={`match-badge ${passwordsMatch ? 'matched' : 'mismatched'}`}>
                      {passwordsMatch ? (
                        <>
                          <CheckCircle2 size={13} />
                          <span>Passwords match</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={13} />
                          <span>Passwords do not match</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary auth-action-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="auth-btn-spinner" aria-hidden="true" />
                    <span>{mode === 'login' ? 'Signing in...' : 'Creating account...'}</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Sign In to SpendWise' : 'Create Account'}</span>
                    <ArrowRight size={18} className="auth-arrow-icon" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Helper Button */}
            <div className="auth-demo-shortcut-row">
              <button
                type="button"
                className="auth-demo-pill"
                onClick={handleQuickDemoFill}
                title="Fill sample inputs for quick review"
              >
                <Zap size={14} />
                <span>Fill sample inputs</span>
              </button>
            </div>

            {/* Switch Mode Prompt */}
            <div className="auth-card-footer-switch">
              {mode === 'login' ? (
                <p>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    className="auth-inline-switch-btn"
                    onClick={() => handleSwitchMode('register')}
                  >
                    Create an account
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="auth-inline-switch-btn"
                    onClick={() => handleSwitchMode('login')}
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>

            {/* Privacy Footnote */}
            <div className="auth-card-micro-footnote">
              <span className="micro-dot-green" aria-hidden="true" />
              <span>Independent financial workspace. No admin monitoring or shared data.</span>
            </div>
          </div>
        </main>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="modal-backdrop" onClick={() => setShowForgotPasswordModal(false)}>
          <div
            className="modal-content auth-dialog-box"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-password-modal-title"
          >
            <div className="modal-header">
              <div className="modal-title-wrap">
                <Info size={20} className="modal-title-icon" />
                <h3 id="forgot-password-modal-title">Password Recovery</h3>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowForgotPasswordModal(false)}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body auth-dialog-body">
              <p>
                SpendWise secures all user passwords with one-way salted bcrypt encryption.
                Passwords can never be read or retrieved in plaintext.
              </p>
              <p>
                If you forgot your password, please contact support with your registered email
                address (<strong>{email || 'your account email'}</strong>).
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowForgotPasswordModal(false)}
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
