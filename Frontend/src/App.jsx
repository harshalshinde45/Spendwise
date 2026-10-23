import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ExpenseProvider } from './context/ExpenseContext';
import { AppLayout } from './components/AppLayout';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SavingsGoalsPage } from './pages/SavingsGoalsPage';
import { SettingsPage } from './pages/SettingsPage';

export function SpendWiseApp() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <AppLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'dashboard' && (
        <DashboardPage onNavigateToTransactions={() => setActiveTab('transactions')} />
      )}
      {activeTab === 'transactions' && <TransactionsPage />}
      {(activeTab === 'budgets' || activeTab === 'time-machine') && <BudgetsPage />}
      {activeTab === 'analytics' && <AnalyticsPage />}
      {activeTab === 'goals' && <SavingsGoalsPage />}
      {activeTab === 'settings' && <SettingsPage />}
    </AppLayout>
  );
}

function AuthRouter() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="auth-root-wrapper">
        <div style={{ textAlign: 'center', zIndex: 1 }}>
          <div className="brand-logo-mark" style={{ margin: '0 auto 16px auto', width: '48px', height: '48px' }}>
            <svg
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="brand-svg"
            >
              <rect x="2" y="2" width="24" height="24" rx="7" fill="var(--accent-primary, #A9553D)" />
              <path
                d="M14 6V22M14 6C17.5 6 20.5 8.5 20.5 11.5C20.5 14.5 16 15.5 14 16C12 16.5 7.5 17.5 7.5 20.5"
                stroke="#FFFFFF"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="14" cy="14" r="1.8" fill="#FFFFFF" />
            </svg>
          </div>
          <div
            className="auth-btn-spinner"
            style={{
              margin: '0 auto 14px auto',
              borderColor: 'var(--color-border, #DCD6C9)',
              borderTopColor: 'var(--accent-primary, #A9553D)',
              width: '24px',
              height: '24px',
            }}
          />
          <p style={{ fontSize: '14px', color: 'var(--text-secondary, #77766C)', fontWeight: 500 }}>
            Restoring your private workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <ExpenseProvider>
      <SpendWiseApp />
    </ExpenseProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthRouter />
    </AuthProvider>
  );
}
