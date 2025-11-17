import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/transactions', '/transaction', '/settings'];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route requires protection
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Get Supabase configuration from environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Middleware] Supabase not configured');
    return NextResponse.next();
  }

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Get session from Supabase auth cookie
  // Supabase uses project-specific cookie name: sb-<project-ref>-auth-token
  const authCookie = request.cookies.get('sb-skvfgvlwccxetglmfhpm-auth-token')?.value;

  console.log('[Middleware] Path:', pathname);
  console.log('[Middleware] Auth cookie exists:', !!authCookie);

  let session = null;

  if (authCookie) {
    try {
      // Parse the auth cookie JSON
      const authData = JSON.parse(authCookie);
      console.log('[Middleware] Cookie has tokens:', !!authData.access_token, !!authData.refresh_token);

      if (authData.access_token && authData.refresh_token) {
        const { data: { session: sessionData } } = await supabase.auth.setSession({
          access_token: authData.access_token,
          refresh_token: authData.refresh_token,
        });
        session = sessionData;
        console.log('[Middleware] Session established:', !!session);
      }
    } catch (e) {
      console.error('[Middleware] Error parsing auth cookie:', e);
    }
  }

  // Fallback to checking session
  if (!session) {
    const { data: { session: sessionData } } = await supabase.auth.getSession();
    session = sessionData;
    console.log('[Middleware] Fallback session:', !!session);
  }

  // If trying to access protected route without authentication
  if (isProtectedRoute && !session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If trying to access auth route while already authenticated
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
