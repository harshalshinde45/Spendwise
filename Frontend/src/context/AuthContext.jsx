import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { getStoredToken, setStoredToken, registerUnauthorizedHandler } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => getStoredToken());
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    setStoredToken(null);
    setToken(null);
    setUser(null);
  }, []);

  // Register unauthorized listener to automatically log out on 401
  useEffect(() => {
    registerUnauthorizedHandler(() => {
      logout();
    });
  }, [logout]);

  // Initial session restoration on app load
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const storedToken = getStoredToken();
      if (!storedToken) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await authService.getMe();
        if (isMounted && response?.user) {
          setUser(response.user);
          setToken(storedToken);
        } else {
          logout();
        }
      } catch (err) {
        console.warn('Session verification failed, signing out:', err?.message || err);
        logout();
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [logout]);

  const login = useCallback(async ({ email, password }) => {
    const response = await authService.login({ email, password });
    if (response?.token && response?.user) {
      setStoredToken(response.token);
      setToken(response.token);
      setUser(response.user);
      return response.user;
    }
    throw new Error('Invalid login response from server.');
  }, []);

  const register = useCallback(async ({ name, email, password }) => {
    const response = await authService.register({ name, email, password });
    if (response?.token && response?.user) {
      setStoredToken(response.token);
      setToken(response.token);
      setUser(response.user);
      return response.user;
    }
    throw new Error('Invalid registration response from server.');
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
