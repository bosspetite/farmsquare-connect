import { UserRole } from '@/types';
import { getSupabaseClient } from '@/lib/supabase';
import { clearProfileCache, ensureProfileExists, getProfileById, mapProfileToUser } from '@/services/profileService';
import { ensureWalletExists } from '@/services/walletService';
import type { AuthError, AuthUser, SignInParams, SignUpParams } from '@/services/localAuthService';

const authBootstrapCache = new Map<string, Promise<AuthUser | null>>();

const normalizeRole = (value: unknown): UserRole | null => {
  if (value === 'buyer' || value === 'farmer' || value === 'agent' || value === 'admin') {
    return value;
  }

  return null;
};

const mapProfileToAuthUser = (profile: Awaited<ReturnType<typeof getProfileById>> extends infer T
  ? Exclude<T, null>
  : never): AuthUser => {
  const mappedUser = mapProfileToUser(profile);
  return {
    id: mappedUser.id,
    email: mappedUser.email || profile.email || '',
    role: mappedUser.role,
    fullName: mappedUser.name,
    region: mappedUser.region,
    phone: mappedUser.phone,
    kycStatus: mappedUser.kycStatus,
  };
};

const toAuthUser = async (userId: string): Promise<AuthUser | null> => {
  const profile = await getProfileById(userId);
  if (!profile) {
    return null;
  }

  return mapProfileToAuthUser(profile);
};

const bootstrapAuthenticatedUser = async (
  authUser: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, any>;
  },
  fallback?: Partial<SignUpParams>
): Promise<AuthUser | null> => {
  const existingRequest = authBootstrapCache.get(authUser.id);
  if (existingRequest) {
    return existingRequest;
  }

  const request = (async () => {
    const profile = await ensureProfileAndWallet(authUser, fallback);
    const currentUser = mapProfileToAuthUser(profile);
    console.log('[SupabaseAuth] Profile fetch resolved', {
      userId: authUser.id,
      role: currentUser?.role ?? null,
    });
    return currentUser;
  })();

  authBootstrapCache.set(authUser.id, request);

  try {
    return await request;
  } finally {
    authBootstrapCache.delete(authUser.id);
  }
};

const ensureProfileAndWallet = async (
  authUser: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, any>;
  },
  fallback?: Partial<SignUpParams>
) => {
  const metadata = authUser.user_metadata || {};
  const role = normalizeRole(metadata.role) || normalizeRole(fallback?.role) || 'buyer';

  const profile = await ensureProfileExists({
    id: authUser.id,
    email: authUser.email || fallback?.email || null,
    fullName: metadata.full_name || fallback?.fullName || authUser.email || null,
    role,
    region: metadata.region || fallback?.region || 'Lagos',
    phone: metadata.phone || null,
  });

  try {
    await ensureWalletExists(profile.id);
  } catch (error) {
    console.warn('[SupabaseAuth] Wallet bootstrap failed; continuing login without blocking access', {
      userId: profile.id,
      role: profile.role,
      error,
    });
  }

  return profile;
};

const toAuthError = (error: any, fallbackMessage: string): AuthError => ({
  message: error?.message || fallbackMessage,
  code: error?.code,
});

const isEmailConfirmationError = (error: any) => {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('email') && (message.includes('confirm') || message.includes('verified'));
};

const isAlreadyRegisteredError = (error: any) => {
  const message = String(error?.message || '').toLowerCase();
  const code = String(error?.code || '').toLowerCase();
  return (
    message.includes('already registered') ||
    message.includes('user already registered') ||
    code === 'user_already_exists'
  );
};

