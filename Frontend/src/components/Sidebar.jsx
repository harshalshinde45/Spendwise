import React, { useState, useEffect } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  PieChart,
  Sparkles,
  Target,
  Settings,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react';
import './Sidebar.css';

const COLLAPSED_STORAGE_KEY = 'spendwise:sidebar_collapsed';

export function Sidebar({ activeTab, onTabChange }) {
  const { openAddModal, theme, setTheme } = useExpense();
  const { user, logout } = useAuth();

  const userInitials = (user?.name || 'User')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(COLLAPSED_STORAGE_KEY) === 'true';
      }
    } catch (e) {
      console.warn('Error reading sidebar collapse state:', e);
    }
    return false;
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(COLLAPSED_STORAGE_KEY, String(next));
        }
      } catch (e) {
        console.warn('Error saving sidebar collapse state:', e);
      }
      return next;
    });
  };

  const navGroups = [
    {
      group: 'Finance',
      items: [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: 'transactions', label: 'Transactions', icon: Receipt },
        { id: 'budgets', label: 'Budgets', icon: Wallet },
        { id: 'analytics', label: 'Analytics', icon: PieChart },
      ],
    },
    {
      group: 'Planning',
      items: [
        { id: 'goals', label: 'Savings Goals', icon: Target },
      ],
    },
    {
      group: 'System',
      items: [
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <aside
      className={`app-sidebar ${isCollapsed ? 'is-collapsed' : ''}`}
      aria-label="Main Navigation"
    >
      {/* Brand Header */}
      <div className="sidebar-brand-row">
        <div className="brand-logo-mark" title="SpendWise">
          <svg
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="brand-svg"
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

        {!isCollapsed && (
          <div className="brand-text-group">
            <span className="brand-title">SpendWise</span>
            <span className="brand-tagline">Intelligent Finance</span>
          </div>
        )}
      </div>

      {/* Prominent Quick Add Expense Button */}
      <div className="sidebar-action-wrap">
        <button
          type="button"
          className={`btn btn-primary sidebar-add-btn ${isCollapsed ? 'collapsed' : ''}`}
          onClick={openAddModal}
          title="Add New Expense"
          aria-label="Add new expense"
        >
          <Plus size={18} />
          {!isCollapsed && <span>Add Expense</span>}
        </button>
      </div>

      {/* Grouped Navigation Links */}
      <nav className="sidebar-nav">
        {navGroups.map((grp) => (
          <div key={grp.group} className="nav-group-section">
            {!isCollapsed && (
              <span className="nav-group-heading">{grp.group}</span>
            )}
            <div className="nav-group-items">
              {grp.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => onTabChange(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon size={18} className="nav-icon" aria-hidden="true" />
                    {!isCollapsed && <span className="nav-label">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Authenticated User Session Profile */}
      {user && (
        <div className={`sidebar-user-section ${isCollapsed ? 'collapsed' : ''}`}>
          <div className="user-avatar-badge" title={user.name}>
            {userInitials}
          </div>
          {!isCollapsed && (
            <div className="user-info-text">
              <span className="user-display-name">{user.name}</span>
              <span className="user-email-text" title={user.email}>{user.email}</span>
            </div>
          )}
          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={logout}
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      )}

      {/* Sidebar Footer Controls */}
      <div className="sidebar-footer">
        {!isCollapsed && (
          <span className="sidebar-version-tag">SpendWise v1.0</span>
        )}

        <div className="sidebar-footer-actions">
          {/* Theme Switcher */}
          <button
            type="button"
            className="btn-icon theme-toggle-btn"
            onClick={handleThemeToggle}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            className="btn-icon collapse-toggle-btn"
            onClick={toggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
        </div>
      </div>
    </aside>
  );
}
