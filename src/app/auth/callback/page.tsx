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

        // If Supabase placed the session in the URL hash (access_token / refresh_token),
        // grab it before anything else.
        if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
          const { data: urlSession, error: urlSessionError } = await supabase.auth.getSessionFromUrl();
          if (urlSessionError) {
            console.error('Error getting session from URL hash:', urlSessionError);
            setStatus(`Invalid or expired link: ${urlSessionError.message}. Please request a new invitation.`);
            return;
          }
          if (urlSession?.session) {
            // Session established from URL hash; proceed to password setup for invite flows.
            router.push('/auth/update-password');
            return;
          }
        }

        // Check if this is a password recovery or invite flow
        const type = searchParams?.get('type');
        const token = searchParams?.get('token');
        const tokenHash = searchParams?.get('token_hash');
        const flow = searchParams?.get('flow');

        // First, check if we have a session (Supabase may have already verified)
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        // If we have a session, force invite flows straight to password setup
        if (initialSession?.user) {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) return;

          // Resolve role from metadata, fallback to profiles table
          let role = user.user_metadata?.role as string | undefined;
          if (!role) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', user.id)
              .single();
            role = profileData?.role as string | undefined;
          }
          
          // Minimal invite detection: any of these flags triggers password setup
          const isBuyer = role === 'buyer';
          const isInviteType = type === 'invite';
          const isInviteFlow = flow === 'invite' || isInviteType || isBuyer;
          
          // Last-resort: if we came here without a code but already have a session,
          // treat it as invite and send to password setup (Supabase stripped params).
          const noCode = !searchParams?.get('code');

          if (isInviteFlow || noCode) {
            router.push('/auth/update-password');
            return;
          }
        }

        // If no session yet but tokens are present, attempt to verify explicitly (handles cases where Supabase strips type)
        if (!initialSession?.user && (token || tokenHash)) {
          const inferredType = type || (flow === 'invite' ? 'invite' : 'recovery');
          const otpType = inferredType === 'recovery' ? 'recovery' : 'invite';

          const verifyResult = await supabase.auth.verifyOtp(
            token
              ? { token, type: otpType as 'recovery' | 'invite' }
              : { token_hash: tokenHash || '', type: otpType as 'recovery' | 'invite' }
          );

          if (verifyResult.error) {
            console.error('Error verifying token (fallback):', verifyResult.error);
            setStatus(`Invalid or expired link: ${verifyResult.error.message}. Please request a new invitation.`);
            return;
          }

          // Retry to get session after explicit verification
          const { data: { session: verifiedSession } } = await supabase.auth.getSession();
          if (verifiedSession) {
            router.push('/auth/update-password');
            return;
          }
        }

        if (type === 'recovery' || type === 'invite') {
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
              type: type === 'invite' ? 'invite' : 'recovery',
            });

            if (exchangeError) {
              console.error('Error verifying token:', exchangeError);
              setStatus(`Invalid or expired link: ${exchangeError.message}. Please request a new invitation.`);
              return;
            }

            // Get session after verification
            const { data: { session: newSession } } = await supabase.auth.getSession();
            session = newSession;
          } else if (!session && tokenHash) {
            // Handle token_hash format (PKCE flow)
            const { data: verifyData, error: exchangeError } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: type === 'invite' ? 'invite' : 'recovery',
            });

            if (exchangeError) {
              console.error('Error exchanging code for session:', exchangeError);
              setStatus(`Invalid or expired link: ${exchangeError.message}. Please request a new invitation.`);
              return;
            }

            // Get session after verification
            const { data: { session: newSession } } = await supabase.auth.getSession();
            session = newSession;
          }

          if (!session) {
            setStatus('Session could not be established. Please try clicking the link from your email again.');
            return;
          }

          // After successful session establishment, redirect to password update page
          router.push('/auth/update-password');
          return;
        }

        // Regular auth callback
        const code = searchParams?.get('code');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error('Error exchanging code for session:', error);
            setStatus('Authentication failed. Please try again.');
          } else {
            // Get user data
            const { data } = await supabase.auth.getUser();
            if (!mounted) return;

            if (data.user) {
              setEmail(data.user.email ?? null);
              setStatus('Email confirmed successfully!');
              // Redirect to dashboard after a short delay
              setTimeout(() => {
                router.push('/dashboard');
              }, 1500);
            }
          }
        } else {
          // No code, check if user is authenticated
          const { data } = await supabase.auth.getUser();
          if (!mounted) return;

          if (data.user) {
            // Resolve role from metadata, fallback to profiles table
            let role = data.user.user_metadata?.role as string | undefined;
            if (!role) {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .single();
              role = profileData?.role as string | undefined;
            }

            const isBuyer = role === 'buyer';
            const isInviteType = type === 'invite';
            const isInviteFlow = flow === 'invite' || isInviteType || isBuyer;

            // Last-resort: if we arrived without code but have a session, treat as invite
            const noCode = !searchParams?.get('code');

            if (isInviteFlow || noCode) {
              router.push('/auth/update-password');
              return;
            }
            
            setEmail(data.user.email ?? null);
            setStatus('Your email has been confirmed.');
          } else {
            setStatus('Email confirmation complete. Please sign in.');
          }
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
