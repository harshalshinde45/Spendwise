import { apiRequest } from './api';

export const authService = {
  /**
   * Register a new user account.
   * @param {{ name: string, email: string, password: string }} data
   */
  async register({ name, email, password }) {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: { name, email, password },
    });
  },

  /**
   * Authenticate an existing user.
   * @param {{ email: string, password: string }} credentials
   */
  async login({ email, password }) {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  },

  /**
   * Retrieve current authenticated user profile.
   */
  async getMe() {
    return apiRequest('/auth/me', {
      method: 'GET',
    });
  },
};
