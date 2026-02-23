/**
 * Auth Service Abstraction Layer (FRONTEND-ONLY - MOCK)
 * 
 * TEMPORARY: Email + Password authentication for development
 * Uses localStorage and existing store system (NO Supabase)
 * 
 * This service abstracts authentication logic so we can easily switch
 * to Supabase/Phone OTP in Phase 2 without changing the rest of the app.
 * 
 * Current implementation: Email + Password with localStorage
 * Future: Supabase Auth with Phone OTP for Farmers/Buyers, Email/Password for Admin/Agent
 */

import { UserRole } from '@/types';
import { getAppState, setAppState, generateId } from '@/lib/store';
import { User } from '@/types';

// Storage key for email/password mappings (temporary for development)
const AUTH_STORAGE_KEY = 'farmsquare_auth_credentials';

interface AuthCredentials {
  email: string;
  password: string; // In production, this would be hashed
  userId: string;
  role: UserRole;
}

export interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  region: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  region: string;
  phone?: string;
}

export interface AuthError {
  message: string;
  code?: string;
}

/**
 * Get stored auth credentials from localStorage
 */
const getAuthCredentials = (): AuthCredentials[] => {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/**
 * Save auth credentials to localStorage
 */
const saveAuthCredentials = (credentials: AuthCredentials[]): void => {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(credentials));
  } catch (error) {
    console.error('Failed to save auth credentials:', error);
  }
};

/**
 * Find user by email in the store
 */
const findUserByEmail = (email: string): User | null => {
  const state = getAppState();
  const allUsers = [...state.farmers, ...state.buyers, ...state.agents, ...state.admins];
  
  // Check if email is stored in credentials
  const credentials = getAuthCredentials();
  const cred = credentials.find(c => c.email.toLowerCase() === email.toLowerCase());
  
  if (cred) {
    // Find user by userId from credentials
    const user = allUsers.find(u => u.id === cred.userId);
    if (user) {
      return user;
    }
  }
  
  return null;
};

/**
 * Sign up with email and password
 * Creates user in appropriate array and stores credentials
 */
