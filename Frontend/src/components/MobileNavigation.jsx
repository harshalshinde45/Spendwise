import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  PieChart,
  Sparkles,
  Target,
  Settings,
  Plus,
} from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import './MobileNavigation.css';

export function MobileNavigation({ activeTab, onTabChange }) {
  const { openAddModal } = useExpense();

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'budgets', label: 'Budgets', icon: Wallet },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Top Header */}
      <header className="mobile-top-bar" aria-label="SpendWise Mobile Bar">
        <div className="mobile-brand">
          <div className="mobile-brand-mark">
            <svg
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mobile-brand-svg"
              aria-hidden="true"
            >
              <rect x="2" y="2" width="24" height="24" rx="7" fill="var(--accent-primary)" />
              <path
                d="M14 6V22M14 6C17.5 6 20.5 8.5 20.5 11.5C20.5 14.5 16 15.5 14 16C12 16.5 7.5 17.5 7.5 20.5"
                stroke="#FFFFFF"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="mobile-brand-title">SpendWise</span>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-sm mobile-add-btn"
          onClick={openAddModal}
          aria-label="Add new expense"
        >
          <Plus size={16} />
          <span>Add</span>
        </button>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`mobile-nav-btn ${isActive ? 'active' : ''}`}
              onClick={() => onTabChange(item.id)}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={18} className="mobile-nav-icon" aria-hidden="true" />
              <span className="mobile-nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
