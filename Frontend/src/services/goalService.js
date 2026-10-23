import { apiRequest } from './api';

export const goalService = {
  /**
   * Fetch all savings goals.
   */
  async getGoals() {
    return apiRequest('/goals');
  },

  /**
   * Create a new savings goal.
   */
  async createGoal(goalData) {
    return apiRequest('/goals', {
      method: 'POST',
      body: goalData,
    });
  },

  /**
   * Update an existing savings goal.
   */
  async updateGoal(id, updates) {
    return apiRequest(`/goals/${id}`, {
      method: 'PUT',
      body: updates,
    });
  },

  /**
   * Delete a savings goal.
   */
  async deleteGoal(id) {
    return apiRequest(`/goals/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Add contribution towards a savings goal.
   */
  async contributeToGoal(id, amountPaise) {
    return apiRequest(`/goals/${id}/contribute`, {
      method: 'POST',
      body: { amountPaise },
    });
  },
};
