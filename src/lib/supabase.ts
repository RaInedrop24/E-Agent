import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { AUTH_COOKIE_NAME } from "@/lib/constants";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Supabase client will be unavailable."
  );
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // Session is persisted in localStorage; AuthContext mirrors the
        // tokens into a cookie so the proxy (middleware) can read them.
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: AUTH_COOKIE_NAME,
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        // Let supabase-js keep the session alive; onAuthStateChange
        // (TOKEN_REFRESHED) re-syncs the middleware cookie on each refresh.
        autoRefreshToken: true,
      },
    })
    : (undefined as unknown as ReturnType<typeof createSupabaseClient>);

export function createClient() {
  return supabase;
}
