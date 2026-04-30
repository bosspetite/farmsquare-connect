import React, { ReactNode, useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { User, UserRole } from '@/types';
import { getAppState, setAppState } from '@/lib/store';
import { getCurrentUser, signOut as authSignOut, AuthUser } from '@/services/authService';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { AuthContext } from '@/contexts/auth-context';

const AUTH_REQUEST_TIMEOUT_MS = 10000;
const AUTH_LOADING_FAILSAFE_MS = 12000;

const withTimeout = async <T,>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string
): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const toUser = (authUser: AuthUser): User => ({
  id: authUser.id,
  name: authUser.fullName,
  email: authUser.email,
  phone: authUser.phone || '+2340000000000',
  role: authUser.role,
  region: authUser.region,
  kycStatus: authUser.kycStatus || (authUser.role === 'admin' ? 'APPROVED' : 'NOT_STARTED'),
  createdAt: new Date().toISOString(),
});

export const getDashboardPathForRole = (role: UserRole): string => {
  switch (role) {
    case 'farmer':
      return '/farmer/dashboard';
    case 'buyer':
      return '/buyer/dashboard';
    case 'agent':
      return '/agent/dashboard';
    case 'admin':
      return '/admin/dashboard';
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);

  const syncUser = (nextUser: User | null) => {
    setUser(nextUser);
    const state = getAppState();
    state.currentUser = nextUser;
    setAppState(state);
    return nextUser;
  };

  const clearAuthState = () => {
    setSession(null);
    return syncUser(null);
  };

  const resolveCurrentUser = async (reason: string): Promise<User | null> => {
    const { user: authUser, error } = await withTimeout(
      getCurrentUser(),
      AUTH_REQUEST_TIMEOUT_MS,
      `Authentication is taking too long during ${reason}.`
    );

    if (error) {
      throw new Error(error.message);
    }

    if (!authUser) {
      console.log('[AuthContext] No authenticated profile resolved', { reason });
      return clearAuthState();
    }

    const nextUser = toUser(authUser);
    console.log('[AuthContext] Authenticated user resolved', {
      reason,
      userId: nextUser.id,
      role: nextUser.role,
    });
    return syncUser(nextUser);
  };

  useEffect(() => {
    isMountedRef.current = true;
    const loadingFailsafe = window.setTimeout(() => {
      if (!isMountedRef.current) {
        return;
      }

      console.warn('[AuthContext] Loading fallback triggered');
      setIsLoading(false);
    }, AUTH_LOADING_FAILSAFE_MS);

    if (!isSupabaseConfigured) {
      const initializeLocalAuth = async () => {
        try {
          await resolveCurrentUser('local-init');
        } catch (error) {
          console.error('[AuthContext] Local auth initialization failed', error);
          const state = getAppState();
          syncUser(state.currentUser || null);
        } finally {
          if (isMountedRef.current) {
            setIsLoading(false);
          }
        }
      };

      initializeLocalAuth();

      return () => {
        isMountedRef.current = false;
        window.clearTimeout(loadingFailsafe);
      };
    }

    const supabase = getSupabaseClient();

    const initializeSupabaseAuth = async () => {
      try {
        const {
          data: { session: activeSession },
        } = await withTimeout(
          supabase.auth.getSession(),
          AUTH_REQUEST_TIMEOUT_MS,
          'Session lookup timed out.'
        );

        if (!isMountedRef.current) {
          return;
        }

        setSession(activeSession ?? null);

        if (!activeSession?.user) {
          console.log('[AuthContext] No active session during initialization');
          clearAuthState();
          return;
        }

        console.log('[AuthContext] Session restored', { userId: activeSession.user.id });
        await resolveCurrentUser('session-init');
      } catch (error) {
        console.error('[AuthContext] Supabase auth initialization failed', error);
        clearAuthState();
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!isMountedRef.current) {
        return;
      }

      console.log('[AuthContext] Auth state changed', {
        event,
        hasSession: Boolean(nextSession?.user),
        userId: nextSession?.user?.id ?? null,
      });

      setSession(nextSession ?? null);

      if (!nextSession?.user) {
        clearAuthState();
        setIsLoading(false);
        return;
      }

      void (async () => {
        try {
          await resolveCurrentUser(`auth-change:${event}`);
        } catch (error) {
          console.error('[AuthContext] Failed to resolve user after auth change', error);
          clearAuthState();
        } finally {
          if (isMountedRef.current) {
            setIsLoading(false);
          }
        }
      })();
    });

    void initializeSupabaseAuth();

    return () => {
      isMountedRef.current = false;
      window.clearTimeout(loadingFailsafe);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isSupabaseConfigured) {
      return undefined;
    }

    const handleStorageChange = () => {
      const state = getAppState();
      syncUser(state.currentUser || null);
      setIsLoading(false);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('farmsquare:state-changed', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('farmsquare:state-changed', handleStorageChange);
    };
  }, []);

  const login = async (_role?: UserRole, _name?: string, _region?: string): Promise<User | null> => {
    try {
      return await resolveCurrentUser('login-refresh');
    } catch (error) {
      console.error('[AuthContext] Login refresh failed', error);
      setIsLoading(false);
      return null;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('[AuthContext] Signing out', { userId: user?.id ?? null, hasSession: Boolean(session) });
      const { error } = await withTimeout(
        authSignOut(),
        AUTH_REQUEST_TIMEOUT_MS,
        'Sign out is taking too long. Please try again.'
      );

      if (error) {
        throw new Error(error.message);
      }

      console.log('[AuthContext] Logout success');
    } catch (error) {
      console.error('[AuthContext] Logout failed', error);
      throw error;
    } finally {
      clearAuthState();
      setIsLoading(false);
      window.location.replace('/');
    }
  };

  const refreshUser = async (): Promise<User | null> => {
    try {
      return await resolveCurrentUser('manual-refresh');
    } catch (error) {
      console.error('[AuthContext] Manual refresh failed', error);
      setIsLoading(false);
      return null;
    }
  };

  const hydrateUser = (nextUser: User | null): User | null => {
    console.log('[AuthContext] Hydrating user state', {
      userId: nextUser?.id ?? null,
      role: nextUser?.role ?? null,
    });
    return syncUser(nextUser);
  };

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
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
        hydrateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
