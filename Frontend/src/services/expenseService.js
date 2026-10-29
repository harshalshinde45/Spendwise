import { apiRequest } from './api';

export const expenseService = {
  /**
   * Fetch all expenses with optional month, category, and sorting filters.
   */
  async getExpenses(filters = {}) {
    const params = new URLSearchParams();
    if (filters.month) params.append('month', filters.month);
    if (filters.category) params.append('category', filters.category);
    if (filters.sort) params.append('sort', filters.sort);

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/expenses${query}`);
  },

  /**
   * Fetch a single expense by ID.
   */
  async getExpenseById(id) {
    return apiRequest(`/expenses/${id}`);
  },

  /**
   * Create a new expense in MongoDB.
   */
  async createExpense(expenseData) {
    return apiRequest('/expenses', {
      method: 'POST',
      body: expenseData,
    });
  },

  /**
   * Update an existing expense by ID.
   */
  async updateExpense(id, updates) {
    return apiRequest(`/expenses/${id}`, {
      method: 'PUT',
      body: updates,
    });
  },

  /**
   * Delete an expense by ID.
   */
  async deleteExpense(id) {
    return apiRequest(`/expenses/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Parse natural-language text into a structured draft proposal (Zero-write).
   */
  async parseExpenseWithAI(text, referenceDate) {
    return apiRequest('/ai/parse-expense', {
      method: 'POST',
      body: { text, referenceDate },
    });
  },
};
