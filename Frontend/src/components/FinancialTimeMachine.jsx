import React, { useState, useMemo } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { simulateFinancialPurchase } from '../utils/intelligence';
import { formatINR, rupeesToPaise } from '../utils/currency';
import { CATEGORIES } from '../data/categories';
import {
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  DollarSign,
  TrendingDown,
  Info,
} from 'lucide-react';
import './FinancialTimeMachine.css';

export function FinancialTimeMachine() {
  const { currentBudgetPaise, monthlyTotalPaise, selectedMonth } = useExpense();

  // Simulation inputs (in rupees for intuitive input)
  const [purchaseAmount, setPurchaseAmount] = useState('2500');
  const [selectedCategory, setSelectedCategory] = useState('Entertainment');
  const [description, setDescription] = useState('Wireless Headphones');

  const purchasePaise = useMemo(() => {
    return rupeesToPaise(purchaseAmount) || 0;
  }, [purchaseAmount]);

  const simulation = useMemo(() => {
    return simulateFinancialPurchase({
      budgetPaise: currentBudgetPaise,
      totalSpentPaise: monthlyTotalPaise,
      monthKey: selectedMonth,
      purchaseAmountPaise: purchasePaise,
      category: selectedCategory,
    });
  }, [currentBudgetPaise, monthlyTotalPaise, selectedMonth, purchasePaise, selectedCategory]);

  const handleReset = () => {
    setPurchaseAmount('0');
    setDescription('');
    setSelectedCategory('General');
  };

  const {
    isBudgetConfigured,
    currentRemainingPaise,
    currentDailyLimitPaise,
    simulatedRemainingPaise,
    simulatedDailyLimitPaise,
    simulatedUtilizationPercent,
    isExceeded,
    shortfallPaise,
    dailyImpactPaise,
    daysRemaining,
    scenarios,
  } = simulation;

  return (
    <div className="card financial-time-machine-card" role="region" aria-label="Financial Time Machine Simulator">
      {/* Simulation Header */}
      <div className="simulator-header">
        <div className="simulator-title-group">
          <div className="simulator-icon-wrap">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="simulator-tag-row">
              <h2 className="simulator-title">Financial Time Machine</h2>
              <span className="simulator-badge">Hypothetical Sandbox</span>
            </div>
            <p className="simulator-subtitle">
              Test planned purchases before spending. Simulated decisions never affect your database.
            </p>
          </div>
        </div>

        <button type="button" className="btn btn-subtle btn-sm reset-btn" onClick={handleReset}>
          <RotateCcw size={14} />
          <span>Reset Simulation</span>
        </button>
      </div>

      {/* Simulator Input Controls */}
      <div className="simulator-controls-grid">
        <div className="control-group">
          <label htmlFor="sim-amount" className="control-label">
            Planned Purchase Amount (₹)
          </label>
          <div className="amount-input-wrap">
            <span className="currency-prefix">₹</span>
            <input
              id="sim-amount"
              type="number"
              min="0"
              step="any"
              className="form-input font-mono amount-field"
              placeholder="0.00"
              value={purchaseAmount}
              onChange={(e) => setPurchaseAmount(e.target.value)}
            />
          </div>
        </div>

        <div className="control-group">
          <label htmlFor="sim-category" className="control-label">
            Category
          </label>
          <select
            id="sim-category"
            className="form-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
            <option value="General">General / Discretionary</option>
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="sim-desc" className="control-label">
            Item Name (Optional)
          </label>
          <input
            id="sim-desc"
            type="text"
            className="form-input"
            placeholder="e.g. New Headphones, Flight ticket"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>

      {/* Primary Impact Projection */}
      <div className={`simulator-impact-banner ${isExceeded ? 'impact-danger' : 'impact-success'}`}>
        <div className="impact-left">
          {isExceeded ? (
            <AlertTriangle size={22} className="impact-icon danger" aria-hidden="true" />
          ) : (
            <ShieldCheck size={22} className="impact-icon success" aria-hidden="true" />
          )}
          <div className="impact-text">
            <h4 className="impact-title">
              {isExceeded
                ? `Exceeds Available Budget by ${formatINR(shortfallPaise)}`
                : `Leaves ${formatINR(simulatedRemainingPaise)} Remaining in Reserve`}
            </h4>
            <p className="impact-description">
              {isExceeded
                ? `Making this purchase of ${formatINR(purchasePaise)} will push your budget to ${simulatedUtilizationPercent}% utilization.`
                : `After purchasing ${description ? `"${description}"` : 'this item'}, your daily suggested allowance adjusts from ${formatINR(currentDailyLimitPaise)}/day to ${formatINR(simulatedDailyLimitPaise)}/day for the remaining ${daysRemaining} days.`}
            </p>
          </div>
        </div>

        <div className="impact-stat font-mono">
          <span className="stat-label">New Daily Limit</span>
          <span className={`stat-val ${isExceeded ? 'danger' : ''}`}>
            {formatINR(simulatedDailyLimitPaise)} / day
          </span>
        </div>
      </div>

      {/* Scenario Comparisons Grid */}
      <div className="scenarios-section">
        <h3 className="scenarios-heading">Decision Alternatives & Comparative Impacts</h3>
        <div className="scenarios-grid">
          {/* Scenario 1: Buy Now */}
          <div className={`scenario-card ${isExceeded ? 'scenario-alert' : ''}`}>
            <div className="scenario-badge">Option A</div>
            <h4 className="scenario-title">Buy Now</h4>
            <div className="scenario-stat">
              <span className="label">Remaining Budget</span>
              <span className={`val font-mono ${isExceeded ? 'danger' : ''}`}>
                {isExceeded ? `-${formatINR(shortfallPaise)}` : formatINR(simulatedRemainingPaise)}
              </span>
            </div>
            <div className="scenario-stat">
              <span className="label">Daily Allowance</span>
              <span className="val font-mono">{formatINR(simulatedDailyLimitPaise)}/day</span>
            </div>
            <p className="scenario-summary">{scenarios.now.impactSummary}</p>
          </div>

          {/* Scenario 2: Postpone */}
          <div className="scenario-card">
            <div className="scenario-badge badge-neutral">Option B</div>
            <h4 className="scenario-title">Postpone to Next Month</h4>
            <div className="scenario-stat">
              <span className="label">Current Remaining</span>
              <span className="val font-mono">{formatINR(currentRemainingPaise)}</span>
            </div>
            <div className="scenario-stat">
              <span className="label">Daily Allowance</span>
              <span className="val font-mono">{formatINR(currentDailyLimitPaise)}/day</span>
            </div>
            <p className="scenario-summary">{scenarios.postpone.impactSummary}</p>
          </div>

          {/* Scenario 3: Cheaper Alternative */}
          <div className="scenario-card scenario-recommended">
            <div className="scenario-badge badge-accent">Option C • Smarter Choice</div>
            <h4 className="scenario-title">Cheaper Alternative (-35%)</h4>
            <div className="scenario-stat">
              <span className="label">Simulated Price</span>
              <span className="val font-mono">{formatINR(scenarios.cheaperAlternative.amountPaise)}</span>
            </div>
            <div className="scenario-stat">
              <span className="label">Daily Allowance</span>
              <span className="val font-mono">
                {formatINR(scenarios.cheaperAlternative.dailyLimitPaise)}/day
              </span>
            </div>
            <p className="scenario-summary">{scenarios.cheaperAlternative.impactSummary}</p>
          </div>
        </div>
      </div>

      <div className="simulator-notice">
        <Info size={14} aria-hidden="true" />
        <span>
          Sandbox simulation only. No real transaction is generated, and your MongoDB database records remain unchanged.
        </span>
      </div>
    </div>
  );
}