export const signUp = async (params: SignUpParams): Promise<{ user: AuthUser | null; error: AuthError | null }> => {
  try {
    // Validate email format
    const emailValidation = validateEmail(params.email);
    if (!emailValidation.valid) {
      return {
        user: null,
        error: {
          message: emailValidation.message || 'Invalid email address',
          code: 'INVALID_EMAIL',
        },
      };
    }

    // Check if email already exists
    const existingUser = findUserByEmail(params.email);
    if (existingUser) {
      return {
        user: null,
        error: {
          message: 'An account with this email already exists',
          code: 'EMAIL_EXISTS',
        },
      };
    }

    // Create new user
    const userId = generateId();
    const newUser: User = {
      id: userId,
      name: params.fullName,
      phone: '+2340000000000', // Placeholder - will be updated when switching to Phone OTP
      role: params.role,
      region: params.region,
      kycStatus: params.role === 'admin' ? 'APPROVED' : 'NOT_STARTED',
      createdAt: new Date().toISOString(),
    };

    // Add user to appropriate array
    const state = getAppState();
    switch (params.role) {
      case 'farmer':
        state.farmers.push(newUser as any);
        break;
      case 'buyer':
        state.buyers.push({ ...newUser, companyName: undefined } as any);
        break;
      case 'agent':
        state.agents.push({ ...newUser, farmersOnboarded: 0, inspectionsCompleted: 0 } as any);
        break;
      case 'admin':
        state.admins.push(newUser as any);
        break;
    }

    // Create wallet for new user
    if (!state.wallets.find(w => w.userId === userId)) {
      state.wallets.push({
        userId,
        available: 0,
        pending: 0,
        locked: 0,
        currency: '₦',
      });
    }

    // Save credentials (temporary - in production this would be handled by Supabase)
    const credentials = getAuthCredentials();
    credentials.push({
      email: params.email.toLowerCase(),
      password: params.password, // In production, never store plain passwords!
      userId,
      role: params.role,
    });
    saveAuthCredentials(credentials);

    // Save state
    setAppState(state);

    // Return auth user
    const user: AuthUser = {
      id: userId,
      email: params.email,
      role: params.role,
      fullName: params.fullName,
      region: params.region,
    };

    return { user, error: null };
  } catch (error: any) {
    return {
      user: null,
      error: {
        message: error.message || 'An unexpected error occurred during signup',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
};

/**
 * Sign in with email and password
 * Finds user and verifies password
 */
export const signIn = async (params: SignInParams): Promise<{ user: AuthUser | null; error: AuthError | null }> => {
  try {
    // Validate email format
    const emailValidation = validateEmail(params.email);
    if (!emailValidation.valid) {
      return {
        user: null,
        error: {
          message: emailValidation.message || 'Invalid email address',
          code: 'INVALID_EMAIL',
        },
      };
    }

    // Find credentials
    const credentials = getAuthCredentials();
    const cred = credentials.find(c => c.email.toLowerCase() === params.email.toLowerCase());

    if (!cred) {
      return {
        user: null,
        error: {
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
        },
      };
    }

    // Verify password (in production, this would be handled by Supabase)
    if (cred.password !== params.password) {
      return {
        user: null,
        error: {
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
        },
      };
    }

    // Find user in store
    const state = getAppState();
    const allUsers = [...state.farmers, ...state.buyers, ...state.agents, ...state.admins];
    const user = allUsers.find(u => u.id === cred.userId);

    if (!user) {
      return {
        user: null,
        error: {
          message: 'User account not found',
          code: 'USER_NOT_FOUND',
        },
      };
    }

    // Return auth user
    const authUser: AuthUser = {
      id: user.id,
      email: params.email,
      role: user.role,
      fullName: user.name,
      region: user.region,
      phone: user.phone,
    };

    return { user: authUser, error: null };
  } catch (error: any) {
    return {
      user: null,
      error: {
        message: error.message || 'An unexpected error occurred during signin',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
};

/**
 * Sign out current user
 */
export const signOut = async (): Promise<{ error: AuthError | null }> => {
  try {
    // Clear current user from store
    const state = getAppState();
    state.currentUser = null;
    setAppState(state);
    
    return { error: null };
  } catch (error: any) {
    return {
      error: {
        message: error.message || 'An unexpected error occurred during signout',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
};

/**
 * Get current authenticated user
 * Checks localStorage and store
 */
export const getCurrentUser = async (): Promise<{ user: AuthUser | null; error: AuthError | null }> => {
  try {
    const state = getAppState();
    
    if (!state.currentUser) {
      return { user: null, error: null }; // Not authenticated
    }

    // Find credentials for current user
    const credentials = getAuthCredentials();
    const cred = credentials.find(c => c.userId === state.currentUser!.id);

    if (!cred) {
      return { user: null, error: null }; // No credentials found
    }

    const authUser: AuthUser = {
      id: state.currentUser.id,
      email: cred.email,
      role: state.currentUser.role,
      fullName: state.currentUser.name,
      region: state.currentUser.region,
      phone: state.currentUser.phone,
    };

    return { user: authUser, error: null };
  } catch (error: any) {
    return {
      user: null,
      error: {
        message: error.message || 'Failed to get current user',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
};

/**
 * Listen to auth state changes
 * For localStorage-based auth, we'll use storage events
 */
export const onAuthStateChange = (callback: (user: AuthUser | null) => void) => {
  // Listen to storage changes
  const handleStorageChange = async () => {
    const { user } = await getCurrentUser();
    callback(user);
  };

  window.addEventListener('storage', handleStorageChange);
  window.addEventListener('farmsquare:state-changed', handleStorageChange);

  // Initial check
  getCurrentUser().then(({ user }) => callback(user));

  // Return subscription object (mimicking Supabase API)
  return {
    data: {
      subscription: {
        unsubscribe: () => {
          window.removeEventListener('storage', handleStorageChange);
          window.removeEventListener('farmsquare:state-changed', handleStorageChange);
        },
      },
    },
  };
};

/**
 * Validate password strength
 * Min 8 characters
 */
export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return {
      valid: false,
      message: 'Password must be at least 8 characters long',
    };
  }
  return { valid: true };
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): { valid: boolean; message?: string } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      valid: false,
      message: 'Please enter a valid email address',
    };
  }
  return { valid: true };
};
