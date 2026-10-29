import React from 'react';
import { useExpense } from '../context/ExpenseContext';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../utils/currency';
import { formatMonthReadable } from '../utils/dates';
import { Wallet, ArrowRight, TrendingDown, Target, Zap } from 'lucide-react';
import './FintechHeroCard.css';

export function FintechHeroCard({ greeting = 'Hello', onNavigateToTransactions }) {
  const {
    selectedMonth,
    monthlyTotalPaise,
    currentBudgetPaise,
    budgetStatus,
    monthlyExpenses,
    openBudgetModal,
  } = useExpense();
  const { user } = useAuth();

  const monthLabel = formatMonthReadable(selectedMonth);
  const userName = user?.name ? user.name.split(' ')[0] : 'Member';
  const transactionCount = monthlyExpenses.length;

  // Calculate daily average spend
  const parts = (selectedMonth || '').split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const days = isCurrentMonth ? Math.max(1, now.getDate()) : 30;
  const avgDailyPaise = Math.round(monthlyTotalPaise / days);

  return (
    <div className="fintech-hero-card" role="region" aria-label="Monthly Financial Summary">
      {/* Ambient orange wave curve & glow graphics inspired by mobile reference */}
      <div className="hero-ambient-layer" aria-hidden="true">
        <div className="hero-ambient-glow" />
        <svg className="hero-wave-graphic" viewBox="0 0 600 180" preserveAspectRatio="none">
          <path
            d="M0,100 C150,40 280,140 420,70 C500,30 550,60 600,40 L600,180 L0,180 Z"
            fill="url(#fintechOrangeGlow)"
            opacity="0.28"
          />
          <path
            d="M0,130 C120,70 240,160 380,90 C480,50 540,80 600,60 L600,180 L0,180 Z"
            fill="url(#fintechOrangeGlow)"
            opacity="0.15"
          />
          <defs>
            <linearGradient id="fintechOrangeGlow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FF6B2C" />
              <stop offset="60%" stopColor="#EA571D" />
              <stop offset="100%" stopColor="#FF9F2E" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="hero-card-inner">
        {/* Top Header Row: User Greeting, Date & Target Pill */}
        <div className="hero-header-row">
          <div className="hero-user-meta">
            <h1 className="hero-greeting-title">
              {greeting}, {userName}
            </h1>
            <span className="hero-period-label">{monthLabel} Overview</span>
          </div>

          <button
            type="button"
            className="hero-target-pill"
            onClick={openBudgetModal}
            aria-label="Configure Monthly Budget"
          >
            <Wallet size={14} className="hero-pill-icon" aria-hidden="true" />
            <span>{budgetStatus.isSet ? 'Target Set' : 'Set Budget'}</span>
          </button>
        </div>

        {/* Primary Prominent Financial Display */}
        <div className="hero-display-block">
          <span className="hero-display-eyebrow">TOTAL SPENT</span>
          <div className="hero-display-value tabular-nums">
            {formatINR(monthlyTotalPaise)}
          </div>
        </div>

        {/* 3 Compact Metric Tiles Inspired by Mobile Reference */}
        <div className="hero-tiles-grid">
          {/* Tile 1: Remaining Budget */}
          <div
            className="hero-micro-tile clickable"
            onClick={openBudgetModal}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openBudgetModal()}
          >
            <div className="micro-tile-top">
              <span className="micro-tile-label">REMAINING</span>
              <span
                className={`micro-tile-badge ${
                  budgetStatus.isSet
                    ? budgetStatus.isOverBudget
                      ? 'badge-danger'
                      : 'badge-success'
                    : 'badge-neutral'
                }`}
              >
                {budgetStatus.isSet
                  ? budgetStatus.isOverBudget
                    ? 'Over'
                    : 'On Track'
                  : 'Unset'}
              </span>
            </div>
            <span className="micro-tile-value tabular-nums">
              {budgetStatus.isSet
                ? budgetStatus.isOverBudget
                  ? `-${formatINR(budgetStatus.overspentPaise)}`
                  : formatINR(budgetStatus.remainingPaise)
                : '—'}
            </span>
          </div>

          {/* Tile 2: Monthly Limit Target */}
          <div
            className="hero-micro-tile clickable"
            onClick={openBudgetModal}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openBudgetModal()}
          >
            <div className="micro-tile-top">
              <span className="micro-tile-label">BUDGET TARGET</span>
              <span className="micro-tile-badge badge-neutral">
                {budgetStatus.isSet ? `${budgetStatus.utilizationPercent}%` : 'Off'}
              </span>
            </div>
            <span className="micro-tile-value tabular-nums">
              {budgetStatus.isSet ? formatINR(currentBudgetPaise) : 'Click to Set'}
            </span>
          </div>

          {/* Tile 3: Daily Average */}
          <div
            className="hero-micro-tile clickable"
            onClick={onNavigateToTransactions}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onNavigateToTransactions?.()}
          >
            <div className="micro-tile-top">
              <span className="micro-tile-label">DAILY BURN</span>
              <span className="micro-tile-badge badge-neutral">
                {transactionCount} {transactionCount === 1 ? 'txn' : 'txns'}
              </span>
            </div>
            <span className="micro-tile-value tabular-nums">
              {formatINR(avgDailyPaise)}
              <small className="micro-unit">/day</small>
            </span>
          </div>
        </div>

        {/* Bottom Utilization Progress Strip & Details Trigger */}
        <div className="hero-progress-footer">
          <div className="hero-bar-container">
            <div className="hero-bar-labels">
              <span className="hero-bar-title">Budget Utilization</span>
              <span className="hero-bar-metric tabular-nums">
                {budgetStatus.isSet ? `${budgetStatus.utilizationPercent}% of target` : 'No budget set'}
              </span>
            </div>
            <div className="hero-track">
              <div
                className={`hero-fill ${budgetStatus.isOverBudget ? 'overbudget' : ''}`}
                style={{
                  width: `${Math.min(100, budgetStatus.visualProgressPercent || 0)}%`,
                }}
              />
            </div>
          </div>

          <button
            type="button"
            className="hero-action-link"
            onClick={openBudgetModal}
            aria-label="Manage budget details"
          >
            <span>Details</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
