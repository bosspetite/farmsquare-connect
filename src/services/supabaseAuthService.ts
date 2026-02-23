/**
 * Supabase Auth Service - REAL Authentication
 * 
 * Connects to Supabase Auth for email/password sign-up/sign-in.
 * Automatically creates a profile row in the `profiles` table on sign-up.
 */

import { supabase } from '@/lib/supabase';
import { UserRole } from '@/types';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
  phone: string;
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
  phone: string;
  kycStatus: string;
}

export interface AuthError {
  message: string;
  code?: string;
}

// ─── Sign Up ─────────────────────────────────────────────────────────────────

export const signUp = async (
  params: SignUpParams
): Promise<{ user: AuthUser | null; error: AuthError | null }> => {
  try {
    // 1. Create auth user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          full_name: params.fullName,
          phone: params.phone,
          role: params.role,
          region: params.region,
        },
      },
    });

    if (authError) {
      return {
        user: null,
        error: {
          message: authError.message,
          code: authError.code || 'AUTH_ERROR',
        },
      };
    }

    if (!authData.user) {
      return {
        user: null,
        error: { message: 'Sign-up succeeded but no user returned', code: 'NO_USER' },
      };
    }

    // 2. Insert profile row (the DB trigger in migration 004 may do this too,
    //    but we do it explicitly to set role/region immediately)
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: authData.user.id,
      full_name: params.fullName,
      phone: params.phone,
      email: params.email,
      role: params.role,
      address: params.region,
      state: params.region,
    });

    if (profileError) {
      console.warn('Profile insert warning (may already exist via trigger):', profileError.message);
    }

    // 3. Create wallet for new user
    const { error: walletError } = await supabase.from('wallets').upsert({
      user_id: authData.user.id,
      available: 0,
      pending: 0,
      locked: 0,
      withdrawn: 0,
      currency: '₦',
    });

    if (walletError) {
      console.warn('Wallet creation warning:', walletError.message);
    }

    const user: AuthUser = {
      id: authData.user.id,
      email: params.email,
      role: params.role,
      fullName: params.fullName,
      region: params.region,
      phone: params.phone,
      kycStatus: params.role === 'admin' ? 'APPROVED' : 'NOT_STARTED',
    };

    return { user, error: null };
  } catch (err: any) {
    return {
      user: null,
      error: { message: err.message || 'Unexpected error during sign-up', code: 'UNKNOWN' },
    };
  }
};

// ─── Sign In ─────────────────────────────────────────────────────────────────

export const signIn = async (
  params: SignInParams
): Promise<{ user: AuthUser | null; error: AuthError | null }> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: params.email,
      password: params.password,
    });

    if (error) {
      return {
        user: null,
        error: { message: error.message, code: error.code || 'AUTH_ERROR' },
      };
    }

    if (!data.user) {
      return {
        user: null,
        error: { message: 'Sign-in succeeded but no user returned', code: 'NO_USER' },
      };
    }

    // Fetch profile from DB
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      // Fallback to user_metadata
      const meta = data.user.user_metadata || {};
      return {
        user: {
          id: data.user.id,
          email: data.user.email || params.email,
          role: (meta.role as UserRole) || 'buyer',
          fullName: meta.full_name || 'User',
          region: meta.region || 'Lagos',
          phone: meta.phone || '',
          kycStatus: 'NOT_STARTED',
        },
        error: null,
      };
    }

    return {
      user: {
        id: profile.id,
        email: profile.email || data.user.email || params.email,
        role: profile.role as UserRole,
        fullName: profile.full_name,
        region: profile.state || profile.address || 'Lagos',
        phone: profile.phone,
        kycStatus: profile.kyc_status || 'NOT_STARTED',
      },
      error: null,
    };
  } catch (err: any) {
    return {
      user: null,
      error: { message: err.message || 'Unexpected error during sign-in', code: 'UNKNOWN' },
    };
  }
};

// ─── Sign Out ────────────────────────────────────────────────────────────────

export const signOut = async (): Promise<{ error: AuthError | null }> => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { error: { message: error.message, code: 'SIGN_OUT_ERROR' } };
  }
  return { error: null };
};

// ─── Get Current User ────────────────────────────────────────────────────────

export const getCurrentUser = async (): Promise<{
  user: AuthUser | null;
  error: AuthError | null;
}> => {
  try {
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser();

    if (error || !authUser) {
      return { user: null, error: null }; // Not logged in
    }

    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (profile) {
      return {
        user: {
          id: profile.id,
          email: profile.email || authUser.email || '',
          role: profile.role as UserRole,
          fullName: profile.full_name,
          region: profile.state || profile.address || 'Lagos',
          phone: profile.phone,
          kycStatus: profile.kyc_status || 'NOT_STARTED',
        },
        error: null,
      };
    }

    // Fallback to user_metadata
    const meta = authUser.user_metadata || {};
    return {
      user: {
        id: authUser.id,
        email: authUser.email || '',
        role: (meta.role as UserRole) || 'buyer',
        fullName: meta.full_name || 'User',
        region: meta.region || 'Lagos',
        phone: meta.phone || '',
        kycStatus: 'NOT_STARTED',
      },
      error: null,
    };
  } catch (err: any) {
    return {
      user: null,
      error: { message: err.message || 'Failed to get current user', code: 'UNKNOWN' },
    };
  }
};

// ─── Auth State Listener ─────────────────────────────────────────────────────

export const onAuthStateChange = (callback: (user: AuthUser | null) => void) => {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT' || !session?.user) {
      callback(null);
      return;
    }

    // Fetch profile for the authenticated user
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    if (profile) {
      callback({
        id: profile.id,
        email: profile.email || session.user.email || '',
        role: profile.role as UserRole,
        fullName: profile.full_name,
        region: profile.state || profile.address || 'Lagos',
        phone: profile.phone,
        kycStatus: profile.kyc_status || 'NOT_STARTED',
      });
    } else {
      const meta = session.user.user_metadata || {};
      callback({
        id: session.user.id,
        email: session.user.email || '',
        role: (meta.role as UserRole) || 'buyer',
        fullName: meta.full_name || 'User',
        region: meta.region || 'Lagos',
        phone: meta.phone || '',
        kycStatus: 'NOT_STARTED',
      });
    }
  });

  return { data: { subscription } };
};

// ─── Validators ──────────────────────────────────────────────────────────────

export const validatePassword = (password: string) => {
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters long' };
  }
  return { valid: true };
};

export const validateEmail = (email: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) {
    return { valid: false, message: 'Please enter a valid email address' };
  }
  return { valid: true };
};

