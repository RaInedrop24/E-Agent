'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<string>('Processing authentication...');
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function handleCallback() {
      try {
        if (!supabase) {
          setStatus('Supabase not configured. Check .env.local and restart.');
          return;
        }

        // Check for errors in query params first
        const errorParam = searchParams?.get('error');
        const errorDescription = searchParams?.get('error_description');
        if (errorParam) {
          setStatus(`Authentication error: ${errorDescription || errorParam}. Please try again.`);
          return;
        }

        // First check if we already have a session (Supabase may have auto-verified)
        // This handles token-based verification (without emailRedirectTo) which works cross-device
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (initialSession?.user) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!mounted) return;

          if (user) {
            setEmail(user.email ?? null);
            setStatus('Email confirmed successfully!');
            
            // Ensure profile exists and has website_url
            const websiteUrl = user.user_metadata?.website_url;
            if (user.id) {
              // Update profile with website_url if it exists in metadata but not in profile
              if (websiteUrl) {
                const { data: profileData } = await supabase
                  .from('profiles')
                  .select('website_url')
                  .eq('id', user.id)
                  .single();
                
                // If profile doesn't have website_url, update it
                if (profileData && !profileData.website_url) {
                  await supabase
                    .from('profiles')
                    .update({ website_url: websiteUrl })
                    .eq('id', user.id);
                }
                
                // Website URL saved - color extraction will be done manually from settings page
              }
            }
            
            // Redirect to dashboard after a short delay
            setTimeout(() => {
              router.push('/dashboard');
            }, 1500);
          }
          return;
        }

        // Handle email verification code parameter (PKCE flow - only used if emailRedirectTo was set)
        const code = searchParams?.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error('Error exchanging code for session:', error);
            
            // PKCE flow requires code_verifier in sessionStorage, which may not be available
            // if the email link opens in a different browser. In this case, the user needs
            // to verify their email from the same browser they registered in, or we need
            // to use a different flow (token-based instead of PKCE).
            if (error.message?.includes('code verifier') || error.message?.includes('non-empty')) {
              setStatus('Please open this link in the same browser you used to register. If you continue to have issues, please try signing in and we\'ll resend the verification email.');
              return;
            }
            
            setStatus('Authentication failed. Please try again.');
            return;
          }

          // Get user data after successful verification
          const { data } = await supabase.auth.getUser();
          if (!mounted) return;

          if (data.user) {
            setEmail(data.user.email ?? null);
            setStatus('Email confirmed successfully!');
            
            // Ensure profile exists and has website_url
            const websiteUrl = data.user.user_metadata?.website_url;
            if (data.user.id) {
              // Update profile with website_url if it exists in metadata but not in profile
              if (websiteUrl) {
                const { data: profileData } = await supabase
                  .from('profiles')
                  .select('website_url')
                  .eq('id', data.user.id)
                  .single();
                
                // If profile doesn't have website_url, update it
                if (profileData && !profileData.website_url) {
                  await supabase
                    .from('profiles')
                    .update({ website_url: websiteUrl })
                    .eq('id', data.user.id);
                }
                
                // Website URL saved - color extraction will be done manually from settings page
              }
            }
            
            // Redirect to dashboard after a short delay
            setTimeout(() => {
              router.push('/dashboard');
            }, 1500);
          }
          return;
        }

        // Check if this is a password recovery or invite flow
        const type = searchParams?.get('type');
        const token = searchParams?.get('token');
        const tokenHash = searchParams?.get('token_hash');
        const flow = searchParams?.get('flow');

        // For invite flows, redirect directly to update-password page with token parameters
        // The update-password page will handle token verification
        if (type === 'invite' || flow === 'invite' || (token && !type && !initialSession?.user)) {
          // Build redirect URL with token parameters
          const params = new URLSearchParams();
          if (token) params.set('token', token);
          if (tokenHash) params.set('token_hash', tokenHash);
          if (type) params.set('type', type);
          else params.set('type', 'invite');
          if (flow) params.set('flow', flow);
          
          // Redirect directly to update-password page
          router.push(`/auth/update-password?${params.toString()}`);
          return;
        }

        if (type === 'recovery') {
          // Password recovery or invite flow
          // When Supabase redirects after verification, the session should already be established
          // But we may need to wait a moment for it to be available
          
          let session = null;
          let attempts = 0;
          const maxAttempts = 5;

          // Try to get session, with retries (Supabase might need a moment to establish it)
          while (!session && attempts < maxAttempts) {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            if (currentSession) {
              session = currentSession;
              break;
            }
            attempts++;
            // Wait 200ms before retrying
            await new Promise(resolve => setTimeout(resolve, 200));
          }

          // If still no session and we have a token, try to verify it
          if (!session && token) {
            const { data: verifyData, error: exchangeError } = await supabase.auth.verifyOtp({
              token,
              type: 'recovery',
            });

            if (exchangeError) {
              console.error('Error verifying token:', exchangeError);
              setStatus(`Invalid or expired link: ${exchangeError.message}. Please request a new password reset.`);
              return;
            }

            // Get session after verification
            const { data: { session: newSession } } = await supabase.auth.getSession();
            session = newSession;
          } else if (!session && tokenHash) {
            // Handle token_hash format (PKCE flow)
            const { data: verifyData, error: exchangeError } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: 'recovery',
            });

            if (exchangeError) {
              console.error('Error exchanging code for session:', exchangeError);
              setStatus(`Invalid or expired link: ${exchangeError.message}. Please request a new password reset.`);
              return;
            }

            // Get session after verification
            const { data: { session: newSession } } = await supabase.auth.getSession();
            session = newSession;
          }

          if (!session) {
            // If no session, redirect to update-password with token params anyway
            const params = new URLSearchParams();
            if (token) params.set('token', token);
            if (tokenHash) params.set('token_hash', tokenHash);
            params.set('type', 'recovery');
            router.push(`/auth/update-password?${params.toString()}`);
            return;
          }

          // After successful session establishment, redirect to password update page
          router.push('/auth/update-password');
          return;
        }

        // If we reach here, there's no code parameter and it's not a type/token flow
        // Check if user is authenticated (fallback case)
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;

        if (data.user) {
          setEmail(data.user.email ?? null);
          setStatus('Your email has been confirmed.');
        } else {
          setStatus('Email confirmation complete. Please sign in.');
        }
      } catch (err) {
        console.error('Error in auth callback:', err);
        setStatus('An error occurred. Please try again.');
      }
    }

    handleCallback();

    return () => {
      mounted = false;
    };
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to The Property Gateway</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm">{status}</div>
          {email && <div className="text-sm text-muted-foreground">Signed in as {email}</div>}
          <div className="flex gap-2 pt-2">
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome to The Property Gateway</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
