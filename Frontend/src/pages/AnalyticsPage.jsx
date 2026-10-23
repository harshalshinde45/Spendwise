import React from 'react';
import { useExpense } from '../context/ExpenseContext';
import { PageHeader } from '../components/PageHeader';
import { ExpenseDetective } from '../components/ExpenseDetective';
import { CategoryChart } from '../components/CategoryChart';
import { CategoryIcon } from '../components/CategoryIcon';
import { formatINR } from '../utils/currency';
import { formatMonthReadable } from '../utils/dates';
import { Award, Calculator, Receipt, PieChart as PieIcon } from 'lucide-react';
import './AnalyticsPage.css';

export function AnalyticsPage() {
  const {
    selectedMonth,
    monthlyExpenses,
    monthlyTotalPaise,
    categoryTotals,
  } = useExpense();

  const monthLabel = formatMonthReadable(selectedMonth);

  // Computed metrics
  const topCategory = categoryTotals.length > 0 ? categoryTotals[0] : null;
  const avgExpensePaise =
    monthlyExpenses.length > 0
      ? Math.round(monthlyTotalPaise / monthlyExpenses.length)
      : 0;

  return (
    <div className="analytics-page">
      <PageHeader
        title="Spending Analytics"
        subtitle={`Category breakdown and distribution for ${monthLabel}`}
        showMonthSelector={true}
        showAddExpense={false}
      />

      {/* Analytics High-level Metrics */}
      <section className="analytics-metrics-grid" aria-label="Monthly Insights">
        <div className="card insight-card">
          <div className="insight-icon" style={{ backgroundColor: 'var(--bg-accent-subtle)', color: 'var(--accent-primary)' }}>
            <Award size={18} />
          </div>
          <div className="insight-content">
            <span className="insight-label">Top Category</span>
            <span className="insight-value">{topCategory ? topCategory.name : '—'}</span>
            <span className="insight-detail">
              {topCategory
                ? `${formatINR(topCategory.totalPaise)} (${topCategory.percentage}%)`
                : 'No expenses recorded'}
            </span>
          </div>
        </div>

        <div className="card insight-card">
          <div className="insight-icon" style={{ backgroundColor: 'var(--bg-surface-subtle)', color: 'var(--text-secondary)' }}>
            <Calculator size={18} />
          </div>
          <div className="insight-content">
            <span className="insight-label">Average Expense</span>
            <span className="insight-value">{formatINR(avgExpensePaise)}</span>
            <span className="insight-detail">Across {monthlyExpenses.length} transactions</span>
          </div>
        </div>

        <div className="card insight-card">
          <div className="insight-icon" style={{ backgroundColor: 'var(--bg-surface-subtle)', color: 'var(--text-primary)' }}>
            <Receipt size={18} />
          </div>
          <div className="insight-content">
            <span className="insight-label">Total Outflow</span>
            <span className="insight-value">{formatINR(monthlyTotalPaise)}</span>
            <span className="insight-detail">Recorded in {monthLabel}</span>
          </div>
        </div>
      </section>

      {/* Signature Feature 3: Expense Detective Pattern Discovery */}
      <ExpenseDetective />

      {/* Main Chart Visualization Card */}
      <section className="card analytics-chart-card" aria-label="Visual Category Breakdown">
        <CategoryChart
          categoryTotals={categoryTotals}
          totalMonthPaise={monthlyTotalPaise}
        />
      </section>

      {/* Accessible Table Breakdown */}
      {categoryTotals.length > 0 && (
        <section className="card category-table-card" aria-label="Detailed Category Table">
          <div className="table-header-row">
            <h3 className="table-heading">Category Details</h3>
            <span className="table-subheading">
              Detailed breakdown of expenditures for {monthLabel}
            </span>
          </div>

          <div className="table-responsive-wrapper">
            <table className="category-details-table">
              <thead>
                <tr>
                  <th scope="col">Category</th>
                  <th scope="col" className="text-right">Transactions</th>
                  <th scope="col" className="text-right">Total Spent</th>
                  <th scope="col" className="text-right">Share</th>
                  <th scope="col" className="text-right">Average</th>
                </tr>
              </thead>
              <tbody>
                {categoryTotals.map((cat) => {
                  const avgPaise = Math.round(cat.totalPaise / cat.count);
                  return (
                    <tr key={cat.id}>
                      <td>
                        <div className="table-cat-cell">
                          <span
                            className="cat-bullet"
                            style={{ backgroundColor: cat.color }}
                            aria-hidden="true"
                          />
                          <CategoryIcon iconName={cat.iconName} size={16} color={cat.color} />
                          <span className="cat-name">{cat.name}</span>
                        </div>
                      </td>
                      <td className="text-right">{cat.count}</td>
                      <td className="text-right font-mono font-bold">
                        {formatINR(cat.totalPaise)}
                      </td>
                      <td className="text-right">
                        <span className="percent-badge">{cat.percentage}%</span>
                      </td>
                      <td className="text-right font-mono text-muted">
                        {formatINR(avgPaise)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
