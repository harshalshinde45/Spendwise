import React, { useState } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { formatMonthReadable } from '../utils/dates';
import {
  Compass,
  Search,
  Sparkles,
  PieChart,
  Receipt,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  X,
  CheckCircle2,
} from 'lucide-react';
import './ExpenseDetective.css';

const DISMISSED_KEY = 'spendwise:dismissed_detective_insights';

function getDismissedSet() {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const raw = window.sessionStorage.getItem(DISMISSED_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    }
  } catch (e) {
    console.warn('Error reading dismissed insights:', e);
  }
  return new Set();
}

export function ExpenseDetective() {
  const { expenseDetectiveInsights, selectedMonth } = useExpense();
  const [dismissedIds, setDismissedIds] = useState(() => getDismissedSet());

  const monthLabel = formatMonthReadable(selectedMonth);

  const handleDismiss = (id) => {
    const nextSet = new Set(dismissedIds);
    nextSet.add(id);
    setDismissedIds(nextSet);
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(nextSet)));
      }
    } catch (e) {
      console.warn('Error saving dismissed insight:', e);
    }
  };

  const visibleInsights = (expenseDetectiveInsights || []).filter((i) => !dismissedIds.has(i.id));

  const renderIcon = (type) => {
    switch (type) {
      case 'concentration':
        return <PieChart size={16} aria-hidden="true" />;
      case 'micro_transactions':
        return <Receipt size={16} aria-hidden="true" />;
      case 'outlier':
        return <TrendingUp size={16} aria-hidden="true" />;
      case 'weekend_spending':
        return <Calendar size={16} aria-hidden="true" />;
      case 'category_trend':
        return <ArrowUpRight size={16} aria-hidden="true" />;
      default:
        return <Search size={16} aria-hidden="true" />;
    }
  };

  return (
    <div className="card expense-detective-card" role="region" aria-label="Expense Detective Insights">
      <div className="detective-header">
        <div className="detective-title-group">
          <div className="detective-icon-wrap">
            <Compass size={18} />
          </div>
          <div>
            <div className="detective-label-row">
              <h3 className="detective-title">Expense Detective</h3>
              <span className="detective-tag">Pattern Discovery</span>
            </div>
            <p className="detective-subtitle">Data-driven observations from {monthLabel}</p>
          </div>
        </div>

        {visibleInsights.length > 0 && (
          <span className="detective-count-badge">
            {visibleInsights.length} pattern{visibleInsights.length > 1 ? 's' : ''} detected
          </span>
        )}
      </div>

      {visibleInsights.length === 0 ? (
        <div className="detective-empty-state">
          <CheckCircle2 size={24} className="detective-empty-icon" />
          <p className="detective-empty-text">No unusual spending anomalies detected</p>
          <span className="detective-empty-subtext">
            As you record transactions across the month, Expense Detective automatically inspects for
            micro-purchases, weekend surges, and outliers.
          </span>
        </div>
      ) : (
        <div className="detective-insights-list">
          {visibleInsights.map((insight) => (
            <div
              key={insight.id}
              className={`detective-insight-item severity-${insight.severity || 'neutral'}`}
            >
              <div className="insight-item-header">
                <div className="insight-type-label">
                  <span className="insight-icon">{renderIcon(insight.type)}</span>
                  <span className="insight-title-text">{insight.title}</span>
                </div>

                <button
                  type="button"
                  className="dismiss-insight-btn"
                  onClick={() => handleDismiss(insight.id)}
                  aria-label={`Dismiss insight: ${insight.title}`}
                  title="Dismiss this observation"
                >
                  <X size={14} />
                </button>
              </div>

              <p className="insight-observation">{insight.observation}</p>

              <div className="insight-footer">
                <span className="insight-explanation">{insight.explanation}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
