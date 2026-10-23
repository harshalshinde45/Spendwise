import React, { useEffect, useRef } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { AlertTriangle, X } from 'lucide-react';
import { formatINR } from '../utils/currency';
import { formatDateReadable } from '../utils/dates';
import './ConfirmDialog.css';

export function ConfirmDialog() {
  const { confirmDialog, closeConfirmDialog } = useExpense();
  const cancelBtnRef = useRef(null);

  useEffect(() => {
    if (confirmDialog.isOpen) {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          closeConfirmDialog();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      cancelBtnRef.current?.focus();
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [confirmDialog.isOpen, closeConfirmDialog]);

  if (!confirmDialog.isOpen) return null;

  const handleConfirm = () => {
    confirmDialog.onConfirm();
    closeConfirmDialog();
  };

  const { itemDetails } = confirmDialog;

  return (
    <div className="modal-backdrop" onClick={closeConfirmDialog}>
      <div
        className="modal-content confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-header">
          <div className={`confirm-icon-wrapper ${confirmDialog.isDanger ? 'danger' : 'warning'}`}>
            <AlertTriangle size={20} />
          </div>
          <h2 id="confirm-dialog-title" className="confirm-title">
            {confirmDialog.title}
          </h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={closeConfirmDialog}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <p className="confirm-message">{confirmDialog.message}</p>

        {itemDetails && (
          <div className="confirm-item-preview">
            <div className="confirm-item-row">
              <span className="confirm-item-label">Amount:</span>
              <span className="confirm-item-value highlight">{formatINR(itemDetails.amountPaise)}</span>
            </div>
            <div className="confirm-item-row">
              <span className="confirm-item-label">Category:</span>
              <span className="confirm-item-value">{itemDetails.category}</span>
            </div>
            <div className="confirm-item-row">
              <span className="confirm-item-label">Date:</span>
              <span className="confirm-item-value">{formatDateReadable(itemDetails.date)}</span>
            </div>
            {itemDetails.description && (
              <div className="confirm-item-row">
                <span className="confirm-item-label">Description:</span>
                <span className="confirm-item-value">{itemDetails.description}</span>
              </div>
            )}
          </div>
        )}

        <div className="confirm-actions">
          <button
            ref={cancelBtnRef}
            type="button"
            className="btn btn-secondary"
            onClick={closeConfirmDialog}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${confirmDialog.isDanger ? 'btn-danger' : 'btn-primary'}`}
            onClick={handleConfirm}
          >
            {confirmDialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
