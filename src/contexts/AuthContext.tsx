import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { getAppState, setAppState } from '@/lib/store';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (role: UserRole, name?: string, region?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const state = getAppState();
    if (state.currentUser) {
      setUser(state.currentUser);
    }
  }, []);

  const login = (role: UserRole, name?: string, region?: string) => {
    const state = getAppState();
    let existingUser: User | undefined;

    // Find or create user based on role
    switch (role) {
      case 'farmer':
        existingUser = state.farmers[0];
        break;
      case 'buyer':
        existingUser = state.buyers[0];
        break;
      case 'agent':
        existingUser = state.agents[0];
        break;
      case 'admin':
        existingUser = state.admins[0];
        break;
    }

    if (existingUser) {
      // Update name/region if provided
      if (name) existingUser.name = name;
      if (region) existingUser.region = region;
      
      state.currentUser = existingUser;
      setAppState(state);
      setUser(existingUser);
    }
  };

  const logout = () => {
    const state = getAppState();
    state.currentUser = null;
    setAppState(state);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
