import { UserRole } from '@/types';
import { getAppState, setAppState, generateId } from '@/lib/store';
import { User } from '@/types';

const AUTH_STORAGE_KEY = 'farmsquare_auth_credentials';

interface AuthCredentials {
  email: string;
  password: string;
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
  kycStatus?: User['kycStatus'];
}

export interface AuthError {
  message: string;
  code?: string;
}

const getAuthCredentials = (): AuthCredentials[] => {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveAuthCredentials = (credentials: AuthCredentials[]): void => {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(credentials));
  } catch (error) {
    console.error('Failed to save auth credentials:', error);
  }
};

const findUserByEmail = (email: string): User | null => {
  const state = getAppState();
  const allUsers = [...state.farmers, ...state.buyers, ...state.agents, ...state.admins];
  const credentials = getAuthCredentials();
  const cred = credentials.find((entry) => entry.email.toLowerCase() === email.toLowerCase());

  if (!cred) {
    return null;
  }

  return allUsers.find((candidate) => candidate.id === cred.userId) || null;
};

export const signUp = async (
  params: SignUpParams
): Promise<{ user: AuthUser | null; error: AuthError | null }> => {
  try {
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

    const userId = generateId();
    const newUser: User = {
      id: userId,
      name: params.fullName,
      email: params.email.toLowerCase(),
      phone: '+2340000000000',
      role: params.role,
      region: params.region,
      kycStatus: params.role === 'admin' ? 'APPROVED' : 'NOT_STARTED',
      createdAt: new Date().toISOString(),
    };

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

    if (!state.wallets.find((wallet) => wallet.userId === userId)) {
      state.wallets.push({
        userId,
        available: 0,
        pending: 0,
        locked: 0,
        currency: '₦',
      });
    }

    const credentials = getAuthCredentials();
    credentials.push({
      email: params.email.toLowerCase(),
      password: params.password,
      userId,
      role: params.role,
    });

    saveAuthCredentials(credentials);
    state.currentUser = newUser;
    setAppState(state);

    return {
      user: {
        id: userId,
        email: params.email.toLowerCase(),
        role: params.role,
        fullName: params.fullName,
        region: params.region,
        phone: newUser.phone,
        kycStatus: newUser.kycStatus,
      },
      error: null,
    };
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

export const signIn = async (
  params: SignInParams
): Promise<{ user: AuthUser | null; error: AuthError | null }> => {
  try {
    const credentials = getAuthCredentials();
    const cred = credentials.find((entry) => entry.email.toLowerCase() === params.email.toLowerCase());

    if (!cred || cred.password !== params.password) {
      return {
        user: null,
        error: {
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
        },
      };
    }

    const state = getAppState();
    const allUsers = [...state.farmers, ...state.buyers, ...state.agents, ...state.admins];
    const user = allUsers.find((candidate) => candidate.id === cred.userId);

    if (!user) {
      return {
        user: null,
        error: {
          message: 'User account not found',
          code: 'USER_NOT_FOUND',
        },
      };
    }

    state.currentUser = user;
    setAppState(state);

    return {
      user: {
        id: user.id,
        email: cred.email,
        role: user.role,
        fullName: user.name,
        region: user.region,
        phone: user.phone,
        kycStatus: user.kycStatus,
      },
      error: null,
    };
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

export const signOut = async (): Promise<{ error: AuthError | null }> => {
  try {
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

export const getCurrentUser = async (): Promise<{ user: AuthUser | null; error: AuthError | null }> => {
  try {
    const state = getAppState();

    if (!state.currentUser) {
      return { user: null, error: null };
    }

    const credentials = getAuthCredentials();
    const cred = credentials.find((entry) => entry.userId === state.currentUser!.id);

    if (!cred) {
      return { user: null, error: null };
    }

    return {
      user: {
        id: state.currentUser.id,
        email: cred.email,
        role: state.currentUser.role,
        fullName: state.currentUser.name,
        region: state.currentUser.region,
        phone: state.currentUser.phone,
        kycStatus: state.currentUser.kycStatus,
      },
      error: null,
    };
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

export const onAuthStateChange = (callback: (user: AuthUser | null) => void) => {
  const handleStorageChange = async () => {
    const { user } = await getCurrentUser();
    callback(user);
  };

  window.addEventListener('storage', handleStorageChange);
  window.addEventListener('farmsquare:state-changed', handleStorageChange);

  getCurrentUser().then(({ user }) => callback(user));

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
