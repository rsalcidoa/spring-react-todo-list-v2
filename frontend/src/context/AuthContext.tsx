import React, { createContext, useContext, useState } from 'react';
import { api } from '../services/ApiService';
import { getToken, getEmail, saveSession, clearSession } from '../services/session';

export interface AuthContextProps {
  user: string | null;
  token: string | null;
  login: (email: string, password: string, onSuccess?: () => void) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => getToken());
  const [user, setUser] = useState<string | null>(() => getEmail());

  const login = async (email: string, password: string, onSuccess?: () => void) => {
    const res = await api.post('/auth/login', { email, password });
    const token = res.data.token;
    setToken(token);
    setUser(email);
    saveSession(token, email);
    if (onSuccess) onSuccess();
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    clearSession();
  };

  return <AuthContext.Provider value={{ user, token, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextProps => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};