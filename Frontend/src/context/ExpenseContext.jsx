import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  STORAGE_KEYS,
  safeGetItem,
  clearSpendWiseStorage,
  isValidStoredExpense,
  isValidStoredBudgets,
} from '../utils/storage';
import { getCurrentMonthKey } from '../utils/dates';
import {
  getExpensesForMonth,
  calculateMonthlyTotal,
  calculateCategoryTotals,
  calculateBudgetStatus,
  calculateSmartBudgetAlert,
} from '../utils/calculations';
import { expenseService } from '../services/expenseService';
import { budgetService } from '../services/budgetService';
import { analyticsService } from '../services/analyticsService';
import { goalService } from '../services/goalService';
import {
  calculateFinancialWeather,
  calculateSpendingSpeedometer,
  calculateExpenseDetective,
} from '../utils/intelligence';
import { useAuth } from './AuthContext';

const ExpenseContext = createContext(null);

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'sw-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
}

export function ExpenseProvider({ children }) {
  // --- Core Data State (MongoDB source of truth) ---
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [goals, setGoals] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(() => getCurrentMonthKey());
  const [isLoading, setIsLoading] = useState(true);

  // --- Database & Connectivity State ---
  const [dbState, setDbState] = useState({
    isOperational: false,
    status: 'checking', // 'checking' | 'connected' | 'disconnected'
    message: '',
  });

  // --- Local Storage Migration Detection ---
  const [localDataMigration, setLocalDataMigration] = useState(null);
  const [isMigrating, setIsMigrating] = useState(false);

  // --- UI & Notification States ---
  const [toasts, setToasts] = useState([]);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  // --- Confirm Dialog State ---
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    itemDetails: null,
    confirmLabel: 'Confirm',
    isDanger: true,
    onConfirm: () => {},
  });

  // --- Theme State (Persisted in browser Local Storage as a harmless preference) ---
  const [theme, setThemeState] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedTheme = window.localStorage.getItem(STORAGE_KEYS.THEME);
        if (savedTheme === 'dark' || savedTheme === 'light') {
          return savedTheme;
        }
      }
    } catch (e) {
      console.warn('Error reading theme from storage:', e);
    }
    return 'light';
  });

  const setTheme = useCallback((newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      setThemeState(newTheme);
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
        }
      } catch (e) {
        console.warn('Error saving theme to storage:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  // --- Toast Manager ---
  const showToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = generateId();
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // --- Detect Local Storage Records for Migration ---
  const checkLocalStorageMigration = useCallback(() => {
    try {
      const expRes = safeGetItem(STORAGE_KEYS.EXPENSES, [], (arr) => Array.isArray(arr) && arr.length > 0);
      const bgtRes = safeGetItem(STORAGE_KEYS.BUDGETS, {}, (obj) => typeof obj === 'object' && Object.keys(obj).length > 0);

      const expCount = Array.isArray(expRes.data) ? expRes.data.length : 0;
      const bgtCount = typeof bgtRes.data === 'object' ? Object.keys(bgtRes.data).length : 0;

      if (expCount > 0 || bgtCount > 0) {
        setLocalDataMigration({
          expensesCount: expCount,
          budgetsCount: bgtCount,
          expenses: expRes.data,
          budgets: bgtRes.data,
        });
      } else {
        setLocalDataMigration(null);
      }
    } catch (e) {
      console.warn('Error detecting local storage records:', e);
    }
  }, []);

  // --- Fetch Data from Backend ---
  const loadBackendData = useCallback(async (retryCount = 0) => {
    setIsLoading(true);
    try {
      // 1. Check Backend Health & Database Connectivity
      const health = await analyticsService.checkHealth();
      const isConnected = health?.database?.status === 'connected' && health?.database?.isOperational === true;

      if (isConnected) {
        setDbState({
          isOperational: true,
          status: 'connected',
          message: 'Connected to MongoDB',
        });

        // 2. Fetch Expenses, Budgets & Savings Goals from MongoDB
        const [loadedExpenses, loadedBudgets, loadedGoals] = await Promise.all([
          expenseService.getExpenses(),
          budgetService.getAllBudgets(),
          goalService.getGoals().catch(() => []),
        ]);

        setExpenses(Array.isArray(loadedExpenses) ? loadedExpenses : []);
        setBudgets(loadedBudgets && typeof loadedBudgets === 'object' ? loadedBudgets : {});
        setGoals(Array.isArray(loadedGoals) ? loadedGoals : []);

        // 3. Check for any unmigrated local storage records
        checkLocalStorageMigration();
        setIsLoading(false);
      } else {
        setDbState({
          isOperational: false,
          status: 'disconnected',
          message: 'MongoDB is disconnected. Please configure MONGODB_URI in backend/.env to persist expenses.',
        });
        setExpenses([]);
        setBudgets({});
        setGoals([]);
        setIsLoading(false);
      }
    } catch (err) {
      // Graceful cold-start retry for free-tier hosting (Render spins down when idle)
      if (retryCount < 2) {
        console.warn(`[SpendWise API] Server warming up, auto-retrying in 3s (attempt ${retryCount + 1} of 2)...`);
        setTimeout(() => {
          loadBackendData(retryCount + 1);
        }, 3000);
        return;
      }

      console.error('[SpendWise API Error]:', err.message);
      setDbState({
        isOperational: false,
        status: 'disconnected',
        message: err.message || 'Unable to connect to backend server. Verify your backend service is running.',
      });
      setExpenses([]);
      setBudgets({});
      setGoals([]);
      setIsLoading(false);
    }
  }, [checkLocalStorageMigration]);

  // Auth awareness for data loading & session isolation
  let isAuthenticated = true;
  let currentUserId = null;
  try {
    const auth = useAuth();
    isAuthenticated = auth.isAuthenticated;
    currentUserId = auth.user?.id;
  } catch {
    // Graceful fallback if ExpenseProvider is rendered outside AuthProvider
  }

  // Load backend data when authenticated; clear in-memory state when unauthenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadBackendData();
    } else {
      setExpenses([]);
      setBudgets({});
      setGoals([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, currentUserId, loadBackendData]);

  // --- CRUD Operations (Connecting to MongoDB via REST API) ---

  const addExpense = useCallback(
    async ({ amountPaise, category, date, description }) => {
      if (!dbState.isOperational) {
        showToast(
          'Cannot save expense: MongoDB database is disconnected. Please configure MONGODB_URI in backend/.env.',
          'error',
          5000
        );
        return null;
      }

      try {
        const savedExpense = await expenseService.createExpense({
          amountPaise,
          category,
          date,
          description: description || '',
        });

        // Update local state with the saved record from MongoDB
        setExpenses((prev) => [savedExpense, ...prev]);
        showToast('Expense recorded successfully.', 'success');
        return savedExpense;
      } catch (err) {
        showToast(err.message || 'Failed to save expense.', 'error');
        return null;
      }
    },
    [dbState.isOperational, showToast]
  );

  const updateExpense = useCallback(
    async (id, updates) => {
      if (!dbState.isOperational) {
        showToast(
          'Cannot update expense: MongoDB database is disconnected.',
          'error',
          5000
        );
        return null;
      }

      try {
        const updatedExpense = await expenseService.updateExpense(id, {
          amountPaise: updates.amountPaise,
          category: updates.category,
          date: updates.date,
          description: updates.description || '',
        });

        setExpenses((prev) =>
          prev.map((e) => (e.id === id ? updatedExpense : e))
        );
        showToast('Expense updated successfully.', 'success');
        return updatedExpense;
      } catch (err) {
        showToast(err.message || 'Failed to update expense.', 'error');
        return null;
      }
    },
    [dbState.isOperational, showToast]
  );

  const deleteExpense = useCallback(
    async (id) => {
      if (!dbState.isOperational) {
        showToast(
          'Cannot delete expense: MongoDB database is disconnected.',
          'error',
          5000
        );
        return;
      }

      try {
        await expenseService.deleteExpense(id);
        setExpenses((prev) => prev.filter((e) => e.id !== id));
        showToast('Expense deleted.', 'info');
      } catch (err) {
        showToast(err.message || 'Failed to delete expense.', 'error');
      }
    },
    [dbState.isOperational, showToast]
  );

  const setMonthlyBudget = useCallback(
    async (monthKey, amountPaise) => {
      if (!dbState.isOperational) {
        showToast(
          'Cannot save budget: MongoDB database is disconnected.',
          'error',
          5000
        );
        return;
      }

      try {
        await budgetService.setBudgetForMonth(monthKey, amountPaise);

        setBudgets((prev) => {
          const next = { ...prev };
          if (amountPaise <= 0) {
            delete next[monthKey];
          } else {
            next[monthKey] = amountPaise;
          }
          return next;
        });

        showToast(
          amountPaise > 0 ? 'Monthly budget updated.' : 'Monthly budget cleared.',
          'success'
        );
      } catch (err) {
        showToast(err.message || 'Failed to update budget.', 'error');
      }
    },
    [dbState.isOperational, showToast]
  );

  const clearAllData = useCallback(async () => {
    if (!dbState.isOperational) {
      showToast('Cannot clear database: MongoDB is not connected.', 'error');
      return;
    }

    try {
      await analyticsService.clearAllDatabaseData();
      setExpenses([]);
      setBudgets({});
      setGoals([]);
      showToast('All expense and budget records have been permanently cleared from MongoDB.', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to clear data.', 'error');
    }
  }, [dbState.isOperational, showToast]);

  // --- Savings Goals CRUD ---
  const addGoal = useCallback(
    async (goalData) => {
      if (!dbState.isOperational) {
        showToast('Cannot save goal: MongoDB is disconnected.', 'error');
        return null;
      }
      try {
        const saved = await goalService.createGoal(goalData);
        setGoals((prev) => [saved, ...prev]);
        showToast(`Savings goal "${saved.name}" established!`, 'success');
        return saved;
      } catch (err) {
        showToast(err.message || 'Failed to create savings goal.', 'error');
        return null;
      }
    },
    [dbState.isOperational, showToast]
  );

  const updateGoal = useCallback(
    async (id, updates) => {
      if (!dbState.isOperational) {
        showToast('Cannot update goal: MongoDB is disconnected.', 'error');
        return null;
      }
      try {
        const updated = await goalService.updateGoal(id, updates);
        setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
        showToast('Savings goal updated.', 'success');
        return updated;
      } catch (err) {
        showToast(err.message || 'Failed to update goal.', 'error');
        return null;
      }
    },
    [dbState.isOperational, showToast]
  );

  const deleteGoal = useCallback(
    async (id) => {
      if (!dbState.isOperational) {
        showToast('Cannot delete goal: MongoDB is disconnected.', 'error');
        return;
      }
      try {
        await goalService.deleteGoal(id);
        setGoals((prev) => prev.filter((g) => g.id !== id));
        showToast('Savings goal removed.', 'info');
      } catch (err) {
        showToast(err.message || 'Failed to delete goal.', 'error');
      }
    },
    [dbState.isOperational, showToast]
  );

  const contributeToGoal = useCallback(
    async (id, amountPaise) => {
      if (!dbState.isOperational) {
        showToast('Cannot save contribution: MongoDB is disconnected.', 'error');
        return null;
      }
      try {
        const updated = await goalService.contributeToGoal(id, amountPaise);
        setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
        showToast('Contribution added to savings goal!', 'success');
        return updated;
      } catch (err) {
        showToast(err.message || 'Failed to record contribution.', 'error');
        return null;
      }
    },
    [dbState.isOperational, showToast]
  );

  // --- Safe Migration of Existing Local Storage Records ---
  const migrateLocalData = useCallback(async () => {
    if (!localDataMigration) return;
    if (!dbState.isOperational) {
      showToast('Cannot migrate data: MongoDB database is disconnected.', 'error');
      return;
    }

    setIsMigrating(true);
    try {
      const res = await analyticsService.migrateData({
        expenses: localDataMigration.expenses || [],
        budgets: localDataMigration.budgets || {},
      });

      // Verification: reload fresh data from database
      await loadBackendData();

      // Clear local storage expenses and budgets ONLY after successful verification
      clearSpendWiseStorage();
      setLocalDataMigration(null);

      showToast(
        `Migration successful: Imported ${res.summary?.expensesImported || 0} expenses and ${res.summary?.budgetsConfigured || 0} budgets.`,
        'success',
        6000
      );
    } catch (err) {
      showToast(err.message || 'Failed to migrate data to MongoDB.', 'error');
    } finally {
      setIsMigrating(false);
    }
  }, [localDataMigration, dbState.isOperational, loadBackendData, showToast]);

  const dismissMigrationBanner = useCallback(() => {
    setLocalDataMigration(null);
  }, []);

  // --- Modal Helpers ---
  const openAddModal = useCallback(() => {
    setEditingExpense(null);
    setIsExpenseModalOpen(true);
  }, []);

  const openEditModal = useCallback((expense) => {
    setEditingExpense(expense);
    setIsExpenseModalOpen(true);
  }, []);

  const closeExpenseModal = useCallback(() => {
    setIsExpenseModalOpen(false);
    setEditingExpense(null);
  }, []);

  const openBudgetModal = useCallback(() => {
    setIsBudgetModalOpen(true);
  }, []);

  const closeBudgetModal = useCallback(() => {
    setIsBudgetModalOpen(false);
  }, []);

  const openConfirmDialog = useCallback((config) => {
    setConfirmDialog({
      isOpen: true,
      title: config.title || 'Are you sure?',
      message: config.message || '',
      itemDetails: config.itemDetails || null,
      confirmLabel: config.confirmLabel || 'Confirm',
      isDanger: config.isDanger !== undefined ? config.isDanger : true,
      onConfirm: config.onConfirm || (() => {}),
    });
  }, []);

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // --- Derived Calculations for Selected Month ---
  const monthlyExpenses = useMemo(() => {
    return getExpensesForMonth(expenses, selectedMonth);
  }, [expenses, selectedMonth]);

  const monthlyTotalPaise = useMemo(() => {
    return calculateMonthlyTotal(expenses, selectedMonth);
  }, [expenses, selectedMonth]);

  const currentBudgetPaise = useMemo(() => {
    return budgets[selectedMonth] || 0;
  }, [budgets, selectedMonth]);

  const budgetStatus = useMemo(() => {
    return calculateBudgetStatus(currentBudgetPaise, monthlyTotalPaise);
  }, [currentBudgetPaise, monthlyTotalPaise]);

  const categoryTotals = useMemo(() => {
    return calculateCategoryTotals(expenses, selectedMonth);
  }, [expenses, selectedMonth]);

  const smartBudgetAlert = useMemo(() => {
    return calculateSmartBudgetAlert({
      budgetPaise: currentBudgetPaise,
      totalSpentPaise: monthlyTotalPaise,
      monthKey: selectedMonth,
      categoryTotals,
    });
  }, [currentBudgetPaise, monthlyTotalPaise, selectedMonth, categoryTotals]);

  // --- Intelligence Features ---
  const financialWeather = useMemo(() => {
    return calculateFinancialWeather({
      budgetPaise: currentBudgetPaise,
      totalSpentPaise: monthlyTotalPaise,
      monthKey: selectedMonth,
    });
  }, [currentBudgetPaise, monthlyTotalPaise, selectedMonth]);

  const spendingSpeedometer = useMemo(() => {
    return calculateSpendingSpeedometer({
      budgetPaise: currentBudgetPaise,
      totalSpentPaise: monthlyTotalPaise,
      monthKey: selectedMonth,
    });
  }, [currentBudgetPaise, monthlyTotalPaise, selectedMonth]);

  const expenseDetectiveInsights = useMemo(() => {
    return calculateExpenseDetective({
      expenses,
      selectedMonth,
      categoryTotals,
    });
  }, [expenses, selectedMonth, categoryTotals]);

  const value = {
    // Theme
    theme,
    setTheme,

    // Database & Connectivity
    dbState,
    isLoading,
    refreshData: loadBackendData,

    // Data & Selection
    expenses,
    budgets,
    goals,
    selectedMonth,
    setSelectedMonth,
    monthlyExpenses,
    monthlyTotalPaise,
    currentBudgetPaise,
    budgetStatus,
    categoryTotals,
    smartBudgetAlert,

    // Intelligence
    financialWeather,
    spendingSpeedometer,
    expenseDetectiveInsights,

    // Migration
    localDataMigration,
    isMigrating,
    migrateLocalData,
    dismissMigrationBanner,

    // CRUD
    addExpense,
    updateExpense,
    deleteExpense,
    setMonthlyBudget,
    clearAllData,

    // Savings Goals
    addGoal,
    updateGoal,
    deleteGoal,
    contributeToGoal,

    // Modals & UI
    isExpenseModalOpen,
    editingExpense,
    openAddModal,
    openEditModal,
    closeExpenseModal,
    isBudgetModalOpen,
    openBudgetModal,
    closeBudgetModal,
    confirmDialog,
    openConfirmDialog,
    closeConfirmDialog,

    // Toasts
    toasts,
    showToast,
    removeToast,
  };

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
}

export function useExpense() {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpense must be used within an ExpenseProvider');
  }
  return context;
}
