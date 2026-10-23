import React, { useState, useEffect, useRef } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { formatMonthReadable } from '../utils/dates';
import { paiseToInputValue } from '../utils/currency';
import { validateBudget } from '../utils/validation';
import { X, AlertCircle, Wallet } from 'lucide-react';
import './ExpenseModal.css';

export function BudgetModal() {
  const {
    isBudgetModalOpen,
    closeBudgetModal,
    selectedMonth,
    currentBudgetPaise,
    setMonthlyBudget,
  } = useExpense();

  const [budgetAmount, setBudgetAmount] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isBudgetModalOpen) {
      setBudgetAmount(paiseToInputValue(currentBudgetPaise));
      setError('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isBudgetModalOpen, currentBudgetPaise]);

  useEffect(() => {
    if (isBudgetModalOpen) {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          closeBudgetModal();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isBudgetModalOpen, closeBudgetModal]);

  if (!isBudgetModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const validation = validateBudget(budgetAmount);

    if (!validation.isValid) {
      setError(validation.error || 'Please enter a valid amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      await setMonthlyBudget(selectedMonth, validation.budgetPaise);
      closeBudgetModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  const readableMonth = formatMonthReadable(selectedMonth);

  return (
    <div className="modal-backdrop" onClick={closeBudgetModal}>
      <div
        className="modal-content expense-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="budget-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wallet size={20} color="var(--accent-primary)" />
            <h2 id="budget-modal-title" className="modal-title">
              Monthly Budget — {readableMonth}
            </h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={closeBudgetModal}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
          Set your total target spending limit for {readableMonth}. Budgets are tracked separately for each month. Leave empty or set to 0 to remove the budget limit.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="budget-input" className="form-label">
              Monthly Limit
            </label>
            <div className="amount-input-wrapper">
              <span className="currency-prefix" aria-hidden="true">₹</span>
              <input
                ref={inputRef}
                id="budget-input"
                type="text"
                inputMode="decimal"
                placeholder="e.g. 10000"
                value={budgetAmount}
                onChange={(e) => {
                  setBudgetAmount(e.target.value);
                  if (error) setError('');
                }}
                className={`form-input amount-input ${error ? 'has-error' : ''}`}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'budget-input-error' : undefined}
              />
            </div>
            {error && (
              <p id="budget-input-error" className="form-error">
                <AlertCircle size={14} /> {error}
              </p>
            )}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={closeBudgetModal}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