export const signUp = async (
  params: SignUpParams
): Promise<{ user: AuthUser | null; error: AuthError | null }> => {
  try {
    if (!['buyer', 'farmer'].includes(params.role)) {
      return {
        user: null,
        error: {
          message: 'Only farmers and buyers can self-register.',
          code: 'ROLE_NOT_ALLOWED',
        },
      };
    }

    const supabase = getSupabaseClient();
    const signUpResult = await supabase.auth.signUp({
      email: params.email.toLowerCase(),
      password: params.password,
      options: {
        data: {
          full_name: params.fullName,
          role: params.role,
          region: params.region,
        },
      },
    });

    if (signUpResult.error) {
      if (isAlreadyRegisteredError(signUpResult.error)) {
        const signInResult = await supabase.auth.signInWithPassword({
          email: params.email.toLowerCase(),
          password: params.password,
        });

        if (signInResult.error || !signInResult.data.user) {
          return {
            user: null,
            error: toAuthError(
              signInResult.error || signUpResult.error,
              'This account already exists. Try signing in instead.'
            ),
          };
        }

        const recoveredUser = await bootstrapAuthenticatedUser(signInResult.data.user, params);

        if (!recoveredUser) {
          return {
            user: null,
            error: {
              message: 'Your account exists, but the profile could not be restored automatically.',
              code: 'PROFILE_RECOVERY_FAILED',
            },
          };
        }

        console.log('[SupabaseAuth] Signup recovered existing account', {
          userId: signInResult.data.user.id,
          role: recoveredUser.role,
        });
        return { user: recoveredUser, error: null };
      }

      return {
        user: null,
        error: toAuthError(signUpResult.error, 'Unable to create your account.'),
      };
    }

    let authUser = signUpResult.data.user;
    if (!authUser) {
      return {
        user: null,
        error: {
          message: 'Sign up completed but no user session was returned.',
          code: 'SIGNUP_NO_USER',
        },
      };
    }

    if (!signUpResult.data.session) {
      const signInResult = await supabase.auth.signInWithPassword({
        email: params.email.toLowerCase(),
        password: params.password,
      });

      if (signInResult.error) {
        if (isEmailConfirmationError(signInResult.error)) {
          return {
            user: null,
            error: {
              message: 'Your account was created. Confirm your email first, then sign in.',
              code: 'EMAIL_CONFIRMATION_REQUIRED',
            },
          };
        }

        return {
          user: null,
          error: toAuthError(
            signInResult.error,
            'Account created, but automatic sign in failed. Please log in manually.'
          ),
        };
      }

      authUser = signInResult.data.user;
    }

    const currentUser = await bootstrapAuthenticatedUser(authUser, params);

    if (!currentUser) {
      return {
        user: null,
        error: {
          message: 'Your account was created, but your profile could not be loaded.',
          code: 'PROFILE_LOAD_FAILED',
        },
      };
    }

    console.log('[SupabaseAuth] Signup success', { userId: authUser.id, role: currentUser.role });
    return { user: currentUser, error: null };
  } catch (error: any) {
    return {
      user: null,
      error: toAuthError(error, 'An unexpected error occurred during signup.'),
    };
  }
};

export const signIn = async (
  params: SignInParams
): Promise<{ user: AuthUser | null; error: AuthError | null }> => {
  try {
    const supabase = getSupabaseClient();
    const result = await supabase.auth.signInWithPassword({
      email: params.email.toLowerCase(),
      password: params.password,
    });

    if (result.error || !result.data.user) {
      return {
        user: null,
        error: toAuthError(result.error, 'Invalid email or password.'),
      };
    }

    const currentUser = await bootstrapAuthenticatedUser(result.data.user);

    if (!currentUser) {
      return {
        user: null,
        error: {
          message: 'Your profile could not be loaded after sign in.',
          code: 'PROFILE_LOAD_FAILED',
        },
      };
    }

    console.log('[SupabaseAuth] Login success', { userId: result.data.user.id, role: currentUser.role });
    return { user: currentUser, error: null };
  } catch (error: any) {
    console.error('[SupabaseAuth] Login failed', {
      email: params.email?.toLowerCase?.() || params.email,
      error,
    });
    return {
      user: null,
      error: toAuthError(error, 'An unexpected error occurred during signin.'),
    };
  }
};

export const signOut = async (): Promise<{ error: AuthError | null }> => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { error: toAuthError(error, 'Unable to sign out right now.') };
    }

    authBootstrapCache.clear();
    clearProfileCache();
    console.log('[SupabaseAuth] Logout success');
    return { error: null };
  } catch (error: any) {
    return {
      error: toAuthError(error, 'An unexpected error occurred during signout.'),
    };
  }
};

export const getCurrentUser = async (): Promise<{ user: AuthUser | null; error: AuthError | null }> => {
  try {
    const supabase = getSupabaseClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      return {
        user: null,
        error: toAuthError(error, 'Unable to load the current session.'),
      };
    }

    const user = session?.user ?? null;
    if (!user) {
      console.log('[SupabaseAuth] No active session found');
      return { user: null, error: null };
    }

    try {
      const currentUser = await bootstrapAuthenticatedUser(user);
      console.log('[SupabaseAuth] Current user resolved', { userId: user.id, role: currentUser?.role ?? null });
      return { user: currentUser, error: null };
    } catch (bootstrapError) {
      console.warn('[SupabaseAuth] Bootstrap failed during current-user lookup; attempting direct profile recovery', {
        userId: user.id,
        bootstrapError,
      });

      const directProfile = await getProfileById(user.id, { forceRefresh: true });
      if (directProfile) {
        const recoveredUser = mapProfileToAuthUser(directProfile);
        console.log('[SupabaseAuth] Current user recovered from profile', {
          userId: recoveredUser.id,
          role: recoveredUser.role,
        });
        return { user: recoveredUser, error: null };
      }

      throw bootstrapError;
    }
  } catch (error: any) {
    return {
      user: null,
      error: toAuthError(error, 'Unable to load the current user.'),
    };
  }
};

export const onAuthStateChange = (callback: (user: AuthUser | null) => void) => {
  const supabase = getSupabaseClient();

  const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('[SupabaseAuth] Auth state changed', {
      event,
      hasSession: Boolean(session?.user),
      userId: session?.user?.id ?? null,
    });

    if (!session?.user) {
      callback(null);
      return;
    }

    try {
      const currentUser = await bootstrapAuthenticatedUser(session.user);
      callback(currentUser);
    } catch (error) {
      console.error('Auth state sync failed:', error);
      callback(null);
    }
  });

  return { data };
};
