import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { getAppState, setAppState } from '@/lib/store';

// ── Import BOTH auth services ──────────────────────────────────────
// Supabase (real) – used when Supabase env vars are set
import {
  getCurrentUser as supabaseGetCurrentUser,
  onAuthStateChange as supabaseOnAuthStateChange,
  signOut as supabaseSignOut,
  AuthUser,
} from '@/services/supabaseAuthService';

// localStorage (mock) – fallback when Supabase is not configured
import {
  getCurrentUser as mockGetCurrentUser,
  onAuthStateChange as mockOnAuthStateChange,
  signOut as mockSignOut,
} from '@/services/authService';

// ── Detect which backend to use ────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const useSupabase = Boolean(SUPABASE_URL && SUPABASE_KEY);

// Unified wrappers
const getCurrentUser = useSupabase ? supabaseGetCurrentUser : mockGetCurrentUser;
const onAuthStateChange = useSupabase ? supabaseOnAuthStateChange : mockOnAuthStateChange;
const performSignOut = useSupabase ? supabaseSignOut : mockSignOut;

if (useSupabase) {
  console.log('🟢 AuthContext: Using Supabase Auth');
} else {
  console.log('🟡 AuthContext: Using localStorage mock auth (set VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY to enable Supabase)');
}

// ── Context type ───────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (role: UserRole, name?: string, region?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Provider ───────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /** Map an AuthUser (from either service) → frontend User */
  const toUser = (au: AuthUser): User => ({
    id: au.id,
    name: au.fullName,
    phone: au.phone || '+2340000000000',
    role: au.role,
    region: au.region,
    kycStatus: (au as any).kycStatus ?? (au.role === 'admin' ? 'APPROVED' : 'NOT_STARTED'),
    createdAt: new Date().toISOString(),
  });

  // ── Bootstrap ──────────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      try {
        const { user: authUser } = await getCurrentUser();
        if (authUser) {
          const u = toUser(authUser);
          setUser(u);
          // Keep localStorage in sync (so legacy pages still work)
          const state = getAppState();
          state.currentUser = u;
          setAppState(state);
        } else {
          // Fall back to any user stored in localStorage
          const state = getAppState();
          if (state.currentUser) setUser(state.currentUser);
        }
      } catch (err) {
        console.error('Auth init error:', err);
        const state = getAppState();
        if (state.currentUser) setUser(state.currentUser);
      } finally {
        setIsLoading(false);
      }
    };

    init();

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange((authUser: AuthUser | null) => {
      if (authUser) {
        const u = toUser(authUser);
        setUser(u);
        const state = getAppState();
        state.currentUser = u;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Legacy localStorage sync (backward-compat) ────────────────

  useEffect(() => {
    const handle = () => {
      const state = getAppState();
      if (state.currentUser && (!user || state.currentUser.id !== user.id)) {
        setUser(state.currentUser);
      }
    };
    window.addEventListener('storage', handle);
    window.addEventListener('farmsquare:state-changed', handle);
    return () => {
      window.removeEventListener('storage', handle);
      window.removeEventListener('farmsquare:state-changed', handle);
    };
  }, [user]);

  // ── Login (post-authentication sync) ──────────────────────────

  const login = async (role: UserRole, name?: string, region?: string): Promise<void> => {
    const { user: authUser } = await getCurrentUser();

    if (authUser) {
      const u = toUser(authUser);
      if (name) u.name = name;
      if (region) u.region = region;
      setUser(u);
      const state = getAppState();
      state.currentUser = u;
      setAppState(state);
    } else {
      // Fallback (development / mock)
      const state = getAppState();
      let existingUser: User | undefined;
      switch (role) {
        case 'farmer':  existingUser = state.farmers[0];  break;
        case 'buyer':   existingUser = state.buyers[0];   break;
        case 'agent':   existingUser = state.agents[0];   break;
        case 'admin':   existingUser = state.admins[0];   break;
      }

      if (existingUser) {
        if (name) existingUser.name = name;
        if (region) existingUser.region = region;
        state.currentUser = existingUser;
        setAppState(state);
        setUser(existingUser);
      } else {
        const newUser: User = {
          id: `${role}_${Date.now()}`,
          name: name || `${role} User`,
          phone: '+2348000000000',
          role,
          region: region || 'Lagos',
          kycStatus: role === 'admin' ? 'APPROVED' : 'NOT_STARTED',
          createdAt: new Date().toISOString(),
        };
        switch (role) {
          case 'farmer':  state.farmers.push(newUser as any);  break;
          case 'buyer':   state.buyers.push(newUser as any);   break;
          case 'agent':   state.agents.push({ ...newUser, farmersOnboarded: 0, inspectionsCompleted: 0 } as any); break;
          case 'admin':   state.admins.push(newUser as any);   break;
        }
        state.currentUser = newUser;
        setAppState(state);
        setUser(newUser);
      }
    }
  };

  // ── Logout ────────────────────────────────────────────────────

  const logout = async (): Promise<void> => {
    await performSignOut();
    const state = getAppState();
    state.currentUser = null;
    setAppState(state);
    setUser(null);
  };

  // ── Loading spinner ───────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
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
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
