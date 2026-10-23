import React from 'react';
import { TransactionItem } from './TransactionItem';
import { EmptyState } from './EmptyState';
import { formatINR } from '../utils/currency';
import { useExpense } from '../context/ExpenseContext';
import './TransactionList.css';

export function TransactionList({
  expenses = [],
  isFiltered = false,
  onResetFilters,
  onAddClick,
  limit,
}) {
  const { openAddModal, loadDemo, expenses: allStoredExpenses } = useExpense();

  if (expenses.length === 0) {
    if (isFiltered) {
      return (
        <EmptyState
          type="no-results"
          title="No transactions match your search"
          description="We couldn't find any expenses matching your active filter criteria."
          actionLabel="Clear Filters"
          onAction={onResetFilters}
        />
      );
    }

    if (allStoredExpenses.length === 0) {
      return (
        <EmptyState
          type="no-data"
          title="No expenses recorded yet"
          description="Start building your spending history. Add an expense or load sample demo data to see SpendWise in action."
          actionLabel="Add First Expense"
          onAction={onAddClick || openAddModal}
          secondaryActionLabel="Load Demo Data"
          onSecondaryAction={loadDemo}
        />
      );
    }

    return (
      <EmptyState
        type="no-data"
        title="No expenses for this month"
        description="There are no recorded expenses for the selected month."
        actionLabel="Add Expense"
        onAction={onAddClick || openAddModal}
      />
    );
  }

  const displayedExpenses = limit ? expenses.slice(0, limit) : expenses;
  const totalFilteredPaise = displayedExpenses.reduce(
    (sum, exp) => sum + (exp.amountPaise || 0),
    0
  );

  return (
    <div className="transaction-list-wrapper">
      <div className="transaction-list-items">
        {displayedExpenses.map((exp) => (
          <TransactionItem key={exp.id} expense={exp} />
        ))}
      </div>

      {limit && expenses.length > limit && (
        <div className="transaction-list-footer">
          <span className="showing-count">
            Showing {limit} of {expenses.length} transactions
          </span>
        </div>
      )}
    </div>
  );
}
