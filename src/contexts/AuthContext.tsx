import React, { createContext, useContext, useState } from 'react';
import { User } from '../types';
import { authApi } from '../api';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (roles: string[]) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('bmc_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('bmc_access_token');
  });

  const login = async (username: string, password: string) => {
    const res = await authApi.login({ username, password });
    const authToken = res.accessToken || res.token || '';
    const authUser: User = {
      ...res.user,
      role: res.user.roleCode || res.user.role || 'ADMIN',
    };
    setUser(authUser);
    setToken(authToken);
    localStorage.setItem('bmc_access_token', authToken);
    localStorage.setItem('bmc_current_user', JSON.stringify(authUser));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('bmc_access_token');
    localStorage.removeItem('bmc_current_user');
  };

  const hasRole = (roles: string[]) => {
    if (!user) return false;
    const currentRole = user.role || user.roleCode || '';
    return roles.includes(currentRole);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token && !!user, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
