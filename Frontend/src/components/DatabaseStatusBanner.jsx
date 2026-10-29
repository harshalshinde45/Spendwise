import React from 'react';
import { useExpense } from '../context/ExpenseContext';
import { Database, AlertTriangle, RefreshCw, UploadCloud, X } from 'lucide-react';
import './DatabaseStatusBanner.css';

export function DatabaseStatusBanner() {
  const {
    dbState,
    refreshData,
    localDataMigration,
    migrateLocalData,
    dismissMigrationBanner,
    isMigrating,
  } = useExpense();

  return (
    <div className="status-banners-wrapper" aria-label="System Connectivity & Alerts">
      {/* 1. Database Disconnected Alert */}
      {!dbState.isOperational && dbState.status !== 'checking' && (
        <div className="db-alert-banner alert-warning" role="alert">
          <div className="alert-content-left">
            <AlertTriangle size={18} className="alert-icon" aria-hidden="true" />
            <div className="alert-text-block">
              <strong>Cloud Service Temporarily Offline</strong>
              <p>
                Unable to reach cloud synchronization. Please check your network connection or verify your server status.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm retry-btn"
            onClick={refreshData}
          >
            <RefreshCw size={13} />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* 2. Detected Unmigrated Local Storage Data Alert */}
      {dbState.isOperational && localDataMigration && (
        <div className="db-alert-banner alert-info" role="region" aria-label="Data Migration Notice">
          <div className="alert-content-left">
            <UploadCloud size={20} className="alert-icon" aria-hidden="true" />
            <div className="alert-text-block">
              <strong>Local Storage Records Detected</strong>
              <p>
                Found {localDataMigration.expensesCount} expenses and {localDataMigration.budgetsCount} budgets in your browser storage. Would you like to sync them to your cloud account?
              </p>
            </div>
          </div>
          <div className="alert-actions-group">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={migrateLocalData}
              disabled={isMigrating}
            >
              <UploadCloud size={14} />
              <span>{isMigrating ? 'Syncing...' : 'Sync to Cloud'}</span>
            </button>
            <button
              type="button"
              className="btn btn-subtle btn-sm"
              onClick={dismissMigrationBanner}
              aria-label="Dismiss migration prompt"
            >
              <X size={14} />
              <span>Dismiss</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
