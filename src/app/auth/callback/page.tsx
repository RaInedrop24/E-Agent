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

        // Check if this is a password recovery or invite flow
        const type = searchParams?.get('type');
        const token = searchParams?.get('token');
        const tokenHash = searchParams?.get('token_hash');

        // First, check if we have a session (Supabase may have already verified)
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        // If we have a session, check if user needs to set password (invited users)
        if (initialSession?.user) {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) return;
          
          // Check if this is an invite flow:
          // 1. type=invite in URL
          // 2. User was just created (within last 15 minutes) - strong indicator of invite
          // 3. User is a buyer (buyers are typically invited, not self-registered)
          // 4. No code in URL (invites don't have codes, they go through Supabase verify first)
          const isInviteType = type === 'invite';
          const userCreatedAt = user.created_at ? new Date(user.created_at).getTime() : 0;
          const now = new Date().getTime();
          const isRecentlyCreated = userCreatedAt > 0 && (now - userCreatedAt) < 15 * 60 * 1000; // 15 minutes
          const isBuyer = user.user_metadata?.role === 'buyer';
          const noCode = !searchParams?.get('code');
          
          // If it's an invite type OR (recently created AND is buyer AND no code), redirect to password setup
          // Buyers are always invited, so if they were just created and reached callback without code, they need to set password
          if (isInviteType || (isRecentlyCreated && isBuyer && noCode)) {
            // This is likely an invite flow - redirect to password setup
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
            // Check if this is an invited user who needs to set password
            // For invited users, we check:
            // 1. type=invite in URL
            // 2. User was created very recently (within 10 minutes) - likely just invited
            // 3. User has no last_sign_in_at or it equals created_at (never logged in with password)
            // 4. User is a buyer (buyers are typically invited)
            const isInviteType = type === 'invite';
            const userCreatedAt = data.user.created_at ? new Date(data.user.created_at).getTime() : 0;
            const now = new Date().getTime();
            const isRecentlyCreated = userCreatedAt > 0 && (now - userCreatedAt) < 10 * 60 * 1000; // 10 minutes
            
            // Check if user has never signed in (indicates they need to set password)
            let neverSignedIn = true;
            if (data.user.last_sign_in_at) {
              const lastSignIn = new Date(data.user.last_sign_in_at).getTime();
              // If last_sign_in is within 1 second of created_at, they haven't signed in with password yet
              neverSignedIn = Math.abs(lastSignIn - userCreatedAt) < 1000;
            }
            
            // Check if user is a buyer (buyers are typically invited, not self-registered)
            const isBuyer = data.user.user_metadata?.role === 'buyer';
            
            // If it's an invite type OR (recently created AND never signed in AND is buyer), redirect to password setup
            const needsPassword = isInviteType || (isRecentlyCreated && neverSignedIn && isBuyer);
            
            if (needsPassword) {
              // Redirect to password setup for invited users
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
