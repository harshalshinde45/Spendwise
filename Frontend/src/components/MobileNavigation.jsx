import React, { useState } from 'react';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  PieChart,
  Target,
  Settings,
  Plus,
  MoreHorizontal,
  X,
  Sun,
  Moon,
  LogOut,
  Calendar,
} from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { useAuth } from '../context/AuthContext';
import { formatMonthReadable } from '../utils/dates';
import './MobileNavigation.css';

export function MobileNavigation({ activeTab, onTabChange }) {
  const { openAddModal, selectedMonth, theme, setTheme } = useExpense();
  const { user, logout } = useAuth();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const monthLabel = formatMonthReadable(selectedMonth);

  const userInitials = (user?.name || 'User')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

  const isMoreActive = ['analytics', 'goals', 'settings'].includes(activeTab);

  const handleTabSelect = (tabId) => {
    onTabChange(tabId);
    setIsMoreMenuOpen(false);
  };

  const handleToggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <>
      {/* Mobile Top Header (Clean brand + Month indicator + User profile avatar) */}
      <header className="mobile-top-bar" aria-label="SpendWise Mobile Bar">
        <div className="mobile-brand" onClick={() => onTabChange('dashboard')}>
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
              <circle cx="14" cy="14" r="1.8" fill="#FFFFFF" />
            </svg>
          </div>
          <span className="mobile-brand-title">SpendWise</span>
        </div>

        <div className="mobile-header-right">
          <div className="mobile-month-badge" title="Active reporting month">
            <Calendar size={12} aria-hidden="true" />
            <span>{monthLabel}</span>
          </div>

          <button
            type="button"
            className="mobile-profile-avatar"
            onClick={() => onTabChange('settings')}
            title="Account Settings"
            aria-label="Account Settings"
          >
            {userInitials || 'U'}
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar with Prominent Thumb-Friendly Center [+] Action */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        {/* 1. Overview */}
        <button
          type="button"
          className={`mobile-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleTabSelect('dashboard')}
          aria-label="Overview Dashboard"
        >
          <LayoutDashboard size={20} className="mobile-nav-icon" />
          <span className="mobile-nav-label">Overview</span>
        </button>

        {/* 2. Transactions */}
        <button
          type="button"
          className={`mobile-nav-btn ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => handleTabSelect('transactions')}
          aria-label="Transactions"
        >
          <Receipt size={20} className="mobile-nav-icon" />
          <span className="mobile-nav-label">Activity</span>
        </button>

        {/* 3. Center Elevated Action Button [+] Add Expense */}
        <div className="mobile-center-action-wrapper">
          <button
            type="button"
            className="mobile-center-add-btn"
            onClick={openAddModal}
            aria-label="Add new expense"
            title="Add New Expense"
          >
            <Plus size={24} />
          </button>
        </div>

        {/* 4. Budgets */}
        <button
          type="button"
          className={`mobile-nav-btn ${activeTab === 'budgets' ? 'active' : ''}`}
          onClick={() => handleTabSelect('budgets')}
          aria-label="Budgets"
        >
          <Wallet size={20} className="mobile-nav-icon" />
          <span className="mobile-nav-label">Budgets</span>
        </button>

        {/* 5. More (Analytics, Goals, Settings) */}
        <button
          type="button"
          className={`mobile-nav-btn ${isMoreActive || isMoreMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMoreMenuOpen((prev) => !prev)}
          aria-label="More Options"
          aria-expanded={isMoreMenuOpen}
        >
          <MoreHorizontal size={20} className="mobile-nav-icon" />
          <span className="mobile-nav-label">More</span>
        </button>
      </nav>

      {/* Mobile More Drawer / Popover Menu */}
      {isMoreMenuOpen && (
        <div className="mobile-more-backdrop" onClick={() => setIsMoreMenuOpen(false)}>
          <div
            className="mobile-more-sheet"
            role="dialog"
            aria-label="Additional Navigation"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-more-header">
              <span className="mobile-more-title">More Features</span>
              <button
                type="button"
                className="mobile-more-close"
                onClick={() => setIsMoreMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mobile-more-grid">
              <button
                type="button"
                className={`mobile-more-item ${activeTab === 'analytics' ? 'active' : ''}`}
                onClick={() => handleTabSelect('analytics')}
              >
                <div className="more-item-icon-wrap analytics">
                  <PieChart size={20} />
                </div>
                <div className="more-item-text">
                  <span className="more-item-title">Analytics</span>
                  <span className="more-item-desc">Spending breakdown & trends</span>
                </div>
              </button>

              <button
                type="button"
                className={`mobile-more-item ${activeTab === 'goals' ? 'active' : ''}`}
                onClick={() => handleTabSelect('goals')}
              >
                <div className="more-item-icon-wrap goals">
                  <Target size={20} />
                </div>
                <div className="more-item-text">
                  <span className="more-item-title">Savings Goals</span>
                  <span className="more-item-desc">Track financial targets</span>
                </div>
              </button>

              <button
                type="button"
                className={`mobile-more-item ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => handleTabSelect('settings')}
              >
                <div className="more-item-icon-wrap settings">
                  <Settings size={20} />
                </div>
                <div className="more-item-text">
                  <span className="more-item-title">Settings</span>
                  <span className="more-item-desc">Preferences & data export</span>
                </div>
              </button>
            </div>

            <div className="mobile-more-footer">
              <button
                type="button"
                className="mobile-theme-toggle-btn"
                onClick={handleToggleTheme}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>

              {user && (
                <button
                  type="button"
                  className="mobile-signout-btn"
                  onClick={logout}
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
