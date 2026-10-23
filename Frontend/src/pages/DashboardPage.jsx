import React, { useMemo } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { PageHeader } from '../components/PageHeader';
import { SummaryCard } from '../components/SummaryCard';
import { BudgetCard } from '../components/BudgetCard';
import { SmartBudgetAlert } from '../components/SmartBudgetAlert';
import { SpendingActivityChart } from '../components/SpendingActivityChart';
import { CategoryChart } from '../components/CategoryChart';
import { TransactionList } from '../components/TransactionList';
import { SpendingSpeedometer } from '../components/SpendingSpeedometer';
import { FinancialWeather } from '../components/FinancialWeather';
import { CategoryIcon } from '../components/CategoryIcon';
import { getCategoryByName } from '../data/categories';
import { formatINR } from '../utils/currency';
import { formatMonthReadable } from '../utils/dates';
import {
  TrendingDown,
  Wallet,
  TrendingUp,
  Clock,
  ArrowRight,
  Plus,
  Flame,
} from 'lucide-react';
import './DashboardPage.css';

export function DashboardPage({ onNavigateToTransactions }) {
  const {
    selectedMonth,
    monthlyExpenses,
    monthlyTotalPaise,
    currentBudgetPaise,
    budgetStatus,
    categoryTotals,
    openBudgetModal,
    openAddModal,
  } = useExpense();

  const monthLabel = formatMonthReadable(selectedMonth);

  // Contextual time greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Calculate average daily spending for month
  const avgDailyPaise = useMemo(() => {
    const parts = (selectedMonth || '').split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const now = new Date();
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
    const days = isCurrentMonth ? Math.max(1, now.getDate()) : 30;
    return Math.round(monthlyTotalPaise / days);
  }, [selectedMonth, monthlyTotalPaise]);

  // Highest spending category if available
  const topCategory = categoryTotals && categoryTotals.length > 0 ? categoryTotals[0] : null;

  return (
    <div className="dashboard-page">
      {/* =========================================================================
          SECTION A: Header (Compact Overview & Month Selector)
         ========================================================================= */}
      <section className="dashboard-row-1" aria-label="Dashboard Header">
        <PageHeader
          title="Overview"
          subtitle={`${greeting} • Financial command center and spending intelligence for ${monthLabel}`}
          showMonthSelector={true}
          showAddExpense={false}
        />
      </section>

      {/* =========================================================================
          SECTION B: 3 Primary Financial Metric Cards
          (Card 1: Total Spent, Card 2: Remaining Budget, Card 3: Budget Utilization)
         ========================================================================= */}
      <section className="dashboard-metrics-grid" aria-label="Key Financial Indicators">
        {/* Card 1: Total Spent */}
        <SummaryCard
          title="Total Spent"
          value={formatINR(monthlyTotalPaise)}
          subtitle={`${monthlyExpenses.length} transaction${monthlyExpenses.length === 1 ? '' : 's'} recorded`}
          icon={TrendingDown}
          badgeText={monthLabel}
          badgeVariant="neutral"
        />

        {/* Card 2: Remaining Budget */}
        <SummaryCard
          title={budgetStatus.isOverBudget ? 'Over Budget' : 'Remaining Budget'}
          value={
            budgetStatus.isSet
              ? budgetStatus.isOverBudget
                ? `+${formatINR(budgetStatus.overspentPaise)}`
                : formatINR(budgetStatus.remainingPaise)
              : '—'
          }
          subtitle={
            budgetStatus.isSet
              ? budgetStatus.isOverBudget
                ? `Exceeded monthly target`
                : `Available reserve for ${monthLabel}`
              : 'Click to configure monthly target'
          }
          icon={TrendingUp}
          badgeText={
            budgetStatus.isSet
              ? budgetStatus.isOverBudget
                ? 'Over Budget'
                : 'Within Target'
              : 'Unset'
          }
          badgeVariant={
            budgetStatus.isSet
              ? budgetStatus.isOverBudget
                ? 'danger'
                : 'success'
              : 'neutral'
          }
          onClick={openBudgetModal}
        />

        {/* Card 3: Budget Utilization */}
        <SummaryCard
          title="Budget Utilization"
          value={budgetStatus.isSet ? `${budgetStatus.utilizationPercent}%` : 'Not Set'}
          subtitle={
            budgetStatus.isSet
              ? `Of ${formatINR(currentBudgetPaise)} target limit`
              : 'Click to set monthly target'
          }
          icon={Wallet}
          progress={budgetStatus.isSet ? budgetStatus.visualProgressPercent : null}
          badgeText={
            budgetStatus.isSet
              ? budgetStatus.isOverBudget
                ? 'Exceeded'
                : budgetStatus.statusLevel === 'warning'
                ? 'Caution'
                : 'On Track'
              : 'Set Target'
          }
          badgeVariant={budgetStatus.isSet ? budgetStatus.statusLevel : 'neutral'}
          onClick={openBudgetModal}
        />
      </section>

      {/* =========================================================================
          THIRD ROW: Main Budget Overview & Smart Budget Alert
         ========================================================================= */}
      <section className="dashboard-row-3" aria-label="Budget Overview & Alerts">
        <SmartBudgetAlert />
        <BudgetCard />
      </section>

      {/* =========================================================================
          FOURTH ROW: Spending Trend Chart & Category Breakdown Chart
         ========================================================================= */}
      <section className="dashboard-charts-grid" aria-label="Visual Analytics & Trends">
        {/* Spending trend chart over time (Daily / Weekly toggle) */}
        <div className="chart-column">
          <SpendingActivityChart
            expenses={monthlyExpenses}
            selectedMonth={selectedMonth}
          />
        </div>

        {/* Category breakdown chart (Donut / Bar toggle with legends) */}
        <div className="chart-column">
          <div className="card dashboard-cat-card">
            <CategoryChart
              categoryTotals={categoryTotals}
              totalMonthPaise={monthlyTotalPaise}
            />
          </div>
        </div>
      </section>

      {/* =========================================================================
          FIFTH ROW: Recent Transactions & Relevant Spending Insights
         ========================================================================= */}
      <section className="dashboard-row-5-grid" aria-label="Transactions & Insights">
        {/* Recent Transactions Card with Quick Actions */}
        <div className="card recent-transactions-card">
          <div className="recent-header">
            <div>
              <h2 className="recent-title">Recent Transactions</h2>
              <p className="recent-subtitle">Latest entries for {monthLabel}</p>
            </div>
            <div className="recent-actions-row">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={openAddModal}
              >
                <Plus size={14} />
                <span>Add Expense</span>
              </button>
              {monthlyExpenses.length > 0 && (
                <button
                  type="button"
                  className="btn btn-subtle btn-sm view-all-btn"
                  onClick={onNavigateToTransactions}
                >
                  <span>View All ({monthlyExpenses.length})</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>

          <TransactionList
            expenses={monthlyExpenses}
            limit={6}
            onResetFilters={() => {}}
          />
        </div>

        {/* Relevant Spending Insights (Top Category, Speedometer & Weather) */}
        <div className="dashboard-insights-col">
          {topCategory && (
            <div className="card top-category-insight-card">
              <div className="top-cat-header">
                <div className="top-cat-tag">
                  <Flame size={14} className="top-cat-flame-icon" aria-hidden="true" />
                  <span>Top Spending Category</span>
                </div>
                <span className="top-cat-share">{topCategory.percentage}% of month</span>
              </div>
              <div className="top-cat-body">
                <div
                  className="top-cat-icon-wrap"
                  style={{
                    backgroundColor: getCategoryByName(topCategory.name).bgColor,
                    color: getCategoryByName(topCategory.name).color,
                  }}
                >
                  <CategoryIcon
                    iconName={getCategoryByName(topCategory.name).iconName}
                    size={18}
                    color={getCategoryByName(topCategory.name).color}
                  />
                </div>
                <div className="top-cat-info">
                  <span className="top-cat-name">{topCategory.name}</span>
                  <span className="top-cat-amount">{formatINR(topCategory.totalPaise)}</span>
                </div>
              </div>
            </div>
          )}
          <FinancialWeather />
          <SpendingSpeedometer />
        </div>
      </section>
    </div>
  );
}
