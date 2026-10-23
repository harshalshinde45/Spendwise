import React from 'react';
import { Receipt, SearchX, Plus, RefreshCw } from 'lucide-react';
import './EmptyState.css';

export function EmptyState({
  type = 'no-data', // 'no-data' | 'no-results'
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) {
  const isSearchNoResults = type === 'no-results';

  return (
    <div className="empty-state-container">
      <div className="empty-state-icon-wrapper">
        {isSearchNoResults ? (
          <SearchX size={32} className="empty-state-icon" aria-hidden="true" />
        ) : (
          <Receipt size={32} className="empty-state-icon" aria-hidden="true" />
        )}
      </div>

      <h3 className="empty-state-title">
        {title || (isSearchNoResults ? 'No matching transactions' : 'No expenses recorded yet')}
      </h3>

      <p className="empty-state-description">
        {description ||
          (isSearchNoResults
            ? 'Try adjusting your search keywords, category filters, or selected month.'
            : 'Start tracking your spending by adding your first expense or load sample demo data to explore.')}
      </p>

      <div className="empty-state-actions">
        {actionLabel && onAction && (
          <button type="button" className="btn btn-primary" onClick={onAction}>
            {actionLabel.includes('Add') && <Plus size={16} />}
            {actionLabel}
          </button>
        )}

        {secondaryActionLabel && onSecondaryAction && (
          <button type="button" className="btn btn-secondary" onClick={onSecondaryAction}>
            {secondaryActionLabel.includes('Demo') && <RefreshCw size={14} />}
            {secondaryActionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
