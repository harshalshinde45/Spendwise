import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import './RegisterPage.css';

export function RegisterPage({ onNavigateToLogin }) {
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[0-9]/.test(password) && /[a-zA-Z]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    if (score <= 1) {
      return { score: 1, label: 'Weak', color: 'var(--status-danger)' };
    }
    if (score === 2 || score === 3) {
      return { score: 2, label: 'Good', color: 'var(--status-warning)' };
    }
    return { score: 3, label: 'Strong', color: 'var(--status-success)' };
  }, [password]);

  const passwordsMatch = useMemo(() => {
    if (!confirmPassword) return null;
    return password === confirmPassword;
  }, [password, confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName || cleanName.length < 2) {
      setErrorMessage('Please enter your full name (minimum 2 characters).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please ensure both fields match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        name: cleanName,
        email: cleanEmail,
        password,
      });
    } catch (err) {
      setErrorMessage(
        err.message || 'Unable to register account. Please check your information and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    name.trim().length >= 2 &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    password === confirmPassword;

  return (
    <div className="auth-page-container">
      <div className="auth-card-wrapper">
        {/* Brand Header */}
        <div className="auth-brand-header">
          <div className="auth-brand-logo" aria-hidden="true">
            <svg
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="auth-brand-svg"
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
          <h1 className="auth-brand-title">SpendWise</h1>
          <p className="auth-brand-subtitle">
            Create your individual account to begin managing your finances.
          </p>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="auth-alert error" role="alert" aria-live="assertive">
            <AlertCircle size={18} className="auth-alert-icon" />
            <div className="auth-alert-text">{errorMessage}</div>
          </div>
        )}

        {/* Registration Form */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Full Name Field */}
          <div className="auth-field-group">
            <label htmlFor="register-name" className="auth-label">
              Full Name
            </label>
            <div className="auth-input-wrapper">
              <User size={18} className="auth-input-icon" aria-hidden="true" />
              <input
                id="register-name"
                type="text"
                className="auth-input"
                placeholder="e.g. Maya Patel"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                autoComplete="name"
                autoFocus
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          {/* Email Address Field */}
          <div className="auth-field-group">
            <label htmlFor="register-email" className="auth-label">
              Email Address
            </label>
            <div className="auth-input-wrapper">
              <Mail size={18} className="auth-input-icon" aria-hidden="true" />
              <input
                id="register-email"
                type="email"
                className="auth-input"
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

          {/* Password Field */}
          <div className="auth-field-group">
            <label htmlFor="register-password" className="auth-label">
              Password
            </label>
            <div className="auth-input-wrapper">
              <Lock size={18} className="auth-input-icon" aria-hidden="true" />
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                className="auth-input with-toggle"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                autoComplete="new-password"
                disabled={isSubmitting}
                required
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <div className="password-strength-wrap">
                <div className="password-strength-bars">
                  <div
                    className={`strength-bar ${passwordStrength.score >= 1 ? 'filled' : ''}`}
                    style={{ backgroundColor: passwordStrength.score >= 1 ? passwordStrength.color : undefined }}
                  />
                  <div
                    className={`strength-bar ${passwordStrength.score >= 2 ? 'filled' : ''}`}
                    style={{ backgroundColor: passwordStrength.score >= 2 ? passwordStrength.color : undefined }}
                  />
                  <div
                    className={`strength-bar ${passwordStrength.score >= 3 ? 'filled' : ''}`}
                    style={{ backgroundColor: passwordStrength.score >= 3 ? passwordStrength.color : undefined }}
                  />
                </div>
                <span className="strength-label" style={{ color: passwordStrength.color }}>
                  Strength: {passwordStrength.label}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="auth-field-group">
            <label htmlFor="register-confirm-password" className="auth-label">
              Confirm Password
            </label>
            <div className="auth-input-wrapper">
              <Lock size={18} className="auth-input-icon" aria-hidden="true" />
              <input
                id="register-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                className="auth-input with-toggle"
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
                className="auth-password-toggle"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Match Indicator */}
            {confirmPassword.length > 0 && (
              <div className={`password-match-indicator ${passwordsMatch ? 'matched' : 'mismatched'}`}>
                {passwordsMatch ? (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Passwords match</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={14} />
                    <span>Passwords do not match</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={isSubmitting || !isFormValid}
          >
            {isSubmitting ? (
              <>
                <span className="auth-spinner" aria-hidden="true" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer Navigation */}
        <div className="auth-card-footer">
          <p className="auth-footer-text">
            Already have an account?{' '}
            <button
              type="button"
              className="auth-switch-link"
              onClick={onNavigateToLogin}
            >
              Sign in
            </button>
          </p>
        </div>

        {/* Security & Isolation Footnote */}
        <div className="auth-security-notice">
          <span className="security-dot online" aria-hidden="true" />
          <span>Independent financial workspace. No admin access or cross-user visibility.</span>
        </div>
      </div>
    </div>
  );
}
