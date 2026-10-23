import React from 'react';
import { AuthPage } from './AuthPage';

export function RegisterPage({ onNavigateToLogin }) {
  return <AuthPage initialMode="register" />;
}
