import { isSupabaseConfigured } from '@/lib/supabase';
import * as localAuthService from '@/services/localAuthService';
import * as supabaseAuthService from '@/services/supabaseAuthService';

export type {
  AuthError,
  AuthUser,
  SignInParams,
  SignUpParams,
} from '@/services/localAuthService';

const activeAuthService = isSupabaseConfigured ? supabaseAuthService : localAuthService;

export const signUp = activeAuthService.signUp;
export const signIn = activeAuthService.signIn;
export const signOut = activeAuthService.signOut;
export const getCurrentUser = activeAuthService.getCurrentUser;
export const onAuthStateChange = activeAuthService.onAuthStateChange;

export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return {
      valid: false,
      message: 'Password must be at least 8 characters long',
    };
  }

  return { valid: true };
};

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
