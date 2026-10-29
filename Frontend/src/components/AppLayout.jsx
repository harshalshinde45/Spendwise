import React from 'react';
import { useExpense } from '../context/ExpenseContext';
import { Sidebar } from './Sidebar';
import { MobileNavigation } from './MobileNavigation';
import { ExpenseModal } from './ExpenseModal';
import { BudgetModal } from './BudgetModal';
import { ConfirmDialog } from './ConfirmDialog';
import { DatabaseStatusBanner } from './DatabaseStatusBanner';
import { Toast } from './Toast';
import { Plus } from 'lucide-react';
import './AppLayout.css';

export function AppLayout({ activeTab, onTabChange, children }) {
  return (
    <div className="app-shell">
      {/* Desktop Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={onTabChange} />

      <div className="app-main-column">
        {/* Mobile Header and Bottom Bar */}
        <MobileNavigation activeTab={activeTab} onTabChange={onTabChange} />

        {/* Primary Page Content */}
        <main className="app-content-container" id="main-content">
          <DatabaseStatusBanner />
          {children}
        </main>
      </div>

      {/* Global Modals & Dialogs */}
      <ExpenseModal />
      <BudgetModal />
      <ConfirmDialog />
      <Toast />
    </div>
  );
}
