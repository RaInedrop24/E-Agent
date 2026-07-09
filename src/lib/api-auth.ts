/**
 * Shared authentication helpers for API routes.
 *
 * Resolves the caller's Supabase access token from either the
 * `Authorization: Bearer` header or the session cookie written by
 * AuthContext, then verifies it against Supabase Auth.
 */

import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/constants';

let adminClient: SupabaseClient | null = null;

/**
 * Service-role Supabase client (server-only). Bypasses RLS — never expose
 * results to a caller without checking ownership first.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!adminClient) {
    adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return adminClient;
}

/**
 * Extract the caller's access token from the Authorization header or the
 * session cookie. Returns null when unauthenticated.
 */
export function getAccessToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length);
  }

  const cookieValue = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (cookieValue) {
    try {
      const parsed = JSON.parse(cookieValue);
      if (typeof parsed?.access_token === 'string') {
        return parsed.access_token;
      }
    } catch {
      // Malformed cookie — treat as unauthenticated
    }
  }

  return null;
}

/**
 * Verify the caller and return their auth user, or null when the request
 * carries no valid session.
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<User | null> {
  const accessToken = getAccessToken(request);
  if (!accessToken) return null;

  const { data, error } = await getSupabaseAdmin().auth.getUser(accessToken);
  if (error || !data.user) return null;
  return data.user;
}

/**
 * Check whether the given (already-verified) user is a super admin.
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const { data, error } = await getSupabaseAdmin()
    .from('profiles')
    .select('is_super_admin')
    .eq('id', userId)
    .single();
  return !error && data?.is_super_admin === true;
}
