import { apiRequest } from './api';

export const analyticsService = {
  /**
   * Fetch backend health status and database connectivity.
   */
  async checkHealth() {
    return apiRequest('/health');
  },

  /**
   * Fetch calculated monthly analytics for target month.
   */
  async getMonthlyAnalytics(month) {
    return apiRequest(`/analytics/monthly/${month}`);
  },

  /**
   * Safely migrate local storage records to MongoDB.
   */
  async migrateData(payload) {
    return apiRequest('/migrate', {
      method: 'POST',
      body: payload,
    });
  },

  /**
   * Clear all expenses and budgets from MongoDB.
   */
  async clearAllDatabaseData() {
    return apiRequest('/data', {
      method: 'DELETE',
    });
  },
};
