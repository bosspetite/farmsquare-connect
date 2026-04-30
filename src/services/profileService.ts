import { User, UserRole } from '@/types';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

export interface ProfileRecord {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  role: UserRole;
  kyc_status: User['kycStatus'];
  kyb_status: User['kycStatus'];
  address: string | null;
  state: string | null;
  lga: string | null;
  created_at: string;
  updated_at: string;
}

export interface EnsureProfileInput {
  id: string;
  email?: string | null;
  fullName?: string | null;
  role?: UserRole | null;
  region?: string | null;
  phone?: string | null;
}

const profileCache = new Map<string, ProfileRecord | null>();
const inFlightProfileRequests = new Map<string, Promise<ProfileRecord | null>>();

const getFallbackName = (email?: string | null) => {
  if (!email) {
    return 'FarmSquare User';
  }

  const base = email.split('@')[0]?.trim();
  return base ? base.replace(/[._-]+/g, ' ') : 'FarmSquare User';
};

const getFallbackPhone = (userId: string, providedPhone?: string | null) => {
  const trimmedPhone = providedPhone?.trim();
  if (trimmedPhone) {
    return trimmedPhone;
  }

  const digitSequence = userId
    .toLowerCase()
    .replace(/[^a-f0-9]/g, '')
    .split('')
    .map((char) => (/\d/.test(char) ? char : String(char.charCodeAt(0) - 87)))
    .join('');

  const subscriberDigits = digitSequence.slice(0, 9).padEnd(9, '0');
  return `+2349${subscriberDigits}`;
};

export const mapProfileToUser = (profile: ProfileRecord): User => ({
  id: profile.id,
  name: profile.full_name,
  email: profile.email || undefined,
  phone: profile.phone,
  role: profile.role,
  region: profile.state || 'Lagos',
  kycStatus: profile.role === 'buyer' ? profile.kyb_status : profile.kyc_status,
  createdAt: profile.created_at,
});

export const clearProfileCache = (userId?: string) => {
  if (userId) {
    profileCache.delete(userId);
    inFlightProfileRequests.delete(userId);
    return;
  }

  profileCache.clear();
  inFlightProfileRequests.clear();
};

export const getProfileById = async (
  userId: string,
  options?: { forceRefresh?: boolean }
): Promise<ProfileRecord | null> => {
  if (!isSupabaseConfigured) {
    return null;
  }

  if (!options?.forceRefresh && profileCache.has(userId)) {
    return profileCache.get(userId) ?? null;
  }

  if (!options?.forceRefresh) {
    const existingRequest = inFlightProfileRequests.get(userId);
    if (existingRequest) {
      return existingRequest;
    }
  }

  const supabase = getSupabaseClient();
  const request = (async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone, email, role, kyc_status, kyb_status, address, state, lga, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    profileCache.set(userId, data ?? null);
    return data ?? null;
  })();

  inFlightProfileRequests.set(userId, request);

  try {
    return await request;
  } finally {
    inFlightProfileRequests.delete(userId);
  }
};

export const getCurrentProfile = async (): Promise<ProfileRecord | null> => {
  if (!isSupabaseConfigured) {
    return null;
  }

  const supabase = getSupabaseClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  const user = session?.user ?? null;
  if (!user) {
    return null;
  }

  return getProfileById(user.id);
};

export const ensureProfileExists = async (input: EnsureProfileInput): Promise<ProfileRecord> => {
  const existingProfile = await getProfileById(input.id);
  if (existingProfile) {
    console.log('[ProfileService] Using existing profile', { userId: input.id, role: existingProfile.role });
    return existingProfile;
  }

  const role = input.role || 'buyer';
  if (!['buyer', 'farmer', 'agent', 'admin'].includes(role)) {
    throw new Error('Invalid role provided while creating profile.');
  }

  const supabase = getSupabaseClient();
  const payload = {
    id: input.id,
    full_name: input.fullName?.trim() || getFallbackName(input.email),
    phone: getFallbackPhone(input.id, input.phone),
    email: input.email?.toLowerCase() || null,
    role,
    state: input.region?.trim() || 'Lagos',
  };

  const { data, error } = await supabase
    .from('profiles')
    .insert(payload)
    .select('id, full_name, phone, email, role, kyc_status, kyb_status, address, state, lga, created_at, updated_at')
    .single();

  if (error) {
    const retryProfile = await getProfileById(input.id);
    if (retryProfile) {
      console.log('[ProfileService] Recovered existing profile after insert retry', { userId: input.id, role: retryProfile.role });
      return retryProfile;
    }

    throw error;
  }

  profileCache.set(input.id, data);
  console.log('[ProfileService] Created profile', { userId: input.id, role: data.role });
  return data;
};
