import React from 'react';
import { AuthPage } from './AuthPage';

export function LoginPage({ onNavigateToRegister }) {
  return <AuthPage initialMode="login" />;
}
