import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/transactions', '/transaction', '/settings', '/buyers'];

// Routes that require super admin access
const superAdminRoutes = ['/admin', '/debug', '/test-sms'];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/register'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Set Content Security Policy headers
  const response = NextResponse.next();
  
  // Only set CSP in production - in development, Next.js needs eval for HMR
  if (process.env.NODE_ENV === 'production') {
    // Strict CSP for production
    const cspHeader = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://*.supabase.in",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co https://*.supabase.in https://api.deepl.com wss://*.supabase.co wss://*.supabase.in",
      "frame-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join('; ');

    response.headers.set('Content-Security-Policy', cspHeader);
  } else {
    // More permissive CSP for development (allows eval for HMR)
    const cspHeader = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://*.supabase.in",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co https://*.supabase.in https://api.deepl.com wss://*.supabase.co wss://*.supabase.in ws://localhost:* http://localhost:*",
      "frame-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    response.headers.set('Content-Security-Policy', cspHeader);
  }

  // Check if the route requires protection
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isSuperAdminRoute = superAdminRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Get Supabase configuration from environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Proxy] Supabase not configured');
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

  console.log('[Proxy] Path:', pathname);
  console.log('[Proxy] Auth cookie exists:', !!authCookie);

  let session = null;

  if (authCookie) {
    try {
      // Parse the auth cookie JSON
      const authData = JSON.parse(authCookie);
      console.log('[Proxy] Cookie has tokens:', !!authData.access_token, !!authData.refresh_token);

      if (authData.access_token && authData.refresh_token) {
        const { data: { session: sessionData } } = await supabase.auth.setSession({
          access_token: authData.access_token,
          refresh_token: authData.refresh_token,
        });
        session = sessionData;
        console.log('[Proxy] Session established:', !!session);
      }
    } catch (e) {
      console.error('[Proxy] Error parsing auth cookie:', e);
    }
  }

  // Fallback to checking session
  if (!session) {
    const { data: { session: sessionData } } = await supabase.auth.getSession();
    session = sessionData;
    console.log('[Proxy] Fallback session:', !!session);
  }

  // If trying to access protected route without authentication
  if (isProtectedRoute && !session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const redirectResponse = NextResponse.redirect(loginUrl);
    // Copy CSP headers to redirect response
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'content-security-policy') {
        redirectResponse.headers.set(key, value);
      }
    });
    return redirectResponse;
  }

  // If trying to access auth route while already authenticated
  if (isAuthRoute && session) {
    const redirectResponse = NextResponse.redirect(new URL('/dashboard', request.url));
    // Copy CSP headers to redirect response
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'content-security-policy') {
        redirectResponse.headers.set(key, value);
      }
    });
    return redirectResponse;
  }

  // If trying to access super admin route, check super admin status and MFA
  if (isSuperAdminRoute && session) {
    try {
      // Check if user is super admin
      const { data: isSuperAdmin, error } = await supabase.rpc('current_user_is_super_admin');

      if (error || !isSuperAdmin) {
        console.warn(`[Proxy] Non-super-admin user attempted to access ${pathname}`);

        // Log the unauthorized access attempt
        try {
          await supabase.from('admin_audit_log').insert({
            admin_user_id: session.user.id,
            action: 'unauthorized_access_attempt',
            resource_type: 'admin_route',
            resource_id: pathname,
            details: {
              user_email: session.user.email,
              attempted_url: pathname,
            },
            ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            user_agent: request.headers.get('user-agent') || 'unknown',
          });
        } catch (logError) {
          console.error('[Proxy] Failed to log unauthorized access:', logError);
        }

        // Redirect to dashboard with error message
        const redirectUrl = new URL('/dashboard', request.url);
        redirectUrl.searchParams.set('error', 'unauthorized');
        const redirectResponse = NextResponse.redirect(redirectUrl);
        // Copy CSP headers to redirect response
        response.headers.forEach((value, key) => {
          if (key.toLowerCase() === 'content-security-policy') {
            redirectResponse.headers.set(key, value);
          }
        });
        return redirectResponse;
      }

      // Check MFA status for super admins
      const { data: mfaData } = await supabase.auth.mfa.listFactors();
      const hasMFA = mfaData && mfaData.all && mfaData.all.length > 0;

      // If super admin doesn't have MFA setup, redirect to MFA setup page
      // (unless they're already on the MFA setup page)
      if (!hasMFA && !pathname.startsWith('/admin/mfa-setup')) {
        console.warn(`[Proxy] Super admin ${session.user.email} accessing without MFA`);
        const redirectUrl = new URL('/admin/mfa-setup', request.url);
        redirectUrl.searchParams.set('returnTo', pathname);
        const redirectResponse = NextResponse.redirect(redirectUrl);
        // Copy CSP headers to redirect response
        response.headers.forEach((value, key) => {
          if (key.toLowerCase() === 'content-security-policy') {
            redirectResponse.headers.set(key, value);
          }
        });
        return redirectResponse;
      }

      // Log successful access
      try {
        await supabase.from('admin_audit_log').insert({
          admin_user_id: session.user.id,
          action: 'access_admin_route',
          resource_type: 'admin_route',
          resource_id: pathname,
          details: {
            user_email: session.user.email,
            url: pathname,
          },
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
        });
      } catch (logError) {
        console.error('[Proxy] Failed to log access:', logError);
      }
    } catch (err) {
      console.error('[Proxy] Error checking super admin status:', err);
      const redirectResponse = NextResponse.redirect(new URL('/dashboard', request.url));
      // Copy CSP headers to redirect response
      response.headers.forEach((value, key) => {
        if (key.toLowerCase() === 'content-security-policy') {
          redirectResponse.headers.set(key, value);
        }
      });
      return redirectResponse;
    }
  }

  return response;
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

