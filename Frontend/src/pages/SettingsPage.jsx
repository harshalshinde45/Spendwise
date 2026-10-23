import React, { useState, useEffect } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { formatMonthReadable, getPreviousMonthKey, getNextMonthKey } from '../utils/dates';
import { formatINR, paiseToInputValue } from '../utils/currency';
import { validateBudget } from '../utils/validation';
import {
  Sun,
  Moon,
  Wallet,
  ShieldCheck,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Check,
  Info,
  Database,
  UploadCloud,
  UserCheck,
  LogOut,
} from 'lucide-react';
import './SettingsPage.css';

export function SettingsPage() {
  const { user, logout } = useAuth();
  const {
    theme,
    setTheme,
    selectedMonth,
    setSelectedMonth,
    currentBudgetPaise,
    setMonthlyBudget,
    clearAllData,
    openConfirmDialog,
    dbState,
    localDataMigration,
    migrateLocalData,
    isMigrating,
  } = useExpense();

  // Local state for the Budget Preferences input
  const [budgetInput, setBudgetInput] = useState('');
  const [budgetError, setBudgetError] = useState('');
  const [isSavingBudget, setIsSavingBudget] = useState(false);

  // Sync budget input field when selected month or current budget changes
  useEffect(() => {
    setBudgetInput(paiseToInputValue(currentBudgetPaise));
    setBudgetError('');
  }, [selectedMonth, currentBudgetPaise]);

  const readableMonth = formatMonthReadable(selectedMonth);

  // Month navigation handlers
  const handlePrevMonth = () => {
    setSelectedMonth(getPreviousMonthKey(selectedMonth));
  };

  const handleNextMonth = () => {
    setSelectedMonth(getNextMonthKey(selectedMonth));
  };

  // Handle saving budget changes
  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (isSavingBudget) return;

    const validation = validateBudget(budgetInput);

    if (!validation.isValid) {
      setBudgetError(validation.error || 'Please enter a valid amount.');
      return;
    }

    setIsSavingBudget(true);
    try {
      await setMonthlyBudget(selectedMonth, validation.budgetPaise);
      setBudgetError('');
    } finally {
      setIsSavingBudget(false);
    }
  };

  // Handle clear all data with confirmation dialog
  const handleClearExpenseData = () => {
    openConfirmDialog({
      title: 'Clear All Expense Data',
      message:
        'Are you sure you want to delete all saved expenses and budgets? This action permanently removes saved expenses and budgets from your current browser storage. Your theme preference will be preserved.',
      confirmLabel: 'Clear Expense Data',
      isDanger: true,
      onConfirm: clearAllData,
    });
  };

  return (
    <div className="settings-page">
      <PageHeader
        title="Settings"
        subtitle="Manage your personal preferences, monthly budget, and stored data"
        showMonthSelector={false}
        showAddExpense={false}
      />

      <div className="settings-stack">
        {/* User Account & Session */}
        {user && (
          <section className="card settings-section-card" aria-labelledby="account-info-heading">
            <div className="section-card-header">
              <h2 id="account-info-heading" className="section-title">
                Account & Workspace
              </h2>
              <p className="section-description">
                Your private individual workspace. Financial records are isolated and protected.
              </p>
            </div>

            <div className="account-details-grid">
              <div className="account-detail-item">
                <span className="account-detail-label">Full Name</span>
                <span className="account-detail-value">{user.name}</span>
              </div>
              <div className="account-detail-item">
                <span className="account-detail-label">Email Address</span>
                <span className="account-detail-value">{user.email}</span>
              </div>
              <div className="account-detail-item">
                <span className="account-detail-label">Account Status</span>
                <span className="account-detail-value status-badge-active">
                  <UserCheck size={14} /> Active Individual Account
                </span>
              </div>
            </div>

            <div className="account-action-row">
              <button
                type="button"
                className="btn btn-secondary btn-logout"
                onClick={logout}
              >
                <LogOut size={16} />
                <span>Log Out of SpendWise</span>
              </button>
            </div>
          </section>
        )}

        {/* A. General Preferences */}
        <section className="card settings-section-card" aria-labelledby="general-pref-heading">
          <div className="section-card-header">
            <h2 id="general-pref-heading" className="section-title">
              General Preferences
            </h2>
            <p className="section-description">
              Customize the appearance of SpendWise. Your preference is saved locally.
            </p>
          </div>

          <div className="theme-options-grid" role="radiogroup" aria-label="Theme Selection">
            {/* Light Mode Option */}
            <button
              type="button"
              role="radio"
              aria-checked={theme === 'light'}
              className={`theme-option-card ${theme === 'light' ? 'selected' : ''}`}
              onClick={() => setTheme('light')}
            >
              <div className="theme-option-top">
                <div className="theme-icon-box light-icon">
                  <Sun size={20} />
                </div>
                {theme === 'light' && (
                  <span className="theme-active-indicator" aria-label="Active theme">
                    <Check size={14} /> Active
                  </span>
                )}
              </div>
              <div className="theme-option-info">
                <span className="theme-name">Light Mode</span>
                <span className="theme-desc">
                  Clean warm-neutral surfaces for bright environments.
                </span>
              </div>
            </button>

            {/* Dark Mode Option */}
            <button
              type="button"
              role="radio"
              aria-checked={theme === 'dark'}
              className={`theme-option-card ${theme === 'dark' ? 'selected' : ''}`}
              onClick={() => setTheme('dark')}
            >
              <div className="theme-option-top">
                <div className="theme-icon-box dark-icon">
                  <Moon size={20} />
                </div>
                {theme === 'dark' && (
                  <span className="theme-active-indicator" aria-label="Active theme">
                    <Check size={14} /> Active
                  </span>
                )}
              </div>
              <div className="theme-option-info">
                <span className="theme-name">Dark Mode</span>
                <span className="theme-desc">
                  Muted dark charcoal surfaces for reduced eye strain in low light.
                </span>
              </div>
            </button>
          </div>
        </section>

        {/* B. Budget Preferences */}
        <section className="card settings-section-card" aria-labelledby="budget-pref-heading">
          <div className="section-card-header">
            <div className="header-flex-between">
              <div>
                <h2 id="budget-pref-heading" className="section-title">
                  Budget Preferences
                </h2>
                <p className="section-description">
                  Set or adjust your spending limit for any month. Changes update your dashboard immediately.
                </p>
              </div>

              {/* Month selector navigation */}
              <div className="budget-month-nav" aria-label="Select Month for Budget">
                <button
                  type="button"
                  className="month-nav-btn"
                  onClick={handlePrevMonth}
                  aria-label="Previous month"
                  title="Previous month"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="budget-month-display">{readableMonth}</span>
                <button
                  type="button"
                  className="month-nav-btn"
                  onClick={handleNextMonth}
                  aria-label="Next month"
                  title="Next month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="budget-current-summary">
            <div className="budget-summary-box">
              <span className="budget-summary-label">Target Month:</span>
              <span className="budget-summary-value">{readableMonth}</span>
            </div>
            <div className="budget-summary-box">
              <span className="budget-summary-label">Current Budget:</span>
              <span className="budget-summary-value highlight">
                {currentBudgetPaise > 0 ? formatINR(currentBudgetPaise) : 'Not Set'}
              </span>
            </div>
          </div>

          <form onSubmit={handleSaveBudget} className="budget-settings-form" noValidate>
            <div className="form-group">
              <label htmlFor="budget-amount-input" className="form-label">
                Monthly Spending Limit
                <span className="form-label-hint">Leave blank or enter 0 to remove limit</span>
              </label>
              <div className="amount-input-wrapper">
                <span className="currency-prefix" aria-hidden="true">₹</span>
                <input
                  id="budget-amount-input"
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g. 10000"
                  value={budgetInput}
                  onChange={(e) => {
                    setBudgetInput(e.target.value);
                    if (budgetError) setBudgetError('');
                  }}
                  className={`form-input amount-input ${budgetError ? 'has-error' : ''}`}
                  aria-invalid={Boolean(budgetError)}
                  aria-describedby={budgetError ? 'settings-budget-error' : undefined}
                />
              </div>
              {budgetError && (
                <p id="settings-budget-error" className="form-error">
                  <AlertCircle size={14} /> {budgetError}
                </p>
              )}
            </div>

            <div className="budget-form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSavingBudget}
              >
                {isSavingBudget ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </section>

        {/* C. Privacy & Data */}
        <section className="card settings-section-card" aria-labelledby="privacy-data-heading">
          <div className="section-card-header">
            <h2 id="privacy-data-heading" className="section-title">
              Privacy & Data
            </h2>
            <p className="privacy-explanation-text">
              Your expenses and budgets are stored in your configured MongoDB database. SpendWise does not require an account or track your financial activity.
            </p>
          </div>

          {/* Database Connectivity Status */}
          <div className="db-connection-status-row">
            <div className="status-indicator-group">
              <Database
                size={18}
                color={dbState.isOperational ? 'var(--status-success)' : 'var(--status-warning)'}
              />
              <div>
                <span className="status-label">Database Storage Status</span>
                <span className={`status-badge-text ${dbState.isOperational ? 'connected' : 'disconnected'}`}>
                  {dbState.isOperational ? 'Connected to MongoDB' : 'Disconnected (Check backend/.env)'}
                </span>
              </div>
            </div>
          </div>

          {/* Local Storage Migration Card if previous data detected */}
          {localDataMigration && (
            <div className="migration-card-box">
              <div className="migration-box-info">
                <UploadCloud size={20} color="var(--accent-primary)" />
                <div>
                  <strong>Local Storage Records Detected</strong>
                  <p>
                    Found {localDataMigration.expensesCount} expenses and {localDataMigration.budgetsCount} budgets in browser storage.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={migrateLocalData}
                disabled={isMigrating || !dbState.isOperational}
              >
                {isMigrating ? 'Migrating...' : 'Migrate to MongoDB'}
              </button>
            </div>
          )}

          <div className="danger-action-row">
            <div className="danger-action-info">
              <span className="danger-action-title">Clear All Expense Data</span>
              <span className="danger-action-desc">
                Permanently removes all saved expenses and monthly budgets from your MongoDB database.
              </span>
            </div>
            <button
              type="button"
              className="btn btn-danger-outline"
              onClick={handleClearExpenseData}
            >
              <Trash2 size={16} />
              <span>Clear All Expense Data</span>
            </button>
          </div>
        </section>

        {/* D. About SpendWise */}
        <section className="about-section" aria-labelledby="about-spendwise-heading">
          <h2 id="about-spendwise-heading" className="about-title">
            About SpendWise
          </h2>
          <div className="about-content">
            <div className="about-meta-line">
              <span className="about-app-name">SpendWise</span>
              <span className="about-version">Version 1.0 (Full-Stack)</span>
            </div>
            <p className="about-desc">
              A full-stack personal expense tracker built with React, Node.js, Express, and MongoDB.
            </p>
            <p className="about-note">
              Financial records are managed through a dedicated REST API with Mongoose schemas and integer minor units (paise).
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
