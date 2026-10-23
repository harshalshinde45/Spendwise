import React, { useState } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { PageHeader } from '../components/PageHeader';
import { BudgetCard } from '../components/BudgetCard';
import { SmartBudgetAlert } from '../components/SmartBudgetAlert';
import { FinancialTimeMachine } from '../components/FinancialTimeMachine';
import { SurvivalBudgetMode } from '../components/SurvivalBudgetMode';
import { formatINR } from '../utils/currency';
import { formatMonthReadable } from '../utils/dates';
import { CategoryIcon } from '../components/CategoryIcon';
import { getCategoryByName } from '../data/categories';
import {
  Wallet,
  Sparkles,
  HeartHandshake,
  PieChart,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import './BudgetsPage.css';

export function BudgetsPage() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'simulator' | 'survival'
  const {
    selectedMonth,
    budgetStatus,
    currentBudgetPaise,
    monthlyTotalPaise,
    categoryTotals,
    openBudgetModal,
  } = useExpense();

  const monthLabel = formatMonthReadable(selectedMonth);

  return (
    <div className="budgets-page">
      <PageHeader
        title="Budgets & Planning"
        subtitle={`Budget tracking, scenario forecasting, and spending management for ${monthLabel}`}
        showMonthSelector={true}
        showAddExpense={false}
      />

      {/* Segmented Mode Selector */}
      <div className="budget-tab-bar" role="tablist" aria-label="Budget Mode">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'overview'}
          className={`budget-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Wallet size={16} />
          <span>Monthly Target & Categories</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'simulator'}
          className={`budget-tab ${activeTab === 'simulator' ? 'active' : ''}`}
          onClick={() => setActiveTab('simulator')}
        >
          <Sparkles size={16} />
          <span>Purchase Simulator</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'survival'}
          className={`budget-tab ${activeTab === 'survival' ? 'active' : ''}`}
          onClick={() => setActiveTab('survival')}
        >
          <HeartHandshake size={16} />
          <span>Survival Budget Mode</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="budget-tab-content">
        {activeTab === 'overview' && (
          <div className="budget-overview-stack">
            {/* Smart Alert Banner if active */}
            <SmartBudgetAlert />

            {/* Main Interactive Budget Card */}
            <BudgetCard />

            {/* Category Budget Breakdown */}
            <div className="card category-budget-breakdown-card">
              <div className="breakdown-header">
                <div>
                  <h3 className="breakdown-title">Category Spending Distribution</h3>
                  <p className="breakdown-subtitle">
                    Recorded outlays across categories against your total {monthLabel} budget
                  </p>
                </div>
                {budgetStatus.isSet && (
                  <span className="badge badge-neutral">
                    {budgetStatus.utilizationPercent}% of ₹{formatINR(currentBudgetPaise)} used
                  </span>
                )}
              </div>

              {categoryTotals.length === 0 ? (
                <div className="empty-category-notice">
                  <p>No category expenses recorded for {monthLabel} yet.</p>
                </div>
              ) : (
                <div className="category-progress-list">
                  {categoryTotals.map((cat) => {
                    const catMeta = getCategoryByName(cat.name);
                    const percentOfTotalSpend = cat.percentage || 0;
                    const percentOfBudget =
                      currentBudgetPaise > 0
                        ? Math.min(100, Math.round((cat.totalPaise / currentBudgetPaise) * 100))
                        : 0;

                    return (
                      <div key={cat.name} className="cat-progress-row">
                        <div className="cat-info-col">
                          <div
                            className="cat-badge-icon"
                            style={{ backgroundColor: catMeta.bgColor, color: catMeta.color }}
                          >
                            <CategoryIcon iconName={catMeta.iconName} size={16} color={catMeta.color} />
                          </div>
                          <div>
                            <span className="cat-name">{cat.name}</span>
                            <span className="cat-count">
                              {cat.count} expense{cat.count === 1 ? '' : 's'} ({percentOfTotalSpend}% of spend)
                            </span>
                          </div>
                        </div>

                        <div className="cat-bar-col">
                          <div
                            className="cat-track"
                            role="progressbar"
                            aria-valuenow={percentOfBudget}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${cat.name}: ${formatINR(cat.totalPaise)}`}
                          >
                            <div
                              className="cat-fill"
                              style={{
                                width: `${currentBudgetPaise > 0 ? percentOfBudget : percentOfTotalSpend}%`,
                                backgroundColor: catMeta.color,
                              }}
                            />
                          </div>
                        </div>

                        <div className="cat-amount-col">
                          <span className="cat-amount">{formatINR(cat.totalPaise)}</span>
                          {currentBudgetPaise > 0 && (
                            <span className="cat-budget-share">{percentOfBudget}% of limit</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'simulator' && <FinancialTimeMachine />}

        {activeTab === 'survival' && <SurvivalBudgetMode />}
      </div>
    </div>
  );
}
