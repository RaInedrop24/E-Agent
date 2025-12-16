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

        if (type === 'recovery' || type === 'invite') {
          // Password recovery or invite flow - exchange token for session first
          if (token) {
            const { error: exchangeError } = await supabase.auth.verifyOtp({
              token,
              type: type === 'invite' ? 'invite' : 'recovery',
            });

            if (exchangeError) {
              console.error('Error verifying token:', exchangeError);
              setStatus('Invalid or expired link. Please request a new invitation.');
              return;
            }
          } else if (tokenHash) {
            // Handle token_hash format (PKCE flow)
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(tokenHash);

            if (exchangeError) {
              console.error('Error exchanging code for session:', exchangeError);
              setStatus('Invalid or expired link. Please request a new invitation.');
              return;
            }
          }

          // After successful token exchange, redirect to password update page
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
          // No code, just check if user is authenticated
          const { data } = await supabase.auth.getUser();
          if (!mounted) return;

          if (data.user) {
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
