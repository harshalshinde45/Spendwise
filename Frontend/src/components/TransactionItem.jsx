import React from 'react';
import { useExpense } from '../context/ExpenseContext';
import { getCategoryByName } from '../data/categories';
import { CategoryIcon } from './CategoryIcon';
import { formatINR } from '../utils/currency';
import { formatDateReadable } from '../utils/dates';
import { Edit3, Trash2 } from 'lucide-react';
import './TransactionItem.css';

export function TransactionItem({ expense }) {
  const { openEditModal, openConfirmDialog, deleteExpense } = useExpense();
  const categoryMeta = getCategoryByName(expense.category);

  const handleDelete = () => {
    openConfirmDialog({
      title: 'Delete Expense',
      message: 'Are you sure you want to delete this transaction? This action cannot be undone.',
      confirmLabel: 'Delete Expense',
      isDanger: true,
      itemDetails: expense,
      onConfirm: () => deleteExpense(expense.id),
    });
  };

  const displayName = expense.description?.trim() || expense.category;

  return (
    <div className="transaction-row">
      {/* Category icon and main info */}
      <div className="trans-left">
        <div
          className="trans-category-icon"
          style={{ backgroundColor: categoryMeta.bgColor, color: categoryMeta.color }}
          title={categoryMeta.name}
        >
          <CategoryIcon iconName={categoryMeta.iconName} size={18} color={categoryMeta.color} />
        </div>

        <div className="trans-info">
          <div className="trans-title-line">
            <span className="trans-title">{displayName}</span>
            {expense.isDemo && <span className="demo-tag">Sample</span>}
          </div>
          <div className="trans-meta-line">
            <span
              className="trans-category-pill"
              style={{ color: categoryMeta.color }}
            >
              {expense.category}
            </span>
            <span className="meta-separator" aria-hidden="true">•</span>
            <time className="trans-date" dateTime={expense.date}>
              {formatDateReadable(expense.date)}
            </time>
          </div>
        </div>
      </div>

      {/* Amount & Actions */}
      <div className="trans-right">
        <div className="trans-amount">{formatINR(expense.amountPaise)}</div>

        <div className="trans-actions">
          <button
            type="button"
            className="trans-action-btn edit-btn"
            onClick={() => openEditModal(expense)}
            title="Edit expense"
            aria-label={`Edit ${displayName}`}
          >
            <Edit3 size={15} />
          </button>
          <button
            type="button"
            className="trans-action-btn delete-btn"
            onClick={handleDelete}
            title="Delete expense"
            aria-label={`Delete ${displayName}`}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
