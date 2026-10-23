import React, { useState, useEffect, useMemo } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { calculateSurvivalBudget } from '../utils/intelligence';
import { formatINR, rupeesToPaise, paiseToRupees } from '../utils/currency';
import { getDaysRemainingInMonth, formatMonthReadable } from '../utils/dates';
import {
  ShieldAlert,
  HeartHandshake,
  Utensils,
  Car,
  Home,
  Receipt,
  HeartPulse,
  Info,
  RotateCcw,
} from 'lucide-react';
import './SurvivalBudgetMode.css';

const SURVIVAL_STORAGE_KEY = 'spendwise:survival_mode_plans';

const DEFAULT_ESSENTIALS = {
  groceries: '3000',
  transit: '1000',
  rent: '0',
  bills: '800',
  health: '500',
};

function getStoredEssentials(monthKey) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(SURVIVAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed[monthKey]) return parsed[monthKey];
      }
    }
  } catch (e) {
    console.warn('Error reading survival plans:', e);
  }
  return DEFAULT_ESSENTIALS;
}

export function SurvivalBudgetMode() {
  const { currentBudgetPaise, monthlyTotalPaise, selectedMonth } = useExpense();

  const [plannedAmounts, setPlannedAmounts] = useState(() => getStoredEssentials(selectedMonth));

  // Sync when selectedMonth changes
  useEffect(() => {
    setPlannedAmounts(getStoredEssentials(selectedMonth));
  }, [selectedMonth]);

  const handleAmountChange = (key, value) => {
    const next = { ...plannedAmounts, [key]: value };
    setPlannedAmounts(next);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(SURVIVAL_STORAGE_KEY);
        const all = raw ? JSON.parse(raw) : {};
        all[selectedMonth] = next;
        window.localStorage.setItem(SURVIVAL_STORAGE_KEY, JSON.stringify(all));
      }
    } catch (e) {
      console.warn('Error writing survival plans:', e);
    }
  };

  const handleReset = () => {
    setPlannedAmounts(DEFAULT_ESSENTIALS);
  };

  const daysRemaining = useMemo(() => getDaysRemainingInMonth(selectedMonth), [selectedMonth]);
  const remainingBudgetPaise = currentBudgetPaise - monthlyTotalPaise;

  const plannedEssentialsPaise = useMemo(() => {
    const res = {};
    for (const [k, v] of Object.entries(plannedAmounts)) {
      res[k] = rupeesToPaise(v) || 0;
    }
    return res;
  }, [plannedAmounts]);

  const survivalCalc = useMemo(() => {
    return calculateSurvivalBudget({
      remainingBudgetPaise,
      daysRemaining,
      plannedEssentials: plannedEssentialsPaise,
    });
  }, [remainingBudgetPaise, daysRemaining, plannedEssentialsPaise]);

  const monthLabel = formatMonthReadable(selectedMonth);

  const {
    totalPlannedEssentialsPaise,
    availableDiscretionaryPaise,
    dailyDiscretionaryPaise,
    hasShortfall,
    shortfallPaise,
    advice,
  } = survivalCalc;

  const essentialCategories = [
    { id: 'groceries', label: 'Essential Food & Groceries', icon: Utensils },
    { id: 'transit', label: 'Commute & Travel', icon: Car },
    { id: 'rent', label: 'Remaining Rent / Shelter', icon: Home },
    { id: 'bills', label: 'Utilities & Critical Bills', icon: Receipt },
    { id: 'health', label: 'Health & Medical', icon: HeartPulse },
  ];

  return (
    <div className="card survival-budget-card" role="region" aria-label="Survival Budget Planning Mode">
      {/* Header */}
      <div className="survival-header">
        <div className="survival-title-group">
          <div className="survival-icon-wrap">
            <HeartHandshake size={20} />
          </div>
          <div>
            <div className="survival-title-row">
              <h2 className="survival-title">Survival Budget Mode</h2>
              <span className="survival-badge">Safety Margin Planner</span>
            </div>
            <p className="survival-subtitle">
              Ring-fence your non-negotiable living essentials to calculate safe discretionary spending for the next {daysRemaining} days.
            </p>
          </div>
        </div>

        <button type="button" className="btn btn-subtle btn-sm" onClick={handleReset}>
          <RotateCcw size={14} />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Overview Metric Bar */}
      <div className={`survival-summary-bar ${hasShortfall ? 'has-shortfall' : 'has-buffer'}`}>
        <div className="summary-col">
          <span className="col-label">Remaining Budget</span>
          <span className="col-val font-mono">{formatINR(remainingBudgetPaise)}</span>
        </div>
        <div className="summary-math-symbol">−</div>
        <div className="summary-col">
          <span className="col-label">Planned Essentials</span>
          <span className="col-val font-mono">{formatINR(totalPlannedEssentialsPaise)}</span>
        </div>
        <div className="summary-math-symbol">=</div>
        <div className="summary-col highlight">
          <span className="col-label">
            {hasShortfall ? 'Estimated Shortfall' : 'Discretionary Pocket'}
          </span>
          <span className={`col-val font-mono ${hasShortfall ? 'shortfall' : 'buffer'}`}>
            {hasShortfall ? `-${formatINR(shortfallPaise)}` : formatINR(availableDiscretionaryPaise)}
          </span>
        </div>
        <div className="summary-col daily-allowance font-mono">
          <span className="col-label">Daily Pocket ({daysRemaining} days left)</span>
          <span className="col-val highlight-daily">{formatINR(dailyDiscretionaryPaise)} / day</span>
        </div>
      </div>

      {/* Advice Banner */}
      <div className={`survival-advice-banner ${hasShortfall ? 'banner-alert' : 'banner-healthy'}`}>
        <Info size={16} aria-hidden="true" />
        <p className="advice-text">{advice}</p>
      </div>

      {/* Essential Inputs Form */}
      <div className="essentials-inputs-section">
        <h3 className="section-title">Allocate Upcoming Essential Obligations (₹)</h3>
        <p className="section-sub">
          Enter what you anticipate needing for strictly necessary survival items through the end of {monthLabel}.
        </p>

        <div className="essentials-grid">
          {essentialCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div key={cat.id} className="essential-input-card">
                <div className="essential-card-header">
                  <div className="cat-icon-container">
                    <Icon size={16} />
                  </div>
                  <label htmlFor={`essential-${cat.id}`} className="cat-label">
                    {cat.label}
                  </label>
                </div>
                <div className="input-wrap">
                  <span className="currency-mark">₹</span>
                  <input
                    id={`essential-${cat.id}`}
                    type="number"
                    min="0"
                    step="any"
                    className="form-input font-mono cat-input"
                    value={plannedAmounts[cat.id] || ''}
                    onChange={(e) => handleAmountChange(cat.id, e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety Notice */}
      <div className="survival-footnote">
        <span>
          • Planned essential amounts are strictly for your planning simulations and are never recorded as actual expense transactions.
        </span>
      </div>
    </div>
  );
}
