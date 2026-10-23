import React, { useState, useEffect } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { formatINR } from '../utils/currency';
import { formatMonthReadable } from '../utils/dates';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Lightbulb,
  Calendar,
  X,
  Wallet,
  ArrowUpRight,
} from 'lucide-react';
import './SmartBudgetAlert.css';

const STORAGE_KEY = 'spendwise:dismissed_budget_alert';

function getStoredDismissals() {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    }
  } catch (e) {
    console.warn('Error reading dismissed alerts from sessionStorage:', e);
  }
  return {};
}

export function SmartBudgetAlert() {
  const {
    smartBudgetAlert,
    selectedMonth,
    openBudgetModal,
  } = useExpense();

  const [dismissedMap, setDismissedMap] = useState(() => getStoredDismissals());

  // Listen for storage changes across tabs or window updates
  useEffect(() => {
    const handleStorage = () => {
      setDismissedMap(getStoredDismissals());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  if (!smartBudgetAlert) return null;

  const {
    alertLevel,
    shouldDisplay,
    budgetPaise,
    spentPaise,
    remainingPaise,
    remainingPercent,
    utilizationPercent,
    visualProgressPercent,
    isOverBudget,
    overspentPaise,
    daysRemaining,
    dailySuggestionPaise,
    title,
    message,
    badgeText,
    variant,
    tips,
  } = smartBudgetAlert;

  // If healthy or rule says not to display, hide alert
  if (!shouldDisplay) {
    return null;
  }

  // Check if current alert level has been dismissed for this month
  const isDismissed = dismissedMap[selectedMonth] === alertLevel;
  if (isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    const next = {
      ...dismissedMap,
      [selectedMonth]: alertLevel,
    };
    setDismissedMap(next);
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
    } catch (e) {
      console.warn('Error writing dismissed alert to sessionStorage:', e);
    }
  };

  const monthLabel = formatMonthReadable(selectedMonth);

  // Render UNSET state asking user to set a budget
  if (alertLevel === 'UNSET') {
    return (
      <div
        className="smart-budget-alert-card card alert-variant-neutral"
        role="region"
        aria-label="Budget Configuration Notice"
      >
        <div className="alert-header">
          <div className="alert-header-left">
            <div className="alert-icon-wrap icon-neutral">
              <Wallet size={18} aria-hidden="true" />
            </div>
            <div>
              <div className="alert-title-row">
                <h3 className="alert-card-title">{title}</h3>
                <span className="alert-badge badge-neutral">{badgeText}</span>
              </div>
              <p className="alert-card-subtitle">{message}</p>
            </div>
          </div>

          <div className="alert-header-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={openBudgetModal}
            >
              <Wallet size={14} />
              <span>Set Budget for {monthLabel}</span>
            </button>
            <button
              type="button"
              className="btn btn-subtle btn-sm dismiss-btn"
              onClick={handleDismiss}
              aria-label="Dismiss budget notice"
              title="Dismiss for now"
            >
              <X size={14} />
              <span>Dismiss</span>
            </button>
          </div>
        </div>

        {tips && tips.length > 0 && (
          <div className="alert-tips-section">
            <div className="tips-heading">
              <Lightbulb size={15} aria-hidden="true" />
              <span>Planning Advice</span>
            </div>
            <ul className="tips-list">
              {tips.map((tip, idx) => (
                <li key={idx} className="tip-item">
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Active Alert states: CAUTION, LOW_BUDGET, BUDGET_EXHAUSTED, OVER_BUDGET
  const isDanger = variant === 'danger';

  return (
    <div
      className={`smart-budget-alert-card card alert-variant-${variant}`}
      role="region"
      aria-label={`Smart Budget Alert: ${title}`}
    >
      {/* Alert Header */}
      <div className="alert-header">
        <div className="alert-header-left">
          <div className={`alert-icon-wrap icon-${variant}`}>
            {isDanger ? (
              <AlertCircle size={20} aria-hidden="true" />
            ) : (
              <AlertTriangle size={20} aria-hidden="true" />
            )}
          </div>
          <div>
            <div className="alert-title-row">
              <h3 className="alert-card-title">{title}</h3>
              <span className={`alert-badge badge-${variant}`}>{badgeText}</span>
            </div>
            <p className="alert-card-subtitle">{message}</p>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-subtle btn-sm dismiss-btn"
          onClick={handleDismiss}
          aria-label={`Dismiss ${title}`}
          title="Dismiss this alert"
        >
          <X size={14} />
          <span>Dismiss</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="alert-metrics-grid">
        <div className="alert-metric-item">
          <span className="metric-label">Monthly Budget</span>
          <span className="metric-value">{formatINR(budgetPaise)}</span>
        </div>

        <div className="alert-metric-item">
          <span className="metric-label">Total Spent</span>
          <span className="metric-value">{formatINR(spentPaise)}</span>
        </div>

        <div className="alert-metric-item">
          <span className="metric-label">
            {isOverBudget ? 'Overspent By' : 'Remaining Balance'}
          </span>
          <span
            className={`metric-value ${
              isOverBudget || alertLevel === 'BUDGET_EXHAUSTED'
                ? 'metric-danger'
                : 'metric-warning'
            }`}
          >
            {isOverBudget
              ? `+${formatINR(overspentPaise)}`
              : formatINR(remainingPaise)}
          </span>
        </div>

        <div className="alert-metric-item">
          <span className="metric-label">Remaining %</span>
          <span
            className={`metric-value ${
              remainingPercent <= 0 ? 'metric-danger' : 'metric-warning'
            }`}
          >
            {remainingPercent <= 0 ? '0%' : `${remainingPercent}%`}
          </span>
        </div>
      </div>

      {/* Visual Budget Progress Bar */}
      <div className="alert-progress-block">
        <div className="progress-info-row">
          <span className="progress-utilization-text">
            <strong>{utilizationPercent}%</strong> of monthly budget spent
          </span>
          <span className="progress-remaining-text">
            {isOverBudget
              ? `Exceeded by ${formatINR(overspentPaise)}`
              : `${formatINR(remainingPaise)} available`}
          </span>
        </div>

        <div
          className="alert-progress-track"
          role="progressbar"
          aria-valuenow={visualProgressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Budget utilization: ${utilizationPercent}%`}
        >
          <div
            className={`alert-progress-bar fill-${variant}`}
            style={{ width: `${visualProgressPercent}%` }}
          />
        </div>
      </div>

      {/* Daily Spending Limit Suggestion (if remaining balance > 0 and days remaining > 0) */}
      {dailySuggestionPaise > 0 && daysRemaining > 0 && (
        <div className="alert-daily-suggestion" role="status">
          <div className="suggestion-badge">
            <Calendar size={14} aria-hidden="true" />
            <span>
              Suggested daily spending limit:{' '}
              <strong>{formatINR(dailySuggestionPaise)}</strong> / day
            </span>
          </div>
          <span className="suggestion-helper">
            Based on {daysRemaining} day{daysRemaining > 1 ? 's' : ''} left in{' '}
            {monthLabel}. (Target limit to pace spending, not a guaranteed balance.)
          </span>
        </div>
      )}

      {/* Practical Spending Tips Section */}
      {tips && tips.length > 0 && (
        <div className="alert-tips-section">
          <div className="tips-heading">
            <Lightbulb size={15} aria-hidden="true" />
            <span>Practical Spending Tips</span>
          </div>
          <ul className="tips-list">
            {tips.map((tip, idx) => (
              <li key={idx} className="tip-item">
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}