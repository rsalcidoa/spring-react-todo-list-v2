import React, { createContext, useContext, useEffect, useState } from 'react';
import { authSession } from '../services/AuthSession';

export interface AuthContextProps {
  user: string | null;
  token: string | null;
  login: (email: string, password: string, onSuccess?: () => void) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState(() => ({
    token: authSession.getToken(),
    user: authSession.getEmail(),
  }));

  useEffect(() => authSession.subscribe(s => setState({ token: s.token, user: s.email })), []);

  const login = async (email: string, password: string, onSuccess?: () => void) => {
    await authSession.login(email, password);
    if (onSuccess) onSuccess();
  };

  const logout = () => {
    authSession.logout();
  };

  return <AuthContext.Provider value={{ user: state.user, token: state.token, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextProps => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
