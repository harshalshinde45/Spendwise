import React, { useMemo } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { PageHeader } from '../components/PageHeader';
import { FintechHeroCard } from '../components/FintechHeroCard';
import { SpendingActivityChart } from '../components/SpendingActivityChart';
import { CategoryChart } from '../components/CategoryChart';
import { TransactionList } from '../components/TransactionList';
import { SpendingSpeedometer } from '../components/SpendingSpeedometer';
import { FinancialWeather } from '../components/FinancialWeather';
import { SmartBudgetAlert } from '../components/SmartBudgetAlert';
import { CategoryIcon } from '../components/CategoryIcon';
import { getCategoryByName } from '../data/categories';
import { formatINR } from '../utils/currency';
import { formatMonthReadable } from '../utils/dates';
import {
  TrendingDown,
  TrendingUp,
  Clock,
  ArrowRight,
  Flame,
  Calendar,
  Sparkles,
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
  } = useExpense();

  const monthLabel = formatMonthReadable(selectedMonth);

  // Contextual time-of-day greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Calculate average daily spending for active month
  const avgDailyPaise = useMemo(() => {
    const parts = (selectedMonth || '').split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const now = new Date();
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
    const days = isCurrentMonth ? Math.max(1, now.getDate()) : 30;
    return Math.round(monthlyTotalPaise / days);
  }, [selectedMonth, monthlyTotalPaise]);

  // Highest spending category
  const topCategory = categoryTotals && categoryTotals.length > 0 ? categoryTotals[0] : null;

  return (
    <div className="dashboard-page">
      {/* SECTION 1: Page Header with Month Selector (No duplicate Add Expense button) */}
      <section className="dashboard-header-section" aria-label="Dashboard Controls">
        <PageHeader
          title="Overview"
          subtitle={`${greeting} • Financial command center & spending insights for ${monthLabel}`}
          showMonthSelector={true}
          showAddExpense={false}
        />
      </section>

      {/* SECTION 2: Prominent Fintech Hero Financial Card */}
      <section className="dashboard-hero-section" aria-label="Financial Overview">
        <FintechHeroCard
          greeting={greeting}
          onNavigateToTransactions={onNavigateToTransactions}
        />
      </section>

      {/* SECTION 3: Contextual Smart Budget Alert Banner (when relevant) */}
      <SmartBudgetAlert />

      {/* SECTION 4: Balanced Multi-Column Workspace Layout */}
      <div className="dashboard-grid-layout">
        {/* PRIMARY COLUMN: Visual Trends & Recent Activity */}
        <div className="dashboard-main-col">
          {/* Spending Over Time Chart (Daily / Weekly toggle) */}
          <section className="dashboard-chart-box" aria-label="Spending Trends">
            <SpendingActivityChart
              expenses={monthlyExpenses}
              selectedMonth={selectedMonth}
            />
          </section>

          {/* Recent Transactions (With View All link, NO duplicate Add Expense button) */}
          <section className="card recent-transactions-card" aria-label="Recent Transactions">
            <div className="recent-header">
              <div>
                <h2 className="recent-title">Recent Transactions</h2>
                <p className="recent-subtitle">Latest recorded entries for {monthLabel}</p>
              </div>

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

            <TransactionList
              expenses={monthlyExpenses}
              limit={6}
              onResetFilters={() => {}}
            />
          </section>
        </div>

        {/* SECONDARY COLUMN: Category Outlay, Velocity & Financial Weather */}
        <div className="dashboard-sidebar-col">
          {/* Category Breakdown (Donut / Bar) */}
          <div className="card dashboard-cat-card" aria-label="Category Spending Breakdown">
            <CategoryChart
              categoryTotals={categoryTotals}
              totalMonthPaise={monthlyTotalPaise}
            />
          </div>

          {/* Top Spending Category Callout */}
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
                    size={20}
                    color={getCategoryByName(topCategory.name).color}
                  />
                </div>
                <div className="top-cat-info">
                  <span className="top-cat-name">{topCategory.name}</span>
                  <span className="top-cat-amount tabular-nums">{formatINR(topCategory.totalPaise)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Financial Weather Intelligence */}
          <FinancialWeather />

          {/* Spending Speedometer Velocity Gauge */}
          <SpendingSpeedometer />
        </div>
      </div>
    </div>
  );
}
