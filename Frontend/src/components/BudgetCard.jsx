import React from 'react';
import { useExpense } from '../context/ExpenseContext';
import { formatINR } from '../utils/currency';
import { formatMonthReadable } from '../utils/dates';
import { Wallet, PlusCircle, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import './BudgetCard.css';

export function BudgetCard() {
  const {
    selectedMonth,
    budgetStatus,
    currentBudgetPaise,
    monthlyTotalPaise,
    openBudgetModal,
  } = useExpense();

  const monthLabel = formatMonthReadable(selectedMonth);

  return (
    <div className="card budget-card">
      <div className="budget-card-header">
        <div className="budget-title-group">
          <div className="budget-icon-container">
            <Wallet size={20} />
          </div>
          <div>
            <h2 className="budget-card-title">Monthly Budget</h2>
            <p className="budget-card-subtitle">{monthLabel}</p>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={openBudgetModal}
          aria-label={budgetStatus.isSet ? `Edit budget for ${monthLabel}` : `Set budget for ${monthLabel}`}
        >
          {budgetStatus.isSet ? 'Edit Budget' : '+ Set Budget'}
        </button>
      </div>

      {!budgetStatus.isSet ? (
        <div className="budget-unset-state">
          <p className="budget-unset-text">
            No budget set for {monthLabel}. Set a monthly spending target to monitor your utilization and prevent overspending.
          </p>
          <div className="budget-unset-stats">
            <span className="stat-label">Total Spent so far:</span>
            <span className="stat-value">{formatINR(monthlyTotalPaise)}</span>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm budget-set-now-btn"
            onClick={openBudgetModal}
          >
            <PlusCircle size={14} />
            <span>Set Target for {monthLabel}</span>
          </button>
        </div>
      ) : (
        <div className="budget-active-state">
          {/* Main figures */}
          <div className="budget-figures-grid">
            <div className="figure-block">
              <span className="figure-label">Total Budget</span>
              <span className="figure-value">{formatINR(currentBudgetPaise)}</span>
            </div>

            <div className="figure-block">
              <span className="figure-label">Spent</span>
              <span className="figure-value spent">{formatINR(monthlyTotalPaise)}</span>
            </div>

            <div className="figure-block">
              <span className="figure-label">
                {budgetStatus.isOverBudget ? 'Over Budget By' : 'Remaining'}
              </span>
              <span className={`figure-value ${budgetStatus.isOverBudget ? 'over-budget' : 'healthy'}`}>
                {budgetStatus.isOverBudget
                  ? `+${formatINR(budgetStatus.overspentPaise)}`
                  : formatINR(budgetStatus.remainingPaise)}
              </span>
            </div>
          </div>

          {/* Progress Bar & Status Text */}
          <div className="budget-progress-section">
            <div className="progress-labels">
              <span className="progress-status-badge badge-tag" data-status={budgetStatus.statusLevel}>
                {budgetStatus.isOverBudget ? (
                  <>
                    <AlertCircle size={13} aria-hidden="true" />
                    <span>Exceeded Budget ({budgetStatus.utilizationPercent}%)</span>
                  </>
                ) : budgetStatus.statusLevel === 'warning' ? (
                  <>
                    <TrendingUp size={13} aria-hidden="true" />
                    <span>Near Limit ({budgetStatus.utilizationPercent}%)</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={13} aria-hidden="true" />
                    <span>On Track ({budgetStatus.utilizationPercent}%)</span>
                  </>
                )}
              </span>
              <span className="progress-percent-text">
                {budgetStatus.visualProgressPercent}% of limit
              </span>
            </div>

            <div
              className="progress-bar-track"
              role="progressbar"
              aria-valuenow={budgetStatus.visualProgressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Budget utilization for ${monthLabel}: ${budgetStatus.utilizationPercent}%`}
            >
              <div
                className={`progress-bar-fill fill-${budgetStatus.statusLevel}`}
                style={{ width: `${budgetStatus.visualProgressPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
