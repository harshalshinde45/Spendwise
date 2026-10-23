import React from 'react';
import { useExpense } from '../context/ExpenseContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import './Toast.css';

export function Toast() {
  const { toasts, removeToast } = useExpense();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite" role="status">
      {toasts.map((toast) => {
        let Icon = CheckCircle2;
        if (toast.type === 'error') Icon = AlertCircle;
        else if (toast.type === 'warning') Icon = AlertTriangle;
        else if (toast.type === 'info') Icon = Info;

        return (
          <div key={toast.id} className={`toast-item toast-${toast.type}`}>
            <Icon size={18} className="toast-icon" aria-hidden="true" />
            <div className="toast-message">{toast.message}</div>
            <button
              type="button"
              className="toast-close-btn"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
