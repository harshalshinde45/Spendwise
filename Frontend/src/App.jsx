import React, { useState } from 'react';
import { ExpenseProvider } from './context/ExpenseContext';
import { AppLayout } from './components/AppLayout';
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

export default function App() {
  return (
    <ExpenseProvider>
      <SpendWiseApp />
    </ExpenseProvider>
  );
}
