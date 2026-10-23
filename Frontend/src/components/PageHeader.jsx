import React from 'react';
import { useExpense } from '../context/ExpenseContext';
import {
  formatMonthReadable,
  getPreviousMonthKey,
  getNextMonthKey,
  getCurrentMonthKey,
} from '../utils/dates';
import { ChevronLeft, ChevronRight, Plus, Calendar } from 'lucide-react';
import './PageHeader.css';

export function PageHeader({
  title,
  subtitle,
  showMonthSelector = true,
  showAddExpense = true,
  actionButton,
}) {
  const { selectedMonth, setSelectedMonth, openAddModal } = useExpense();

  const handlePrevMonth = () => {
    setSelectedMonth(getPreviousMonthKey(selectedMonth));
  };

  const handleNextMonth = () => {
    setSelectedMonth(getNextMonthKey(selectedMonth));
  };

  const handleResetCurrentMonth = () => {
    setSelectedMonth(getCurrentMonthKey());
  };

  const isCurrentMonth = selectedMonth === getCurrentMonthKey();
  const readableMonth = formatMonthReadable(selectedMonth);

  const hasActionButton = actionButton !== undefined ? Boolean(actionButton) : showAddExpense;
  const hasActions = showMonthSelector || hasActionButton;

  return (
    <header className="page-header">
      <div className="header-titles">
        <h1 className="header-page-title">{title}</h1>
        {subtitle && <p className="header-page-subtitle">{subtitle}</p>}
      </div>

      {hasActions && (
        <div className="header-actions">
          {showMonthSelector && (
            <div className="month-selector-group">
              <div className="month-nav">
                <button
                  type="button"
                  className="month-nav-btn"
                  onClick={handlePrevMonth}
                  aria-label="View previous month"
                  title="Previous month"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="month-display" title="Active reporting month">
                  <Calendar size={14} className="month-cal-icon" aria-hidden="true" />
                  <span className="month-name">{readableMonth}</span>
                </div>

                <button
                  type="button"
                  className="month-nav-btn"
                  onClick={handleNextMonth}
                  aria-label="View next month"
                  title="Next month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {!isCurrentMonth && (
                <button
                  type="button"
                  className="btn btn-subtle btn-sm current-month-btn"
                  onClick={handleResetCurrentMonth}
                  title="Return to today's month"
                >
                  This Month
                </button>
              )}
            </div>
          )}

          {actionButton !== undefined ? (
            actionButton
          ) : showAddExpense ? (
            <button
              type="button"
              className="btn btn-primary add-expense-btn"
              onClick={openAddModal}
            >
              <Plus size={16} />
              <span>Add Expense</span>
            </button>
          ) : null}
        </div>
      )}
    </header>
  );
}
