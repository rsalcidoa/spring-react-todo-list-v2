import React, { createContext, useContext, useState } from 'react';
import { api } from '../services/ApiService';

export interface AuthContextProps {
  user: string | null;
  token: string | null;
  login: (email: string, password: string, onSuccess?: () => void) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('jwt'));
  const [user, setUser] = useState<string | null>(() => localStorage.getItem('email'));

  const login = async (email: string, password: string, onSuccess?: () => void) => {
    const res = await api.post('/auth/login', { email, password });
    const token = res.data.token;
    setToken(token);
    localStorage.setItem('jwt', token);
    setUser(email);
    localStorage.setItem('email', email);
    if (onSuccess) onSuccess();
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('jwt');
    localStorage.removeItem('email');
  };

  return <AuthContext.Provider value={{ user, token, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextProps => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};