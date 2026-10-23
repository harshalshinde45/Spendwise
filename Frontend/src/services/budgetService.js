import { apiRequest } from './api';

export const budgetService = {
  /**
   * Fetch all configured monthly budgets.
   * Returns dictionary { "YYYY-MM": amountPaise }.
   */
  async getAllBudgets() {
    return apiRequest('/budgets');
  },

  /**
   * Fetch budget for a particular month.
   */
  async getBudgetForMonth(month) {
    return apiRequest(`/budgets/${month}`);
  },

  /**
   * Create or update budget for a particular month.
   */
  async setBudgetForMonth(month, amountPaise) {
    return apiRequest(`/budgets/${month}`, {
      method: 'PUT',
      body: { amountPaise },
    });
  },
};
