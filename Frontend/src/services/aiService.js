import { apiRequest } from './api';

export const aiService = {
  /**
   * Check whether Google Gemini AI is configured and ready.
   */
  async getStatus() {
    return apiRequest('/ai/status');
  },

  /**
   * Parse a natural-language description into a structured expense draft.
   * ZERO-WRITE GUARANTEE: Generates a proposed draft only; does NOT modify database.
   * 
   * @param {string} text - Natural language description (max 500 characters)
   * @param {string} [referenceDate] - Local calendar date anchor (YYYY-MM-DD)
   * @returns {Promise<Object>}
   */
  async parseExpense(text, referenceDate) {
    return apiRequest('/ai/parse-expense', {
      method: 'POST',
      body: { text, referenceDate },
    });
  },
};
