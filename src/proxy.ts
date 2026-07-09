import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '@/lib/rate-limit';
import { AUTH_COOKIE_NAME } from '@/lib/constants';
import { logger } from '@/lib/logger';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/transactions', '/transaction', '/settings', '/buyers'];

// Routes that require super admin access
const superAdminRoutes = ['/admin', '/debug', '/test-sms'];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/register'];

// Rate limits for API routes (requests per minute, per IP)
const API_RATE_LIMIT = 60;
// Tighter limit for routes that spend third-party quota (DeepL, Twilio, Resend)
const EXPENSIVE_API_RATE_LIMIT = 20;
const EXPENSIVE_API_PREFIXES = ['/api/translate', '/api/buyers', '/api/test-sms'];
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate-limit API routes before doing any other work
  if (pathname.startsWith('/api/')) {
    const ip = getClientIp(request);
    const isExpensive = EXPENSIVE_API_PREFIXES.some((route) => pathname.startsWith(route));
    const limit = isExpensive ? EXPENSIVE_API_RATE_LIMIT : API_RATE_LIMIT;
    // Bucket by IP + route class so hammering one endpoint can't starve the rest
    const result = rateLimit(`${ip}:${isExpensive ? pathname : 'api'}`, limit, RATE_LIMIT_WINDOW_MS);

    if (!result.allowed) {
      logger.warn('[Proxy] Rate limit exceeded', { ip, pathname });
      return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        {
          status: 429,
          headers: { 'Retry-After': String(result.retryAfterSeconds) },
        }
      );
    }
  }

  // Set Content Security Policy headers
  const response = NextResponse.next();
  
  // Only set CSP in production - keep dev clean for HMR/devtools
  if (process.env.NODE_ENV === 'production') {
    // NOTE on 'unsafe-inline': Next.js App Router injects inline hydration
    // scripts into statically prerendered pages, and nonce-based CSP would
    // force every page to render dynamically (killing static optimization).
    // Revisit if/when Next.js supports hashes/SRI for inline flight scripts.
    // Supabase is intentionally NOT in script-src — supabase-js never loads
    // remote scripts; it only needs connect-src for API/websocket calls.
    const cspHeader = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
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
  }

  // Check if the route requires protection
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isSuperAdminRoute = superAdminRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Get Supabase configuration from environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    logger.warn('[Proxy] Supabase not configured');
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
  const authCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  logger.debug('[Proxy] Request', { pathname, hasAuthCookie: !!authCookie });

  let session = null;

  if (authCookie) {
    try {
      // Parse the auth cookie JSON
      const authData = JSON.parse(authCookie);

      if (authData.access_token && authData.refresh_token) {
        const { data: { session: sessionData } } = await supabase.auth.setSession({
          access_token: authData.access_token,
          refresh_token: authData.refresh_token,
        });
        session = sessionData;
      }
    } catch (e) {
      logger.warn('[Proxy] Error parsing auth cookie', {
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  // Fallback to checking session
  if (!session) {
    const { data: { session: sessionData } } = await supabase.auth.getSession();
    session = sessionData;
  }

  // Super admin routes require a session too — without this, unauthenticated
  // visitors would fall through to the page (the super-admin check below only
  // runs when a session exists).
  if (isSuperAdminRoute && !session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const redirectResponse = NextResponse.redirect(loginUrl);
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'content-security-policy') {
        redirectResponse.headers.set(key, value);
      }
    });
    return redirectResponse;
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
        logger.warn('[Proxy] Non-super-admin user attempted admin route', { pathname });

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
          logger.error('[Proxy] Failed to log unauthorized access', {
            error: logError instanceof Error ? logError.message : String(logError),
          });
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
        logger.warn('[Proxy] Super admin accessing without MFA', { pathname });
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
        logger.error('[Proxy] Failed to log access', {
          error: logError instanceof Error ? logError.message : String(logError),
        });
      }
    } catch (err) {
      logger.error('[Proxy] Error checking super admin status', {
        error: err instanceof Error ? err.message : String(err),
      });
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

