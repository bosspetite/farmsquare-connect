import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { getAppState, setAppState } from '@/lib/store';
import { getCurrentUser, onAuthStateChange, signOut as authSignOut, AuthUser } from '@/services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (role: UserRole, name?: string, region?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Convert AuthUser to User type
  const convertAuthUserToUser = (authUser: AuthUser): User => {
    return {
      id: authUser.id,
      name: authUser.fullName,
      phone: authUser.phone || '+2340000000000', // Default phone for email-based auth
      role: authUser.role,
      region: authUser.region,
      kycStatus: authUser.role === 'admin' ? 'APPROVED' : 'NOT_STARTED',
      createdAt: new Date().toISOString(),
    };
  };

  // Initialize auth state from localStorage/store
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { user: authUser, error } = await getCurrentUser();
        
        if (!error && authUser) {
          const userData = convertAuthUserToUser(authUser);
          setUser(userData);
          
          // Sync with local store
          const state = getAppState();
          state.currentUser = userData;
          setAppState(state);
        } else {
          // Fallback to localStorage if no auth user found
          const state = getAppState();
          if (state.currentUser) {
            setUser(state.currentUser);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Fallback to localStorage
        const state = getAppState();
        if (state.currentUser) {
          setUser(state.currentUser);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen to auth state changes
    const { data: { subscription } } = onAuthStateChange((authUser) => {
      if (authUser) {
        const userData = convertAuthUserToUser(authUser);
        setUser(userData);
        
        // Sync with local store
        const state = getAppState();
        state.currentUser = userData;
        setAppState(state);
      } else {
        setUser(null);
        const state = getAppState();
        state.currentUser = null;
        setAppState(state);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // PRESERVED: Legacy localStorage sync (for backward compatibility)
  useEffect(() => {
    const handleStorageChange = () => {
      const state = getAppState();
      if (state.currentUser && (!user || state.currentUser.id !== user.id)) {
        setUser(state.currentUser);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('farmsquare:state-changed', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('farmsquare:state-changed', handleStorageChange);
    };
  }, [user]);

  const login = async (role: UserRole, name?: string, region?: string): Promise<void> => {
    // This function is called after successful authentication
    // It syncs the user data to local state and store
    
    // Try to get current user from auth service
    const { user: authUser, error } = await getCurrentUser();
    
    if (!error && authUser) {
      // Use auth service user data
      const userData = convertAuthUserToUser(authUser);
      
      // Update name/region if provided (for profile completion)
      if (name) userData.name = name;
      if (region) userData.region = region;
      
      setUser(userData);
      
      // Sync with local store
      const state = getAppState();
      state.currentUser = userData;
      setAppState(state);
    } else {
      // Fallback: Create user from provided data (for development/testing)
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
      } else {
        // Create new user
        const newUser: User = {
          id: `${role}_${Date.now()}`,
          name: name || `${role} User`,
          phone: '+2348000000000',
          role: role,
          region: region || 'Lagos',
          kycStatus: role === 'admin' ? 'APPROVED' : 'NOT_STARTED',
          createdAt: new Date().toISOString(),
        };
        
        // Add to appropriate array
        switch (role) {
          case 'farmer':
            state.farmers.push(newUser as any);
            break;
          case 'buyer':
            state.buyers.push(newUser as any);
            break;
          case 'agent':
            state.agents.push({ ...newUser, farmersOnboarded: 0, inspectionsCompleted: 0 } as any);
            break;
          case 'admin':
            state.admins.push(newUser as any);
            break;
        }
        
        state.currentUser = newUser;
        setAppState(state);
        setUser(newUser);
      }
    }
  };

  const logout = async (): Promise<void> => {
    // Sign out (clears auth state)
    await authSignOut();
    
    // Clear local state
    const state = getAppState();
    state.currentUser = null;
    setAppState(state);
    setUser(null);
  };

  // Show loading state while initializing auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

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
