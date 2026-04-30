import { createContext } from 'react';
import { User, UserRole } from '@/types';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (role?: UserRole, name?: string, region?: string) => Promise<User | null>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
  hydrateUser: (user: User | null) => User | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
