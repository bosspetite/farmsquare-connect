/**
 * Supabase Client Configuration
 *
 * If VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set, a real Supabase
 * client is created.  Otherwise a lightweight stub is exported so the rest
 * of the app can import `supabase` without crashing – but all calls will
 * be no-ops and the app falls back to localStorage.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let supabase: SupabaseClient;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  console.log('🟢 Supabase client initialized (connected to', supabaseUrl, ')');
} else {
  console.warn(
    '🟡 Supabase env vars missing – running in localStorage-only mode.\n' +
      '   Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env to enable Supabase.'
  );
  // Create a stub client pointing at a dummy URL so imports don't crash.
  // All actual DB calls will fail gracefully and the app uses localStorage.
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key', {
    auth: { persistSession: false },
  });
}

export { supabase };
