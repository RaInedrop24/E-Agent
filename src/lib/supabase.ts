import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Supabase client will be unavailable."
  );
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // Store session in cookies instead of localStorage
        // This allows middleware to access the session
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'sb-skvfgvlwccxetglmfhpm-auth-token',
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: false,
      },
    })
    : (undefined as any);

export function createClient() {
  return supabase;
}
