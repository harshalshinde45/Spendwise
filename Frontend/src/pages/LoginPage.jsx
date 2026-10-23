import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Info, X } from 'lucide-react';
import './LoginPage.css';

export function LoginPage({ onNavigateToRegister }) {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: cleanEmail, password });
    } catch (err) {
      setErrorMessage(
        err.message || 'Unable to log in. Please check your credentials and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
            Welcome back. Log in to your personal financial workspace.
          </p>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="auth-alert error" role="alert" aria-live="assertive">
            <AlertCircle size={18} className="auth-alert-icon" />
            <div className="auth-alert-text">{errorMessage}</div>
          </div>
        )}

        {/* Login Form */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Email Field */}
          <div className="auth-field-group">
            <label htmlFor="login-email" className="auth-label">
              Email Address
            </label>
            <div className="auth-input-wrapper">
              <Mail size={18} className="auth-input-icon" aria-hidden="true" />
              <input
                id="login-email"
                type="email"
                className="auth-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                autoComplete="email"
                autoFocus
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="auth-field-group">
            <div className="auth-label-row">
              <label htmlFor="login-password" className="auth-label">
                Password
              </label>
              <button
                type="button"
                className="auth-text-link"
                onClick={() => setShowForgotPasswordModal(true)}
              >
                Forgot password?
              </button>
            </div>
            <div className="auth-input-wrapper">
              <Lock size={18} className="auth-input-icon" aria-hidden="true" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="auth-input with-toggle"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                autoComplete="current-password"
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
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={isSubmitting || !email.trim() || !password}
          >
            {isSubmitting ? (
              <>
                <span className="auth-spinner" aria-hidden="true" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Log In</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer Navigation */}
        <div className="auth-card-footer">
          <p className="auth-footer-text">
            Don't have an account?{' '}
            <button
              type="button"
              className="auth-switch-link"
              onClick={onNavigateToRegister}
            >
              Create an account
            </button>
          </p>
        </div>

        {/* Security & Isolation Footnote */}
        <div className="auth-security-notice">
          <span className="security-dot online" aria-hidden="true" />
          <span>Strict multi-user data isolation. Your expenses and budgets remain private.</span>
        </div>
      </div>

      {/* Forgot Password Informational Modal */}
      {showForgotPasswordModal && (
        <div className="modal-backdrop" onClick={() => setShowForgotPasswordModal(false)}>
          <div
            className="modal-content auth-modal-box"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-pwd-title"
          >
            <div className="modal-header">
              <div className="modal-title-wrap">
                <Info size={20} className="modal-title-icon" />
                <h3 id="forgot-pwd-title">Password Recovery</h3>
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
            <div className="modal-body auth-modal-body">
              <p>
                To reset your password, please contact your workspace administrator or support
                with your registered email address (<strong>{email || 'your account email'}</strong>).
              </p>
              <p className="subtle-note">
                SpendWise strictly secures user credentials using salted bcrypt hashing.
                Passwords cannot be retrieved in plaintext.
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
